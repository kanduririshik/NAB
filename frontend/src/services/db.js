import { supabase } from '../lib/supabase';

// Event hub for real-time notifications across browser views using Supabase Realtime
class EventHub {
  constructor() {
    this.listeners = {};
    this.channel = null;
    this.initChannel();
  }
  
  initChannel() {
    if (typeof window === 'undefined') return;

    if (this.channel) {
      try {
        supabase.removeChannel(this.channel);
      } catch (e) {}
    }

    // Set up Supabase Realtime channel to listen to all public database changes
    this.channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          const table = payload.table;
          const data = payload.new || payload.old;
          
          if (table === 'live_locations') {
            this.notify('locations_update', data);
          } else if (table === 'delivery_assignments') {
            this.notify('assignments_update', data);
          } else if (table === 'orders') {
            this.notify('orders_update', data);
          } else if (table === 'delivery_agents') {
            this.notify('agents_update', data);
          } else if (table === 'contact_messages') {
            this.notify('contacts_update', data);
          } else if (table === 'products') {
            this.notify('products_update', data);
          } else if (table === 'categories') {
            this.notify('categories_update', data);
          } else if (table === 'profiles') {
            this.notify('customers_update', data);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setTimeout(() => {
            this.initChannel();
          }, 3000);
        }
      });
  }
  subscribe(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }
  notify(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try { callback(data); } catch (e) { console.error(e); }
      });
    }
  }
}

export const dbEvents = new EventHub();

// --- IMAGE UPLOAD HELPER FUNCTIONS ---

async function uploadBase64Image(base64Data, folder = 'products') {
  if (!base64Data || !base64Data.startsWith('data:')) {
    // If it's already a standard URL, just return it
    return base64Data;
  }
  
  try {
    // Extract base64 content
    const base64Parts = base64Data.split(',');
    const mimeType = base64Parts[0].match(/:(.*?);/)[1];
    const rawBase64 = base64Parts[1];
    
    // Convert base64 to binary
    const binaryStr = atob(rawBase64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    
    const blob = new Blob([bytes], { type: mimeType });
    const extension = mimeType.split('/')[1] || 'png';
    const fileName = `${folder}/${Math.random().toString(36).substr(2, 9)}-${Date.now()}.${extension}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, blob, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: true
      });
      
    if (error) throw error;
    
    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);
      
    return publicUrl;
  } catch (err) {
    console.error('Image upload failed, using fallback:', err);
    return base64Data; // fallback to original data URL if upload fails
  }
}

async function uploadDeliveryProof(base64Data, orderId, type = 'signature') {
  if (!base64Data || !base64Data.startsWith('data:')) {
    return base64Data;
  }
  
  try {
    const base64Parts = base64Data.split(',');
    const mimeType = base64Parts[0].match(/:(.*?);/)[1];
    const rawBase64 = base64Parts[1];
    
    const binaryStr = atob(rawBase64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    
    const blob = new Blob([bytes], { type: mimeType });
    const extension = mimeType.split('/')[1] || 'png';
    const fileName = `${orderId}/${type}-${Date.now()}.${extension}`;
    
    const { data, error } = await supabase.storage
      .from('delivery-proofs')
      .upload(fileName, blob, {
        contentType: mimeType,
        upsert: true
      });
      
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('delivery-proofs')
      .getPublicUrl(fileName);
      
    return publicUrl;
  } catch (err) {
    console.error('Proof upload failed:', err);
    return base64Data;
  }
}

// --- API LAYER IMPLEMENTATIONS ---

export const api = {
  // --- AUTH METHODS ---
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    // Retrieve associated profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();
      
    const mappedProfile = profile ? {
      userId: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      phone: profile.phone,
      gender: profile.gender,
      address: profile.address,
      occupation: profile.occupation,
      institutionType: profile.institution_type,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    } : null;
    
    return { user: data.user, profile: mappedProfile };
  },

  async register(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data.user;
  },

  async requestOTP(email) {
    throw new Error('OTP login is disabled in production. Please use Email/Password authentication.');
  },

  async verifyOTP(email, otp) {
    throw new Error('OTP login is disabled in production. Please use Email/Password authentication.');
  },

  async loginViaOTP(email, otp) {
    throw new Error('OTP login is disabled in production. Please use Email/Password authentication.');
  },

  async updateProfile(userId, profileData) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: profileData.email,
        full_name: profileData.fullName,
        phone: profileData.phone,
        gender: profileData.gender || 'Other',
        address: profileData.address,
        occupation: profileData.occupation,
        institution_type: profileData.institutionType,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) throw error;
    
    const mappedProfile = {
      userId: data.id,
      email: data.email,
      fullName: data.full_name,
      phone: data.phone,
      gender: data.gender,
      address: data.address,
      occupation: data.occupation,
      institutionType: data.institution_type,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
    
    return { profile: mappedProfile, profileCompleted: true };
  },

  // --- ADMIN AUTH ---
  async adminLogin(username, password) {
    const email = username.includes('@') ? username : `${username}@nab.in`;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Check role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .maybeSingle();

    const isExplicitAdmin = roleData?.role === 'admin';
    const isDefaultAdminEmail = email.toLowerCase() === 'nab@nab.in' || data.user?.email?.toLowerCase() === 'nab@nab.in';

    if (!isExplicitAdmin && !isDefaultAdminEmail) {
      await supabase.auth.signOut();
      throw new Error('Unauthorized: Invalid administrator credentials.');
    }

    return { admin: { id: data.user.id, email: data.user.email, role: 'admin' }, token: data.session.access_token };
  },

  // --- PRODUCTS ---
  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category_name,
      description: p.description,
      price: p.price,
      stockQuantity: p.stock_quantity,
      isActive: p.is_active,
      image: p.image_url,
      createdAt: p.created_at
    }));
  },

  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
      
    if (error) throw error;
    return data;
  },

  async addCategory(name) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const id = `cat-${Math.random().toString(36).substr(2, 9)}`;
    const { data, error } = await supabase
      .from('categories')
      .insert({ id, name, slug })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async updateCategory(id, name) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const { data, error } = await supabase
      .from('categories')
      .update({ name, slug })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    // Update category cached names on products
    await supabase
      .from('products')
      .update({ category_name: name })
      .eq('category_id', id);
      
    return data;
  },

  async deleteCategory(id) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return { success: true };
  },

  async addProduct(productData) {
    // 1. Upload base64 image if applicable
    const imageUrl = await uploadBase64Image(productData.image);

    // 2. Look up category_id
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('name', productData.category)
      .maybeSingle();
      
    const categoryId = cat ? cat.id : '5'; // default 'Others'
    const id = `prod-${Math.random().toString(36).substr(2, 9)}`;
    
    const { data, error } = await supabase
      .from('products')
      .insert({
        id,
        name: productData.name,
        category_id: categoryId,
        category_name: productData.category,
        description: productData.description,
        price: parseFloat(productData.price),
        stock_quantity: parseInt(productData.stockQuantity),
        is_active: productData.isActive !== undefined ? productData.isActive : true,
        image_url: imageUrl
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      category: data.category_name,
      description: data.description,
      price: data.price,
      stockQuantity: data.stock_quantity,
      isActive: data.is_active,
      image: data.image_url,
      createdAt: data.created_at
    };
  },

  async updateProduct(id, productData) {
    // 1. Upload base64 image if applicable
    const imageUrl = await uploadBase64Image(productData.image);

    // 2. Look up category_id
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('name', productData.category)
      .maybeSingle();
      
    const categoryId = cat ? cat.id : '5';
    
    const { data, error } = await supabase
      .from('products')
      .update({
        name: productData.name,
        category_id: categoryId,
        category_name: productData.category,
        description: productData.description,
        price: parseFloat(productData.price),
        stock_quantity: parseInt(productData.stockQuantity),
        is_active: productData.isActive !== undefined ? productData.isActive : true,
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      category: data.category_name,
      description: data.description,
      price: data.price,
      stockQuantity: data.stock_quantity,
      isActive: data.is_active,
      image: data.image_url,
      createdAt: data.created_at
    };
  },

  async deleteProduct(id) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return { success: true };
  },

  // --- ORDERS ---
  async getOrders(userId = null) {
    let query = supabase
      .from('orders')
      .select('*, items:order_items(*)');
      
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    
    return data.map(o => ({
      id: o.id,
      userId: o.user_id,
      customerName: o.customer_name,
      phone: o.phone,
      email: o.email,
      deliveryAddress: o.delivery_address,
      status: o.status,
      totalAmount: o.total_amount,
      createdAt: o.created_at,
      items: o.items.map(item => ({
        productId: item.product_id,
        productName: item.product_name_snapshot,
        productImage: item.product_image_snapshot,
        price: item.unit_price,
        quantity: item.quantity
      }))
    }));
  },

  async submitOrder(userId, shippingDetails, cartItems) {
    const orderId = `ord-${Math.floor(1000 + Math.random() * 9000)}`;
    let totalAmount = 0;
    cartItems.forEach(item => {
      totalAmount += item.product.price * item.quantity;
    });

    // 1. Insert parent order (Initially status = Pending)
    const { error: orderErr } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        user_id: userId === 'anonymous' ? null : userId,
        customer_name: shippingDetails.fullName,
        phone: shippingDetails.phone,
        email: shippingDetails.email,
        delivery_address: shippingDetails.deliveryAddress,
        status: 'Pending',
        total_amount: totalAmount
      });
      
    if (orderErr) throw orderErr;

    // 2. Insert order items
    const itemsToInsert = cartItems.map(item => ({
      order_id: orderId,
      product_id: item.product.id,
      product_name_snapshot: item.product.name,
      product_image_snapshot: item.product.image || '',
      quantity: item.quantity,
      unit_price: item.product.price,
      subtotal: item.product.price * item.quantity
    }));
    
    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(itemsToInsert);
      
    if (itemsErr) throw itemsErr;

    return {
      id: orderId,
      userId,
      customerName: shippingDetails.fullName,
      phone: shippingDetails.phone,
      email: shippingDetails.email,
      deliveryAddress: shippingDetails.deliveryAddress,
      status: 'Pending',
      totalAmount,
      createdAt: new Date().toISOString(),
      items: cartItems.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        productImage: item.product.image || '',
        price: item.product.price,
        quantity: item.quantity
      }))
    };
  },

  async updateOrderStatus(id, status) {
    // Option B Transactional RPC integration
    if (status === 'Confirmed') {
      const { error: rpcErr } = await supabase.rpc('confirm_order', { p_order_id: id });
      if (rpcErr) throw rpcErr;
    } else if (status === 'Cancelled') {
      const { error: rpcErr } = await supabase.rpc('cancel_order', { p_order_id: id });
      if (rpcErr) throw rpcErr;
    } else {
      const { error: updateErr } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (updateErr) throw updateErr;
    }

    // Load updated order details
    const { data, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      customerName: data.customer_name,
      phone: data.phone,
      email: data.email,
      deliveryAddress: data.delivery_address,
      status: data.status,
      totalAmount: data.total_amount,
      createdAt: data.created_at,
      items: data.items.map(item => ({
        productId: item.product_id,
        productName: item.product_name_snapshot,
        productImage: item.product_image_snapshot,
        price: item.unit_price,
        quantity: item.quantity
      }))
    };
  },

  async deleteOrder(id) {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return { success: true };
  },

  // --- CONTACTS ---
  async getContactMessages() {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data.map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      phone: m.phone,
      message: m.message,
      isRead: m.is_read,
      createdAt: m.created_at
    }));
  },

  async submitContact(contactData) {
    const { data, error } = await supabase
      .from('contact_messages')
      .insert({
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone || '',
        message: contactData.message,
        is_read: false
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
      isRead: data.is_read,
      createdAt: data.created_at
    };
  },

  async updateContactMessage(id, contactData) {
    const { data, error } = await supabase
      .from('contact_messages')
      .update({
        is_read: contactData.is_read !== undefined ? contactData.is_read : contactData.isRead
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
      isRead: data.is_read,
      createdAt: data.created_at
    };
  },

  async deleteContactMessage(id) {
    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return { success: true };
  },

  // --- CUSTOMERS ---
  async getCustomers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data.map(c => ({
      userId: c.id,
      email: c.email,
      fullName: c.full_name,
      phone: c.phone,
      gender: c.gender,
      address: c.address,
      occupation: c.occupation,
      institutionType: c.institution_type,
      createdAt: c.created_at
    }));
  },

  // --- DELIVERY AGENTS ---
  async getAgents() {
    const { data, error } = await supabase
      .from('delivery_agents')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data.map(a => ({
      id: a.id,
      fullName: a.full_name,
      username: a.username,
      phone: a.phone,
      email: a.email,
      address: a.address,
      vehicleType: a.vehicle_type,
      vehicleNumber: a.vehicle_number,
      employeeId: a.employee_id,
      profilePhoto: a.profile_photo,
      joiningDate: a.joining_date,
      status: a.status
    }));
  },

  async addAgent(agentData) {
    // 1. Create auth user securely
    const agentEmail = agentData.email || `${agentData.username}@nab.in`;
    const agentPassword = agentData.password || 'password123';
    
    const { data: userId, error: rpcErr } = await supabase.rpc('create_auth_user', {
      p_email: agentEmail,
      p_password: agentPassword,
      p_role: 'delivery_boy'
    });
    
    if (rpcErr) throw rpcErr;

    // 2. Upload profile photo if applicable
    const photoUrl = await uploadBase64Image(agentData.profilePhoto, 'delivery-proofs');

    // 3. Create profile details
    const { data, error } = await supabase
      .from('delivery_agents')
      .insert({
        id: userId,
        full_name: agentData.fullName,
        username: agentData.username,
        phone: agentData.phone,
        email: agentEmail,
        address: agentData.address,
        vehicle_type: agentData.vehicleType,
        vehicle_number: agentData.vehicleNumber,
        employee_id: agentData.employeeId,
        profile_photo: photoUrl,
        joining_date: agentData.joiningDate || new Date().toISOString().split('T')[0],
        status: 'Active'
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      fullName: data.full_name,
      username: data.username,
      phone: data.phone,
      email: data.email,
      address: data.address,
      vehicleType: data.vehicle_type,
      vehicleNumber: data.vehicle_number,
      employeeId: data.employee_id,
      profilePhoto: data.profile_photo,
      joiningDate: data.joining_date,
      status: data.status
    };
  },

  async updateAgent(id, agentData) {
    // Upload base64 image if it changed
    const photoUrl = await uploadBase64Image(agentData.profilePhoto, 'delivery-proofs');

    const { data, error } = await supabase
      .from('delivery_agents')
      .update({
        full_name: agentData.fullName,
        phone: agentData.phone,
        address: agentData.address,
        vehicle_type: agentData.vehicleType,
        vehicle_number: agentData.vehicleNumber,
        employee_id: agentData.employeeId,
        profile_photo: photoUrl,
        status: agentData.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      fullName: data.full_name,
      username: data.username,
      phone: data.phone,
      email: data.email,
      address: data.address,
      vehicleType: data.vehicle_type,
      vehicleNumber: data.vehicle_number,
      employeeId: data.employee_id,
      profilePhoto: data.profile_photo,
      joiningDate: data.joining_date,
      status: data.status
    };
  },

  async deleteAgent(id) {
    const { error } = await supabase
      .from('delivery_agents')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return { success: true };
  },

  // --- ASSIGNMENTS ---
  async getAssignments() {
    const { data, error } = await supabase
      .from('delivery_assignments')
      .select('*')
      .order('assigned_at', { ascending: false });
      
    if (error) throw error;
    
    return data.map(a => ({
      id: a.id,
      orderId: a.order_id,
      agentId: a.agent_id,
      agentName: a.agent_name,
      status: a.status,
      assignedAt: a.assigned_at,
      acceptedAt: a.accepted_at,
      pickedUpAt: a.picked_up_at,
      outForDeliveryAt: a.out_for_delivery_at,
      deliveredAt: a.delivered_at,
      failedAt: a.failed_at,
      notes: a.notes,
      signature: a.signature_url,
      photo: a.photo_url,
      distance: a.distance,
      priority: a.priority
    }));
  },

  async getAgentAssignments(agentId) {
    const { data, error } = await supabase
      .from('delivery_assignments')
      .select('*')
      .eq('agent_id', agentId)
      .order('assigned_at', { ascending: false });
      
    if (error) throw error;
    
    return data.map(a => ({
      id: a.id,
      orderId: a.order_id,
      agentId: a.agent_id,
      agentName: a.agent_name,
      status: a.status,
      assignedAt: a.assigned_at,
      acceptedAt: a.accepted_at,
      pickedUpAt: a.picked_up_at,
      outForDeliveryAt: a.out_for_delivery_at,
      deliveredAt: a.delivered_at,
      failedAt: a.failed_at,
      notes: a.notes,
      signature: a.signature_url,
      photo: a.photo_url,
      distance: a.distance,
      priority: a.priority
    }));
  },

  async assignOrder(orderId, agentId) {
    const { data: agent } = await supabase
      .from('delivery_agents')
      .select('full_name')
      .eq('id', agentId)
      .single();
      
    if (!agent) throw new Error('Agent not found.');

    const { data, error } = await supabase
      .from('delivery_assignments')
      .upsert({
        order_id: orderId,
        agent_id: agentId,
        agent_name: agent.full_name,
        status: 'Assigned',
        assigned_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) throw error;

    await this.updateOrderStatus(orderId, 'Assigned');
    
    return {
      id: data.id,
      orderId: data.order_id,
      agentId: data.agent_id,
      agentName: data.agent_name,
      status: data.status,
      assignedAt: data.assigned_at
    };
  },

  async updateAssignmentStatus(orderId, status, details = {}) {
    const now = new Date().toISOString();
    
    // 1. Upload signature and photo if provided
    const signatureUrl = await uploadDeliveryProof(details.signature, orderId, 'signature');
    const photoUrl = await uploadDeliveryProof(details.photo, orderId, 'photo');

    const updateData = { status, updated_at: now };
    
    if (status === 'Accepted') updateData.accepted_at = now;
    else if (status === 'Picked Up') updateData.picked_up_at = now;
    else if (status === 'Out For Delivery') updateData.out_for_delivery_at = now;
    else if (status === 'Delivered') {
      updateData.delivered_at = now;
      if (signatureUrl) updateData.signature_url = signatureUrl;
      if (photoUrl) updateData.photo_url = photoUrl;
      if (details.notes) updateData.notes = details.notes;
    } else if (status === 'Unable To Deliver') {
      updateData.failed_at = now;
      if (details.notes) updateData.notes = details.notes;
    }

    const { data: assignment, error } = await supabase
      .from('delivery_assignments')
      .update(updateData)
      .eq('order_id', orderId)
      .select()
      .single();
      
    if (error) throw error;

    await this.updateOrderStatus(orderId, status);

    // Save to logs
    await supabase
      .from('delivery_logs')
      .insert({
        order_id: orderId,
        agent_id: assignment.agent_id,
        status,
        notes: details.notes || '',
        timestamp: now
      });
      
    return {
      id: assignment.id,
      orderId: assignment.order_id,
      agentId: assignment.agent_id,
      agentName: assignment.agent_name,
      status: assignment.status,
      assignedAt: assignment.assigned_at,
      acceptedAt: assignment.accepted_at,
      pickedUpAt: assignment.picked_up_at,
      outForDeliveryAt: assignment.out_for_delivery_at,
      deliveredAt: assignment.delivered_at,
      failedAt: assignment.failed_at,
      notes: assignment.notes,
      signature: assignment.signature_url,
      photo: assignment.photo_url,
      distance: assignment.distance,
      priority: assignment.priority
    };
  },

  // --- LIVE LOCATIONS ---
  async getLiveLocations() {
    const { data, error } = await supabase
      .from('live_locations')
      .select('*');
      
    if (error) throw error;
    
    return data.map(l => ({
      agentId: l.agent_id,
      orderId: l.order_id,
      latitude: parseFloat(l.latitude),
      longitude: parseFloat(l.longitude),
      accuracy: l.accuracy != null ? parseFloat(l.accuracy) : null,
      speed: l.speed != null ? parseFloat(l.speed) : null,
      heading: l.heading != null ? parseFloat(l.heading) : null,
      status: l.status,
      updatedAt: l.updated_at,
      lastUpdated: l.updated_at // for backward compatibility with UI
    }));
  },

  async updateLiveLocation(agentId, lat, lng, options = {}) {
    const opts = typeof options === 'string' ? { status: options } : (options || {});
    const payload = {
      agent_id: agentId,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      status: opts.status || 'Moving',
      updated_at: new Date().toISOString()
    };

    if (opts.orderId !== undefined) payload.order_id = opts.orderId;
    if (opts.accuracy !== undefined && opts.accuracy !== null) payload.accuracy = parseFloat(opts.accuracy);
    if (opts.speed !== undefined && opts.speed !== null) payload.speed = parseFloat(opts.speed);
    if (opts.heading !== undefined && opts.heading !== null) payload.heading = parseFloat(opts.heading);

    // Instant local cross-tab broadcast via BroadcastChannel
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        const bc = new BroadcastChannel('nab_live_telemetry');
        bc.postMessage({ type: 'LOCATION_UPDATE', payload });
        bc.close();
      }
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }

    const { data, error } = await supabase
      .from('live_locations')
      .upsert(payload)
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      agentId: data.agent_id,
      orderId: data.order_id,
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
      accuracy: data.accuracy != null ? parseFloat(data.accuracy) : null,
      speed: data.speed != null ? parseFloat(data.speed) : null,
      heading: data.heading != null ? parseFloat(data.heading) : null,
      status: data.status,
      updatedAt: data.updated_at,
      lastUpdated: data.updated_at
    };
  },

  // --- STAFF AUTH ---
  async staffLogin(username, password) {
    const email = username.includes('@') ? username : `${username}@nab.in`;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Check role
    const { data: roleData, error: roleErr } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .single();

    if (roleErr || roleData.role !== 'delivery_boy') {
      await supabase.auth.signOut();
      throw new Error('Unauthorized: Invalid staff credentials.');
    }

    // Load agent profile
    const { data: agent, error: agentErr } = await supabase
      .from('delivery_agents')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (agentErr) {
      await supabase.auth.signOut();
      throw new Error('Agent profile not found.');
    }

    if (agent.status === 'Inactive') {
      await supabase.auth.signOut();
      throw new Error('Account deactivated. Contact Admin.');
    }

    return { agent: {
      id: agent.id,
      fullName: agent.full_name,
      username: agent.username,
      phone: agent.phone,
      email: agent.email,
      address: agent.address,
      vehicleType: agent.vehicle_type,
      vehicleNumber: agent.vehicle_number,
      employeeId: agent.employee_id,
      profilePhoto: agent.profile_photo,
      joiningDate: agent.joining_date,
      status: agent.status
    } };
  },

  async updateStaffProfile(agentId, profileData) {
    let photoUrl = profileData.profilePhoto;
    if (photoUrl && photoUrl.startsWith('data:')) {
      photoUrl = await uploadBase64Image(profileData.profilePhoto, 'delivery-proofs');
    }

    const updateFields = {
      updated_at: new Date().toISOString()
    };
    if (profileData.fullName !== undefined) updateFields.full_name = profileData.fullName;
    if (profileData.phone !== undefined) updateFields.phone = profileData.phone;
    if (profileData.address !== undefined) updateFields.address = profileData.address;
    if (profileData.vehicleType !== undefined) updateFields.vehicle_type = profileData.vehicleType;
    if (profileData.vehicleNumber !== undefined) updateFields.vehicle_number = profileData.vehicleNumber;
    if (photoUrl !== undefined) updateFields.profile_photo = photoUrl;

    const { data, error } = await supabase
      .from('delivery_agents')
      .update(updateFields)
      .eq('id', agentId)
      .select()
      .single();
      
    if (error) throw error;

    const result = {
      id: data.id,
      fullName: data.full_name,
      username: data.username,
      phone: data.phone,
      email: data.email,
      address: data.address,
      vehicleType: data.vehicle_type,
      vehicleNumber: data.vehicle_number,
      employeeId: data.employee_id,
      profilePhoto: data.profile_photo,
      joiningDate: data.joining_date,
      status: data.status
    };

    // Instant cross-tab broadcast via BroadcastChannel
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        const bc = new BroadcastChannel('nab_agents_telemetry');
        bc.postMessage({ type: 'AGENT_UPDATE', payload: result });
        bc.close();
      }
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }

    // Trigger local and Supabase event hub listeners
    this.notify('agents_update', result);

    return result;
  },

  async changeStaffPassword(agentId, currentPassword, newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return { success: true };
  }
};
