'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  ShoppingCart,
  Receipt,
  Building2,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  QrCode,
  Banknote,
  Printer,
  Sparkles,
  ArrowLeft,
  Share2,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Lock,
  Edit3,
  RotateCcw,
  X,
  Clock,
  FileText,
  Check,
  Undo2,
  Copy,
  ExternalLink,
  Maximize2,
  Minimize2,
  Send,
  Smartphone,
  Crown,
  MessageCircle,
} from 'lucide-react';
import { Product, Category, Branch, BranchId, PaymentMethod, Order, getProductSizes, getProductPriceForSize } from '@/lib/types';

interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

export default function BillingPOSPortal() {
  // Staff Auth State for POS Terminal
  const [currentStaff, setCurrentStaff] = useState<{
    username: string;
    name: string;
    role: string;
    branchId?: BranchId;
    token?: string;
  } | null>(null);

  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // POS State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('branch-1');
  const [cashierName, setCashierName] = useState('Staff Desk');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Cart & Customer Details
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');

  // Processing state & Modal
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showUpiQrModal, setShowUpiQrModal] = useState(false);

  // Selected product for size picker modal
  const [selectedProductForSize, setSelectedProductForSize] = useState<Product | null>(null);

  // Invoices & Returns Management State
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const [invoicesList, setInvoicesList] = useState<Order[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'Completed' | 'Refunded'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Order | null>(null);
  const [showReturnConfirm, setShowReturnConfirm] = useState(false);
  const [returnReason, setReturnReason] = useState('Customer Return / Exchange');
  const [returnSuccessMsg, setReturnSuccessMsg] = useState('');
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);

  // Edit Invoice State
  const [editingInvoice, setEditingInvoice] = useState<Order | null>(null);
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('Cash');
  const [editItems, setEditItems] = useState<Array<{ productId: string; productName: string; size: string; quantity: number; unitSellingPrice: number }>>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Fetch catalog & branches
  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const [resProd, resCat, resBranches] = await Promise.all([
        fetch('/api/products').then((r) => r.json()),
        fetch('/api/categories').then((r) => r.json()),
        fetch('/api/branches').then((r) => r.json()),
      ]);
      if (Array.isArray(resProd)) setProducts(resProd);
      if (Array.isArray(resCat)) setCategories(resCat);
      if (Array.isArray(resBranches)) {
        setBranches(resBranches);
        if (resBranches.length > 0 && !selectedBranch) {
          setSelectedBranch(resBranches[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  // Cashier Login Handler
  const handleStaffLogin = async (e?: React.FormEvent, directUser?: string, directPass?: string) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    const u = directUser || staffUsername;
    const p = directPass || staffPassword;

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentStaff(data.user);
        setCashierName(data.user.name);
        if (data.user.branchId) {
          setSelectedBranch(data.user.branchId);
        }
      } else {
        setAuthError(data.message || 'Staff authentication failed');
      }
    } catch (err) {
      setAuthError('Connection error to Cognito auth service');
    } finally {
      setAuthLoading(false);
    }
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = activeCategory === 'All' || p.category.toLowerCase() === activeCategory.toLowerCase();
      const matchQuery =
        searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [products, activeCategory, searchQuery]);

  // Cart calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const price = getProductPriceForSize(item.product, item.size).sellingPrice;
      return acc + price * item.quantity;
    }, 0);
  }, [cart]);

  const discount = Math.min(subtotal, Math.max(0, discountAmount));
  const taxable = Math.max(0, subtotal - discount);
  const tax = Number((taxable * 0.05).toFixed(2)); // 5% GST
  const grandTotal = Number((taxable + tax).toFixed(2));

  // Dynamic Scan-to-Pay UPI and WhatsApp Notification States
  const [upiCopied, setUpiCopied] = useState(false);
  const [isCustomerDisplayMode, setIsCustomerDisplayMode] = useState(false);
  const [isDispatchingNotification, setIsDispatchingNotification] = useState(false);
  const [notificationFeedback, setNotificationFeedback] = useState('');

  // Generate deterministic provisional billing reference for on-screen UPI QR
  const provisionalRef = useMemo(() => {
    const branchCode = selectedBranch === 'branch-1' ? 'B1' : 'B2';
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `BILL-${branchCode}-${todayStr}-${rand}`;
  }, [selectedBranch, cart.length]);

  // NPCI Compliant Dynamic UPI URI with pre-filled amount and transaction ref
  const upiIntentUri = useMemo(() => {
    const storeVpa = process.env.NEXT_PUBLIC_STORE_UPI_VPA || 'romanisland@okhdfcbank';
    const storeName = 'Roman Island';
    const amountStr = grandTotal.toFixed(2);
    return `upi://pay?pa=${encodeURIComponent(storeVpa)}&pn=${encodeURIComponent(storeName)}&am=${amountStr}&tr=${encodeURIComponent(provisionalRef)}&tn=${encodeURIComponent(`Roman Island Bill ${provisionalRef}`)}&cu=INR`;
  }, [grandTotal, provisionalRef]);

  const handleCopyUpiUri = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(upiIntentUri);
      setUpiCopied(true);
      setTimeout(() => setUpiCopied(false), 2500);
    }
  };

  const handleDispatchNotification = async (orderId: string, channel: 'whatsapp' | 'sms' = 'whatsapp') => {
    setIsDispatchingNotification(true);
    setNotificationFeedback('');
    try {
      const res = await fetch('/api/notifications/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, channel }),
      });
      const data = await res.json();
      if (data.success) {
        setNotificationFeedback(`✓ Digital invoice dispatched via ${data.notification?.provider === 'simulated' ? 'WhatsApp (Simulated)' : data.notification?.provider}!`);
        setTimeout(() => setNotificationFeedback(''), 4000);
      } else {
        alert(data.error || 'Failed to dispatch notification');
      }
    } catch (e) {
      alert('Network error connecting to notification service');
    } finally {
      setIsDispatchingNotification(false);
    }
  };

  // Add item to cart with size
  const addToCart = (product: Product, size: string) => {
    const stockAvailable = product.inventory[selectedBranch]?.[size] ?? 0;
    const existingIndex = cart.findIndex((i) => i.product.id === product.id && i.size === size);
    const currentQtyInCart = existingIndex > -1 ? cart[existingIndex].quantity : 0;

    if (currentQtyInCart + 1 > stockAvailable) {
      setErrorMessage(`Cannot add more. Only ${stockAvailable} in stock at this branch.`);
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, { product, size, quantity: 1 }]);
    }
    setSelectedProductForSize(null);
  };

  // Modify cart quantity
  const updateCartQty = (index: number, delta: number) => {
    const item = cart[index];
    const stockAvailable = item.product.inventory[selectedBranch]?.[item.size] ?? 0;
    const newQty = item.quantity + delta;

    if (newQty > stockAvailable) {
      setErrorMessage(`Only ${stockAvailable} available in stock.`);
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (newQty <= 0) {
      setCart(cart.filter((_, i) => i !== index));
    } else {
      const updated = [...cart];
      updated[index].quantity = newQty;
      setCart(updated);
    }
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // ---------------------------------------------------------------------------
  // INVOICE & RETURNS MANAGEMENT HANDLERS
  // ---------------------------------------------------------------------------
  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const branchParam = currentStaff?.role === 'superadmin' ? '' : `branchId=${selectedBranch}`;
      const res = await fetch(`/api/orders?${branchParam}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setInvoicesList(data);
        // If an invoice is currently selected, update its reference
        if (selectedInvoice) {
          const updated = data.find((o: Order) => o.id === selectedInvoice.id);
          if (updated) setSelectedInvoice(updated);
        }
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Process Return & Refund
  const handleProcessReturn = async (order: Order, reasonStr: string) => {
    setIsProcessingReturn(true);
    setReturnSuccessMsg('');
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'return',
          orderId: order.id,
          reason: reasonStr,
          cashierName: currentStaff?.name || cashierName,
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setSelectedInvoice(data.order);
        setInvoicesList((prev) =>
          prev.map((o) => (o.id === data.order.id ? data.order : o))
        );
        setShowReturnConfirm(false);
        setReturnSuccessMsg(
          `✓ Refund Processed: ₹${data.order.total} deducted from gross revenue & items restocked to branch inventory.`
        );

        // Refresh live apparel catalog to immediately show restored stock counts
        fetchCatalog();

        // Broadcast real-time event to Admin Dashboards & POS terminals
        if (typeof window !== 'undefined') {
          try {
            const bc = new BroadcastChannel('roman_island_sync');
            bc.postMessage({
              type: 'ORDER_REFUNDED',
              order: data.order,
              timestamp: Date.now(),
            });
            bc.close();
          } catch (e) {
            // broadcast fallback
          }
        }
      } else {
        alert(data.error || 'Failed to process return');
      }
    } catch (err) {
      alert('Network error while processing refund');
    } finally {
      setIsProcessingReturn(false);
    }
  };

  // Begin editing an invoice
  const handleStartEditInvoice = (order: Order) => {
    setEditingInvoice(order);
    setEditCustomerName(order.customerName || '');
    setEditCustomerPhone(order.customerPhone || '');
    setEditPaymentMethod(order.paymentMethod || 'Cash');
    setEditItems(
      order.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        size: i.size,
        quantity: i.quantity,
        unitSellingPrice: i.unitSellingPrice,
      }))
    );
    setIsEditingInvoice(true);
  };

  // Adjust item quantity in edit mode
  const handleUpdateEditItemQty = (index: number, delta: number) => {
    setEditItems((prev) => {
      const updated = [...prev];
      const newQty = Math.max(0, updated[index].quantity + delta);
      updated[index].quantity = newQty;
      return updated;
    });
  };

  // Save invoice edits (updates customer info, tender, and adjusts branch stock)
  const handleSaveInvoiceEdit = async () => {
    if (!selectedInvoice) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          orderId: selectedInvoice.id,
          updates: {
            customerName: editCustomerName.trim() || 'Walk-in Customer',
            customerPhone: editCustomerPhone.trim() || 'N/A',
            paymentMethod: editPaymentMethod,
            items: editItems.map((i) => ({
              productId: i.productId,
              size: i.size,
              quantity: i.quantity,
            })),
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setSelectedInvoice(data.order);
        setInvoicesList((prev) =>
          prev.map((o) => (o.id === data.order.id ? data.order : o))
        );
        setIsEditingInvoice(false);
        setReturnSuccessMsg('✓ Invoice updated and inventory difference adjusted successfully.');
        fetchCatalog();

        if (typeof window !== 'undefined') {
          try {
            const bc = new BroadcastChannel('roman_island_sync');
            bc.postMessage({
              type: 'INVOICE_EDITED',
              order: data.order,
              timestamp: Date.now(),
            });
            bc.close();
          } catch (e) {}
        }
      } else {
        alert(data.error || 'Failed to update invoice');
      }
    } catch (err) {
      alert('Network error while saving invoice changes');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Submit and create order
  const handleGenerateBill = async () => {
    if (cart.length === 0) {
      setErrorMessage('Please add items to bill.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    const payload = {
      branchId: selectedBranch,
      items: cart.map((i) => ({
        productId: i.product.id,
        size: i.size,
        quantity: i.quantity,
      })),
      discount,
      paymentMethod,
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim() || 'N/A',
      cashierName,
      source: 'web-pos',
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setCompletedOrder(data.order);
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setDiscountAmount(0);
        // Refresh catalog to reflect decremented stock
        fetchCatalog();

        // Broadcast nanosecond real-time update to Admin dashboard
        if (typeof window !== 'undefined') {
          try {
            const bc = new BroadcastChannel('roman_island_sync');
            bc.postMessage({ type: 'ORDER_PLACED', order: data.order, timestamp: Date.now() });
            bc.close();
            localStorage.setItem('ri_last_order_sync', JSON.stringify({ id: data.order.id, timestamp: Date.now() }));
          } catch (broadcastErr) {
            console.warn('Broadcast sync error:', broadcastErr);
          }
        }
      } else {
        setErrorMessage(data.error || 'Failed to complete order');
      }
    } catch (e) {
      setErrorMessage('Server connection error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 1. Staff Authentication Gate
  if (!currentStaff) {
    return (
      <div className="min-h-screen bg-[#070B14] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-emerald-950/25 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-[#0F1626]/90 border border-slate-800 backdrop-blur-xl p-8 rounded-2xl shadow-2xl z-10 relative">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white shadow-lg text-sm">
              POS
            </div>
            <h1 className="text-xl font-bold tracking-wider uppercase bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Roman Island POS
            </h1>
          </div>

          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold tracking-wider uppercase flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Amazon Cognito Cashier Auth
            </span>
          </div>

          <p className="text-center text-xs text-slate-400 uppercase tracking-widest mb-6">
            In-Store Terminal Login
          </p>

          {authError && (
            <div className="mb-5 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={(e) => handleStaffLogin(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Staff / Cashier ID
              </label>
              <input
                type="text"
                value={staffUsername}
                onChange={(e) => setStaffUsername(e.target.value)}
                placeholder="e.g. cashier_b1 or cashier_b2"
                className="w-full bg-[#162035] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-[#162035] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/30 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Unlock POS Terminal'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-slate-600" /> Authorized Personnel Only
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Authenticated POS Cashier Terminal
  return (
    <div className="min-h-screen bg-[#0A0E17] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <header className="bg-[#111728] border-b border-slate-800/80 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-md text-xs">
              POS
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider uppercase text-white flex items-center gap-2">
                Roman Island In-Store Terminal
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Staff: <span className="text-white font-medium">{cashierName}</span> ({currentStaff.username})
              </p>
            </div>
          </div>
        </div>

        {/* Branch Selector (Locked if assigned to branch, switchable if superadmin) */}
        <div className="flex items-center gap-3">
          {currentStaff.role === 'superadmin' ? (
            <div className="flex items-center gap-1 bg-[#182138] p-1 rounded-xl border border-slate-700/60 max-w-md overflow-x-auto">
              {branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBranch(b.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                    selectedBranch === b.id
                      ? 'bg-amber-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  {b.name} ({b.code})
                </button>
              ))}
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-xl bg-[#182138] border border-slate-700 text-xs font-semibold flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-300">
                {branches.find((b) => b.id === selectedBranch)?.name || selectedBranch}
              </span>
              <span className="text-[10px] text-slate-500 uppercase">(Branch Locked)</span>
            </div>
          )}

          {/* Invoices & Returns Portal Button */}
          <button
            onClick={() => {
              setShowInvoicesModal(true);
              fetchInvoices();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 text-xs font-semibold transition-all shadow-sm group"
            title="Manage Invoices, Process Returns & Edits"
          >
            <Receipt className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Invoices & Returns</span>
          </button>

          {/* Sign Out Button */}
          <button
            onClick={() => {
              setCurrentStaff(null);
              setCart([]);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 text-red-300 border border-red-800/50 hover:bg-red-900/50 text-xs font-medium transition-colors"
            title="Lock POS Terminal"
          >
            <LogOut className="w-3.5 h-3.5" /> Lock POS
          </button>
        </div>
      </header>

      {/* Main Billing Grid */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT COLUMN: Apparel Catalog */}
        <div className="flex-1 flex flex-col border-r border-slate-800/80 bg-[#0C121E] overflow-y-auto">
          {/* Search & Category Filter Bar */}
          <div className="p-4 border-b border-slate-800/80 space-y-3 bg-[#101728]/80 backdrop-blur sticky top-0 z-20">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Quick search cloth name, SKU, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#182138] border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveCategory('All')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  activeCategory === 'All'
                    ? 'bg-white text-black font-bold shadow'
                    : 'bg-[#182138] text-slate-400 hover:text-white'
                }`}
              >
                All Apparel
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    activeCategory === cat.name
                      ? 'bg-white text-black font-bold shadow'
                      : 'bg-[#182138] text-slate-400 hover:text-white'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items Grid */}
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((prod) => {
              const branchStock = prod.inventory[selectedBranch] || { S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
              const totalStock = Object.values(branchStock).reduce((a, b) => a + b, 0);

              return (
                <div
                  key={prod.id}
                  onClick={() => setSelectedProductForSize(prod)}
                  className="bg-[#12192B] border border-slate-800/90 hover:border-emerald-500/60 rounded-xl p-2.5 flex flex-col cursor-pointer transition-all hover:scale-[1.02] shadow-md group"
                >
                  <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-slate-900 mb-2">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-1.5 left-1.5">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-md ${
                          totalStock > 0 ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50' : 'bg-red-950/80 text-red-300'
                        }`}
                      >
                        {totalStock > 0 ? `${totalStock} in branch` : 'Out of Stock'}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">{prod.category}</span>
                    <h4 className="text-xs font-bold text-white line-clamp-1 mb-1">{prod.name}</h4>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400">₹{prod.sellingPrice}</span>
                      <span className="text-[10px] text-indigo-400 group-hover:underline">Select Size →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Bill Register & Checkout */}
        <div className="w-full lg:w-96 xl:w-[420px] bg-[#101625] flex flex-col h-full border-t lg:border-t-0 border-slate-800">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Current Bill</h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              {cart.reduce((a, b) => a + b.quantity, 0)} Items
            </span>
          </div>

          {/* Error notification */}
          {errorMessage && (
            <div className="m-3 p-2.5 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-800/60">
            {cart.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs">
                <ShoppingCart className="w-8 h-8 mb-2 stroke-[1.5] text-slate-600" />
                <p>No items added to bill yet.</p>
                <p className="text-[10px] text-slate-600">Select clothes from catalog on the left.</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={`${item.product.id}-${item.size}`} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <img src={item.product.image} alt={item.product.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white truncate">{item.product.name}</p>
                      <p className="text-[10px] text-slate-400">
                        Size: <span className="text-emerald-400 font-bold">{item.size}</span> | ₹{getProductPriceForSize(item.product, item.size).sellingPrice}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-[#182138] border border-slate-700/80 rounded-lg">
                      <button
                        onClick={() => updateCartQty(idx, -1)}
                        className="px-2 py-0.5 text-slate-400 hover:text-white font-bold"
                      >
                        -
                      </button>
                      <span className="px-1.5 font-bold text-white text-xs">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQty(idx, 1)}
                        className="px-2 py-0.5 text-slate-400 hover:text-white font-bold"
                      >
                        +
                      </button>
                    </div>

                    <span className="font-bold text-white w-14 text-right">
                      ₹{getProductPriceForSize(item.product, item.size).sellingPrice * item.quantity}
                    </span>

                    <button
                      onClick={() => removeFromCart(idx)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Customer Details & Checkout Form */}
          <div className="p-4 border-t border-slate-800 bg-[#0E1422] space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#182138] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                  Phone (for invoice)
                </label>
                <input
                  type="text"
                  placeholder="9876543210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-[#182138] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                Payment Option
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['UPI', 'Cash', 'Card'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(method);
                      if (method === 'UPI') setShowUpiQrModal(true);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                      paymentMethod === method
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                        : 'bg-[#182138] border-slate-700/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {method === 'UPI' && <QrCode className="w-3.5 h-3.5" />}
                    {method === 'Cash' && <Banknote className="w-3.5 h-3.5" />}
                    {method === 'Card' && <CreditCard className="w-3.5 h-3.5" />}
                    <span>{method}</span>
                  </button>
                ))}
              </div>

              {/* Dynamic Scan-to-Pay UPI Quick Card */}
              {paymentMethod === 'UPI' && grandTotal > 0 && (
                <div className="mt-2.5 p-3 rounded-xl bg-[#131D31] border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Dynamic Scan-to-Pay
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                      ₹{grandTotal.toFixed(2)} LOCKED
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-16 h-16 bg-white p-1 rounded-lg flex-shrink-0 shadow flex items-center justify-center relative">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&margin=2&data=${encodeURIComponent(upiIntentUri)}`}
                        alt="UPI QR"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-[10px] text-slate-300 font-mono truncate">
                        romanisland@okhdfcbank
                      </p>
                      <p className="text-[9px] text-slate-400">
                        Exact amount pre-filled; zero customer error.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowUpiQrModal(true)}
                        className="w-full py-1 px-2 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                      >
                        <Maximize2 className="w-3 h-3" /> Customer Display QR
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-white">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Discount (₹)</span>
                <input
                  type="number"
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-20 bg-[#182138] border border-slate-700 rounded px-2 py-0.5 text-right text-xs text-amber-400"
                />
              </div>
              <div className="flex justify-between">
                <span>GST Tax (5%)</span>
                <span className="font-semibold text-white">₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-1.5 border-t border-slate-800">
                <span>Grand Total</span>
                <span className="text-emerald-400 text-base">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Complete Bill Button */}
            <button
              onClick={handleGenerateBill}
              disabled={isProcessing || cart.length === 0}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/30 text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Receipt className="w-4 h-4" /> Generate Bill & Print Receipt
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: SIZE PICKER FOR CATALOG ITEM */}
      {/* ========================================================================= */}
      {selectedProductForSize && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111726] border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">{selectedProductForSize.name}</h3>
                <p className="text-xs text-emerald-400 font-bold">₹{selectedProductForSize.sellingPrice}</p>
              </div>
              <button
                onClick={() => setSelectedProductForSize(null)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Select Size (Stock at {selectedBranch === 'branch-1' ? 'Downtown' : selectedBranch === 'branch-2' ? 'Uptown' : 'Selected Branch'}):
              </label>
              <div className="flex flex-wrap gap-2">
                {getProductSizes(selectedProductForSize).map((sz) => {
                  const stock = selectedProductForSize.inventory[selectedBranch]?.[sz] ?? 0;
                  const isAvailable = stock > 0;

                  const szPrice = getProductPriceForSize(selectedProductForSize, sz).sellingPrice;

                  return (
                    <button
                      key={sz}
                      disabled={!isAvailable}
                      onClick={() => addToCart(selectedProductForSize, sz)}
                      className={`px-3 py-2 rounded-xl text-center border transition-all min-w-[62px] ${
                        isAvailable
                          ? 'bg-[#182138] border-slate-700 hover:border-emerald-500 hover:bg-emerald-600/20 text-white cursor-pointer'
                          : 'bg-[#0b0f19] border-slate-800/60 text-slate-600 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <span className="block font-bold text-xs">{sz}</span>
                      <span className="block text-[9px] text-slate-400">{stock} left</span>
                      <span className="block text-[9px] text-emerald-400 font-mono font-bold">₹{szPrice}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DYNAMIC SCAN-TO-PAY UPI QR CODE (FEATURE 7) */}
      {/* ========================================================================= */}
      {showUpiQrModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className={`bg-[#0D1424] border border-slate-700/80 rounded-3xl shadow-2xl transition-all ${
              isCustomerDisplayMode
                ? 'w-full max-w-2xl p-8 space-y-6'
                : 'w-full max-w-md p-6 space-y-5'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                    Dynamic Scan-to-Pay UPI
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">
                      NPCI Standard
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Ref: {provisionalRef}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerDisplayMode(!isCustomerDisplayMode)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title={isCustomerDisplayMode ? 'Compact View' : 'Full Customer Display'}
                >
                  {isCustomerDisplayMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setShowUpiQrModal(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dynamic Locked Amount Display */}
            <div className="text-center py-2 bg-[#121B2F] border border-slate-800 rounded-2xl">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block">
                Pre-Filled Bill Amount (Locked)
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 mt-1">
                ₹{grandTotal.toFixed(2)}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Zero manual typing error • Scan opens app with exact payable total
              </p>
            </div>

            {/* High-Resolution QR Code with Center Boutique Seal */}
            <div className="flex flex-col items-center justify-center">
              <div className="bg-white p-3.5 rounded-2xl shadow-2xl relative inline-block border-4 border-emerald-500/30">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(upiIntentUri)}`}
                  alt="Dynamic Scan-to-Pay QR"
                  className={`${isCustomerDisplayMode ? 'w-64 h-64' : 'w-52 h-52'} object-contain`}
                />
                {/* Center Roman Island Gold Badge */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 bg-neutral-900 border-2 border-amber-400 rounded-xl shadow-lg flex items-center justify-center">
                  <span className="text-amber-400 font-black text-xs tracking-wider">RI</span>
                </div>
              </div>

              {/* Real-time scan indicator */}
              <div className="flex items-center gap-2 mt-3 text-xs text-slate-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Waiting for Customer Scan on PhonePe / GPay / Paytm...</span>
              </div>
            </div>

            {/* Merchant VPA & Supported Apps */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between bg-[#11192C] px-3 py-2 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400">Store UPI ID:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-white">romanisland@okhdfcbank</span>
                  <button
                    onClick={handleCopyUpiUri}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    {upiCopied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Supported UPI Apps Pills */}
              <div className="flex flex-wrap justify-center items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                <span className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40">GPay</span>
                <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">PhonePe</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">Paytm</span>
                <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">BHIM UPI</span>
                <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40">Cred Pay</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Any UPI App</span>
              </div>
            </div>

            {/* Cashier Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setShowUpiQrModal(false);
                  handleGenerateBill();
                }}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/30 text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" /> Payment Received (Confirm & Complete Bill)
              </button>

              <button
                onClick={() => setShowUpiQrModal(false)}
                className="w-full bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white py-2 rounded-xl text-xs font-semibold transition-colors"
              >
                Close Display
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INSTANT DIGITAL TAX INVOICE & RECEIPT CONFIRMATION (FEATURE 8) */}
      {/* ========================================================================= */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-neutral-900 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 font-mono text-xs my-8 border border-neutral-300">
            {/* Boutique Header */}
            <div className="text-center border-b pb-3 border-dashed border-neutral-400">
              <h3 className="text-base font-bold tracking-widest uppercase">ROMAN ISLAND</h3>
              <p className="text-[10px] text-neutral-600 uppercase">Luxury Ready-To-Wear • Retail Flagship</p>
              <p className="text-[10px] text-neutral-600 font-semibold">{completedOrder.branchName}</p>
              <p className="text-[10px] text-neutral-500">
                GSTIN: 36ABCDE1234F1Z5 | Ph: +91 98765 43210
              </p>
            </div>

            {/* Bill Meta */}
            <div className="space-y-1 text-[11px] border-b pb-2 border-dashed border-neutral-400">
              <div className="flex justify-between">
                <span>BILL ID:</span>
                <span className="font-bold">{completedOrder.billingId}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE:</span>
                <span>{new Date(completedOrder.createdAt).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>CUSTOMER:</span>
                <span className="font-bold">{completedOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>PHONE:</span>
                <span>{completedOrder.customerPhone}</span>
              </div>
              {completedOrder.customerTier && (
                <div className="flex justify-between text-amber-700 font-bold">
                  <span>VIP PRIVILEGE:</span>
                  <span>👑 {completedOrder.customerTier.toUpperCase()} MEMBER</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>CASHIER:</span>
                <span>{completedOrder.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>PAYMENT:</span>
                <span className="font-bold uppercase text-emerald-700">{completedOrder.paymentMethod}</span>
              </div>
            </div>

            {/* Line items */}
            <div className="divide-y divide-neutral-200 py-1">
              {completedOrder.items.map((it, idx) => (
                <div key={idx} className="py-1.5 flex justify-between">
                  <div>
                    <p className="font-bold">{it.productName}</p>
                    <p className="text-[10px] text-neutral-600">
                      Size {it.size} × {it.quantity} @ ₹{it.unitSellingPrice.toFixed(2)}
                    </p>
                  </div>
                  <span className="font-bold">₹{it.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Financial breakdown */}
            <div className="border-t border-dashed border-neutral-400 pt-2 space-y-1">
              <div className="flex justify-between">
                <span>SUBTOTAL</span>
                <span>₹{completedOrder.subtotal.toFixed(2)}</span>
              </div>
              {completedOrder.discount > 0 && (
                <div className="flex justify-between text-neutral-700">
                  <span>DISCOUNT</span>
                  <span>-₹{completedOrder.discount.toFixed(2)}</span>
                </div>
              )}
              {completedOrder.pointsRedeemed && completedOrder.pointsRedeemed > 0 ? (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>⭐ POINTS REDEEMED</span>
                  <span>-₹{completedOrder.pointsRedeemed.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span>₹{completedOrder.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-neutral-900 pt-1">
                <span>GRAND TOTAL</span>
                <span className="text-emerald-700">₹{completedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            {/* VIP Loyalty Accrual */}
            {completedOrder.pointsEarned && completedOrder.pointsEarned > 0 ? (
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center justify-between text-amber-900">
                <span className="text-[10px] font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> VIP Points Accrued Today:
                </span>
                <span className="font-black text-xs font-mono">+⭐ {completedOrder.pointsEarned} Pts</span>
              </div>
            ) : null}

            {/* =============================================================== */}
            {/* FEATURE 8: INSTANT WHATSAPP / SMS DIGITAL BILL DISPATCH CARD */}
            {/* =============================================================== */}
            <div className="bg-slate-900 text-white p-3.5 rounded-xl space-y-2 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  Instant WhatsApp Digital Bill
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  Cloud API
                </span>
              </div>

              {completedOrder.customerPhone && completedOrder.customerPhone.replace(/\D/g, '').length === 10 ? (
                <p className="text-[11px] text-slate-300 leading-snug">
                  ✓ Automated invoice sent to customer WhatsApp at{' '}
                  <strong className="text-white">+91 {completedOrder.customerPhone.replace(/\D/g, '').slice(-10)}</strong>
                </p>
              ) : (
                <p className="text-[10px] text-amber-400">
                  ⚠️ No 10-digit mobile number provided. You can resend via WhatsApp below.
                </p>
              )}

              {notificationFeedback && (
                <p className="text-[10px] text-emerald-300 font-bold animate-pulse">
                  {notificationFeedback}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleDispatchNotification(completedOrder.id, 'whatsapp')}
                  disabled={isDispatchingNotification}
                  className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                >
                  <MessageCircle className="w-3 h-3" />
                  {isDispatchingNotification ? 'Sending...' : 'Resend WhatsApp'}
                </button>

                <button
                  type="button"
                  onClick={() => handleDispatchNotification(completedOrder.id, 'sms')}
                  disabled={isDispatchingNotification}
                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                >
                  <Smartphone className="w-3 h-3" />
                  Send via SMS
                </button>
              </div>

              {/* View Public Digital Tax Invoice link */}
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.open(`/invoice/${encodeURIComponent(completedOrder.billingId)}`, '_blank');
                  }
                }}
                className="w-full py-1.5 px-2 bg-[#18233C] hover:bg-slate-800 text-amber-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 border border-amber-500/30 transition-all"
              >
                <ExternalLink className="w-3 h-3" />
                Open Official Digital Tax Invoice (PDF)
              </button>
            </div>

            <div className="text-center pt-1 text-[10px] text-neutral-500 border-t border-dashed border-neutral-400">
              <p>🌱 100% Paperless Store • Valid for 7-day exchanges.</p>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-black text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-neutral-800"
              >
                <Printer className="w-3.5 h-3.5" /> Print Bill Slip
              </button>
              <button
                onClick={() => {
                  setCompletedOrder(null);
                  setNotificationFeedback('');
                }}
                className="flex-1 bg-neutral-200 text-neutral-800 py-2 rounded-xl text-xs font-semibold hover:bg-neutral-300"
              >
                Next Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INVOICES & RETURNS MANAGEMENT CENTER */}
      {/* ========================================================================= */}
      {showInvoicesModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D1322] border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#11192C]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    Invoices & Returns Portal
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
                      {invoicesList.length} Total Bills
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Select order ID or bill ID to process returns (restocks branch stock & deducts revenue) or edit invoice details.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchInvoices}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Refresh Invoices"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingInvoices ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => {
                    setShowInvoicesModal(false);
                    setSelectedInvoice(null);
                    setIsEditingInvoice(false);
                    setReturnSuccessMsg('');
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification Banner */}
            {returnSuccessMsg && (
              <div className="mx-6 mt-3 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  {returnSuccessMsg}
                </span>
                <button onClick={() => setReturnSuccessMsg('')} className="text-emerald-400 hover:text-white">
                  ✕
                </button>
              </div>
            )}

            {/* Main Content Pane */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Pane: Invoices List & Filter */}
              <div className="w-full md:w-[380px] border-r border-slate-800 flex flex-col bg-[#0A0F1D]">
                {/* Search Bar */}
                <div className="p-3 border-b border-slate-800/80 space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search Bill ID (e.g. BILL-B1), phone or customer..."
                      value={invoiceSearch}
                      onChange={(e) => setInvoiceSearch(e.target.value)}
                      className="w-full bg-[#131D33] border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex gap-1.5">
                    {(['all', 'Completed', 'Refunded'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setInvoiceFilter(f)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                          invoiceFilter === f
                            ? 'bg-amber-600 text-white font-bold shadow'
                            : 'bg-[#152038] text-slate-400 hover:text-white'
                        }`}
                      >
                        {f === 'all' ? 'All Invoices' : f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Invoices List */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
                  {loadingInvoices ? (
                    <div className="h-40 flex items-center justify-center text-xs text-slate-500">
                      <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading invoices...
                    </div>
                  ) : invoicesList.filter((inv) => {
                      const matchF = invoiceFilter === 'all' || inv.status === invoiceFilter;
                      const q = invoiceSearch.trim().toLowerCase();
                      const matchS =
                        !q ||
                        inv.billingId.toLowerCase().includes(q) ||
                        inv.customerPhone?.includes(q) ||
                        inv.customerName?.toLowerCase().includes(q);
                      return matchF && matchS;
                    }).length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-xs text-slate-500">
                      <Receipt className="w-8 h-8 text-slate-600 mb-2" />
                      <p>No invoices match your search.</p>
                    </div>
                  ) : (
                    invoicesList
                      .filter((inv) => {
                        const matchF = invoiceFilter === 'all' || inv.status === invoiceFilter;
                        const q = invoiceSearch.trim().toLowerCase();
                        const matchS =
                          !q ||
                          inv.billingId.toLowerCase().includes(q) ||
                          inv.customerPhone?.includes(q) ||
                          inv.customerName?.toLowerCase().includes(q);
                        return matchF && matchS;
                      })
                      .map((inv) => {
                        const isSelected = selectedInvoice?.id === inv.id;
                        return (
                          <div
                            key={inv.id}
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setIsEditingInvoice(false);
                              setReturnSuccessMsg('');
                            }}
                            className={`p-3 rounded-xl cursor-pointer transition-all border ${
                              isSelected
                                ? 'bg-[#182442] border-amber-500/80 shadow-md'
                                : 'bg-[#10172A] border-slate-800/60 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-mono font-bold text-amber-300">
                                {inv.billingId}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                  inv.status === 'Completed'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {inv.status}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span className="truncate max-w-[140px] text-slate-300">
                                👤 {inv.customerName || 'Walk-in'}
                              </span>
                              <span className="font-bold text-white">₹{inv.total.toFixed(2)}</span>
                            </div>

                            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                              <span>
                                {new Date(inv.createdAt).toLocaleDateString()} • {inv.items.length} items
                              </span>
                              <span className="uppercase text-slate-400">{inv.paymentMethod}</span>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Right Pane: Selected Invoice Breakdown, Return & Edit Actions */}
              <div className="flex-1 flex flex-col bg-[#0D1426] overflow-y-auto">
                {!selectedInvoice ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs p-8 text-center">
                    <Receipt className="w-12 h-12 text-slate-600 mb-3 stroke-[1.2]" />
                    <h3 className="text-sm font-semibold text-slate-300 mb-1">Select an Invoice to Inspect</h3>
                    <p className="max-w-sm text-slate-400 text-[11px]">
                      Choose an order from the list on the left to view items, process full or partial customer returns, or edit customer details and quantities.
                    </p>
                  </div>
                ) : isEditingInvoice ? (
                  /* INVOICE EDITING MODE */
                  <div className="p-6 flex flex-col h-full space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] text-amber-400 uppercase font-bold tracking-widest">
                          Editing Invoice
                        </span>
                        <h3 className="text-base font-bold text-white font-mono">
                          {selectedInvoice.billingId}
                        </h3>
                      </div>
                      <button
                        onClick={() => setIsEditingInvoice(false)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 bg-[#11192E] p-4 rounded-xl border border-slate-800">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                          Customer Name
                        </label>
                        <input
                          type="text"
                          value={editCustomerName}
                          onChange={(e) => setEditCustomerName(e.target.value)}
                          className="w-full bg-[#17223D] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          value={editCustomerPhone}
                          onChange={(e) => setEditCustomerPhone(e.target.value)}
                          className="w-full bg-[#17223D] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                          Payment Method
                        </label>
                        <select
                          value={editPaymentMethod}
                          onChange={(e) => setEditPaymentMethod(e.target.value as PaymentMethod)}
                          className="w-full bg-[#17223D] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="Card">Card</option>
                        </select>
                      </div>
                    </div>

                    {/* Editable items list */}
                    <div className="flex-1 overflow-y-auto space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Adjust Item Quantities (Inventory matrix auto-adjusts stock difference)
                      </h4>
                      {editItems.map((item, idx) => (
                        <div
                          key={`${item.productId}-${item.size}`}
                          className="flex items-center justify-between bg-[#121B31] border border-slate-800/80 p-3 rounded-xl"
                        >
                          <div>
                            <p className="text-xs font-bold text-white">{item.productName}</p>
                            <p className="text-[10px] text-slate-400">
                              Size: <span className="text-emerald-400 font-bold">{item.size}</span> • ₹{item.unitSellingPrice} each
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center bg-[#18233F] border border-slate-700 rounded-lg">
                              <button
                                onClick={() => handleUpdateEditItemQty(idx, -1)}
                                className="px-2.5 py-1 text-slate-400 hover:text-white font-bold text-xs"
                              >
                                −
                              </button>
                              <span className="px-2 font-bold text-white text-xs">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateEditItemQty(idx, 1)}
                                className="px-2.5 py-1 text-slate-400 hover:text-white font-bold text-xs"
                              >
                                +
                              </button>
                            </div>
                            <span className="font-bold text-white text-xs w-16 text-right">
                              ₹{item.unitSellingPrice * item.quantity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Save Changes Button */}
                    <div className="border-t border-slate-800 pt-3 flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditingInvoice(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveInvoiceEdit}
                        disabled={isSavingEdit}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-lg flex items-center gap-1.5"
                      >
                        {isSavingEdit ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Save Invoice Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  /* INVOICE INSPECTION & RETURN MODE */
                  <div className="p-6 flex flex-col h-full space-y-4">
                    {/* Invoice Top Meta */}
                    <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold font-mono text-white">
                            {selectedInvoice.billingId}
                          </h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              selectedInvoice.status === 'Completed'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {selectedInvoice.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {new Date(selectedInvoice.createdAt).toLocaleString('en-IN')} • {selectedInvoice.branchName}
                        </p>
                      </div>

                      {/* Top Action Buttons */}
                      <div className="flex items-center gap-2">
                        {selectedInvoice.status === 'Completed' && (
                          <>
                            <button
                              onClick={() => handleStartEditInvoice(selectedInvoice)}
                              className="px-3 py-1.5 rounded-xl bg-[#18233F] hover:bg-[#1E2D52] text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                              Edit Invoice
                            </button>

                            <button
                              onClick={() => setShowReturnConfirm(true)}
                              className="px-3.5 py-1.5 rounded-xl bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-800/60 text-xs font-bold flex items-center gap-1.5 transition-colors shadow"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                              Return / Refund Order
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setCompletedOrder(selectedInvoice)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" /> Receipt
                        </button>
                      </div>
                    </div>

                    {/* Refunded Banner if order is refunded */}
                    {selectedInvoice.status === 'Refunded' && (
                      <div className="p-3 bg-amber-950/40 border border-amber-600/40 rounded-xl text-xs text-amber-300 space-y-1">
                        <div className="flex items-center gap-2 font-bold text-amber-200">
                          <RotateCcw className="w-4 h-4" /> This invoice has been refunded
                        </div>
                        <p className="text-[11px] text-amber-400/90">
                          Returned on:{' '}
                          <span className="font-semibold">
                            {selectedInvoice.refundedAt
                              ? new Date(selectedInvoice.refundedAt).toLocaleString('en-IN')
                              : 'Recently'}
                          </span>{' '}
                          • Reason: <span className="font-semibold">{selectedInvoice.returnReason || 'Customer Return'}</span>
                        </p>
                        <p className="text-[10px] text-slate-400">
                          The paid amount (₹{selectedInvoice.total}) has been automatically deducted from Gross Revenue, and items were restocked to branch inventory.
                        </p>
                      </div>
                    )}

                    {/* Customer & Cashier Info Pills */}
                    <div className="grid grid-cols-4 gap-3 bg-[#11192E] p-3 rounded-xl border border-slate-800/80 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Customer</span>
                        <span className="font-bold text-white">{selectedInvoice.customerName || 'Walk-in'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Phone</span>
                        <span className="font-bold text-slate-300">{selectedInvoice.customerPhone || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Payment Tender</span>
                        <span className="font-bold text-emerald-400 uppercase">{selectedInvoice.paymentMethod}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Billed By</span>
                        <span className="font-bold text-slate-300">{selectedInvoice.cashierName}</span>
                      </div>
                    </div>

                    {/* Itemized Table */}
                    <div className="flex-1 overflow-y-auto space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Purchased Items ({selectedInvoice.items.length})
                      </h4>
                      <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-[#111728]">
                        {selectedInvoice.items.map((item, idx) => (
                          <div key={idx} className="p-3 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.productName}
                                  className="w-10 h-10 rounded-lg object-cover bg-slate-900"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-500">
                                  RI
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-white">{item.productName}</p>
                                <p className="text-[10px] text-slate-400">
                                  Size: <span className="text-emerald-400 font-bold">{item.size}</span> • ₹{item.unitSellingPrice} each × {item.quantity}
                                </p>
                              </div>
                            </div>
                            <span className="font-bold text-white text-sm">₹{item.subtotal}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-[#11192E] p-4 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-semibold text-white">₹{selectedInvoice.subtotal.toFixed(2)}</span>
                      </div>
                      {selectedInvoice.discount > 0 && (
                        <div className="flex justify-between text-emerald-400">
                          <span>Store Discount</span>
                          <span>-₹{selectedInvoice.discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>GST (5%)</span>
                        <span className="font-semibold text-white">₹{selectedInvoice.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold border-t border-slate-700/80 pt-2 text-white">
                        <span>Total Paid</span>
                        <span className="text-emerald-400 text-base">₹{selectedInvoice.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RETURN / REFUND CONFIRMATION */}
      {/* ========================================================================= */}
      {showReturnConfirm && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121B31] border border-red-800/80 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-red-300">
                  Confirm Customer Return & Refund
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">{selectedInvoice.billingId}</p>
              </div>
            </div>

            <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-xs space-y-1 text-slate-300">
              <p>
                Total Refund Amount: <strong className="text-white text-sm">₹{selectedInvoice.total.toFixed(2)}</strong>
              </p>
              <p className="text-[10px] text-slate-400">
                • Automatically restocks all {selectedInvoice.items.reduce((s, i) => s + i.quantity, 0)} items into{' '}
                <span className="text-emerald-400">{selectedInvoice.branchName}</span> inventory.
              </p>
              <p className="text-[10px] text-slate-400">
                • Deducts ₹{selectedInvoice.total.toFixed(2)} directly from Store Gross Revenue & Daily Sales.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase block mb-1.5">
                Reason for Return
              </label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full bg-[#18233F] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Wrong Size / Fit Exchange">Wrong Size / Fit</option>
                <option value="Fabric / Manufacturing Defect">Fabric / Manufacturing Defect</option>
                <option value="Customer Changed Mind">Customer Changed Mind</option>
                <option value="Incorrect Item Billed">Incorrect Item Billed</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowReturnConfirm(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleProcessReturn(selectedInvoice, returnReason)}
                disabled={isProcessingReturn}
                className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-1.5"
              >
                {isProcessingReturn ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                Confirm Return & Restock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
