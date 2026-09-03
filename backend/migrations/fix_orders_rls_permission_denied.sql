-- Fix: permission denied for table users on order submission
-- Problem: Previous RLS policies on 'orders' and 'order_items' performed a subquery on `auth.users`:
--          (SELECT users.email FROM auth.users WHERE users.id = auth.uid())
--          In PostgreSQL/Supabase, anon and authenticated roles do not have SELECT permission
--          on the internal `auth.users` table, causing "permission denied for table users"
--          whenever placing an order.
-- Solution:
--          1. Use (auth.jwt() ->> 'email') and public.profiles instead of auth.users.
--          2. Explicitly allow INSERT for orders and order_items for customers and guests.

BEGIN;

DROP POLICY IF EXISTS "Users can manage their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can manage their own order items" ON public.order_items;

-- Anyone can insert orders (inquiries can be placed by registered users or guest representatives)
CREATE POLICY "Anyone can insert orders" ON public.orders
FOR INSERT WITH CHECK (true);

-- Users can read and update their own orders
CREATE POLICY "Users can manage their own orders" ON public.orders
FOR ALL USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR (
    email IS NOT NULL AND (
      email = (auth.jwt() ->> 'email')
      OR email IN (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid())
    )
  )
) WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR (
    email IS NOT NULL AND (
      email = (auth.jwt() ->> 'email')
      OR email IN (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid())
    )
  )
);

-- Anyone can insert order items
CREATE POLICY "Anyone can insert order items" ON public.order_items
FOR INSERT WITH CHECK (true);

-- Users can read and manage their own order items
CREATE POLICY "Users can manage their own order items" ON public.order_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND (
      (auth.uid() IS NOT NULL AND orders.user_id = auth.uid())
      OR (
        orders.email IS NOT NULL AND (
          orders.email = (auth.jwt() ->> 'email')
          OR orders.email IN (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid())
        )
      )
    )
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND (
      (auth.uid() IS NOT NULL AND orders.user_id = auth.uid())
      OR (
        orders.email IS NOT NULL AND (
          orders.email = (auth.jwt() ->> 'email')
          OR orders.email IN (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid())
        )
      )
    )
  )
);

COMMIT;
