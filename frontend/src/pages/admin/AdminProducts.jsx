import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product, Category } from '../../services/api';
import { Search, Plus, Edit, Trash2, Loader2, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import SafeImage from '../../components/SafeImage';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Categories Dialog State
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  // TanStack Query for Categories
  const { data: categoriesData = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => Category.list()
  });

  const categories = categoriesData.map(c => c.name);

  const [form, setForm] = useState({
    name: '',
    category: 'Surface Disinfectants',
    price: '',
    stock_quantity: '',
    description: '',
    image_url: '',
    is_active: true
  });

  const [uploading, setUploading] = useState(false);

  // TanStack Query for Products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: () => Product.list('-created_date', 1000)
  });

  // Category Mutations
  const createCategoryMutation = useMutation({
    mutationFn: (name) => Category.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setNewCategoryName('');
      toast.success('Category added successfully!');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to add category.');
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, name }) => Category.update(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      setEditingCategory(null);
      setEditingCategoryName('');
      toast.success('Category updated successfully!');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update category.');
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id) => Category.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      toast.success('Category deleted successfully!');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete category.');
    }
  });

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    createCategoryMutation.mutate(newCategoryName.trim());
  };

  const handleStartEditCategory = (c) => {
    setEditingCategory(c.id);
    setEditingCategoryName(c.name);
  };

  const handleSaveEditCategory = (id) => {
    if (!editingCategoryName.trim()) return;
    updateCategoryMutation.mutate({ id, name: editingCategoryName.trim() });
  };

  const handleDeleteCategory = (id) => {
    if (window.confirm('Deleting this category will reassign all its products to "Others". Proceed?')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  // TanStack Query Mutations
  const createMutation = useMutation({
    mutationFn: (newP) => Product.create(newP),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      toast.success('Product added successfully!');
      closeDialog();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create product.');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      toast.success('Product updated successfully!');
      closeDialog();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update product.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      toast.success('Product deleted successfully!');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete product.');
    }
  });

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      category: categories[0] || 'Surface Disinfectants',
      price: '',
      stock_quantity: '',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1584036561566-baf241830990?auto=format&fit=crop&q=80&w=400',
      is_active: true
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      category: p.category,
      price: p.price,
      stock_quantity: p.stock_quantity,
      description: p.description || '',
      image_url: p.image_url,
      is_active: p.is_active
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, image_url: reader.result }));
      setUploading(false);
      toast.success('Image loaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.price || form.stock_quantity === '') {
      toast.error('Name, Price, and Stock Quantity are required.');
      return;
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(id);
    }
  };

  // Search filter
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 text-left font-sans"
    >
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display text-slate-900 leading-tight">Inventory Manager</h1>
          <p className="text-xs text-muted mt-1">Manage hospital supply items, stocks, and category definitions.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCategoryDialogOpen(true)}
            className="h-10 w-10 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
            title="Manage Category Classifications"
          >
            <Plus size={18} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, shadow: "0 0 15px rgba(19, 114, 217, 0.25)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenCreate}
            className="h-10 px-4 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus size={16} /> Add Product
          </motion.button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="glass-order-card border border-border/80 p-4 rounded-xl flex items-center hover:border-sky-400/50 hover:shadow-md transition-all duration-300">
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products by name or category..."
            className="block w-full h-10 pl-9 pr-4 bg-white/80 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 text-xs font-semibold"
          />
        </div>
      </div>

      {/* Table grid */}
      <div className="glass-order-card border border-border/80 rounded-xl overflow-hidden hover:border-sky-400/40 transition-colors duration-300 shadow-sm">
        {isLoading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="animate-spin text-primary" size={36} />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-xs text-muted">
            No products found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-slate-50 text-muted font-bold uppercase tracking-wider select-none">
                  <th className="p-4 w-20">Image</th>
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Warehouse Stock</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredProducts.map((p) => {
                  const isLowStock = p.stock_quantity < 10;
                  return (
                    <tr key={p.id} className="hover:bg-sky-50/40 border-b border-slate-100 transition-colors">
                      <td className="p-4">
                        <SafeImage
                          src={p.image_url}
                          alt={p.name}
                          className="w-10 h-10 rounded-md object-cover bg-slate-150 border border-border shadow-sm"
                        />
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-foreground text-slate-900">{p.name}</div>
                      </td>
                      <td className="p-4 font-semibold text-slate-500">{p.category}</td>
                      <td className="p-4 font-bold text-foreground">₹{p.price.toLocaleString('en-IN')}</td>
                      <td className="p-4">
                        <span className={`font-bold ${isLowStock ? 'text-destructive flex items-center gap-1 font-extrabold' : 'text-slate-800'}`}>
                          {isLowStock && <AlertTriangle size={12} className="animate-pulse" />}
                          {p.stock_quantity} units
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          p.is_active 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 border border-border rounded-lg text-slate-500 hover:text-primary hover:bg-white hover:border-primary/50 transition-all cursor-pointer"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 border border-border rounded-lg text-slate-500 hover:text-destructive hover:bg-white hover:border-destructive/50 transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Dialog Modal */}
      <AnimatePresence>
        {dialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-white rounded-2xl max-w-md w-full p-8 border border-border shadow-2xl relative space-y-6 text-left max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-lg font-bold text-foreground font-display">
                  {editingProduct ? 'Edit Product Item' : 'Add Product Item'}
                </h3>
                <button
                  onClick={closeDialog}
                  className="text-muted hover:text-foreground text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                    Product Name*
                  </label>
                  <input
                    type="text"
                    required
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="NAB Shield Pro (Surface Disinfectant)"
                    className="block w-full px-3 py-2 bg-slate-50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 text-xs font-semibold"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                    Category Classification*
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    className="block w-full px-3 py-2 bg-slate-50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 text-xs font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                    Product Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    value={form.description}
                    onChange={handleFormChange}
                    placeholder="Enter detailed product description..."
                    className="block w-full px-3 py-2 bg-slate-50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 text-xs font-semibold resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Price */}
                  <div>
                    <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                      Price (INR)*
                    </label>
                    <input
                      type="number"
                      required
                      name="price"
                      value={form.price}
                      onChange={handleFormChange}
                      placeholder="1200"
                      className="block w-full px-3 py-2 bg-slate-50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 text-xs font-semibold"
                    />
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                      Warehouse Stock*
                    </label>
                    <input
                      type="number"
                      required
                      name="stock_quantity"
                      value={form.stock_quantity}
                      onChange={handleFormChange}
                      placeholder="50"
                      className="block w-full px-3 py-2 bg-slate-50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Image Upload Integration */}
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                    Product Image Thumbnail
                  </label>
                  <div className="flex gap-3 items-center">
                    <SafeImage
                      src={form.image_url}
                      alt="Preview"
                      className="w-12 h-12 rounded object-cover bg-slate-100 border border-border flex-shrink-0"
                    />
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        id="dialog-file-upload"
                        className="hidden"
                      />
                      <label
                        htmlFor="dialog-file-upload"
                        className="inline-flex items-center gap-1.5 px-3 py-2 border border-border hover:bg-slate-50 text-foreground text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm select-none"
                      >
                        <ImageIcon size={14} /> {uploading ? 'Loading…' : 'Select Local File'}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    id="dialog-is-active"
                    checked={form.is_active}
                    onChange={handleFormChange}
                    className="w-4 h-4 text-primary focus:ring-sky-400/30 border-border rounded"
                  />
                  <label htmlFor="dialog-is-active" className="text-xs font-bold text-muted uppercase tracking-wider select-none cursor-pointer">
                    Activate in Customer Catalog
                  </label>
                </div>

                {/* Dialog Buttons */}
                <div className="flex gap-3 pt-3 border-t border-border mt-6">
                  <button
                    type="button"
                    onClick={closeDialog}
                    className="flex-1 py-2.5 border border-border hover:bg-slate-50 text-foreground text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 py-2.5 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-lg transition-colors shadow-md flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      'Save Product'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Manager Dialog Modal */}
      <AnimatePresence>
        {categoryDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm text-left font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-white rounded-2xl max-w-md w-full p-8 border border-border shadow-2xl relative space-y-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-lg font-bold text-foreground font-display">
                  Category Classifications
                </h3>
                <button
                  onClick={() => {
                    setCategoryDialogOpen(false);
                    setEditingCategory(null);
                  }}
                  className="text-muted hover:text-foreground text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Add Category Form */}
              <form onSubmit={handleAddCategory} className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                    Add New Category
                  </label>
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Sterilization Liquids"
                    className="block w-full px-3 py-2 bg-slate-50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 text-xs font-semibold"
                  />
                </div>
                <button
                  type="submit"
                  disabled={createCategoryMutation.isPending}
                  className="h-9 px-4 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex-shrink-0 flex items-center justify-center gap-1"
                >
                  {createCategoryMutation.isPending ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <>
                      <Plus size={14} /> Add
                    </>
                  )}
                </button>
              </form>

              {/* List of Categories */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Existing Categories</span>
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
                  {categoriesData.map((c) => {
                    const isEditing = editingCategory === c.id;
                    return (
                      <div key={c.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 border border-sky-200 bg-sky-50/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 text-xs font-semibold"
                          />
                        ) : (
                          <span className="font-semibold text-slate-800">{c.name}</span>
                        )}

                        <div className="flex gap-1.5">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSaveEditCategory(c.id)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCategory(null)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-border rounded-lg font-semibold text-[10px] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStartEditCategory(c)}
                                className="px-2.5 py-1.5 border border-border text-slate-500 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors cursor-pointer text-[10px] font-semibold"
                              >
                                Rename
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(c.id)}
                                className="px-2.5 py-1.5 border border-border text-slate-500 hover:text-destructive hover:bg-slate-50 rounded-lg transition-colors cursor-pointer text-[10px] font-semibold"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
