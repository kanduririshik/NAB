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
-- Function to create confirmed auth user without sending email (bypasses Supabase 3/hour email rate limit)
DROP FUNCTION IF EXISTS public.create_auth_user(text, text, text);

CREATE OR REPLACE FUNCTION public.create_auth_user(p_email text, p_password text, p_role text DEFAULT 'customer')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
declare
  v_user_id uuid;
  v_effective_role text;
begin
  -- Security check: only allow non-customer roles if caller is already an admin
  IF p_role IN ('admin', 'delivery_boy', 'staff') AND NOT (public.is_admin(auth.uid())) THEN
    v_effective_role := 'customer';
  ELSE
    v_effective_role := COALESCE(p_role, 'customer');
  END IF;

  -- Check if user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = LOWER(p_email) LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    -- If user already exists and caller is not admin, do not allow arbitrary password overwrite
    IF NOT (public.is_admin(auth.uid())) THEN
      RAISE EXCEPTION 'User already registered with this email.';
    END IF;

    UPDATE auth.users 
    SET encrypted_password = crypt(p_password, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_user_id;
  ELSE
    v_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      phone_change,
      phone_change_token,
      email_change_token_current,
      reauthentication_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      LOWER(p_email),
      crypt(p_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    );
    
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', LOWER(p_email)),
      'email',
      LOWER(p_email),
      now(),
      now(),
      now()
    );
  END IF;
  
  -- Insert/update user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, v_effective_role)
  ON CONFLICT (user_id) DO UPDATE SET role = v_effective_role;
  
  RETURN v_user_id;
end;
$function$;

GRANT EXECUTE ON FUNCTION public.create_auth_user(text, text, text) TO anon, authenticated, service_role;

COMMIT;
