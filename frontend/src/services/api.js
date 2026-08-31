import { api, dbEvents } from './db';
export { dbEvents };

export const Product = {
  list: async (orderBy = '-created_date', limit = 200) => {
    let list = await api.getProducts();
    // Sort by creation date
    if (orderBy.includes('created_date') || orderBy.includes('createdAt')) {
      list = [...list].sort((a, b) => new Date(b.createdAt || '') - new Date(a.createdAt || ''));
    }
    if (limit) {
      list = list.slice(0, limit);
    }
    // Map fields: stockQuantity -> stock_quantity, image -> image_url, is_active (default true)
    return list.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      stock_quantity: p.stockQuantity,
      description: p.description,
      image_url: p.image,
      is_active: p.isActive !== undefined ? p.isActive : true,
      createdAt: p.createdAt
    }));
  },
  create: async (data) => {
    const payload = {
      name: data.name,
      category: data.category,
      price: parseFloat(data.price),
      stockQuantity: parseInt(data.stock_quantity),
      description: data.description,
      image: data.image_url,
      isActive: data.is_active !== undefined ? data.is_active : true
    };
    const newProd = await api.addProduct(payload);
    return {
      ...newProd,
      stock_quantity: newProd.stockQuantity,
      image_url: newProd.image,
      is_active: newProd.isActive !== undefined ? newProd.isActive : true
    };
  },
  update: async (id, data) => {
    const payload = {
      name: data.name,
      category: data.category,
      price: parseFloat(data.price),
      stockQuantity: parseInt(data.stock_quantity),
      description: data.description,
      image: data.image_url,
      isActive: data.is_active !== undefined ? data.is_active : true
    };
    const updated = await api.updateProduct(id, payload);
    return {
      ...updated,
      stock_quantity: updated.stockQuantity,
      image_url: updated.image,
      is_active: updated.isActive !== undefined ? updated.isActive : true
    };
  },
  delete: async (id) => {
    return await api.deleteProduct(id);
  }
};

export const Order = {
  list: async (orderBy = '-created_date', limit = 50) => {
    const isStaffOrAdminPath = typeof window !== 'undefined' && (
      window.location.pathname.startsWith('/admin') || 
      window.location.pathname.startsWith('/staff')
    );
    const userSession = JSON.parse(sessionStorage.getItem('nab_session_user') || localStorage.getItem('nab_session_user') || 'null');
    const adminSession = JSON.parse(sessionStorage.getItem('nab_session_admin') || localStorage.getItem('nab_session_admin') || 'null');
    const staffSession = JSON.parse(sessionStorage.getItem('nab_session_staff') || localStorage.getItem('nab_session_staff') || 'null');
    
    let list = [];
    if (isStaffOrAdminPath || adminSession || staffSession) {
      list = await api.getOrders();
    } else if (userSession) {
      list = await api.getOrders(userSession.id);
    } else {
      list = [];
    }
    
    if (orderBy.includes('created_date') || orderBy.includes('createdAt')) {
      list = [...list].sort((a, b) => new Date(b.createdAt || b.created_at || '') - new Date(a.createdAt || a.created_at || ''));
    }
    if (limit) {
      list = list.slice(0, limit);
    }
    
    let products = [];
    try {
      products = await api.getProducts();
    } catch (e) {
      console.warn('Could not fetch active products catalog fallback for orders:', e);
    }
    
    return list.map(o => ({
      id: o.id,
      customer_name: o.customerName || o.customer_name || 'Customer',
      customer_email: o.email || o.customer_email || '',
      customer_phone: o.phone || o.customer_phone || '',
      delivery_address: o.deliveryAddress || o.delivery_address || '',
      status: o.status || 'Pending',
      total_amount: Number(o.totalAmount || o.total_amount) || 0,
      createdAt: o.createdAt || o.created_at || new Date().toISOString(),
      items: (o.items || []).map(item => {
        const prodId = item.productId || item.product_id;
        const dbProd = (products || []).find(p => p.id === prodId);
        return {
          product_id: prodId,
          product_name: item.productName || item.product_name || dbProd?.name || 'Product',
          product_image: dbProd?.image || item.productImage || item.product_image || 'https://images.unsplash.com/photo-1584036561566-baf241830990?auto=format&fit=crop&q=80&w=400',
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0
        };
      })
    }));
  },
  create: async (data) => {
    const userSession = JSON.parse(sessionStorage.getItem('nab_session_user') || localStorage.getItem('nab_session_user') || 'null');
    const userId = userSession ? userSession.id : 'anonymous';
    
    const shippingDetails = {
      fullName: data.customer_name,
      phone: data.customer_phone,
      email: data.customer_email,
      deliveryAddress: data.delivery_address
    };
    
    const cartItems = (data.items || []).map(item => ({
      product: {
        id: item.product_id || item.productId,
        name: item.product_name || item.productName,
        price: Number(item.price) || 0,
        image: item.product_image || item.productImage
      },
      quantity: Number(item.quantity) || 1
    }));
    
    const newOrder = await api.submitOrder(userId, shippingDetails, cartItems);
    let products = [];
    try {
      products = await api.getProducts();
    } catch (e) {}

    return {
      id: newOrder.id,
      customer_name: newOrder.customerName || data.customer_name,
      customer_email: newOrder.email || data.customer_email,
      customer_phone: newOrder.phone || data.customer_phone,
      delivery_address: newOrder.deliveryAddress || data.delivery_address,
      status: newOrder.status || 'Pending',
      total_amount: Number(newOrder.totalAmount) || 0,
      createdAt: newOrder.createdAt || new Date().toISOString(),
      items: (newOrder.items || []).map(item => {
        const prodId = item.productId || item.product_id;
        const dbProd = products.find(p => p.id === prodId);
        return {
          product_id: prodId,
          product_name: item.productName || item.product_name || dbProd?.name || 'Product',
          product_image: dbProd?.image || item.productImage || item.product_image || 'https://images.unsplash.com/photo-1584036561566-baf241830990?auto=format&fit=crop&q=80&w=400',
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0
        };
      })
    };
  },
  update: async (id, data) => {
    const updated = await api.updateOrderStatus(id, data.status);
    let products = [];
    try {
      products = await api.getProducts();
    } catch (e) {}

    return {
      id: updated.id,
      customer_name: updated.customerName,
      customer_email: updated.email,
      customer_phone: updated.phone,
      delivery_address: updated.deliveryAddress,
      status: updated.status,
      total_amount: Number(updated.totalAmount) || 0,
      createdAt: updated.createdAt,
      items: (updated.items || []).map(item => {
        const prodId = item.productId || item.product_id;
        const dbProd = products.find(p => p.id === prodId);
        return {
          product_id: prodId,
          product_name: item.productName || item.product_name || dbProd?.name || 'Product',
          product_image: dbProd?.image || item.productImage || item.product_image || 'https://images.unsplash.com/photo-1584036561566-baf241830990?auto=format&fit=crop&q=80&w=400',
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0
        };
      })
    };
  },
  delete: async (id) => {
    return await api.deleteOrder(id);
  }
};

export const ContactMessage = {
  create: async (data) => {
    const payload = {
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      message: data.message,
      isRead: false
    };
    const newMsg = await api.submitContact(payload);
    return {
      id: newMsg.id,
      name: newMsg.name,
      email: newMsg.email,
      phone: newMsg.phone,
      message: newMsg.message,
      is_read: newMsg.isRead !== undefined ? newMsg.isRead : false,
      createdAt: newMsg.createdAt
    };
  },
  list: async () => {
    const messages = await api.getContactMessages();
    return messages.map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      phone: m.phone,
      message: m.message,
      is_read: m.isRead !== undefined ? m.isRead : false,
      createdAt: m.createdAt
    }));
  },
  update: async (id, data) => {
    const updated = await api.updateContactMessage(id, data);
    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      message: updated.message,
      is_read: updated.isRead,
      createdAt: updated.createdAt
    };
  },
  delete: async (id) => {
    return await api.deleteContactMessage(id);
  }
};

export const User = {
  list: async () => {
    const customers = await api.getCustomers();
    return customers.map(c => {
      return {
        id: c.userId,
        name: c.fullName,
        email: c.email,
        phone: c.phone,
        occupation: c.occupation,
        gender: c.gender,
        address: c.address,
        profile_completed: true, // If they are in the customers profiles list, profile is complete
        createdAt: c.createdAt
      };
    });
  }
};

export const Category = {
  list: async () => {
    return await api.getCategories();
  },
  create: async (name) => {
    return await api.addCategory(name);
  },
  update: async (id, name) => {
    return await api.updateCategory(id, name);
  },
  delete: async (id) => {
    return await api.deleteCategory(id);
  }
};

export const base44 = {
  auth: {
    updateMe: async (data) => {
      const userSession = JSON.parse(sessionStorage.getItem('nab_session_user') || localStorage.getItem('nab_session_user') || 'null');
      if (!userSession) throw new Error('No active user session');
      
      const payload = {
        email: userSession.email,
        fullName: data.fullName || data.name || userSession.fullName || 'User',
        phone: data.phone,
        gender: data.gender,
        address: data.address,
        occupation: data.occupation,
        institutionType: data.institutionType
      };
      
      const res = await api.updateProfile(userSession.id, payload);
      sessionStorage.setItem('nab_session_profile', JSON.stringify(res.profile));
      return res.profile;
    }
  }
};

export const updateMe = async (data) => {
  const userSession = JSON.parse(sessionStorage.getItem('nab_session_user') || localStorage.getItem('nab_session_user') || 'null');
  if (!userSession) throw new Error('No active user session');
  
  const payload = {
    email: userSession.email,
    fullName: data.fullName || data.name || userSession.fullName || 'User',
    phone: data.phone,
    gender: data.gender,
    address: data.address,
    occupation: data.occupation,
    institutionType: data.institutionType
  };
  
  const res = await api.updateProfile(userSession.id, payload);
  
  const updatedUser = { ...userSession, profileCompleted: true };
  sessionStorage.setItem('nab_session_user', JSON.stringify(updatedUser));
  sessionStorage.setItem('nab_session_profile', JSON.stringify(res.profile));
  
  const users = JSON.parse(localStorage.getItem('nab_users') || '[]');
  const updatedUsers = users.map(u => u.id === userSession.id ? { ...u, profileCompleted: true } : u);
  localStorage.setItem('nab_users', JSON.stringify(updatedUsers));
  
  dbEvents.notify('customers_update', null);
  return res;
};

export const DeliveryAgent = {
  list: async () => {
    return await api.getAgents();
  },
  create: async (data) => {
    return await api.addAgent(data);
  },
  update: async (id, data) => {
    return await api.updateAgent(id, data);
  },
  delete: async (id) => {
    return await api.deleteAgent(id);
  }
};

export const Assignment = {
  list: async () => {
    return await api.getAssignments();
  },
  getAgentAssignments: async (agentId) => {
    return await api.getAgentAssignments(agentId);
  },
  assign: async (orderId, agentId) => {
    return await api.assignOrder(orderId, agentId);
  },
  updateStatus: async (orderId, status, details) => {
    return await api.updateAssignmentStatus(orderId, status, details);
  }
};

export const LiveLocation = {
  list: async () => {
    return await api.getLiveLocations();
  },
  update: async (agentId, lat, lng, options) => {
    return await api.updateLiveLocation(agentId, lat, lng, options);
  }
};

export const StaffAuth = {
  login: async (username, password) => {
    return await api.staffLogin(username, password);
  },
  updateProfile: async (agentId, profileData) => {
    return await api.updateStaffProfile(agentId, profileData);
  },
  changePassword: async (agentId, currentPassword, newPassword) => {
    return await api.changeStaffPassword(agentId, currentPassword, newPassword);
  }
};

