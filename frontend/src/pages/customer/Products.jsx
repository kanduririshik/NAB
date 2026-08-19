import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '../../context/CartContext';
import { Product, Category } from '../../services/api';
import { Search, ShoppingCart, Check, Package, AlertTriangle, Eye, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeImage from '../../components/SafeImage';
import { toast } from 'sonner';

export default function Products() {
  const { cartItems, addToCart, updateQuantity } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);

  // TanStack Query for products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => Product.list('-created_date', 200),
  });

  // TanStack Query for categories
  const { data: categoriesData = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => Category.list()
  });

  const categories = ['All', ...categoriesData.map(c => c.name)];

  // Filters: category + search query + must be active
  const filteredProducts = products
    .filter(p => p.is_active)
    .filter(p => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });

  return (
    <div className="space-y-8 pb-16 text-left font-sans">
      
      {/* Header with gradient bg + search bar */}
      <section className="glass bg-gradient-to-br from-primary/5 via-sky-500/5 to-accent/5 p-8 sm:p-12 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-sky-200 shadow-sm shadow-sky-100/50">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-display text-foreground">Products Catalog</h1>
          <p className="text-xs text-muted">
            Browse hospital-grade formulations, chemical concentrates, and premium equipment.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
            <Search size={18} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search catalog..."
            className="block w-full h-12 pl-10 pr-4 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs shadow-sm transition-all"
          />
        </div>
      </section>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 items-center">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`py-2 px-4 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-secondary text-foreground hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Product grid */}
      {isLoading ? (
        // 8 Skeleton cards
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, idx) => (
            <div key={idx} className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm h-[380px] flex flex-col animate-pulse">
              <div className="h-48 bg-slate-200" />
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 rounded w-full" />
                </div>
                <div className="flex justify-between items-center border-t border-border pt-4">
                  <div className="h-5 bg-slate-200 rounded w-1/3" />
                  <div className="h-9 bg-slate-200 rounded-lg w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        // Empty state
        <div className="glass rounded-2xl p-16 text-center max-w-md mx-auto space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto text-muted">
            <Package size={28} />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Products Found</h3>
          <p className="text-xs text-muted leading-relaxed">
            There are no active hygiene products matching "{searchTerm}" under the selected category.
          </p>
          <button
            onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
            className="py-2 px-4 bg-primary hover:bg-primary/95 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        // Cards grid with entry animation
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredProducts.map((p) => {
            const isAdded = cartItems.some(item => item.product.id === p.id);
            const isOutOfStock = p.stock_quantity === 0;
            const isLowStock = p.stock_quantity > 0 && p.stock_quantity < 10;

            return (
              <motion.div
                key={p.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                className="group glass-order-card rounded-2xl overflow-hidden flex flex-col h-full"
              >
                {/* Image Area */}
                <div className="h-48 overflow-hidden relative bg-slate-100">
                  <SafeImage
                    src={p.image_url}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Category badge */}
                  <span className="absolute top-3 left-3 bg-primary/90 text-white px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider">
                    {p.category}
                  </span>

                  {/* Stock status badge */}
                  {isOutOfStock ? (
                    <span className="absolute top-3 right-3 bg-destructive text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="absolute top-3 right-3 bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      Low Stock
                    </span>
                  ) : null}
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-display font-bold text-foreground text-sm tracking-tight line-clamp-1">
                      {p.name}
                    </h3>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-border">
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted font-bold uppercase">Estimated Price</span>
                        <span className="text-lg font-black text-foreground">₹{p.price.toLocaleString('en-IN')}</span>
                      </div>
                      <span className="text-[10px] text-muted font-bold">
                        Stock: <span className={isLowStock ? 'text-amber-600 font-extrabold' : 'text-slate-600'}>{p.stock_quantity}</span>
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedProduct(p)}
                        className="p-2.5 border border-border rounded-xl text-muted hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>

                      {isAdded ? (
                        <div className="flex-1 h-10 bg-primary rounded-xl flex items-center justify-between px-2 select-none shadow-md shadow-primary/10 border border-primary/20 text-white">
                          <button
                            type="button"
                            onClick={() => {
                              const item = cartItems.find(item => item.product.id === p.id);
                              if (item) updateQuantity(p.id, item.quantity - 1);
                            }}
                            className="text-white hover:bg-white/10 transition-colors font-extrabold text-base w-8 h-8 rounded-lg cursor-pointer flex items-center justify-center"
                          >
                            –
                          </button>
                          <span className="text-white font-black text-sm font-display">
                            {cartItems.find(item => item.product.id === p.id)?.quantity || 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const item = cartItems.find(item => item.product.id === p.id);
                              if (item) {
                                if (item.quantity >= p.stock_quantity) {
                                  toast.error('Warehouse stock limit reached.');
                                  return;
                                }
                                updateQuantity(p.id, item.quantity + 1);
                              }
                            }}
                            className="text-white hover:bg-white/10 transition-colors font-extrabold text-base w-8 h-8 rounded-lg cursor-pointer flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(p)}
                          disabled={isOutOfStock}
                          className="flex-1 h-10 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-primary hover:bg-primary/95 text-white"
                        >
                          <ShoppingCart size={14} /> Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Product Detail Modal Dialog */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-2xl w-full border border-border shadow-2xl overflow-hidden relative flex flex-col md:flex-row text-left font-sans"
            >
              {/* Image Section */}
              <div className="w-full md:w-1/2 h-64 md:h-auto bg-slate-100 relative">
                <SafeImage
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-4 left-4 bg-primary text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
                  {selectedProduct.category}
                </span>
              </div>

              {/* Content Section */}
              <div className="w-full md:w-1/2 p-5 sm:p-8 flex flex-col justify-between space-y-6 min-w-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-xl font-extrabold text-foreground font-display leading-snug">
                      {selectedProduct.name}
                    </h3>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="text-muted hover:text-foreground text-lg cursor-pointer px-1.5"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      selectedProduct.stock_quantity === 0
                        ? 'bg-destructive text-white'
                        : selectedProduct.stock_quantity < 10
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                    }`}>
                      {selectedProduct.stock_quantity === 0 ? 'Out of Stock' : selectedProduct.stock_quantity < 10 ? '🔴 Low Stock' : 'In Stock'}
                    </span>
                    <span className="bg-secondary text-foreground px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">
                      WHO Compliant
                    </span>
                  </div>

                  {/* Product Description */}
                  {selectedProduct.description && (
                    <div className="space-y-2 text-xs text-slate-600 leading-relaxed max-h-32 overflow-y-auto pr-1 whitespace-normal break-words">
                      {selectedProduct.description.split('\n').filter(Boolean).map((para, idx) => (
                        <p key={idx} className="whitespace-normal break-words">{para}</p>
                      ))}
                    </div>
                  )}

                  <div className="p-3 bg-secondary rounded-xl flex items-start gap-2 text-muted text-[10px] leading-snug">
                    <Info size={14} className="text-primary flex-shrink-0 mt-0.5" />
                    <span>
                      Bulk distributions qualify for commercial freight rate reductions. Inquiry requests are compiled and quoted directly by our purchase desk.
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted font-bold uppercase">Unit Price</span>
                    <span className="text-2xl font-black text-foreground">₹{selectedProduct.price.toLocaleString('en-IN')}</span>
                  </div>

                  <button
                    onClick={() => {
                      addToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    disabled={selectedProduct.stock_quantity === 0}
                    className="py-2.5 px-6 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add to Inquiry
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
