'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  ArrowRight,
  Sparkles,
  MapPin,
  CheckCircle2,
  X,
  Ruler,
  Info,
  Layers,
  Scissors,
  ShieldCheck,
  Tag,
  ChevronRight,
} from 'lucide-react';
import { Product, Category, Branch, getProductSizes, getProductPriceForSize } from '@/lib/types';


function getTotalStockForSize(product: Product, size: string): number {
  if (!product.inventory) return 0;
  let total = 0;
  for (const branchId in product.inventory) {
    total += product.inventory[branchId]?.[size] || 0;
  }
  return total;
}

export default function StorefrontHomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Swipe-right full UI slide-over modal state
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [detailSelectedSize, setDetailSelectedSize] = useState<string>('');

  // Real-time background sync for storefront
  const refreshProducts = async () => {
    try {
      const res = await fetch(`/api/products?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const freshProds = await res.json();
        if (Array.isArray(freshProds)) {
          setProducts(freshProds);
          // Auto-close detail modal if the currently open product was removed
          setSelectedProductForDetail((current) => {
            if (current && !freshProds.some((p) => p.id === current.id)) {
              return null;
            }
            return current;
          });
        }
      }
    } catch (err) {
      console.warn('Failed to refresh products silently', err);
    }
  };

  useEffect(() => {
    async function loadStorefront() {
      try {
        const [resCats, resProds, resBranches] = await Promise.all([
          fetch('/api/categories?_t=' + Date.now(), { cache: 'no-store' }).then((r) => r.json()),
          fetch('/api/products?_t=' + Date.now(), { cache: 'no-store' }).then((r) => r.json()),
          fetch('/api/branches?_t=' + Date.now(), { cache: 'no-store' }).then((r) => r.json()),
        ]);
        if (Array.isArray(resCats)) setCategories(resCats);
        if (Array.isArray(resProds)) setProducts(resProds);
        if (Array.isArray(resBranches)) setBranches(resBranches);
      } catch (err) {
        console.error('Failed to load storefront data', err);
      } finally {
        setLoading(false);
      }
    }
    loadStorefront();

    // 1. Cross-tab BroadcastChannel for 0ms instantaneous deletion & live sync
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('roman_island_sync');
      bc.onmessage = (event) => {
        if (event.data?.type === 'PRODUCT_DELETED') {
          const deletedId = event.data.productId;
          setProducts((prev) => prev.filter((p) => p.id !== deletedId));
          setSelectedProductForDetail((curr) => (curr?.id === deletedId ? null : curr));
          refreshProducts();
        } else if (event.data?.type === 'CATEGORY_DELETED') {
          const cId = event.data.categoryId;
          setCategories((prev) => prev.filter((c) => c.id !== cId));
        } else if (event.data?.type === 'CATALOG_UPDATED') {
          refreshProducts();
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported', e);
    }

    // 2. Storage event listener (fallback cross-tab communication)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'ri_catalog_sync' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.type === 'PRODUCT_DELETED') {
            const deletedId = parsed.productId;
            setProducts((prev) => prev.filter((p) => p.id !== deletedId));
            setSelectedProductForDetail((curr) => (curr?.id === deletedId ? null : curr));
          } else if (parsed.type === 'CATEGORY_DELETED') {
            setCategories((prev) => prev.filter((c) => c.id !== parsed.categoryId));
          }
          refreshProducts();
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Multi-device live sync (polls every 3.5s when active tab)
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshProducts();
      }
    }, 3500);

    // 4. Instant sync on tab focus or visibility change
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshProducts();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, []);

  // Listen for ESC key to close the full UI detail panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedProductForDetail(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // When detail item opens, initialize selected size
  const handleOpenDetail = (product: Product) => {
    setSelectedProductForDetail(product);
    const pSizes = getProductSizes(product);
    const active = selectedSizes[product.id] || (pSizes.length > 0 ? pSizes[0] : '');
    setDetailSelectedSize(active);
  };

  const filteredProducts = products.filter((p) => {
    const matchCategory = activeCategory === 'All' || p.category.toLowerCase() === activeCategory.toLowerCase();
    const matchSearch =
      searchQuery.trim() === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 font-sans antialiased selection:bg-neutral-900 selection:text-white">
      {/* Top Announcement Bar */}
      <div className="bg-neutral-900 text-white text-[11px] py-2.5 px-4 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-neutral-300">
              <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>
                <strong className="text-white">Jubilee Hills Flagship</strong> • Road No. 36
              </span>
            </span>
            <span className="text-neutral-700 hidden md:inline">•</span>
            <span className="flex items-center gap-1.5 text-neutral-300">
              <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>
                <strong className="text-white">Inorbit Galleria</strong> • Hitech City
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-neutral-400 text-[11px]">
            <span>Flagship Boutiques Open Daily: <strong className="text-white font-medium">10:30 AM – 9:30 PM</strong></span>
          </div>
        </div>
      </div>

      {/* Clean Modern Navbar */}
      <nav className="sticky top-0 w-full z-40 bg-white/90 backdrop-blur-xl border-b border-neutral-200/70 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveCategory('All')}>
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-sm">
              RI
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-[0.22em] uppercase text-neutral-900">
              Roman Island
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs uppercase tracking-widest font-semibold text-neutral-600">
            <button
              onClick={() => setActiveCategory('All')}
              className={`hover:text-black transition-colors ${
                activeCategory === 'All' ? 'text-black underline underline-offset-4' : ''
              }`}
            >
              All
            </button>
            {categories.slice(0, 6).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={`hover:text-black transition-colors ${
                  activeCategory === cat.name ? 'text-black underline underline-offset-4' : ''
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search collection..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-neutral-100 border border-neutral-200 rounded-full pl-9 pr-4 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 w-36 sm:w-56 transition-all"
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Banner Section */}
      <section className="relative w-full h-[60vh] sm:h-[70vh] overflow-hidden bg-neutral-900 group">
        <img
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1600&auto=format&fit=crop"
          alt="New Collection"
          className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-[3s] ease-out group-hover:scale-105 opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-6 sm:p-12 md:p-20 flex flex-col items-start justify-end text-white">
          <div className="flex items-center gap-2 mb-3 opacity-90">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">
              Autumn / Winter '26 • Flagship Editions
            </span>
          </div>
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-6 tracking-tight leading-[1.1]">
            The Urban <br /> Edition.
          </h2>
          <a
            href="#catalog"
            className="group flex items-center gap-3 bg-white text-black px-8 py-3.5 font-semibold uppercase tracking-widest text-xs hover:bg-neutral-200 transition-all duration-300 shadow-xl rounded-sm"
          >
            Explore Collection
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </section>

      {/* Categories Stories Row */}
      <section className="pt-10 pb-6 max-w-7xl mx-auto">
        <div className="flex gap-6 overflow-x-auto no-scrollbar px-6 snap-x snap-mandatory">
          <button
            onClick={() => setActiveCategory('All')}
            className="flex flex-col items-center flex-shrink-0 group focus:outline-none snap-start"
          >
            <div
              className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[2px] transition-all duration-300 ${
                activeCategory === 'All' ? 'bg-neutral-900 scale-105 shadow-md' : 'bg-transparent hover:bg-neutral-300'
              }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-neutral-100 flex items-center justify-center">
                <span className="text-xs uppercase font-bold tracking-widest text-neutral-800">
                  All
                </span>
              </div>
            </div>
            <span
              className={`mt-3 text-[10px] sm:text-xs uppercase tracking-[0.15em] transition-colors ${
                activeCategory === 'All' ? 'font-bold text-neutral-900' : 'font-medium text-neutral-500'
              }`}
            >
              All Items
            </span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.name)}
              className="flex flex-col items-center flex-shrink-0 group focus:outline-none snap-start"
            >
              <div
                className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[2px] transition-all duration-300 ${
                  activeCategory === cat.name
                    ? 'bg-neutral-900 scale-105 shadow-md'
                    : 'bg-transparent hover:bg-neutral-300'
                }`}
              >
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-neutral-100">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              </div>
              <span
                className={`mt-3 text-[10px] sm:text-xs uppercase tracking-[0.15em] transition-colors ${
                  activeCategory === cat.name ? 'font-bold text-neutral-900' : 'font-medium text-neutral-500'
                }`}
              >
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Main Catalog Grid */}
      <section id="catalog" className="px-4 sm:px-6 max-w-7xl mx-auto pb-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 px-2 gap-4">
          <div>
            <h3 className="text-xl font-bold uppercase tracking-widest text-neutral-900">
              {activeCategory === 'All' ? 'Latest Arrivals' : `${activeCategory} Collection`}
            </h3>
            <p className="text-xs text-neutral-500 uppercase tracking-widest mt-1">
              Tap any item to view big screen photos, fabric details & size chart
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              {filteredProducts.length} Items Available
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse bg-white p-4 rounded-xl border border-neutral-100 space-y-3">
                <div className="w-full aspect-[4/5] bg-neutral-200 rounded-lg" />
                <div className="h-4 bg-neutral-200 rounded w-3/4" />
                <div className="h-4 bg-neutral-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => {
              const pSizes = getProductSizes(product);
              const activeSize = selectedSizes[product.id] || (pSizes.length > 0 ? pSizes[0] : undefined);

              return (
                <div
                  key={product.id}
                  onClick={() => handleOpenDetail(product)}
                  className="group relative flex flex-col bg-white p-3 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl border border-neutral-200/80 cursor-pointer hover:-translate-y-1"
                >
                  {/* Item Image with Hover Zoom */}
                  <div className="relative w-full aspect-[4/5] bg-neutral-100 overflow-hidden rounded-xl mb-3">
                    {product.tag && (
                      <div className="absolute top-2 left-2 z-10 bg-neutral-900/90 backdrop-blur-sm px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white rounded shadow-sm">
                        {product.tag}
                      </div>
                    )}

                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-in-out"
                    />

                    {/* Quick View Tag on Image */}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/75 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-white flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" /> View Specs & Chart
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col flex-grow px-1">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold mb-1">
                      {product.category}
                    </span>
                    <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wide line-clamp-1 mb-1 text-neutral-900 group-hover:text-black">
                      {product.name}
                    </h4>

                    {/* Cost / Price Display */}
                    {(() => {
                      const activePrice = getProductPriceForSize(product, activeSize).sellingPrice;
                      return (
                        <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                          <span className="font-extrabold text-base sm:text-lg text-neutral-900">
                            ₹{activePrice.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[11px] text-neutral-400 line-through">
                            ₹{Math.round(activePrice * 1.4).toLocaleString('en-IN')}
                          </span>
                          {product.hasVariablePricing && (
                            <span className="text-[9px] uppercase tracking-wider font-semibold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                              Variable Sizing Price
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    {/* Size Selection Buttons (Larger Size + Grey Shaded when out of stock) */}
                    {pSizes && pSizes.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-neutral-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] text-neutral-400 uppercase tracking-wider font-semibold">
                            Select Size:
                          </span>
                          {activeSize && (
                            <span className="text-[9px] text-neutral-600 font-semibold">
                              Chosen: <strong className="text-neutral-900">{activeSize}</strong>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {pSizes.map((sz) => {
                            const isSelected = activeSize === sz;
                            const inStockCount = getTotalStockForSize(product, sz);
                            const isOutOfStock = inStockCount <= 0;

                            return (
                              <button
                                key={sz}
                                type="button"
                                title={isOutOfStock ? `${sz} is Out of Stock` : `Select Size ${sz}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isOutOfStock) {
                                    setSelectedSizes((prev) => ({ ...prev, [product.id]: sz }));
                                  }
                                }}
                                disabled={isOutOfStock}
                                className={`min-w-[38px] h-9 px-3 py-1 text-xs font-bold font-mono rounded-lg transition-all flex items-center justify-center ${
                                  isOutOfStock
                                    ? 'bg-neutral-200/70 text-neutral-400 border border-neutral-300/80 line-through cursor-not-allowed opacity-60'
                                    : isSelected
                                    ? 'bg-neutral-900 text-white border-2 border-neutral-900 shadow-sm scale-105'
                                    : 'bg-white text-neutral-800 border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50'
                                }`}
                              >
                                {sz}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Boutique Branch Locations Showcase */}
      <section className="bg-neutral-100/90 py-16 px-4 sm:px-6 border-t border-neutral-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-neutral-900">
              Visit Our Flagship Stores
            </h2>
            <p className="text-xs text-neutral-500 uppercase tracking-widest mt-2">
              Experience the luxury fabrics, tailoring, and fit in person
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {branches.map((b) => (
              <div key={b.id} className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-neutral-900 text-white text-[10px] uppercase font-bold tracking-widest rounded">
                    Flagship Boutique
                  </span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Open Today (10:30 AM – 9:30 PM)
                  </span>
                </div>
                <h3 className="text-base font-bold uppercase tracking-wider text-neutral-900">
                  {b.name.replace(/^Branch\s*\d+\s*-\s*/i, '')}
                </h3>
                <p className="text-xs text-neutral-600">
                  {b.location}
                </p>
                <p className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                  Direct In-Store Assistance Available
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Footer */}
      <footer className="bg-neutral-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-lg font-bold tracking-[0.25em] uppercase">Roman Island</h2>
            <p className="text-xs text-neutral-400 uppercase tracking-widest mt-1">
              Multi-Branch Boutique & Tailored Ready-to-Wear
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-neutral-400">
            <span>Boutique Operating Hours: <strong className="text-white">10:30 AM – 9:30 PM Daily</strong></span>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-neutral-800 text-center text-[10px] text-neutral-500 uppercase tracking-widest">
          © 2026 Roman Island Apparel Co. All Rights Reserved.
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* SWIPE-RIGHT FULL UI SLIDE-OVER DRAWER FOR BIG IMAGE, FABRIC & SIZE CHART */}
      {/* ========================================================================= */}
      {selectedProductForDetail && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop Overlay */}
          <div
            onClick={() => setSelectedProductForDetail(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          />

          {/* Slide-over Container (Swipes in smoothly from right) */}
          <div className="relative w-full max-w-3xl lg:max-w-4xl bg-white shadow-2xl h-full flex flex-col overflow-y-auto transform transition-transform duration-300 ease-out z-50">
            {/* Top Sticky Bar */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-widest text-neutral-400">
                  {selectedProductForDetail.category}
                </span>
                <span className="text-neutral-300">•</span>
                <span className="text-xs font-mono font-medium text-neutral-500">
                  SKU: {selectedProductForDetail.sku}
                </span>
              </div>

              <button
                onClick={() => setSelectedProductForDetail(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-full text-xs font-bold transition-all"
              >
                <span>Close (ESC)</span>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-8">
              {/* BIG SCREEN IMAGE CONTAINER */}
              <div className="relative w-full rounded-2xl overflow-hidden bg-neutral-100 shadow-inner border border-neutral-200/80 group">
                <div className="w-full aspect-[4/3] sm:aspect-[16/10] max-h-[560px]">
                  <img
                    src={selectedProductForDetail.image}
                    alt={selectedProductForDetail.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                </div>

                {/* Overlaid Badges */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  {selectedProductForDetail.tag && (
                    <span className="bg-neutral-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-widest shadow">
                      {selectedProductForDetail.tag}
                    </span>
                  )}
                  <span className="bg-white/90 backdrop-blur-md text-neutral-900 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-widest shadow">
                    Roman Island Edition
                  </span>
                </div>
              </div>

              {/* PRODUCT HEADER & COST */}
              <div className="space-y-2 pb-6 border-b border-neutral-200">
                <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-neutral-900">
                  {selectedProductForDetail.name}
                </h2>
                {selectedProductForDetail.description?.trim() ? (
                  <p className="text-sm text-neutral-600 leading-relaxed pt-1">
                    {selectedProductForDetail.description}
                  </p>
                ) : null}

                {/* Prominent Price & Cost Display */}
                {(() => {
                  const detailPrice = getProductPriceForSize(selectedProductForDetail, detailSelectedSize).sellingPrice;
                  return (
                    <div className="pt-3 flex flex-wrap items-baseline gap-3">
                      <span className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
                        ₹{detailPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-base sm:text-lg text-neutral-400 line-through">
                        ₹{Math.round(detailPrice * 1.45).toLocaleString('en-IN')}
                      </span>
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-md uppercase tracking-wider">
                        Special In-Store Rate (31% OFF)
                      </span>
                      {selectedProductForDetail.hasVariablePricing && (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-md uppercase tracking-wider">
                          Size-Specific Pricing
                        </span>
                      )}
                    </div>
                  );
                })()}
                <p className="text-[11px] text-neutral-400 uppercase tracking-widest">
                  Inclusive of all GST & duties • Complimentary alterations at both flagship stores
                </p>
              </div>

              {/* SIZE SELECTION WINDOW (Prominent Larger Buttons with Grey Shading for Out-of-Stock) */}
              <div className="space-y-3 pb-6 border-b border-neutral-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-neutral-700" />
                    Available Sizes:
                  </h3>
                  {detailSelectedSize && (
                    <span className="text-xs font-semibold text-neutral-600">
                      Selected: <strong className="text-neutral-900">{detailSelectedSize}</strong>{' '}
                      {getTotalStockForSize(selectedProductForDetail, detailSelectedSize) > 0 ? (
                        <span className="text-emerald-600 font-bold ml-1.5">• In Stock (₹{getProductPriceForSize(selectedProductForDetail, detailSelectedSize).sellingPrice})</span>
                      ) : (
                        <span className="text-neutral-400 font-bold ml-1.5">• Out of Stock</span>
                      )}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {getProductSizes(selectedProductForDetail).map((sz) => {
                    const isSelected = detailSelectedSize === sz;
                    const stock = getTotalStockForSize(selectedProductForDetail, sz);
                    const isOutOfStock = stock <= 0;
                    const szPrice = getProductPriceForSize(selectedProductForDetail, sz).sellingPrice;

                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          if (!isOutOfStock) {
                            setDetailSelectedSize(sz);
                            setSelectedSizes((prev) => ({
                              ...prev,
                              [selectedProductForDetail.id]: sz,
                            }));
                          }
                        }}
                        disabled={isOutOfStock}
                        title={isOutOfStock ? `${sz} is Out of Stock` : `Select Size ${sz} - ₹${szPrice}`}
                        className={`min-w-[58px] h-12 px-3.5 rounded-xl font-mono text-sm font-bold transition-all flex flex-col items-center justify-center ${
                          isOutOfStock
                            ? 'bg-neutral-200 text-neutral-400 border-2 border-neutral-300 line-through cursor-not-allowed opacity-60'
                            : isSelected
                            ? 'bg-neutral-900 text-white border-2 border-neutral-900 shadow-md scale-105'
                            : 'bg-white text-neutral-800 border-2 border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50'
                        }`}
                      >
                        <span className="leading-tight">{sz}</span>
                        {selectedProductForDetail.hasVariablePricing && !isOutOfStock && (
                          <span className={`text-[10px] font-sans font-semibold leading-none ${
                            isSelected ? 'text-amber-300' : 'text-neutral-500'
                          }`}>
                            ₹{szPrice}
                          </span>
                        )}
                        {isOutOfStock && <span className="text-[9px] font-sans leading-none">(Sold)</span>}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-neutral-400">
                  Note: Sizes shaded in grey are currently out of stock.
                </p>
              </div>

              {/* FABRIC & MATERIAL SPECIFICATIONS (Only displayed if admin explicitly entered fabric or care details) */}
              {(Boolean(selectedProductForDetail.fabric?.trim()) || Boolean(selectedProductForDetail.care?.trim())) && (
                <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-neutral-900 text-white rounded-lg">
                      <Scissors className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                        Fabric & Craftsmanship Specifications
                      </h3>
                      <p className="text-[11px] text-neutral-500 uppercase tracking-wider">
                        Tailoring standards & material composition
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                    {selectedProductForDetail.fabric?.trim() && (
                      <div className="space-y-1 bg-white p-3.5 rounded-xl border border-neutral-200/70">
                        <span className="text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                          Material & Composition
                        </span>
                        <p className="font-semibold text-neutral-900 text-xs sm:text-sm">
                          {selectedProductForDetail.fabric}
                        </p>
                      </div>
                    )}

                    {selectedProductForDetail.care?.trim() && (
                      <div className="space-y-1 bg-white p-3.5 rounded-xl border border-neutral-200/70">
                        <span className="text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                          Garment Care Instructions
                        </span>
                        <p className="font-semibold text-neutral-900 text-xs sm:text-sm">
                          {selectedProductForDetail.care}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SIZE CHART & MEASUREMENTS TABLE (Only displayed if admin toggled ON and manually entered measurements) */}
              {selectedProductForDetail.hasSizeChart &&
                selectedProductForDetail.sizeChartMeasurements &&
                selectedProductForDetail.sizeChartMeasurements.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-neutral-900 text-white rounded-lg">
                          <Ruler className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                            Garment Measurements & Sizing Chart (Inches)
                          </h3>
                          <p className="text-[11px] text-neutral-500 uppercase tracking-wider">
                            Exact garment measurement guide
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Table with active highlighted size */}
                    <div className="overflow-x-auto rounded-xl border border-neutral-200 shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-neutral-900 text-white uppercase text-[10px] tracking-wider font-semibold">
                          <tr>
                            <th className="py-3 px-4">Size</th>
                            <th className="py-3 px-4">Chest (in)</th>
                            <th className="py-3 px-4">Length (in)</th>
                            <th className="py-3 px-4">Shoulder (in)</th>
                            <th className="py-3 px-4">Sleeve (in)</th>
                            {selectedProductForDetail.sizeChartMeasurements.some((r) => r.waist) && (
                              <th className="py-3 px-4">Waist (in)</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 bg-white">
                          {selectedProductForDetail.sizeChartMeasurements.map((row, idx) => {
                            const isRowSelected =
                              detailSelectedSize &&
                              (row.size.toLowerCase() === detailSelectedSize.toLowerCase() ||
                                row.size.toLowerCase().startsWith(detailSelectedSize.toLowerCase()));

                            return (
                              <tr
                                key={idx}
                                className={`transition-colors ${
                                  isRowSelected
                                    ? 'bg-amber-50/80 font-semibold'
                                    : 'hover:bg-neutral-50'
                                }`}
                              >
                                <td className="py-3 px-4 font-mono font-bold flex items-center gap-2">
                                  <span>{row.size}</span>
                                  {isRowSelected && (
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                  )}
                                </td>
                                <td className="py-3 px-4 font-mono">{row.chest || '-'}</td>
                                <td className="py-3 px-4 font-mono">{row.length || '-'}</td>
                                <td className="py-3 px-4 font-mono">{row.shoulder || '-'}</td>
                                <td className="py-3 px-4 font-mono">{row.sleeve || '-'}</td>
                                {selectedProductForDetail.sizeChartMeasurements!.some((r) => r.waist) && (
                                  <td className="py-3 px-4 font-mono">{row.waist || '-'}</td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              {/* Bottom Action Bar */}
              <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-neutral-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Available for in-person fitting at Jubilee Hills & Inorbit Flagship stores</span>
                </div>

                <button
                  onClick={() => setSelectedProductForDetail(null)}
                  className="w-full sm:w-auto px-8 py-3 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md"
                >
                  Back to Collection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}