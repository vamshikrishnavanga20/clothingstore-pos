'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Package,
  Layers,
  Receipt,
  LogOut,
  Plus,
  Search,
  Upload,
  RefreshCw,
  Building2,
  DollarSign,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Edit,
  Cloud,
  SlidersHorizontal,
  ChevronDown,
  Lock,
  Sun,
  Moon,
  Database,
  Crown,
  Maximize2,
  Menu,
  X,
  CreditCard,
  ShieldCheck,
  Tag,
  MapPin,
  Phone,
  User,
  Sliders,
  Award,
  UploadCloud,
  ImagePlus,
  Calendar,
  Zap,
  RefreshCcw,
  FolderTree,
  Check,
  ChevronRight,
  Printer,
  Ruler,
} from 'lucide-react';
import {
  Product,
  Category,
  Order,
  AnalyticsSummary,
  AnalyticsReportRange,
  ItemSalesPerformance,
  Branch,
  ThemeMode,
  ThemePalette,
  getProductSizes,
  SizeMeasurementRow,
} from '@/lib/types';

export default function EnterpriseAdminOS() {
  // -------------------------------------------------------------
  // 1. AUTHENTICATION STATE
  // -------------------------------------------------------------
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    name: string;
    role: 'superadmin' | 'branch_manager';
    branchId?: string;
  } | null>(null);

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // -------------------------------------------------------------
  // 2. THEME & APPEARANCE ENGINE
  // -------------------------------------------------------------
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [themePalette, setThemePalette] = useState<ThemePalette>('obsidian-gold');
  const [catalogDensity, setCatalogDensity] = useState<number>(18);

  // Sync themeMode with document root classes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (themeMode === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    }
  }, [themeMode]);

  // Theme Accent Tokens
  const themeAccents = useMemo(() => {
    switch (themePalette) {
      case 'obsidian-gold':
        return {
          primary: '#E5B869',
          primaryBg: 'bg-[#E5B869]',
          primaryText: 'text-[#E5B869]',
          primaryBorder: 'border-[#E5B869]',
          primaryLightBg: 'bg-[#E5B869]/15',
          gradient: 'from-[#D4AF37] to-[#F3E5AB]',
          badgeBorder: 'border-[#E5B869]/40',
        };
      case 'midnight-sapphire':
        return {
          primary: '#38BDF8',
          primaryBg: 'bg-[#38BDF8]',
          primaryText: 'text-[#38BDF8]',
          primaryBorder: 'border-[#38BDF8]',
          primaryLightBg: 'bg-[#38BDF8]/15',
          gradient: 'from-[#0284C7] to-[#38BDF8]',
          badgeBorder: 'border-[#38BDF8]/40',
        };
      case 'emerald-reserve':
        return {
          primary: '#10B981',
          primaryBg: 'bg-[#10B981]',
          primaryText: 'text-[#10B981]',
          primaryBorder: 'border-[#10B981]',
          primaryLightBg: 'bg-[#10B981]/15',
          gradient: 'from-[#059669] to-[#34D399]',
          badgeBorder: 'border-[#10B981]/40',
        };
      case 'royal-amethyst':
        return {
          primary: '#A855F7',
          primaryBg: 'bg-[#A855F7]',
          primaryText: 'text-[#A855F7]',
          primaryBorder: 'border-[#A855F7]',
          primaryLightBg: 'bg-[#A855F7]/15',
          gradient: 'from-[#7E22CE] to-[#C084FC]',
          badgeBorder: 'border-[#A855F7]/40',
        };
    }
  }, [themePalette]);

  // -------------------------------------------------------------
  // 3. NAVIGATION STATE
  // -------------------------------------------------------------
  const [activeNav, setActiveNav] = useState<
    | 'command-center'
    | 'executive-brief'
    | 'orders'
    | 'catalog'
    | 'inventory'
    | 'branches'
    | 'categories'
    | 'settings'
  >('command-center');

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);

  // Live System Clock (Format: 03:48 pm)
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // -------------------------------------------------------------
  // 4. DATA STATES
  // -------------------------------------------------------------
  const [branches, setBranches] = useState<Branch[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Real-time Live Sync & Order Notifications
  const [liveOrderToast, setLiveOrderToast] = useState<Order | null>(null);
  const [isLivePulse, setIsLivePulse] = useState(false);

  // Analytics Custom Range State ('7d' | '30d' | 'custom')
  const [analyticsRange, setAnalyticsRange] = useState<AnalyticsReportRange>('7d');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  // Garment Itemized Sales Ledger Search & Filters
  const [itemSalesSearch, setItemSalesSearch] = useState('');
  const [itemSalesCategoryFilter, setItemSalesCategoryFilter] = useState('All');
  const [itemSalesStatusFilter, setItemSalesStatusFilter] = useState<'all' | 'sold' | 'unsold'>('all');
  const [itemSalesSortBy, setItemSalesSortBy] = useState<'revenue' | 'units' | 'profit' | 'stock' | 'name'>('revenue');

  const displayedItemSales = useMemo(() => {
    if (!analytics?.allItemSales) return [];
    let list = [...analytics.allItemSales];

    if (itemSalesSearch.trim()) {
      const q = itemSalesSearch.toLowerCase();
      list = list.filter(
        (it) =>
          (it.name || '').toLowerCase().includes(q) ||
          (it.category || '').toLowerCase().includes(q) ||
          (it.sku && it.sku.toLowerCase().includes(q))
      );
    }

    if (itemSalesCategoryFilter !== 'All') {
      list = list.filter((it) => it.category === itemSalesCategoryFilter);
    }

    if (itemSalesStatusFilter === 'sold') {
      list = list.filter((it) => it.unitsSold > 0);
    } else if (itemSalesStatusFilter === 'unsold') {
      list = list.filter((it) => it.unitsSold === 0);
    }

    list.sort((a, b) => {
      switch (itemSalesSortBy) {
        case 'revenue':
          return b.totalRevenue - a.totalRevenue;
        case 'units':
          return b.unitsSold - a.unitsSold;
        case 'profit':
          return b.totalProfit - a.totalProfit;
        case 'stock':
          return a.currentStock - b.currentStock;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return list;
  }, [analytics?.allItemSales, itemSalesSearch, itemSalesCategoryFilter, itemSalesStatusFilter, itemSalesSortBy]);

  // Category-divided Inventory Filtering
  const [selectedInventoryCategory, setSelectedInventoryCategory] = useState<string>('All');

  // File Upload State
  const [clothImageUploading, setClothImageUploading] = useState(false);
  const [catImageUploading, setCatImageUploading] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Direct Image Upload Handler for Cloth Items
  const handleClothImageUpload = async (file: File) => {
    if (!file) return;
    setClothImageUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setClothForm((prev) => ({ ...prev, image: data.url }));
        showToast('Apparel photo uploaded successfully!');
      } else {
        showToast(data.error || 'Failed to upload photo', 'error');
      }
    } catch (e) {
      showToast('Error uploading image to server', 'error');
    } finally {
      setClothImageUploading(false);
    }
  };

  // Direct Image Upload Handler for Categories
  const handleCatImageUpload = async (file: File) => {
    if (!file) return;
    setCatImageUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setCatImage(data.url);
        showToast('Category photo uploaded successfully!');
      } else {
        showToast(data.error || 'Failed to upload category photo', 'error');
      }
    } catch (e) {
      showToast('Error uploading photo', 'error');
    } finally {
      setCatImageUploading(false);
    }
  };

  // Fetch all store data with range support & silent live refresh
  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const branchQuery = selectedBranchId !== 'all' ? `branchId=${selectedBranchId}` : '';
      
      const analyticsParams = new URLSearchParams();
      if (selectedBranchId !== 'all') analyticsParams.set('branchId', selectedBranchId);
      if (analyticsRange) analyticsParams.set('range', analyticsRange);
      if (analyticsRange === 'custom') {
        if (customStartDate) analyticsParams.set('startDate', customStartDate);
        if (customEndDate) analyticsParams.set('endDate', customEndDate);
      }
      const aQueryStr = analyticsParams.toString() ? `?${analyticsParams.toString()}` : '';
      const bQueryStr = branchQuery ? `?${branchQuery}` : '';

      const [resBranches, resAnalytics, resProducts, resCats, resOrders] = await Promise.all([
        fetch('/api/branches', { cache: 'no-store' }).then((r) => r.json()),
        fetch(`/api/analytics${aQueryStr}`, { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/products', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/categories', { cache: 'no-store' }).then((r) => r.json()),
        fetch(`/api/orders${bQueryStr}`, { cache: 'no-store' }).then((r) => r.json()),
      ]);

      if (Array.isArray(resBranches)) setBranches(resBranches);
      if (resAnalytics) setAnalytics(resAnalytics);
      if (Array.isArray(resProducts)) setProducts(resProducts);
      if (Array.isArray(resCats)) setCategories(resCats);
      if (Array.isArray(resOrders)) setOrders(resOrders);
    } catch (e) {
      console.error(e);
      if (!silent) showToast('Error syncing with backend', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Real-time live synchronization (BroadcastChannel + storage event + 2.5s liveness poll)
  useEffect(() => {
    if (!currentUser) return;
    fetchData();

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('roman_island_sync');
      bc.onmessage = (event) => {
        if (event.data?.type === 'ORDER_PLACED' || event.data?.type === 'ORDER_REFUNDED') {
          const newOrder = event.data.order;
          setLiveOrderToast(newOrder);
          setIsLivePulse(true);
          setTimeout(() => setIsLivePulse(false), 2500);
          fetchData(true);
        } else if (event.data?.type === 'PRODUCT_DELETED') {
          const pId = event.data.productId;
          setProducts((prev) => prev.filter((p) => p.id !== pId));
          fetchData(true);
        } else if (event.data?.type === 'CATEGORY_DELETED') {
          const cId = event.data.categoryId;
          setCategories((prev) => prev.filter((c) => c.id !== cId));
          fetchData(true);
        } else if (event.data?.type === 'CATALOG_UPDATED') {
          fetchData(true);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported in current environment', e);
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'ri_last_order_sync' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setLiveOrderToast(parsed);
          setIsLivePulse(true);
          setTimeout(() => setIsLivePulse(false), 2500);
          fetchData(true);
        } catch (err) {}
      }
      if (e.key === 'ri_catalog_sync' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.type === 'PRODUCT_DELETED') {
            setProducts((prev) => prev.filter((p) => p.id !== parsed.productId));
          } else if (parsed.type === 'CATEGORY_DELETED') {
            setCategories((prev) => prev.filter((c) => c.id !== parsed.categoryId));
          }
          fetchData(true);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    const interval = setInterval(() => {
      fetchData(true);
    }, 12000);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [currentUser, selectedBranchId, analyticsRange, customStartDate, customEndDate]);

  // Auth Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setCurrentUser(data.user);
        if (data.user.role === 'branch_manager' && data.user.branchId) {
          setSelectedBranchId(data.user.branchId);
        }
        showToast(`Welcome back, ${data.user.name}`);
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError('Authentication service unreachable');
    } finally {
      setAuthLoading(false);
    }
  };

  // Branch Save & Delete Handlers
  const [branchForm, setBranchForm] = useState({
    name: '',
    code: '',
    city: 'Hyderabad',
    location: '',
    phone: '',
    managerName: '',
  });
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [branchSearch, setBranchSearch] = useState('');

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.name || !branchForm.location || !branchForm.phone) {
      showToast('Name, location, and phone are required', 'error');
      return;
    }

    try {
      if (editingBranchId) {
        const res = await fetch('/api/branches', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingBranchId, ...branchForm }),
        });
        if (res.ok) {
          showToast(`Branch "${branchForm.name}" updated`);
          setEditingBranchId(null);
          setBranchForm({ name: '', code: '', city: 'Hyderabad', location: '', phone: '', managerName: '' });
          fetchData();
        }
      } else {
        const res = await fetch('/api/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(branchForm),
        });
        if (res.ok) {
          showToast(`New branch "${branchForm.name}" added`);
          setBranchForm({ name: '', code: '', city: 'Hyderabad', location: '', phone: '', managerName: '' });
          fetchData();
        }
      }
    } catch (e) {
      showToast('Failed to save branch', 'error');
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!confirm('Are you sure you want to remove this branch?')) return;
    try {
      const res = await fetch(`/api/branches?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast('Branch removed');
        if (selectedBranchId === id) setSelectedBranchId('all');
        fetchData();
      } else {
        showToast(data.error || 'Cannot delete branch', 'error');
      }
    } catch (e) {
      showToast('Error removing branch', 'error');
    }
  };

  // Category State & Handlers
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catImage, setCatImage] = useState('');
  const [catSearch, setCatSearch] = useState('');

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName, description: catDesc, image: catImage }),
      });
      if (res.ok) {
        showToast(`Category "${catName}" created`);
        setCatName('');
        setCatDesc('');
        setCatImage('');
        fetchData();
      }
    } catch (e) {
      showToast('Error creating category', 'error');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    const previousCategories = categories;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    try {
      const res = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE',
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Category deleted successfully');
        if (typeof window !== 'undefined') {
          try {
            const bc = new BroadcastChannel('roman_island_sync');
            bc.postMessage({ type: 'CATEGORY_DELETED', categoryId: id, timestamp: Date.now() });
            bc.close();
          } catch (e) {}
          try {
            localStorage.setItem(
              'ri_catalog_sync',
              JSON.stringify({ type: 'CATEGORY_DELETED', categoryId: id, timestamp: Date.now() })
            );
          } catch (e) {}
        }
        fetchData(true);
      } else {
        setCategories(previousCategories);
        showToast(data.error || 'Failed to delete category', 'error');
      }
    } catch (e) {
      setCategories(previousCategories);
      showToast('Failed to delete category', 'error');
    }
  };

  // Product & Inventory State & Handlers
  const [isAddClothOpen, setIsAddClothOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [clothForm, setClothForm] = useState({
    name: '',
    sku: '',
    category: 'Checks',
    description: '',
    costPrice: 600,
    sellingPrice: 1499,
    tag: '',
    image: '',
    initialStock: 10,
    sizes: '', // Clean manual entry box for manager (e.g. "XL, L" or "S, M" or "10")
    targetBranch: 'all',
    branchStock: {} as Record<string, number>,
    hasVariablePricing: false,
    sizePrices: {} as Record<string, { sellingPrice: number; costPrice: number }>,
    fabric: '',
    care: '',
    hasSizeChart: false,
    sizeChartMeasurements: [] as SizeMeasurementRow[],
  });

  // Comprehensive Product Edit Opener (invocable anywhere: catalog, inventory, dashboard)
  const openEditClothModal = (prod: Product) => {
    const pSizes = getProductSizes(prod);
    const existingStockMap: Record<string, number> = {};
    branches.forEach((b) => {
      const bStock = prod.inventory?.[b.id];
      if (bStock) {
        const firstVal = Object.values(bStock)[0];
        if (firstVal !== undefined) existingStockMap[b.id] = firstVal;
      }
    });
    const defaultBranch =
      currentUser?.role === 'branch_manager' && currentUser.branchId
        ? currentUser.branchId
        : selectedBranchId !== 'all'
        ? selectedBranchId
        : 'all';
    const initialQty =
      defaultBranch !== 'all'
        ? (existingStockMap[defaultBranch] ?? 10)
        : (Object.values(existingStockMap)[0] ?? 10);

    const szPricesMap: Record<string, { sellingPrice: number; costPrice: number }> = {};
    pSizes.forEach((sz) => {
      if (prod.sizePrices && prod.sizePrices[sz]) {
        const sp = prod.sizePrices[sz];
        szPricesMap[sz] = {
          sellingPrice: typeof sp === 'number' ? sp : (sp.sellingPrice ?? prod.sellingPrice),
          costPrice:
            typeof sp === 'object' && sp.costPrice !== undefined ? sp.costPrice : prod.costPrice,
        };
      } else {
        szPricesMap[sz] = {
          sellingPrice: prod.sellingPrice,
          costPrice: prod.costPrice,
        };
      }
    });

    setEditingProduct(prod);
    setClothForm({
      name: prod.name || '',
      sku: prod.sku || '',
      category: prod.category || 'Checks',
      description: prod.description || '',
      costPrice: prod.costPrice ?? 600,
      sellingPrice: prod.sellingPrice ?? 1499,
      tag: prod.tag || '',
      image: prod.image || '',
      initialStock: initialQty,
      sizes: pSizes.join(', '),
      targetBranch: defaultBranch,
      branchStock: existingStockMap,
      hasVariablePricing: Boolean(prod.hasVariablePricing),
      sizePrices: szPricesMap,
      fabric: prod.fabric || '',
      care: prod.care || '',
      hasSizeChart: Boolean(prod.hasSizeChart),
      sizeChartMeasurements: prod.sizeChartMeasurements ? [...prod.sizeChartMeasurements] : [],
    });
    setIsAddClothOpen(true);
  };
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('All');
  const [inventorySearch, setInventorySearch] = useState('');

  // Stock Adjuster
  const handleStockAdjust = async (productId: string, branchId: string, size: string, delta: number) => {
    if (currentUser?.role === 'branch_manager' && currentUser.branchId && branchId !== currentUser.branchId) {
      showToast('Restricted: You can only adjust inventory for your assigned branch', 'error');
      return;
    }
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const current = prod.inventory[branchId]?.[size] ?? 0;
    const newQty = Math.max(0, current + delta);

    try {
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, branchId, size, quantity: newQty }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id !== productId) return p;
            return {
              ...p,
              inventory: {
                ...p.inventory,
                [branchId]: {
                  ...(p.inventory[branchId] || {}),
                  [size]: newQty,
                },
              },
            };
          })
        );
      }
    } catch (e) {
      showToast('Stock update failed', 'error');
    }
  };

  // Product Save
  const handleSaveCloth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clothForm.name || !clothForm.category || !clothForm.sellingPrice) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    // Parse manual sizes entered by manager: e.g. "XL, L" or "S, M, L" or "10" or "7, 8, 9, 10"
    const rawSizes = (clothForm.sizes || '')
      .split(/[,/]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedSizes = rawSizes.length > 0 ? Array.from(new Set(rawSizes)) : ['Free Size'];

    const inventoryObj: Record<string, Record<string, number>> = {};
    const activeUserBranch = currentUser?.role === 'branch_manager' ? currentUser.branchId : null;

    branches.forEach((b) => {
      inventoryObj[b.id] = {};
      parsedSizes.forEach((sz) => {
        // If branch manager: ONLY modify their assigned branch! All other branches preserved.
        if (activeUserBranch) {
          if (b.id === activeUserBranch) {
            inventoryObj[b.id][sz] = Math.max(0, Number(clothForm.initialStock) || 0);
          } else {
            inventoryObj[b.id][sz] = editingProduct?.inventory?.[b.id]?.[sz] ?? 0;
          }
          return;
        }

        // If Superadmin in Global mode:
        if (clothForm.targetBranch === 'all') {
          inventoryObj[b.id][sz] = clothForm.branchStock[b.id] !== undefined
            ? Number(clothForm.branchStock[b.id])
            : Math.max(0, Number(clothForm.initialStock) || 0);
        } else if (b.id === clothForm.targetBranch) {
          inventoryObj[b.id][sz] = Math.max(0, Number(clothForm.initialStock) || 0);
        } else {
          inventoryObj[b.id][sz] = clothForm.branchStock[b.id] !== undefined
            ? Number(clothForm.branchStock[b.id])
            : (editingProduct?.inventory?.[b.id]?.[sz] ?? Math.max(0, Number(clothForm.initialStock) || 0));
        }
      });
    });

    const payload = {
      name: clothForm.name,
      sku: clothForm.sku || `RI-${Date.now().toString().slice(-4)}`,
      category: clothForm.category,
      description: clothForm.description,
      costPrice: Number(clothForm.costPrice),
      sellingPrice: Number(clothForm.sellingPrice),
      tag: clothForm.tag,
      sizes: parsedSizes,
      hasVariablePricing: clothForm.hasVariablePricing,
      sizePrices: clothForm.hasVariablePricing ? clothForm.sizePrices : undefined,
      fabric: clothForm.fabric || undefined,
      care: clothForm.care || undefined,
      hasSizeChart: clothForm.hasSizeChart,
      sizeChartMeasurements: clothForm.hasSizeChart && clothForm.sizeChartMeasurements.length > 0 ? clothForm.sizeChartMeasurements : undefined,
      image:
        clothForm.image ||
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop',
      inventory: inventoryObj,
    };

    try {
      if (editingProduct) {
        const res = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingProduct.id, ...payload }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast(`Updated "${clothForm.name}" successfully`);
          setIsAddClothOpen(false);
          setEditingProduct(null);
          if (data.product) {
            setProducts((prev) =>
              prev.map((p) => (p.id === editingProduct.id ? data.product : p))
            );
          }
          if (typeof window !== 'undefined') {
            try {
              const bc = new BroadcastChannel('roman_island_sync');
              bc.postMessage({
                type: 'PRODUCT_UPDATED',
                product: data.product,
                timestamp: Date.now(),
              });
              bc.close();
            } catch (e) {}
            try {
              localStorage.setItem(
                'ri_catalog_sync',
                JSON.stringify({
                  type: 'PRODUCT_UPDATED',
                  product: data.product,
                  timestamp: Date.now(),
                })
              );
            } catch (e) {}
          }
          fetchData(true);
        } else {
          showToast(data.error || 'Failed to update garment in database', 'error');
        }
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast(`Added "${clothForm.name}" to catalog`);
          setIsAddClothOpen(false);
          setClothForm({
            name: '',
            sku: '',
            category: 'Checks',
            description: '',
            costPrice: 600,
            sellingPrice: 1499,
            tag: '',
            image: '',
            initialStock: 10,
            sizes: '',
            targetBranch: currentUser?.role === 'branch_manager' && currentUser.branchId ? currentUser.branchId : 'all',
            branchStock: {},
            hasVariablePricing: false,
            sizePrices: {},
            fabric: '',
            care: '',
            hasSizeChart: false,
            sizeChartMeasurements: [],
          });
          if (data.product) {
            setProducts((prev) => [data.product, ...prev]);
          }
          if (typeof window !== 'undefined') {
            try {
              const bc = new BroadcastChannel('roman_island_sync');
              bc.postMessage({
                type: 'CATALOG_UPDATED',
                timestamp: Date.now(),
              });
              bc.close();
            } catch (e) {}
            try {
              localStorage.setItem(
                'ri_catalog_sync',
                JSON.stringify({ type: 'CATALOG_UPDATED', timestamp: Date.now() })
              );
            } catch (e) {}
          }
          fetchData(true);
        } else {
          showToast(data.error || 'Failed to save garment to database', 'error');
        }
      }
    } catch (e) {
      showToast('Network error while saving garment', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to remove this garment?')) return;
    const previousProducts = products;
    // Optimistic immediate UI update - no refresh needed
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE',
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Product removed successfully');
        // Real-time broadcast across all tabs and open windows
        if (typeof window !== 'undefined') {
          try {
            const bc = new BroadcastChannel('roman_island_sync');
            bc.postMessage({
              type: 'PRODUCT_DELETED',
              productId: id,
              timestamp: Date.now(),
            });
            bc.close();
          } catch (e) {}
          try {
            localStorage.setItem(
              'ri_catalog_sync',
              JSON.stringify({ type: 'PRODUCT_DELETED', productId: id, timestamp: Date.now() })
            );
          } catch (e) {}
        }
        fetchData(true);
      } else {
        setProducts(previousProducts);
        showToast(data.error || 'Failed to remove garment from database', 'error');
      }
    } catch (e) {
      setProducts(previousProducts);
      showToast('Error deleting item', 'error');
    }
  };

  const filteredCatalogProducts = (products || []).filter((p) => {
    if (!p) return false;
    const cat = (p.category || '').toLowerCase();
    const name = (p.name || '').toLowerCase();
    const sku = (p.sku || '').toLowerCase();
    const q = (catalogSearch || '').trim().toLowerCase();
    const matchCategory =
      catalogCategory === 'All' || cat === (catalogCategory || '').toLowerCase();
    const matchSearch =
      q === '' ||
      name.includes(q) ||
      sku.includes(q) ||
      cat.includes(q);
    return matchCategory && matchSearch;
  });

  const filteredInventoryProducts = (products || []).filter((p) => {
    if (!p) return false;
    const cat = (p.category || '').toLowerCase();
    const name = (p.name || '').toLowerCase();
    const sku = (p.sku || '').toLowerCase();
    const q = (inventorySearch || '').trim().toLowerCase();
    const matchCategory =
      selectedInventoryCategory === 'All' ||
      cat === (selectedInventoryCategory || '').toLowerCase();
    const matchSearch =
      q === '' ||
      name.includes(q) ||
      sku.includes(q) ||
      cat.includes(q);
    return matchCategory && matchSearch;
  });

  const maxChartVal = useMemo(() => {
    if (!analytics?.trends || analytics.trends.length === 0) return 1000;
    return Math.max(...analytics.trends.map((t) => t.grossProfit), 1000);
  }, [analytics]);

  const renderSparkline = (color: string) => (
    <svg className="w-20 h-7 overflow-visible opacity-90" viewBox="0 0 100 30">
      <defs>
        <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path
        d="M0,22 Q25,26 45,14 T75,10 T100,3"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M0,22 Q25,26 45,14 T75,10 T100,3 L100,30 L0,30 Z"
        fill={`url(#spark-${color})`}
      />
      <circle cx="100" cy="3" r="3" fill={color} />
    </svg>
  );

  const renderMarginDial = (pct: number) => {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (pct / 100) * circumference * 0.75;
    return (
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="w-full h-full -rotate-135" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
            strokeWidth="7"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeLinecap="round"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="url(#dialGrad)"
            strokeWidth="7"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="dialGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#D4AF37" />
              <stop offset="50%" stopColor="#E5B869" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`text-base font-bold font-serif ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>{pct}%</span>
          <span className={`text-[8px] uppercase tracking-wider ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Margin</span>
        </div>
      </div>
    );
  };

  const currentBranchLabel = useMemo(() => {
    if (selectedBranchId === 'all') return 'All Branches Unified';
    const b = branches.find((x) => x.id === selectedBranchId);
    return b ? b.name : 'All Branches Unified';
  }, [selectedBranchId, branches]);

  // -------------------------------------------------------------
  // LOGIN SCREEN
  // -------------------------------------------------------------
  if (!currentUser) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ambient-mesh ${
        themeMode === 'dark' ? 'bg-[#080A11]' : 'bg-[#F4F6F9]'
      }`}>
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#E5B869]/10 rounded-full blur-[140px] pointer-events-none" />

        <div className={`w-full max-w-md glass-card rounded-3xl p-8 border shadow-2xl relative z-10 ${
          themeMode === 'dark' ? 'border-white/[0.09]' : 'border-slate-200 bg-white/95'
        }`}>
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#D4AF37] via-[#E5B869] to-[#FFF0CA] flex items-center justify-center text-black font-extrabold shadow-[0_0_30px_rgba(229,184,105,0.4)]">
              <Crown className="w-7 h-7" />
            </div>
          </div>

          <h2 className={`text-2xl sm:text-3xl font-bold text-center tracking-[0.2em] uppercase font-serif mb-1 ${
            themeMode === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            Roman Island
          </h2>

          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#E5B869]/15 text-[#E5B869] border border-[#E5B869]/30 font-semibold tracking-wider uppercase flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Amazon Cognito Enterprise Auth
            </span>
          </div>

          <p className={`text-center text-xs uppercase tracking-widest mb-8 ${
            themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Executive Suite & Atelier Terminal
          </p>

          {loginError && (
            <div className="mb-6 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
                themeMode === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Admin Username / Staff ID
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="superadmin or branch1"
                className={`w-full rounded-xl px-4 py-3 text-sm transition-all focus:outline-none focus:border-[#E5B869] ${
                  themeMode === 'dark'
                    ? 'bg-[#0E131F] border border-white/[0.1] text-white placeholder:text-slate-500'
                    : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400'
                }`}
                required
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
                themeMode === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Security Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full rounded-xl px-4 py-3 text-sm transition-all focus:outline-none focus:border-[#E5B869] ${
                  themeMode === 'dark'
                    ? 'bg-[#0E131F] border border-white/[0.1] text-white placeholder:text-slate-500'
                    : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400'
                }`}
                required
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full gold-btn py-3.5 rounded-xl transition-all duration-200 text-xs uppercase tracking-widest flex items-center justify-center gap-2 mt-2"
            >
              {authLoading ? <RefreshCw className="w-4 h-4 animate-spin text-black" /> : 'Enter Executive Suite'}
            </button>
          </form>

          <div className={`mt-8 pt-6 border-t text-center ${
            themeMode === 'dark' ? 'border-white/[0.08]' : 'border-slate-200'
          }`}>
            <p className={`text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 ${
              themeMode === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <Lock className="w-3 h-3 text-slate-400" /> Authorized Personnel Only • Dual Boutique Grid
            </p>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN ENTERPRISE ADMIN OS
  // -------------------------------------------------------------
  return (
    <div
      className={`min-h-screen flex font-sans antialiased selection:bg-[#E5B869] selection:text-black transition-colors duration-300 ${
        themeMode === 'dark' ? 'bg-[#080A11] text-slate-100' : 'bg-[#F4F6F9] text-slate-900'
      }`}
    >
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-semibold border backdrop-blur-md transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-red-950/90 border-red-500/50 text-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          {notification.text}
        </div>
      )}

      {/* ========================================================= */}
      {/* LEFT SIDEBAR */}
      {/* ========================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r transition-all duration-300 ease-in-out ${
          themeMode === 'dark'
            ? 'bg-[#0A0D15] border-white/[0.06]'
            : 'bg-white border-slate-200 shadow-sm'
        } ${isSidebarOpen ? 'w-64' : 'w-20'} hidden md:flex`}
      >
        {/* Sidebar Header with Brand & Insignia */}
        <div
          className={`h-20 border-b flex items-center border-inherit transition-all duration-300 ${
            isSidebarOpen ? 'px-5' : 'px-2 justify-center'
          }`}
        >
          <button
            onClick={() => setActiveNav('command-center')}
            className="flex items-center gap-3 overflow-hidden text-left focus:outline-none group"
            title="Roman Island Command Center"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold flex-shrink-0 shadow-md ${
                themePalette === 'obsidian-gold'
                  ? 'bg-gradient-to-tr from-[#D4AF37] via-[#E5B869] to-[#FFF0CA] text-black shadow-[0_0_15px_rgba(229,184,105,0.3)] group-hover:scale-105 transition-transform'
                  : `${themeAccents.primaryBg} text-white group-hover:scale-105 transition-transform`
              }`}
            >
              <Crown className="w-5 h-5" />
            </div>
            {isSidebarOpen && (
              <div>
                <h1 className={`text-sm font-bold tracking-[0.2em] uppercase font-serif truncate ${
                  themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  Roman Island
                </h1>
                <p className={`text-[9px] uppercase tracking-widest truncate ${
                  themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Executive Suite
                </p>
              </div>
            )}
          </button>
        </div>

        {/* Sidebar Scrollable Nav Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 no-scrollbar">
          {/* GROUP 1: ANALYTICS */}
          <div>
            {isSidebarOpen && (
              <p className={`text-[10px] font-bold uppercase tracking-[0.2em] px-3 mb-2 ${
                themeMode === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Analytics
              </p>
            )}
            <div className="space-y-1">
              <button
                onClick={() => setActiveNav('command-center')}
                className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeNav === 'command-center'
                    ? `${themeAccents.primaryLightBg} ${themeAccents.primaryText} font-bold shadow-sm border border-[#E5B869]/30`
                    : themeMode === 'dark'
                    ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Command Center"
              >
                <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                {isSidebarOpen && <span>Command Center</span>}
              </button>

              <button
                onClick={() => setActiveNav('executive-brief')}
                className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeNav === 'executive-brief'
                    ? `${themeAccents.primaryLightBg} ${themeAccents.primaryText} font-bold shadow-sm border border-[#E5B869]/30`
                    : themeMode === 'dark'
                    ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Executive Deep Analysis"
              >
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                {isSidebarOpen && <span>Executive Deep Analysis</span>}
              </button>
            </div>
          </div>

          {/* GROUP 2: OPERATIONS */}
          <div>
            {isSidebarOpen && (
              <p className={`text-[10px] font-bold uppercase tracking-[0.2em] px-3 mb-2 ${
                themeMode === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Operations
              </p>
            )}
            <div className="space-y-1">
              <button
                onClick={() => setActiveNav('orders')}
                className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeNav === 'orders'
                    ? `${themeAccents.primaryLightBg} ${themeAccents.primaryText} font-bold shadow-sm border border-[#E5B869]/30`
                    : themeMode === 'dark'
                    ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Order History"
              >
                <Receipt className="w-4 h-4 flex-shrink-0" />
                {isSidebarOpen && <span>Order History & Bills</span>}
              </button>

              <Link
                href="/billing"
                target="_blank"
                className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  themeMode === 'dark'
                    ? 'text-slate-400 hover:text-[#E5B869] hover:bg-white/[0.04]'
                    : 'text-slate-600 hover:text-[#E5B869] hover:bg-slate-100'
                }`}
                title="Point of Sale"
              >
                <CreditCard className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                {isSidebarOpen && <span>Point of Sale ↗</span>}
              </Link>

              <button
                onClick={() => setActiveNav('catalog')}
                className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeNav === 'catalog'
                    ? `${themeAccents.primaryLightBg} ${themeAccents.primaryText} font-bold shadow-sm border border-[#E5B869]/30`
                    : themeMode === 'dark'
                    ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Clothing Catalog"
              >
                <Package className="w-4 h-4 flex-shrink-0" />
                {isSidebarOpen && <span>Apparel Catalog</span>}
              </button>

              <button
                onClick={() => setActiveNav('inventory')}
                className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeNav === 'inventory'
                    ? `${themeAccents.primaryLightBg} ${themeAccents.primaryText} font-bold shadow-sm border border-[#E5B869]/30`
                    : themeMode === 'dark'
                    ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Inventory Matrix"
              >
                <Layers className="w-4 h-4 flex-shrink-0" />
                {isSidebarOpen && <span>Inventory Matrix</span>}
              </button>
            </div>
          </div>

          {/* GROUP 3: BRANCHES & CATEGORIES */}
          <div>
            {isSidebarOpen && (
              <p className={`text-[10px] font-bold uppercase tracking-[0.2em] px-3 mb-2 ${
                themeMode === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Branches & Categories
              </p>
            )}
            <div className="space-y-1">
              {currentUser.role === 'superadmin' && (
                <button
                  onClick={() => setActiveNav('branches')}
                  className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeNav === 'branches'
                      ? `${themeAccents.primaryLightBg} ${themeAccents.primaryText} font-bold shadow-sm border border-[#E5B869]/30`
                      : themeMode === 'dark'
                    ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Branch Management"
                >
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  {isSidebarOpen && <span>Branch Management</span>}
                </button>
              )}

              <button
                onClick={() => setActiveNav('categories')}
                className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeNav === 'categories'
                    ? `${themeAccents.primaryLightBg} ${themeAccents.primaryText} font-bold shadow-sm border border-[#E5B869]/30`
                    : themeMode === 'dark'
                    ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Category Management"
              >
                <Tag className="w-4 h-4 flex-shrink-0" />
                {isSidebarOpen && <span>Category Management</span>}
              </button>
            </div>
          </div>

          {/* GROUP 4: SETTINGS */}
          <div>
            {isSidebarOpen && (
              <p className={`text-[10px] font-bold uppercase tracking-[0.2em] px-3 mb-2 ${
                themeMode === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Settings
              </p>
            )}
            <div className="space-y-1">
              <button
                onClick={() => setActiveNav('settings')}
                className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeNav === 'settings'
                    ? `${themeAccents.primaryLightBg} ${themeAccents.primaryText} font-bold shadow-sm border border-[#E5B869]/30`
                    : themeMode === 'dark'
                    ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="System & Themes"
              >
                <Sliders className="w-4 h-4 flex-shrink-0" />
                {isSidebarOpen && <span>System & Themes</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Bottom Action: LOCK TERMINAL */}
        <div className="p-3 border-t border-inherit">
          <button
            onClick={() => setCurrentUser(null)}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
              themeMode === 'dark'
                ? 'bg-red-950/20 hover:bg-red-900/40 text-red-400 border border-red-800/40'
                : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
            }`}
            title="Lock Terminal & Log Out"
          >
            <Lock className="w-3.5 h-3.5" />
            {isSidebarOpen && <span>Lock Terminal</span>}
          </button>
        </div>
      </aside>

      {/* ============================================================= */}
      {/* MAIN CONTENT AREA - DYNAMIC LEFT MARGIN ELIMINATES GAP */}
      {/* ============================================================= */}
      <div
        className={`flex-1 flex flex-col min-w-0 overflow-y-auto transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'md:ml-64' : 'md:ml-20'
        } ambient-mesh`}
      >
        {/* TOP COMMAND HEADER BAR */}
        <header
          className={`sticky top-0 z-30 px-6 py-3.5 border-b backdrop-blur-2xl flex items-center justify-between transition-colors ${
            themeMode === 'dark' ? 'bg-[#080A11]/85 border-white/[0.08]' : 'bg-white/90 border-slate-200'
          }`}
        >
          {/* Left Header Controls: Sidebar Toggle & Branch Switcher */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-xl border transition-colors ${
                themeMode === 'dark'
                  ? 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.08]'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              title={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Dynamic Branch Switcher Dropdown (Superadmin only) */}
            {currentUser.role === 'superadmin' ? (
              <div className="relative">
                <button
                  onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                  className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                    themeMode === 'dark'
                      ? 'bg-[#101422] border-white/[0.1] text-white hover:border-[#E5B869]/40'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${themeAccents.primaryBg} animate-pulse`} />
                  <span className="truncate max-w-[200px]">{currentBranchLabel}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isBranchDropdownOpen && (
                  <div
                    className={`absolute top-full left-0 mt-2 w-64 rounded-2xl border p-2 shadow-2xl z-50 glass-card ${
                      themeMode === 'dark'
                        ? 'bg-[#0E1322] border-white/[0.1]'
                        : 'bg-white border-slate-200 shadow-xl'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setSelectedBranchId('all');
                        setIsBranchDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                        selectedBranchId === 'all'
                          ? `${themeAccents.primaryLightBg} ${themeAccents.primaryText}`
                          : themeMode === 'dark'
                          ? 'hover:bg-white/[0.05] text-slate-200'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>🌐 All Branches Unified</span>
                      {selectedBranchId === 'all' && <CheckCircle2 className="w-3.5 h-3.5 text-[#E5B869]" />}
                    </button>

                    <div className={`h-px my-1.5 ${themeMode === 'dark' ? 'bg-white/[0.08]' : 'bg-slate-200'}`} />

                    {branches.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setSelectedBranchId(b.id);
                          setIsBranchDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                          selectedBranchId === b.id
                            ? `${themeAccents.primaryLightBg} ${themeAccents.primaryText}`
                            : themeMode === 'dark'
                            ? 'hover:bg-white/[0.05] text-slate-200'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="truncate">{b.name}</span>
                        {selectedBranchId === b.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#E5B869]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl border ${
                themeMode === 'dark' ? 'bg-[#101422] border-white/[0.1] text-[#E5B869]' : 'bg-white border-slate-200 text-[#C59846]'
              }`}>
                <Building2 className="w-3.5 h-3.5" />
                <span>{currentBranchLabel}</span>
                <span className="text-[9px] text-slate-400 uppercase tracking-widest">(Assigned Scope)</span>
              </div>
            )}
          </div>

          {/* Right Header Utilities: Live Sync Status, Live Clock, Theme Toggle, Profile */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Real-time Live Sync Indicator */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all ${
                isLivePulse
                  ? 'bg-emerald-500/25 border-emerald-400 text-white scale-105 shadow-lg shadow-emerald-500/20'
                  : themeMode === 'dark'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-700'
              }`}
              title="Zero Delay Sync: All orders refresh dashboard in nanoseconds"
            >
              <span className={`w-2 h-2 rounded-full ${isLivePulse ? 'bg-emerald-300 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="hidden sm:inline">{isLivePulse ? '⚡ Synced Live' : 'Live Sync Active (0s Delay)'}</span>
              <span className="sm:hidden">Live</span>
            </div>

            {/* Live Clock */}
            <div className={`flex items-center gap-1.5 text-xs font-mono tracking-wider ${
              themeMode === 'dark' ? 'text-slate-300' : 'text-slate-700 font-semibold'
            }`}>
              <span>🕒</span>
              <span>{currentTime || '03:48 pm'}</span>
            </div>

            {/* Quick Dark / Light Switcher */}
            <button
              onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-xl border transition-colors ${
                themeMode === 'dark'
                  ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-amber-400'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-indigo-600'
              }`}
              title="Toggle Light / Dark Mode"
            >
              {themeMode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile Chip */}
            <div className={`flex items-center gap-2.5 pl-2 border-l ${
              themeMode === 'dark' ? 'border-white/[0.08]' : 'border-slate-200'
            }`}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-[#E5B869] text-black flex items-center justify-center font-bold text-xs shadow-md">
                {currentUser.name[0]}
              </div>
              <span className={`text-xs font-semibold hidden sm:inline ${
                themeMode === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>{currentUser.name}</span>
            </div>
          </div>
        </header>

        {/* Real-time Order Popup Toast Banner */}
        {liveOrderToast && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-[#0E1B2D] to-slate-900 border border-emerald-500/80 text-white flex items-center justify-between shadow-2xl animate-bounce">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-400 text-black flex items-center justify-center font-bold text-lg shadow-lg">
                ⚡
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Real-time POS Bill Generated!</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-400 text-black font-mono font-bold uppercase">
                    Nanosecond Sync
                  </span>
                </p>
                <p className="text-[11px] text-slate-300">
                  Bill <strong className="text-amber-300 font-mono">{liveOrderToast.billingId}</strong> at <strong>{liveOrderToast.branchName}</strong>: <strong className="text-emerald-400">₹{liveOrderToast.total}</strong> • Revenue & profit synced live!
                </p>
              </div>
            </div>
            <button
              onClick={() => setLiveOrderToast(null)}
              className="glass-btn px-3 py-1.5 text-xs rounded-lg"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* WORKSPACE BODY */}
        {/* ========================================================= */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* ======================================================= */}
          {/* VIEW 1: COMMAND CENTER (Matching Screenshot 1) */}
          {/* ======================================================= */}
          {activeNav === 'command-center' && analytics && (
            <div className="space-y-6">
              {/* Secondary Navigation Sub-Tabs & Range Selector */}
              <div className={`flex flex-wrap items-center justify-between gap-4 border-b pb-3 ${
                themeMode === 'dark' ? 'border-white/[0.08]' : 'border-slate-200'
              }`}>
                <div className="flex items-center gap-8 text-xs font-bold uppercase tracking-wider">
                  <button
                    onClick={() => setActiveNav('command-center')}
                    className="pb-3 border-b-2 transition-all flex items-center gap-2 text-[#E5B869] border-[#E5B869] font-bold"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" /> Performance Overview
                  </button>
                  <button
                    onClick={() => setActiveNav('executive-brief')}
                    className={`pb-3 border-b-2 border-transparent transition-all flex items-center gap-2 ${
                      themeMode === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Executive Brief & Profit
                  </button>
                </div>

                {/* Range Selector: Today | 7 Days Report | 30 Days Report | Custom Date */}
                <div className={`flex items-center gap-1.5 p-1 rounded-xl border text-xs ${
                  themeMode === 'dark' ? 'bg-[#101422] border-white/[0.08]' : 'bg-slate-100 border-slate-200'
                }`}>
                  <button
                    onClick={() => setAnalyticsRange('today')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      analyticsRange === 'today'
                        ? 'gold-btn text-black shadow-sm'
                        : themeMode === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setAnalyticsRange('7d')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      analyticsRange === '7d'
                        ? 'gold-btn text-black shadow-sm'
                        : themeMode === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    7 Days Report
                  </button>
                  <button
                    onClick={() => setAnalyticsRange('30d')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      analyticsRange === '30d'
                        ? 'gold-btn text-black shadow-sm'
                        : themeMode === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    30 Days Report
                  </button>
                  <button
                    onClick={() => setAnalyticsRange('custom')}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                      analyticsRange === 'custom'
                        ? 'gold-btn text-black shadow-sm'
                        : themeMode === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Custom Date
                  </button>
                </div>
              </div>

              {/* Custom Date Picker Bar (when analyticsRange === 'custom') */}
              {analyticsRange === 'custom' && (
                <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl glass-card border text-xs">
                  <span className={`font-bold flex items-center gap-1.5 ${
                    themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    <Calendar className="w-4 h-4 text-[#E5B869]" />
                    Custom Analysis Period:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>From:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className={`rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#E5B869] ${
                        themeMode === 'dark' ? 'bg-[#0E1322] border border-white/[0.1] text-white' : 'bg-white border border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>To:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className={`rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#E5B869] ${
                        themeMode === 'dark' ? 'bg-[#0E1322] border border-white/[0.1] text-white' : 'bg-white border border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <button
                    onClick={() => fetchData(false)}
                    className="gold-btn px-4 py-1.5 rounded-xl font-bold text-xs uppercase"
                  >
                    Apply Filter
                  </button>
                </div>
              )}

              {/* 4 Executive KPI Cards (Screenshot 1 exact design + Sparklines) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Gross Revenue */}
                <div className="glass-card glass-card-hover p-6 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
                      themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Gross Revenue
                    </span>
                    <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
                      ₹
                    </div>
                  </div>
                  <div className={`text-3xl font-bold font-serif mb-1 ${
                    themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    ₹{analytics.totalRevenue.toLocaleString('en-IN')}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className={`text-[11px] ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      Verified retail tickets
                    </p>
                    {renderSparkline('#10B981')}
                  </div>
                </div>

                {/* Total Orders */}
                <div className="glass-card glass-card-hover p-6 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
                      themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Total Orders
                    </span>
                    <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                  </div>
                  <div className={`text-3xl font-bold font-serif mb-1 ${
                    themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {analytics.totalOrders}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className={`text-[11px] ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      Live synchronized
                    </p>
                    {renderSparkline('#E5B869')}
                  </div>
                </div>

                {/* Avg Order Value */}
                <div className="glass-card glass-card-hover p-6 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
                      themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Avg Order Value
                    </span>
                    <div className="w-8 h-8 rounded-full bg-sky-500/15 text-sky-500 border border-sky-500/30 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className={`text-3xl font-bold font-serif mb-1 ${
                    themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    ₹{Math.round(analytics.averageOrderValue).toLocaleString('en-IN')}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className={`text-[11px] ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      Per customer ticket
                    </p>
                    {renderSparkline('#38BDF8')}
                  </div>
                </div>

                {/* Signature Champion */}
                <div className="glass-card glass-card-hover p-6 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-500">
                      Signature Champion
                    </span>
                    <div className="w-8 h-8 rounded-full bg-purple-500/15 text-purple-500 border border-purple-500/30 flex items-center justify-center">
                      <Award className="w-4 h-4" />
                    </div>
                  </div>
                  <div className={`text-lg font-bold font-serif truncate mb-1 ${
                    themeMode === 'dark' ? 'text-purple-200' : 'text-purple-900'
                  }`}>
                    {analytics.topSellingItems[0]?.name || 'Oxford Button-Down'}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className={`text-[11px] ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      {analytics.topSellingItems[0]?.unitsSold || 0} pieces ordered
                    </p>
                    {renderSparkline('#A855F7')}
                  </div>
                </div>
              </div>

              {/* Velocity Dial & Retail Margin Widget */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="glass-card p-6 rounded-2xl flex items-center gap-6">
                  {renderMarginDial(Math.round(analytics.grossMarginPct))}
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#E5B869] font-bold block mb-1">
                      Gross Profit Efficiency
                    </span>
                    <p className={`text-xl font-bold font-serif ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      ₹{analytics.grossProfit.toLocaleString('en-IN')}
                    </p>
                    <p className={`text-xs mt-0.5 ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      Net margin across active branches
                    </p>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-2xl flex flex-col justify-center">
                  <span className={`text-[10px] uppercase tracking-[0.2em] font-bold block mb-2 ${
                    themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Branch Conversion Index
                  </span>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold font-serif text-emerald-500">88.4%</span>
                    <span className={`text-xs font-mono ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Retail Conversion</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${themeMode === 'dark' ? 'bg-white/[0.06]' : 'bg-slate-200'}`}>
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-[88%]" />
                  </div>
                </div>

                <div className="glass-card p-6 rounded-2xl flex flex-col justify-center">
                  <span className={`text-[10px] uppercase tracking-[0.2em] font-bold block mb-2 ${
                    themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Atelier Inventory Health
                  </span>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className={`text-2xl font-bold font-serif ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {products.length}
                    </span>
                    <span className={`text-xs font-mono ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Active Garment SKUs</span>
                  </div>
                  <p className={`text-xs ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Distributed across {branches.length} operational showrooms
                  </p>
                </div>
              </div>

              {/* Top Revenue Contributors with Progress Bars */}
              <div className="glass-card p-7 rounded-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-base font-bold font-serif flex items-center gap-2 ${
                      themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      Top Revenue Contributors
                    </h3>
                    <p className={`text-xs ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      Top-performing apparel offerings for active reporting period
                    </p>
                  </div>
                  <span className="text-xs text-[#E5B869] font-mono">
                    Ranked by Gross Volume
                  </span>
                </div>

                <div className="space-y-3.5">
                  {analytics.topSellingItems.map((item, idx) => (
                    <div
                      key={item.productId}
                      className={`p-4 rounded-xl border transition-all ${
                        themeMode === 'dark'
                          ? 'bg-[#101422] border-white/[0.06] hover:border-[#E5B869]/30'
                          : 'bg-white border-slate-200 shadow-sm hover:border-[#E5B869]/50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3.5">
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              idx === 0
                                ? 'bg-[#E5B869]/20 text-[#E5B869] border border-[#E5B869]/40'
                                : idx === 1
                                ? 'bg-slate-300/20 text-slate-500 border border-slate-300/40'
                                : 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/40'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <div>
                            <p className={`text-xs font-bold ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              {item.name}
                            </p>
                            <p className={`text-[10px] ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                              {item.unitsSold} units sold
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold text-emerald-500 block font-mono">
                            ₹{item.totalRevenue.toLocaleString('en-IN')}
                          </span>
                          <span className={`text-[10px] font-mono ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                            {item.sharePct}% share
                          </span>
                        </div>
                      </div>

                      {/* Revenue Share Progress Bar */}
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                        themeMode === 'dark' ? 'bg-slate-800' : 'bg-slate-200'
                      }`}>
                        <div
                          style={{ width: `${Math.max(8, item.sharePct)}%` }}
                          className={`h-full rounded-full ${
                            idx === 0
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                              : idx === 1
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                              : 'bg-gradient-to-r from-indigo-500 to-blue-400'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ======================================================= */}
              {/* COMPREHENSIVE GARMENT SALES & UNITS LEDGER */}
              {/* ======================================================= */}
              <div className="glass-card p-7 rounded-2xl space-y-6">
                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className={`text-base font-bold font-serif flex items-center gap-2.5 ${
                      themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      <Package className="w-5 h-5 text-[#E5B869]" />
                      Garment Sales & Units Ledger
                    </h3>
                    <p className={`text-xs mt-0.5 ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      Itemized revenue and exact quantity sold per garment ({analytics.reportRange === 'today' ? "Today" : analytics.reportRange === '30d' ? 'Last 30 Days' : analytics.reportRange === 'custom' ? 'Custom Period' : 'Last 7 Days'})
                    </p>
                  </div>

                  {/* Summary Metric Chips */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div className={`px-3 py-1.5 rounded-xl border font-mono ${
                      themeMode === 'dark' ? 'bg-[#101422] border-white/[0.08] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}>
                      <span className="text-slate-400 mr-1">Total Sold:</span>
                      <strong className="text-emerald-500">
                        {analytics.allItemSales?.reduce((acc, it) => acc + it.unitsSold, 0) || 0} Units
                      </strong>
                    </div>

                    <div className={`px-3 py-1.5 rounded-xl border font-mono ${
                      themeMode === 'dark' ? 'bg-[#101422] border-white/[0.08] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}>
                      <span className="text-slate-400 mr-1">Catalog SKUs:</span>
                      <strong className="text-[#E5B869]">
                        {analytics.allItemSales?.length || 0} Items
                      </strong>
                    </div>

                    <div className={`px-3 py-1.5 rounded-xl border font-mono ${
                      themeMode === 'dark' ? 'bg-[#101422] border-white/[0.08] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}>
                      <span className="text-slate-400 mr-1">With Sales:</span>
                      <strong className="text-indigo-400">
                        {analytics.allItemSales?.filter((it) => it.unitsSold > 0).length || 0} Sold
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1">
                  <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={itemSalesSearch}
                        onChange={(e) => setItemSalesSearch(e.target.value)}
                        placeholder="Search garment by name, category, or SKU..."
                        className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none transition-all ${
                          themeMode === 'dark'
                            ? 'bg-[#101422] border border-white/[0.1] text-white focus:border-[#E5B869]'
                            : 'bg-white border border-slate-200 text-slate-900 focus:border-[#E5B869] shadow-sm'
                        }`}
                      />
                    </div>

                    {/* Status filter: All / Sold Only / Unsold */}
                    <div className={`flex items-center p-1 rounded-xl border text-xs self-start sm:self-auto ${
                      themeMode === 'dark' ? 'bg-[#101422] border-white/[0.08]' : 'bg-slate-100 border-slate-200'
                    }`}>
                      {(['all', 'sold', 'unsold'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setItemSalesStatusFilter(st)}
                          className={`px-3 py-1 rounded-lg font-bold capitalize transition-all ${
                            itemSalesStatusFilter === st
                              ? 'gold-btn text-black shadow-sm'
                              : themeMode === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {st === 'all' ? 'All Items' : st === 'sold' ? 'Sold Only' : 'Unsold (0)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sort selector */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`text-[11px] font-semibold whitespace-nowrap ${
                      themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Sort by:
                    </span>
                    <select
                      value={itemSalesSortBy}
                      onChange={(e) => setItemSalesSortBy(e.target.value as any)}
                      className={`px-3 py-1.5 rounded-xl border text-xs focus:outline-none font-semibold ${
                        themeMode === 'dark'
                          ? 'bg-[#101422] border-white/[0.1] text-white focus:border-[#E5B869]'
                          : 'bg-white border-slate-200 text-slate-800 focus:border-[#E5B869] shadow-sm'
                      }`}
                    >
                      <option value="revenue">Highest Revenue (₹)</option>
                      <option value="units">Highest Units Sold</option>
                      <option value="profit">Highest Gross Profit (₹)</option>
                      <option value="stock">Lowest Stock Remaining</option>
                      <option value="name">Garment Name (A-Z)</option>
                    </select>
                  </div>
                </div>

                {/* Items Ledger Table */}
                <div className={`overflow-x-auto rounded-xl border ${
                  themeMode === 'dark' ? 'border-white/[0.08]' : 'border-slate-200'
                }`}>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`text-[10px] uppercase font-bold tracking-wider border-b ${
                        themeMode === 'dark' ? 'bg-white/[0.02] border-white/[0.08] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                        <th className="py-3 px-4">Garment</th>
                        <th className="py-3 px-4">Category / SKU</th>
                        <th className="py-3 px-4 text-center">Units Sold</th>
                        <th className="py-3 px-4 text-right">Gross Revenue</th>
                        <th className="py-3 px-4 text-right">Gross Profit</th>
                        <th className="py-3 px-4 text-center">Current Stock</th>
                        <th className="py-3 px-4 text-center">Revenue Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-inherit text-xs">
                      {displayedItemSales.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                            No garments match the current search or filter.
                          </td>
                        </tr>
                      ) : (
                        displayedItemSales.map((item) => (
                          <tr
                            key={item.productId}
                            className={`transition-colors ${
                              themeMode === 'dark'
                                ? 'hover:bg-white/[0.03]'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            {/* Garment Image & Name */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800 border border-inherit">
                                  <img
                                    src={item.image || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200'}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className={`font-bold truncate max-w-[200px] ${
                                    themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                                  }`}>
                                    {item.name}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    Base Price: ₹{item.sellingPrice.toLocaleString('en-IN')}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Category & SKU */}
                            <td className="py-3.5 px-4">
                              <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                                themeMode === 'dark' ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {item.category}
                              </span>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {item.sku}
                              </p>
                            </td>

                            {/* Units Sold (Big and bold) */}
                            <td className="py-3.5 px-4 text-center">
                              {item.unitsSold > 0 ? (
                                <div>
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                                    {item.unitsSold} {item.unitsSold === 1 ? 'unit' : 'units'} sold
                                  </span>
                                  {item.sizesSold && Object.keys(item.sizesSold).length > 0 && (
                                    <p className="text-[10px] text-slate-400 font-mono mt-1">
                                      {Object.entries(item.sizesSold).map(([sz, q]) => `${sz}: ${q}`).join(' | ')}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] text-slate-400 bg-white/[0.04] border border-white/[0.06]">
                                  0 sold
                                </span>
                              )}
                            </td>

                            {/* Revenue */}
                            <td className="py-3.5 px-4 text-right font-mono">
                              <span className={`font-bold text-sm ${
                                item.totalRevenue > 0 ? 'text-emerald-400' : themeMode === 'dark' ? 'text-slate-500' : 'text-slate-400'
                              }`}>
                                ₹{item.totalRevenue.toLocaleString('en-IN')}
                              </span>
                            </td>

                            {/* Gross Profit */}
                            <td className="py-3.5 px-4 text-right font-mono">
                              <span className={`font-semibold ${
                                item.totalProfit > 0 ? 'text-amber-400' : themeMode === 'dark' ? 'text-slate-500' : 'text-slate-400'
                              }`}>
                                ₹{item.totalProfit.toLocaleString('en-IN')}
                              </span>
                            </td>

                            {/* Current Stock Remaining */}
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                                item.currentStock === 0
                                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                                  : item.currentStock < 5
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : themeMode === 'dark'
                                  ? 'bg-white/[0.06] text-slate-200'
                                  : 'bg-slate-100 text-slate-800'
                              }`}>
                                {item.currentStock} in stock
                              </span>
                            </td>

                            {/* Revenue Share Progress */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2 justify-center">
                                <div className={`w-16 h-1.5 rounded-full overflow-hidden ${
                                  themeMode === 'dark' ? 'bg-slate-800' : 'bg-slate-200'
                                }`}>
                                  <div
                                    style={{ width: `${Math.min(100, Math.max(item.sharePct, item.unitsSold > 0 ? 5 : 0))}%` }}
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                                  />
                                </div>
                                <span className={`text-[10px] font-mono ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {item.sharePct}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* VIEW 2: EXECUTIVE DEEP ANALYSIS & GROSS PROFIT */}
          {/* ======================================================= */}
          {activeNav === 'executive-brief' && analytics && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className={`text-xl font-bold font-serif ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Executive Financial Brief
                  </h2>
                  <p className={`text-xs ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Gross profit breakdown, trajectory visualizer, and showroom performance matrix
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-1.5 p-1 rounded-xl border text-xs ${
                    themeMode === 'dark' ? 'bg-[#101422] border-white/[0.08]' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <button
                      onClick={() => setAnalyticsRange('today')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                        analyticsRange === 'today'
                          ? 'gold-btn text-black shadow-sm'
                          : themeMode === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setAnalyticsRange('7d')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                        analyticsRange === '7d'
                          ? 'gold-btn text-black shadow-sm'
                          : themeMode === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      7D Report
                    </button>
                    <button
                      onClick={() => setAnalyticsRange('30d')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                        analyticsRange === '30d'
                          ? 'gold-btn text-black shadow-sm'
                          : themeMode === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      30D Report
                    </button>
                    <button
                      onClick={() => setAnalyticsRange('custom')}
                      className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                        analyticsRange === 'custom'
                          ? 'gold-btn text-black shadow-sm'
                          : themeMode === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Custom Date
                    </button>
                  </div>

                  <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono">
                    {analytics.grossMarginPct}% Net Margin
                  </div>
                </div>
              </div>

              {/* Trajectory Chart */}
              <div className="glass-card p-7 rounded-2xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 font-serif ${
                    themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                    {analytics.reportRange === 'today'
                      ? "Today's Hourly Gross Profit Trajectory (₹)"
                      : analytics.reportRange === '30d'
                      ? '30-Day Financial Trajectory (₹)'
                      : analytics.reportRange === 'custom'
                      ? `Custom Report: ${analytics.startDate} to ${analytics.endDate} (₹)`
                      : '7-Day Gross Profit Trajectory (₹)'}
                  </h3>
                  <span className="text-xs text-emerald-500 font-bold font-mono">
                    Total Profit: ₹{analytics.grossProfit.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="overflow-x-auto pb-2">
                  <div
                    className={`h-72 flex items-end justify-between gap-2 sm:gap-4 border-b pt-6 pb-2 px-3 ${
                      themeMode === 'dark' ? 'border-white/[0.08]' : 'border-slate-200'
                    }`}
                    style={{ minWidth: analytics.trends.length > 10 ? `${analytics.trends.length * 36}px` : '100%' }}
                  >
                    {analytics.trends.map((item, idx) => {
                      const heightPct =
                        maxChartVal > 0 ? Math.max(12, Math.round((item.grossProfit / maxChartVal) * 100)) : 12;

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative min-w-[30px]">
                          <div className={`opacity-0 group-hover:opacity-100 transition-opacity absolute -top-16 p-2.5 rounded-xl text-[11px] pointer-events-none shadow-2xl z-20 whitespace-nowrap border ${
                            themeMode === 'dark' ? 'bg-[#0E1322] border-white/[0.15] text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
                          }`}>
                            <p className="font-bold">{item.date}</p>
                            <p className="text-emerald-500 font-bold font-mono">Profit: ₹{item.grossProfit.toLocaleString('en-IN')}</p>
                            <p className="font-mono">Revenue: ₹{item.revenue.toLocaleString('en-IN')}</p>
                            <p className="text-[#E5B869]">{item.ordersCount} retail orders</p>
                          </div>

                          <div className="w-full max-w-[44px] flex flex-col justify-end h-full">
                            <div
                              style={{ height: `${heightPct}%` }}
                              className="w-full rounded-t-xl transition-all duration-500 bg-gradient-to-t from-[#C59846]/30 via-[#E5B869]/80 to-[#FFF0CA] shadow-[0_0_15px_rgba(229,184,105,0.25)] group-hover:brightness-125"
                            />
                          </div>

                          <span className={`mt-3 text-[10px] font-medium truncate max-w-[42px] text-center ${
                            themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {item.date.split(' ')[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Dynamic Branch Summaries Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {analytics.branchSummaries.map((bSummary) => (
                  <div
                    key={bSummary.branchId}
                    className="glass-card p-6 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold flex items-center gap-2 ${
                        themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>
                        <Building2 className="w-4 h-4 text-[#E5B869]" />
                        {bSummary.branchName}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md font-mono ${
                        themeMode === 'dark' ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {bSummary.orders} orders
                      </span>
                    </div>

                    <div className="flex justify-between text-xs pt-1">
                      <span className={themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Total Sales:</span>
                      <span className={`font-bold font-mono ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        ₹{bSummary.revenue.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className={themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Gross Profit:</span>
                      <span className="font-bold text-emerald-500 font-mono">
                        +₹{bSummary.grossProfit.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* VIEW 3: DYNAMIC BRANCH MANAGEMENT */}
          {/* ======================================================= */}
          {activeNav === 'branches' && currentUser.role === 'superadmin' && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-bold font-serif ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Enterprise Branch Network
                </h2>
                <p className={`text-xs ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Add new branch locations, customize branch names, and assign store managers
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 p-7 rounded-2xl glass-card space-y-4">
                  <h3 className={`text-sm font-bold uppercase tracking-wider font-serif ${
                    themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {editingBranchId ? 'Edit Branch Location' : 'Add New Branch'}
                  </h3>

                  <form onSubmit={handleSaveBranch} className="space-y-3.5">
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                        themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Branch Name *
                      </label>
                      <input
                        type="text"
                        value={branchForm.name}
                        onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                        placeholder="e.g. Jubilee Hills Flagship"
                        className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#E5B869] ${
                          themeMode === 'dark' ? 'bg-[#0E1322] border border-white/[0.1] text-white' : 'bg-white border border-slate-300 text-slate-900'
                        }`}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                          themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          Branch Code
                        </label>
                        <input
                          type="text"
                          value={branchForm.code}
                          onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                          placeholder="e.g. JUB-01"
                          className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#E5B869] ${
                            themeMode === 'dark' ? 'bg-[#0E1322] border border-white/[0.1] text-white' : 'bg-white border border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                          themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          City
                        </label>
                        <input
                          type="text"
                          value={branchForm.city}
                          onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                          placeholder="Hyderabad"
                          className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#E5B869] ${
                            themeMode === 'dark' ? 'bg-[#0E1322] border border-white/[0.1] text-white' : 'bg-white border border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                        themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Location / Address *
                      </label>
                      <input
                        type="text"
                        value={branchForm.location}
                        onChange={(e) => setBranchForm({ ...branchForm, location: e.target.value })}
                        placeholder="Road No. 36, Near Metro Station"
                        className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#E5B869] ${
                          themeMode === 'dark' ? 'bg-[#0E1322] border border-white/[0.1] text-white' : 'bg-white border border-slate-300 text-slate-900'
                        }`}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                          themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          Phone Number *
                        </label>
                        <input
                          type="text"
                          value={branchForm.phone}
                          onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#E5B869] ${
                            themeMode === 'dark' ? 'bg-[#0E1322] border border-white/[0.1] text-white' : 'bg-white border border-slate-300 text-slate-900'
                          }`}
                          required
                        />
                      </div>

                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                          themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          Branch Manager
                        </label>
                        <input
                          type="text"
                          value={branchForm.managerName}
                          onChange={(e) => setBranchForm({ ...branchForm, managerName: e.target.value })}
                          placeholder="Manager Name"
                          className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#E5B869] ${
                            themeMode === 'dark' ? 'bg-[#0E1322] border border-white/[0.1] text-white' : 'bg-white border border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      {editingBranchId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBranchId(null);
                            setBranchForm({ name: '', code: '', city: 'Hyderabad', location: '', phone: '', managerName: '' });
                          }}
                          className="glass-btn px-4 py-2.5 rounded-xl text-xs font-bold"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        className="flex-1 gold-btn py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider"
                      >
                        {editingBranchId ? 'Save Branch Changes' : 'Create Branch'}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="lg:col-span-7 p-7 rounded-2xl glass-card space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-sm font-bold uppercase tracking-wider font-serif ${
                        themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>
                        Active Showrooms Map ({branches.length})
                      </h3>
                      <p className={`text-xs ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        Operational retail locations connected to Roman Island
                      </p>
                    </div>

                    <div className="relative w-48">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Find branch..."
                        value={branchSearch}
                        onChange={(e) => setBranchSearch(e.target.value)}
                        className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none ${
                          themeMode === 'dark' ? 'bg-[#0E1322] border border-white/[0.1] text-white' : 'bg-white border border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {branches
                      .filter((b) => b.name.toLowerCase().includes(branchSearch.toLowerCase()))
                      .map((branch) => (
                        <div
                          key={branch.id}
                          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                            themeMode === 'dark'
                              ? 'bg-[#101422] border-white/[0.06] hover:border-[#E5B869]/30'
                              : 'bg-white border-slate-200 shadow-sm hover:border-[#E5B869]/50'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-[#E5B869]/15 text-[#E5B869] border border-[#E5B869]/30 flex items-center justify-center font-bold text-xs">
                              {branch.code || 'BR'}
                            </div>
                            <div>
                              <h4 className={`text-xs font-bold flex items-center gap-2 ${
                                themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                              }`}>
                                {branch.name}
                                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500 font-semibold uppercase">
                                  {branch.status}
                                </span>
                              </h4>
                              <p className={`text-[11px] mt-0.5 flex items-center gap-1.5 ${
                                themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                              }`}>
                                <MapPin className="w-3 h-3 text-slate-400" /> {branch.location}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingBranchId(branch.id);
                                setBranchForm({
                                  name: branch.name,
                                  code: branch.code,
                                  city: branch.city || 'Hyderabad',
                                  location: branch.location,
                                  phone: branch.phone,
                                  managerName: branch.managerName || '',
                                });
                              }}
                              className="glass-btn p-2 rounded-lg"
                              title="Edit Branch"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBranch(branch.id)}
                              className="p-2 rounded-lg bg-red-950/20 border border-red-800/40 text-red-500 hover:bg-red-900/40"
                              title="Remove Branch"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* VIEW 4: CATEGORY MANAGEMENT */}
          {/* ======================================================= */}
          {activeNav === 'categories' && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-bold font-serif ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Category Management
                </h2>
                <p className={`text-xs ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Organize apparel departments, category photography, and showroom taxonomy
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 p-7 rounded-2xl glass-card space-y-4">
                  <h3 className={`text-sm font-bold uppercase tracking-wider font-serif ${
                    themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    Add New Section
                  </h3>

                  <form onSubmit={handleCreateCategory} className="space-y-4">
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                        themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Section Name *
                      </label>
                      <input
                        type="text"
                        value={catName}
                        onChange={(e) => setCatName(e.target.value)}
                        placeholder="e.g. Checks, Streetwear, Suits"
                        className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#E5B869] ${
                          themeMode === 'dark' ? 'bg-[#0E1322] border border-white/[0.1] text-white' : 'bg-white border border-slate-300 text-slate-900'
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                        themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Parent Section (Leave blank for root)
                      </label>
                      <select className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#E5B869] ${
                        themeMode === 'dark' ? 'bg-[#0E1322] border border-white/[0.1] text-white' : 'bg-white border border-slate-300 text-slate-900'
                      }`}>
                        <option>None (Top-Level Section)</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                        themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Section Icon / Photography (Optional)
                      </label>

                      <div className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-all ${
                        themeMode === 'dark' ? 'border-white/[0.15] hover:border-[#E5B869]/50 bg-[#0E1322]/50' : 'border-slate-300 hover:border-[#E5B869]/70 bg-slate-50'
                      }`}>
                        {catImage ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <img src={catImage} alt="Category" className="w-12 h-12 object-cover rounded-xl border border-slate-200" />
                                <span className={`text-xs truncate max-w-[160px] ${themeMode === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Photo Attached</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setCatImage('')}
                                className="text-xs text-red-500 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-start">
                              <label className={`cursor-pointer px-3 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 ${
                                themeMode === 'dark' ? 'bg-[#141A2D] text-[#E5B869] border-[#E5B869]/40' : 'bg-white text-slate-800 border-slate-300 shadow-sm'
                              }`}>
                                <ImagePlus className="w-3.5 h-3.5" />
                                <span>Replace Photo</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleCatImageUpload(f);
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center justify-center py-2">
                            {catImageUploading ? (
                              <RefreshCw className="w-6 h-6 text-[#E5B869] animate-spin mb-1" />
                            ) : (
                              <UploadCloud className="w-6 h-6 text-[#E5B869] mb-1" />
                            )}
                            <span className={`text-xs font-semibold ${themeMode === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                              {catImageUploading ? 'Uploading...' : 'Upload Section Image'}
                            </span>
                            <span className={`text-[10px] mt-0.5 ${themeMode === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                              Drag & drop or browse from device
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleCatImageUpload(f);
                              }}
                            />
                          </label>
                        )}

                        <div className="mt-2 pt-2 border-t border-white/[0.06]">
                          <input
                            type="url"
                            value={catImage}
                            onChange={(e) => setCatImage(e.target.value)}
                            placeholder="Or paste image URL here..."
                            className={`w-full rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#E5B869] ${
                              themeMode === 'dark' ? 'bg-[#141A2D] border border-white/[0.1] text-white' : 'bg-white border border-slate-300 text-slate-900'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full gold-btn py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider"
                    >
                      Create Section
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-7 p-7 rounded-2xl glass-card space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-sm font-bold uppercase tracking-wider font-serif ${
                        themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>
                        Taxonomy Map
                      </h3>
                      <p className={`text-xs ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        Hierarchical layout of active clothing departments
                      </p>
                    </div>

                    <div className="relative w-48">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Find section..."
                        value={catSearch}
                        onChange={(e) => setCatSearch(e.target.value)}
                        className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none ${
                          themeMode === 'dark' ? 'bg-[#0E1322] border border-white/[0.1] text-white' : 'bg-white border border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {categories
                      .filter((c) => (c.name || '').toLowerCase().includes((catSearch || '').toLowerCase()))
                      .map((cat) => {
                        const itemsCount = (products || []).filter(
                          (p) => p && (p.category || '').toLowerCase() === (cat.name || '').toLowerCase()
                        ).length;

                        return (
                          <div
                            key={cat.id}
                            className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                              themeMode === 'dark'
                                ? 'bg-[#101422] border-white/[0.06] hover:border-[#E5B869]/30'
                                : 'bg-white border-slate-200 shadow-sm hover:border-[#E5B869]/50'
                            }`}
                          >
                            <div className="flex items-center gap-3.5">
                              <div className={`w-10 h-10 rounded-xl overflow-hidden border flex items-center justify-center ${
                                themeMode === 'dark' ? 'bg-white/[0.06] border-white/[0.08]' : 'bg-slate-100 border-slate-200'
                              }`}>
                                {cat.image ? (
                                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                                ) : (
                                  <FolderTree className="w-4 h-4 text-[#E5B869]" />
                                )}
                              </div>
                              <div>
                                <h4 className={`text-xs font-bold flex items-center gap-2 ${
                                  themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                                }`}>
                                  {cat.name}
                                </h4>
                                <span className="text-[10px] text-emerald-500 font-mono">
                                  ✂ {itemsCount} styles in catalog
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-2 rounded-lg bg-red-950/20 border border-red-800/40 text-red-500 hover:bg-red-900/40"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* VIEW 5: APPAREL CATALOG */}
          {/* ======================================================= */}
          {activeNav === 'catalog' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className={`text-xl font-bold font-serif ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Apparel Catalog
                  </h2>
                  <p className={`text-xs ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Master collection catalog with retail pricing and cost structures
                  </p>
                </div>

                <button
                  onClick={() => {
                    const defaultBranch =
                      currentUser?.role === 'branch_manager' && currentUser.branchId
                        ? currentUser.branchId
                        : (selectedBranchId !== 'all' ? selectedBranchId : 'all');
                    setEditingProduct(null);
                    setClothForm({
                      name: '',
                      sku: '',
                      category: categories[0]?.name || 'Checks',
                      description: '',
                      costPrice: 600,
                      sellingPrice: 1499,
                      tag: '',
                      image: '',
                      initialStock: 10,
                      sizes: '',
                      targetBranch: defaultBranch,
                      branchStock: {},
                      hasVariablePricing: false,
                      sizePrices: {},
                      fabric: '',
                      care: '',
                      hasSizeChart: false,
                      sizeChartMeasurements: [],
                    });
                    setIsAddClothOpen(true);
                  }}
                  className="gold-btn px-4 py-2.5 rounded-xl text-xs flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Apparel Item</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 glass-card p-3 rounded-2xl">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setCatalogCategory('All')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      catalogCategory === 'All'
                        ? 'gold-btn text-black'
                        : themeMode === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCatalogCategory(c.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        catalogCategory === c.name
                          ? 'gold-btn text-black'
                          : themeMode === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>

                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search garment or SKU..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none ${
                      themeMode === 'dark' ? 'bg-[#0E1322] border border-white/[0.1] text-white' : 'bg-white border border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredCatalogProducts.map((p) => (
                  <div
                    key={p.id}
                    className="glass-card glass-card-hover rounded-2xl p-4 flex flex-col"
                  >
                    <div className={`relative w-full aspect-[4/5] rounded-xl overflow-hidden mb-3 border ${
                      themeMode === 'dark' ? 'bg-[#0E1322] border-white/[0.06]' : 'bg-slate-100 border-slate-200'
                    }`}>
                      {p.tag && (
                        <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded bg-black/80 border border-[#E5B869]/40 text-[#E5B869] text-[9px] font-extrabold uppercase tracking-widest">
                          {p.tag}
                        </span>
                      )}
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-[#E5B869] tracking-wider mb-1">
                        {p.category}
                      </span>
                      <h4 className={`text-xs font-bold uppercase truncate mb-1 ${
                        themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>{p.name}</h4>
                      <p className={`text-[10px] font-mono mb-2 ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>SKU: {p.sku}</p>

                      <div className={`mt-auto pt-2.5 border-t flex items-center justify-between ${
                        themeMode === 'dark' ? 'border-white/[0.06]' : 'border-slate-200'
                      }`}>
                        <div>
                          <span className={`text-sm font-bold font-serif ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            ₹{p.sellingPrice}
                          </span>
                          <span className={`text-[10px] ml-1.5 font-mono ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                            Cost: ₹{p.costPrice}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditClothModal(p)}
                            className="glass-btn p-2 rounded-lg hover:text-[#E5B869]"
                            title="Edit Garment Specifications & Pricing"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2 rounded-lg bg-red-950/20 border border-red-800/40 text-red-500 hover:bg-red-900/40"
                            title="Delete Garment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* VIEW 6: INVENTORY MATRIX */}
          {/* ======================================================= */}
          {activeNav === 'inventory' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className={`text-xl font-bold font-serif ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Multi-Branch Inventory Matrix
                  </h2>
                  <p className={`text-xs ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Live stock counters across sizes S, M, L, XL, XXL divided strictly by category
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                <button
                  onClick={() => setSelectedInventoryCategory('All')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    selectedInventoryCategory === 'All'
                      ? 'gold-btn text-black'
                      : 'glass-btn'
                  }`}
                >
                  All Departments ({products.length})
                </button>
                {categories.map((c) => {
                  const count = (products || []).filter(
                    (p) => p && (p.category || '').toLowerCase() === (c.name || '').toLowerCase()
                  ).length;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedInventoryCategory(c.name)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                        selectedInventoryCategory === c.name
                          ? 'gold-btn text-black'
                          : 'glass-btn'
                      }`}
                    >
                      {c.name} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="space-y-8">
                {(selectedInventoryCategory === 'All'
                  ? categories
                  : categories.filter((c) => (c.name || '').toLowerCase() === (selectedInventoryCategory || '').toLowerCase())
                ).map((cat) => {
                  const catProducts = (products || []).filter(
                    (p) => p && (p.category || '').toLowerCase() === (cat.name || '').toLowerCase()
                  );
                  if (catProducts.length === 0) return null;

                  return (
                    <div key={cat.id} className="glass-card p-6 rounded-2xl space-y-4">
                      <div className={`flex items-center justify-between border-b pb-3 ${
                        themeMode === 'dark' ? 'border-white/[0.06]' : 'border-slate-200'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#E5B869]/15 text-[#E5B869] flex items-center justify-center font-bold text-xs">
                            <Tag className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className={`text-sm font-bold uppercase tracking-wider font-serif ${
                              themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                            }`}>
                              {cat.name} Department
                            </h3>
                            <p className={`text-[11px] ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                              {catProducts.length} apparel offerings
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-mono text-[#E5B869]">
                          Live Multi-Branch Matrix
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className={`text-[10px] uppercase font-bold border-b ${
                              themeMode === 'dark' ? 'text-slate-400 border-white/[0.06]' : 'text-slate-500 border-slate-200'
                            }`}>
                              <th className="pb-3">Garment</th>
                              <th className="pb-3">Branch Location</th>
                              <th className="pb-3">Dynamic Sizes & Live Stock Counters</th>
                              <th className="pb-3 text-right">Total Stock</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${themeMode === 'dark' ? 'divide-white/[0.04]' : 'divide-slate-200'}`}>
                            {catProducts.map((p) => {
                              const activeBranches =
                                currentUser?.role === 'branch_manager' && currentUser.branchId
                                  ? branches.filter((b) => b.id === currentUser.branchId)
                                  : selectedBranchId === 'all'
                                  ? branches
                                  : branches.filter((b) => b.id === selectedBranchId);
                              const pSizes = getProductSizes(p);

                              return activeBranches.map((b, bIdx) => {
                                const stock = p.inventory[b.id] || {};
                                const total = Object.values(stock).reduce((acc, v) => acc + (v || 0), 0);

                                return (
                                  <tr key={`${p.id}-${b.id}`} className={themeMode === 'dark' ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}>
                                    {bIdx === 0 ? (
                                      <td className={`py-3 font-semibold ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`} rowSpan={activeBranches.length}>
                                        <div className="flex items-center justify-between gap-2.5">
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <img src={p.image} alt={p.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                                            <div className="min-w-0">
                                              <p className="font-bold truncate">{p.name}</p>
                                              <p className={`text-[10px] font-mono ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{p.sku}</p>
                                            </div>
                                          </div>
                                          <button
                                            onClick={() => openEditClothModal(p)}
                                            className="glass-btn p-1.5 rounded-lg hover:text-[#E5B869] flex-shrink-0 transition-colors"
                                            title={`Edit ${p.name} specifications & pricing at any time`}
                                          >
                                            <Edit className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    ) : null}

                                    <td className={`py-3 font-medium ${themeMode === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                      <span className="flex items-center gap-1.5">
                                        <Building2 className="w-3 h-3 text-amber-500" />
                                        {b.name}
                                      </span>
                                    </td>

                                    <td className="py-3">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {pSizes.map((sz) => (
                                          <div
                                            key={sz}
                                            className={`inline-flex items-center gap-1.5 border px-2 py-1 rounded-xl text-xs transition-colors ${
                                              themeMode === 'dark' ? 'bg-[#0E1322] border-white/[0.08]' : 'bg-slate-100 border-slate-200'
                                            }`}
                                          >
                                            <span className="font-mono font-bold text-[#E5B869] text-[11px] min-w-[16px]">
                                              {sz}
                                            </span>
                                            <div className="flex items-center gap-1">
                                              <button
                                                onClick={() => handleStockAdjust(p.id, b.id, sz, -1)}
                                                className="text-slate-400 hover:text-red-400 px-1 font-bold transition-colors"
                                                title={`Decrease size ${sz}`}
                                              >
                                                -
                                              </button>
                                              <span className={`w-5 text-center font-mono font-bold ${
                                                themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                                              }`}>
                                                {stock[sz] ?? 0}
                                              </span>
                                              <button
                                                onClick={() => handleStockAdjust(p.id, b.id, sz, 1)}
                                                className="text-slate-400 hover:text-emerald-400 px-1 font-bold transition-colors"
                                                title={`Increase size ${sz}`}
                                              >
                                                +
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </td>

                                    <td className="py-3 text-right font-mono font-bold text-emerald-500">
                                      {total} pcs
                                    </td>
                                  </tr>
                                );
                              });
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* VIEW 7: ORDER HISTORY & BILLS */}
          {/* ======================================================= */}
          {activeNav === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className={`text-xl font-bold font-serif ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Order History & Invoices
                  </h2>
                  <p className={`text-xs ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Real-time retail bills generated across POS terminals
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Total Invoices: <strong className={themeMode === 'dark' ? 'text-white' : 'text-slate-900'}>{orders.length}</strong>
                  </span>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl space-y-4">
                <div className="space-y-3">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        themeMode === 'dark'
                          ? 'bg-[#101422] border-white/[0.06]'
                          : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2.5 mb-1">
                          <span className="text-xs font-bold font-mono text-[#E5B869]">
                            {ord.billingId}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500 font-semibold uppercase">
                            {ord.status}
                          </span>
                          <span className={`text-[10px] font-mono ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className={`text-xs ${themeMode === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                          {ord.branchName} • Customer: <strong>{ord.customerName}</strong> ({ord.customerPhone})
                        </p>
                        <p className={`text-[11px] mt-1 ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          {ord.items.map((i) => `${i.productName} (${i.size} × ${i.quantity})`).join(', ')}
                        </p>
                      </div>

                      <div className="text-right flex sm:flex-col items-center sm:items-end justify-between">
                        <span className={`text-base font-bold font-serif font-mono ${
                          themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>
                          ₹{ord.total.toLocaleString('en-IN')}
                        </span>
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${
                          themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          {ord.paymentMethod}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* VIEW 8: SYSTEM & THEMES */}
          {/* ======================================================= */}
          {activeNav === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-bold font-serif ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  System & Appearance Settings
                </h2>
                <p className={`text-xs ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Customize interface themes, fine-tune catalog performance density, and verify system integrity.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-7 rounded-2xl space-y-4">
                  <div>
                    <h3 className={`text-sm font-bold uppercase tracking-wider font-serif flex items-center gap-2 ${
                      themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      <Sparkles className="w-4 h-4 text-[#E5B869]" /> Appearance Mode
                    </h3>
                    <p className={`text-xs ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      Toggle between obsidian dark ambiance and luminous porcelain light mode.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => setThemeMode('dark')}
                      className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                        themeMode === 'dark'
                          ? 'bg-[#0E1322] border-2 border-[#E5B869] text-[#E5B869] shadow-[0_0_20px_rgba(229,184,105,0.2)]'
                          : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Moon className="w-4 h-4" /> Dark Mode
                      {themeMode === 'dark' && <span className="w-2 h-2 rounded-full bg-[#E5B869] ml-1" />}
                    </button>

                    <button
                      onClick={() => setThemeMode('light')}
                      className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                        themeMode === 'light'
                          ? 'bg-white border-2 border-[#E5B869] text-slate-900 shadow-md'
                          : 'bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:bg-white/[0.06]'
                      }`}
                    >
                      <Sun className="w-4 h-4" /> Light Mode
                      {themeMode === 'light' && <span className="w-2 h-2 rounded-full bg-[#E5B869] ml-1" />}
                    </button>
                  </div>
                </div>

                <div className="glass-card p-7 rounded-2xl space-y-4">
                  <div>
                    <h3 className={`text-sm font-bold uppercase tracking-wider font-serif flex items-center gap-2 ${
                      themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      <Zap className="w-4 h-4 text-emerald-500" /> Catalog Browsing Density
                    </h3>
                    <p className={`text-xs ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      With {products.length} garments in catalog, pagination prevents browser latency.
                    </p>
                  </div>

                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${
                      themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      ITEMS RENDERED PER PAGE:
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {[12, 18, 24, 36].map((num) => (
                        <button
                          key={num}
                          onClick={() => setCatalogDensity(num)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all ${
                            catalogDensity === num
                              ? 'gold-btn text-black'
                              : 'glass-btn'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="glass-card p-7 rounded-2xl space-y-4">
                  <div>
                    <h3 className={`text-sm font-bold uppercase tracking-wider font-serif flex items-center gap-2 ${
                      themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      <Crown className="w-4 h-4 text-[#E5B869]" /> Curated Theme Palettes
                    </h3>
                    <p className={`text-xs ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      Click an executive palette to instantly transform accent colors, badges, and chart curves.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <button
                      onClick={() => setThemePalette('obsidian-gold')}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        themePalette === 'obsidian-gold'
                          ? `${themeMode === 'dark' ? 'bg-[#101422]' : 'bg-white'} border-[#E5B869] shadow-[0_0_20px_rgba(229,184,105,0.25)]`
                          : themeMode === 'dark' ? 'bg-white/[0.02] border-white/[0.08]' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <span className="w-3.5 h-3.5 rounded-full bg-[#111827]" />
                          <span className="w-3.5 h-3.5 rounded-full bg-[#E5B869]" />
                        </div>
                        <div>
                          <p className={`text-xs font-bold flex items-center gap-2 ${
                            themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                          }`}>
                            Obsidian Gold
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#E5B869]/20 text-[#E5B869] font-mono">
                              SIGNATURE
                            </span>
                          </p>
                          <p className={`text-[10px] ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                            Signature tailoring with champagne gold foil & deep onyx.
                          </p>
                        </div>
                      </div>
                      {themePalette === 'obsidian-gold' && <Check className="w-4 h-4 text-[#E5B869]" />}
                    </button>

                    <button
                      onClick={() => setThemePalette('midnight-sapphire')}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        themePalette === 'midnight-sapphire'
                          ? `${themeMode === 'dark' ? 'bg-[#101422]' : 'bg-white'} border-[#38BDF8] shadow-[0_0_20px_rgba(56,189,248,0.25)]`
                          : themeMode === 'dark' ? 'bg-white/[0.02] border-white/[0.08]' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <span className="w-3.5 h-3.5 rounded-full bg-[#0369A1]" />
                          <span className="w-3.5 h-3.5 rounded-full bg-[#38BDF8]" />
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            Midnight Sapphire
                          </p>
                          <p className={`text-[10px] ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                            Modern executive palette with cool navy slate & ice blue.
                          </p>
                        </div>
                      </div>
                      {themePalette === 'midnight-sapphire' && <Check className="w-4 h-4 text-[#38BDF8]" />}
                    </button>

                    <button
                      onClick={() => setThemePalette('emerald-reserve')}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        themePalette === 'emerald-reserve'
                          ? `${themeMode === 'dark' ? 'bg-[#101422]' : 'bg-white'} border-[#10B981] shadow-[0_0_20px_rgba(16,185,129,0.25)]`
                          : themeMode === 'dark' ? 'bg-white/[0.02] border-white/[0.08]' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <span className="w-3.5 h-3.5 rounded-full bg-[#065F46]" />
                          <span className="w-3.5 h-3.5 rounded-full bg-[#10B981]" />
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            Emerald Reserve
                          </p>
                          <p className={`text-[10px] ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                            Imperial botanical luxury with deep forest black & emerald jade.
                          </p>
                        </div>
                      </div>
                      {themePalette === 'emerald-reserve' && <Check className="w-4 h-4 text-[#10B981]" />}
                    </button>
                  </div>
                </div>

                <div className="glass-card p-7 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-sm font-bold uppercase tracking-wider font-serif flex items-center gap-2 ${
                        themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>
                        <Database className="w-4 h-4 text-amber-500" /> Cloud Database Storage
                      </h3>
                      <p className={`text-xs ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        Strict 500MB storage ceiling preservation monitor:
                      </p>
                    </div>
                    <span className="text-[10px] px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold uppercase">
                      Safe Tier
                    </span>
                  </div>

                  <div className="pt-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className={themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Current Database Size:</span>
                      <span className="font-mono font-bold text-emerald-500">~14.2 MB / 500 MB (2.8%)</span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${
                      themeMode === 'dark' ? 'bg-white/[0.06]' : 'bg-slate-200'
                    }`}>
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-[2.8%]" />
                    </div>
                    <p className={`text-[10px] pt-1 flex items-center gap-1.5 ${
                      themeMode === 'dark' ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Zero redundant database tables or bulky event logs are created.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ============================================================= */}
      {/* MODAL: ADD / EDIT CLOTH WITH DIRECT FILE UPLOAD */}
      {/* ============================================================= */}
      {isAddClothOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className={`w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-7 border shadow-2xl relative ${
            themeMode === 'dark' ? 'bg-[#0B0F19] text-white border-[#E5B869]/30' : 'bg-white text-slate-900 border-[#E5B869]/50 shadow-2xl'
          }`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-base font-bold uppercase tracking-wider font-serif ${
                themeMode === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                {editingProduct ? 'Edit Apparel Item' : 'Add Apparel Item'}
              </h3>
              <button
                onClick={() => setIsAddClothOpen(false)}
                className={`p-1 ${themeMode === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCloth} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                    themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Cloth Name *
                  </label>
                  <input
                    type="text"
                    value={clothForm.name}
                    onChange={(e) => setClothForm({ ...clothForm, name: e.target.value })}
                    placeholder="e.g. Classic Oxford Button-Down"
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#E5B869] ${
                      themeMode === 'dark' ? 'bg-[#0E1322] border border-white/[0.1] text-white' : 'bg-white border border-slate-300 text-slate-900'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                    themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    SKU / Product Code
                  </label>
                  <input
                    type="text"
                    value={clothForm.sku}
                    onChange={(e) => setClothForm({ ...clothForm, sku: e.target.value })}
                    placeholder="Auto-generated if empty"
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-[#E5B869] ${
                      themeMode === 'dark' ? 'bg-[#0E1322] border border-white/[0.1] text-white' : 'bg-white border border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                    themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Category *
                  </label>
                  <select
                    value={clothForm.category}
                    onChange={(e) => setClothForm({ ...clothForm, category: e.target.value })}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#E5B869] ${
                      themeMode === 'dark' ? 'bg-[#0E1322] border border-white/[0.1] text-white' : 'bg-white border border-slate-300 text-slate-900'
                    }`}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                    themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Badge Tag
                  </label>
                  <select
                    value={clothForm.tag}
                    onChange={(e) => setClothForm({ ...clothForm, tag: e.target.value })}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#E5B869] ${
                      themeMode === 'dark' ? 'bg-[#0E1322] border border-white/[0.1] text-white' : 'bg-white border border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="">None</option>
                    <option value="New">New</option>
                    <option value="Bestseller">Bestseller</option>
                    <option value="Exclusive">Exclusive</option>
                    <option value="Signature">Signature</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                    themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={clothForm.sellingPrice}
                    onChange={(e) => setClothForm({ ...clothForm, sellingPrice: Number(e.target.value) })}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#E5B869] ${
                      themeMode === 'dark' ? 'bg-[#0E1322] border border-white/[0.1] text-white' : 'bg-white border border-slate-300 text-slate-900'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-1">
                    Cost Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={clothForm.costPrice}
                    onChange={(e) => setClothForm({ ...clothForm, costPrice: Number(e.target.value) })}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#E5B869] ${
                      themeMode === 'dark' ? 'bg-[#0E1322] border border-white/[0.1] text-white' : 'bg-white border border-slate-300 text-slate-900'
                    }`}
                    required
                  />
                </div>
              </div>

              {/* ========================================================= */}
              {/* SIZE & BRANCH QUANTITY CONFIGURATION */}
              {/* ========================================================= */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                themeMode === 'dark' ? 'bg-[#0E1322] border-white/[0.08]' : 'bg-slate-50 border-slate-200'
              }`}>
                {/* Size manual input */}
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                    themeMode === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Size (Manual Type) *
                  </label>
                  <input
                    type="text"
                    value={clothForm.sizes}
                    onChange={(e) => setClothForm({ ...clothForm, sizes: e.target.value })}
                    placeholder="e.g. XL, L or S, M or 10 or 7, 8, 9, 10"
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#E5B869] ${
                      themeMode === 'dark'
                        ? 'bg-[#141A2D] border border-white/[0.1] text-white placeholder:text-slate-500'
                        : 'bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                  <p className={`text-[10px] mt-1 ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Type sizes separated by comma (e.g. <strong className="text-[#E5B869]">XL, L</strong> or <strong className="text-[#E5B869]">S, M</strong> for clothes, or shoe size <strong className="text-[#E5B869]">10</strong>).
                  </p>
                </div>

                {/* Branch Selection & Quantity Control */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                      themeMode === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Branch Allocation
                    </label>

                    {currentUser?.role === 'superadmin' ? (
                      // Superadmin (Global): Can choose any branch or All Branches and change its quantity
                      <select
                        value={clothForm.targetBranch}
                        onChange={(e) => {
                          const newBranch = e.target.value;
                          const newQty =
                            newBranch === 'all'
                              ? clothForm.initialStock
                              : (clothForm.branchStock[newBranch] ?? clothForm.initialStock);
                          setClothForm({
                            ...clothForm,
                            targetBranch: newBranch,
                            initialStock: newQty,
                          });
                        }}
                        className={`w-full rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#E5B869] ${
                          themeMode === 'dark'
                            ? 'bg-[#141A2D] border border-white/[0.1] text-white'
                            : 'bg-white border border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="all">🌐 All Branches (Global Sync)</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            🏢 {b.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      // Specific Branch Manager: No option to choose another branch! Locked to their assigned branch.
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${
                        themeMode === 'dark'
                          ? 'bg-[#101422] border-amber-500/30 text-[#E5B869]'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}>
                        <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span className="truncate">
                          {branches.find((b) => b.id === currentUser?.branchId)?.name || 'Assigned Branch'}
                        </span>
                        <span className="text-[10px] opacity-75 font-mono ml-auto">(Assigned)</span>
                      </div>
                    )}
                    <p className={`text-[10px] mt-1 ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      {currentUser?.role === 'superadmin'
                        ? 'Select branch to configure stock individually or sync globally.'
                        : 'Your account is locked to your branch. Other branches cannot be modified.'}
                    </p>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                      themeMode === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Product Quantity (Stock)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={clothForm.initialStock}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setClothForm((prev) => {
                          const updated = { ...prev, initialStock: val };
                          if (prev.targetBranch !== 'all') {
                            updated.branchStock = {
                              ...prev.branchStock,
                              [prev.targetBranch]: val,
                            };
                          }
                          return updated;
                        });
                      }}
                      placeholder="10"
                      className={`w-full rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#E5B869] ${
                        themeMode === 'dark'
                          ? 'bg-[#141A2D] border border-white/[0.1] text-white'
                          : 'bg-white border border-slate-300 text-slate-900'
                      }`}
                    />
                    <p className={`text-[10px] mt-1 ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      {clothForm.targetBranch === 'all'
                        ? 'Units per size across all branches'
                        : `Units per size at ${branches.find(b => b.id === clothForm.targetBranch)?.name || 'selected branch'}`}
                    </p>
                  </div>
                </div>

                {/* Instant visual confirmation of typed sizes */}
                {clothForm.sizes.trim() && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-white/[0.06]">
                    <span className={`text-[9px] uppercase tracking-wider font-mono font-semibold ${
                      themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Recognized Sizes:
                    </span>
                    {clothForm.sizes
                      .split(/[,/]+/)
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((sz) => (
                        <span
                          key={sz}
                          className="px-2.5 py-0.5 rounded-lg bg-[#E5B869]/15 border border-[#E5B869]/40 text-[#E5B869] text-xs font-mono font-bold shadow-sm"
                        >
                          {sz}
                        </span>
                      ))}
                  </div>
                )}
              </div>

              {/* ========================================================= */}
              {/* VARIABLE PRICING BY SIZE (DIFFERENT PRICES FOR DIFFERENT SIZES) */}
              {/* ========================================================= */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                themeMode === 'dark' ? 'bg-[#0E1322] border-white/[0.08]' : 'bg-amber-50/50 border-amber-200/80'
              }`}>
                <label className="flex items-start sm:items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={clothForm.hasVariablePricing}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const rawSizes = (clothForm.sizes || '')
                        .split(/[,/]+/)
                        .map((s) => s.trim())
                        .filter(Boolean);
                      const curSizes = rawSizes.length > 0 ? Array.from(new Set(rawSizes)) : ['Free Size'];
                      const updatedPrices = { ...clothForm.sizePrices };
                      curSizes.forEach((sz) => {
                        if (!updatedPrices[sz]) {
                          updatedPrices[sz] = {
                            sellingPrice: clothForm.sellingPrice || 1499,
                            costPrice: clothForm.costPrice || 600,
                          };
                        }
                      });
                      setClothForm((prev) => ({
                        ...prev,
                        hasVariablePricing: checked,
                        sizePrices: updatedPrices,
                      }));
                    }}
                    className="w-4 h-4 rounded mt-0.5 sm:mt-0 text-[#E5B869] focus:ring-[#E5B869] accent-[#E5B869] cursor-pointer"
                  />
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wider block ${
                      themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      Enable Size-Specific Pricing (Variable Pricing by Size)
                    </span>
                    <span className={`text-[10px] ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      Configure different selling and cost prices for specific sizes (e.g. larger sizes or footwear numbers).
                    </span>
                  </div>
                </label>

                {clothForm.hasVariablePricing && (
                  <div className="pt-3 border-t border-white/[0.06] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        themeMode === 'dark' ? 'text-[#E5B869]' : 'text-amber-800'
                      }`}>
                        Size-Wise Selling & Cost Price Matrix
                      </span>
                      <span className={`text-[10px] font-mono ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        Default Base: ₹{clothForm.sellingPrice} (Cost: ₹{clothForm.costPrice})
                      </span>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {(clothForm.sizes.split(/[,/]+/).map((s) => s.trim()).filter(Boolean).length > 0
                        ? Array.from(new Set(clothForm.sizes.split(/[,/]+/).map((s) => s.trim()).filter(Boolean)))
                        : ['Free Size']
                      ).map((sz) => {
                        const szPrice = clothForm.sizePrices[sz] || {
                          sellingPrice: clothForm.sellingPrice || 1499,
                          costPrice: clothForm.costPrice || 600,
                        };
                        const diff = szPrice.sellingPrice - (clothForm.sellingPrice || 0);

                        return (
                          <div
                            key={sz}
                            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              themeMode === 'dark' ? 'bg-[#141A2D] border-white/[0.08]' : 'bg-white border-slate-200 shadow-sm'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-lg bg-[#E5B869]/15 text-[#E5B869] border border-[#E5B869]/30 flex items-center justify-center font-mono font-bold text-xs">
                                {sz}
                              </span>
                              <div>
                                <span className={`text-xs font-bold ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                  Size {sz}
                                </span>
                                {diff !== 0 && (
                                  <span className={`text-[10px] font-mono ml-2 font-bold ${
                                    diff > 0 ? 'text-amber-400' : 'text-blue-400'
                                  }`}>
                                    ({diff > 0 ? `+₹${diff}` : `-₹${Math.abs(diff)}`} vs base)
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 justify-end">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-slate-400">Sell (₹):</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={szPrice.sellingPrice}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setClothForm((prev) => ({
                                      ...prev,
                                      sizePrices: {
                                        ...prev.sizePrices,
                                        [sz]: {
                                          ...(prev.sizePrices[sz] || { costPrice: prev.costPrice }),
                                          sellingPrice: val,
                                        },
                                      },
                                    }));
                                  }}
                                  className={`w-24 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-[#E5B869] ${
                                    themeMode === 'dark' ? 'bg-[#0E1322] border border-white/[0.1] text-white' : 'bg-slate-50 border border-slate-300 text-slate-900'
                                  }`}
                                />
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-emerald-500">Cost (₹):</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={szPrice.costPrice}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setClothForm((prev) => ({
                                      ...prev,
                                      sizePrices: {
                                        ...prev.sizePrices,
                                        [sz]: {
                                          ...(prev.sizePrices[sz] || { sellingPrice: prev.sellingPrice }),
                                          costPrice: val,
                                        },
                                      },
                                    }));
                                  }}
                                  className={`w-24 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-[#E5B869] ${
                                    themeMode === 'dark' ? 'bg-[#0E1322] border border-white/[0.1] text-white' : 'bg-slate-50 border border-slate-300 text-slate-900'
                                  }`}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ========================================================= */}
              {/* FABRIC & CRAFTSMANSHIP DETAILS */}
              {/* ========================================================= */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                    themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Fabric & Composition (Optional)
                  </label>
                  <input
                    type="text"
                    value={clothForm.fabric || ''}
                    onChange={(e) => setClothForm({ ...clothForm, fabric: e.target.value })}
                    placeholder="e.g. 100% Egyptian Giza Cotton, 260 GSM"
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#E5B869] ${
                      themeMode === 'dark' ? 'bg-[#0E1322] border border-white/[0.1] text-white' : 'bg-white border border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                    themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Care Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={clothForm.care || ''}
                    onChange={(e) => setClothForm({ ...clothForm, care: e.target.value })}
                    placeholder="e.g. Machine wash cold, flat dry in shade"
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#E5B869] ${
                      themeMode === 'dark' ? 'bg-[#0E1322] border border-white/[0.1] text-white' : 'bg-white border border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* ========================================================= */}
              {/* GARMENT DESCRIPTION */}
              {/* ========================================================= */}
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                  themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Garment Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={clothForm.description || ''}
                  onChange={(e) => setClothForm({ ...clothForm, description: e.target.value })}
                  placeholder="Describe cut, silhouette, fit, and craftsmanship detailing..."
                  className={`w-full rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#E5B869] ${
                    themeMode === 'dark' ? 'bg-[#0E1322] border border-white/[0.1] text-white' : 'bg-white border border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* ========================================================= */}
              {/* GARMENT MEASUREMENTS & SIZING CHART (INCHES) (TOGGLE & MANUAL INPUT) */}
              {/* ========================================================= */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                themeMode === 'dark' ? 'bg-[#0E1322] border-white/[0.08]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-[#E5B869]/15 text-[#E5B869]">
                      <Ruler className="w-4 h-4" />
                    </div>
                    <div>
                      <span className={`text-xs font-bold uppercase tracking-wider block ${
                        themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>
                        Garment Measurements & Sizing Chart (Inches)
                      </span>
                      <span className={`text-[10px] ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        Turn ON to manually specify chest, length, shoulder, and sleeve measurements. (Never auto-calculated)
                      </span>
                    </div>
                  </div>

                  {/* Clean Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={clothForm.hasSizeChart}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        let initialRows = [...clothForm.sizeChartMeasurements];
                        if (checked && initialRows.length === 0) {
                          const parsed = (clothForm.sizes || '')
                            .split(/[,/]+/)
                            .map((s) => s.trim())
                            .filter(Boolean);
                          const distinct = parsed.length > 0 ? Array.from(new Set(parsed)) : ['S', 'M', 'L', 'XL'];
                          initialRows = distinct.map((sz) => ({
                            size: sz,
                            chest: '',
                            length: '',
                            shoulder: '',
                            sleeve: '',
                            waist: '',
                          }));
                        }
                        setClothForm((prev) => ({
                          ...prev,
                          hasSizeChart: checked,
                          sizeChartMeasurements: initialRows,
                        }));
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E5B869]"></div>
                  </label>
                </div>

                {clothForm.hasSizeChart && (
                  <div className="pt-3 border-t border-white/[0.06] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] text-amber-500 font-medium">
                        Admin must manually specify chest, length, shoulder, and sleeve measurements below. Nothing is auto-calculated.
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const parsed = (clothForm.sizes || '')
                              .split(/[,/]+/)
                              .map((s) => s.trim())
                              .filter(Boolean);
                            const distinct = parsed.length > 0 ? Array.from(new Set(parsed)) : ['S', 'M', 'L', 'XL'];
                            const newRows = distinct.map((sz) => {
                              const existing = clothForm.sizeChartMeasurements.find((r) => r.size.toLowerCase() === sz.toLowerCase());
                              return existing || { size: sz, chest: '', length: '', shoulder: '', sleeve: '', waist: '' };
                            });
                            setClothForm((prev) => ({
                              ...prev,
                              sizeChartMeasurements: newRows,
                            }));
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 transition-colors"
                        >
                          Sync Rows with Sizes
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setClothForm((prev) => ({
                              ...prev,
                              sizeChartMeasurements: [
                                ...prev.sizeChartMeasurements,
                                { size: '', chest: '', length: '', shoulder: '', sleeve: '', waist: '' },
                              ],
                            }));
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-[#E5B869]/20 text-[#E5B869] hover:bg-[#E5B869]/30 transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Row
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
                      <table className="w-full text-left text-xs">
                        <thead className={`text-[10px] uppercase font-bold tracking-wider ${
                          themeMode === 'dark' ? 'bg-[#141A2D] text-slate-300' : 'bg-slate-200 text-slate-700'
                        }`}>
                          <tr>
                            <th className="py-2.5 px-3 min-w-[100px]">Size Label</th>
                            <th className="py-2.5 px-3 min-w-[90px]">Chest (in)</th>
                            <th className="py-2.5 px-3 min-w-[90px]">Length (in)</th>
                            <th className="py-2.5 px-3 min-w-[90px]">Shoulder (in)</th>
                            <th className="py-2.5 px-3 min-w-[90px]">Sleeve (in)</th>
                            <th className="py-2.5 px-3 min-w-[90px]">Waist (in)</th>
                            <th className="py-2.5 px-2 text-center w-10">Del</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${
                          themeMode === 'dark' ? 'divide-white/[0.05] bg-[#0E1322]' : 'divide-slate-200 bg-white'
                        }`}>
                          {clothForm.sizeChartMeasurements.map((row, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.02]">
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.size}
                                  placeholder="e.g. S (38)"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setClothForm((prev) => {
                                      const next = [...prev.sizeChartMeasurements];
                                      next[idx] = { ...next[idx], size: val };
                                      return { ...prev, sizeChartMeasurements: next };
                                    });
                                  }}
                                  className={`w-full px-2 py-1 rounded text-xs font-mono font-bold focus:outline-none focus:border-[#E5B869] ${
                                    themeMode === 'dark' ? 'bg-[#141A2D] border border-white/[0.1] text-white' : 'bg-slate-50 border border-slate-300 text-slate-900'
                                  }`}
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.chest || ''}
                                  placeholder="e.g. 38.5&quot;"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setClothForm((prev) => {
                                      const next = [...prev.sizeChartMeasurements];
                                      next[idx] = { ...next[idx], chest: val };
                                      return { ...prev, sizeChartMeasurements: next };
                                    });
                                  }}
                                  className={`w-full px-2 py-1 rounded text-xs font-mono focus:outline-none focus:border-[#E5B869] ${
                                    themeMode === 'dark' ? 'bg-[#141A2D] border border-white/[0.1] text-white' : 'bg-slate-50 border border-slate-300 text-slate-900'
                                  }`}
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.length || ''}
                                  placeholder="e.g. 29.0&quot;"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setClothForm((prev) => {
                                      const next = [...prev.sizeChartMeasurements];
                                      next[idx] = { ...next[idx], length: val };
                                      return { ...prev, sizeChartMeasurements: next };
                                    });
                                  }}
                                  className={`w-full px-2 py-1 rounded text-xs font-mono focus:outline-none focus:border-[#E5B869] ${
                                    themeMode === 'dark' ? 'bg-[#141A2D] border border-white/[0.1] text-white' : 'bg-slate-50 border border-slate-300 text-slate-900'
                                  }`}
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.shoulder || ''}
                                  placeholder="e.g. 17.5&quot;"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setClothForm((prev) => {
                                      const next = [...prev.sizeChartMeasurements];
                                      next[idx] = { ...next[idx], shoulder: val };
                                      return { ...prev, sizeChartMeasurements: next };
                                    });
                                  }}
                                  className={`w-full px-2 py-1 rounded text-xs font-mono focus:outline-none focus:border-[#E5B869] ${
                                    themeMode === 'dark' ? 'bg-[#141A2D] border border-white/[0.1] text-white' : 'bg-slate-50 border border-slate-300 text-slate-900'
                                  }`}
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.sleeve || ''}
                                  placeholder="e.g. 24.5&quot;"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setClothForm((prev) => {
                                      const next = [...prev.sizeChartMeasurements];
                                      next[idx] = { ...next[idx], sleeve: val };
                                      return { ...prev, sizeChartMeasurements: next };
                                    });
                                  }}
                                  className={`w-full px-2 py-1 rounded text-xs font-mono focus:outline-none focus:border-[#E5B869] ${
                                    themeMode === 'dark' ? 'bg-[#141A2D] border border-white/[0.1] text-white' : 'bg-slate-50 border border-slate-300 text-slate-900'
                                  }`}
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.waist || ''}
                                  placeholder="Optional"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setClothForm((prev) => {
                                      const next = [...prev.sizeChartMeasurements];
                                      next[idx] = { ...next[idx], waist: val };
                                      return { ...prev, sizeChartMeasurements: next };
                                    });
                                  }}
                                  className={`w-full px-2 py-1 rounded text-xs font-mono focus:outline-none focus:border-[#E5B869] ${
                                    themeMode === 'dark' ? 'bg-[#141A2D] border border-white/[0.1] text-white' : 'bg-slate-50 border border-slate-300 text-slate-900'
                                  }`}
                                />
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  title="Delete Row"
                                  onClick={() => {
                                    setClothForm((prev) => ({
                                      ...prev,
                                      sizeChartMeasurements: prev.sizeChartMeasurements.filter((_, i) => i !== idx),
                                    }));
                                  }}
                                  className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* ========================================================= */}
              {/* GARMENT PHOTOGRAPHY (DIRECT UPLOAD & EDIT) */}
              {/* ========================================================= */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={`block text-[10px] font-bold uppercase tracking-wider ${
                    themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Garment Photography (Upload or Paste URL)
                  </label>
                  {clothForm.image && (
                    <button
                      type="button"
                      onClick={() => setClothForm((prev) => ({ ...prev, image: '' }))}
                      className="text-[11px] text-red-500 hover:text-red-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3 h-3" /> Clear Image
                    </button>
                  )}
                </div>

                {/* Upload & Preview Card */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  themeMode === 'dark' ? 'bg-[#0E1322] border-white/[0.1]' : 'bg-slate-50 border-slate-200'
                }`}>
                  {clothForm.image ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-[#E5B869]/50 shrink-0 bg-neutral-900 shadow-md">
                          <img
                            src={clothForm.image}
                            alt="Garment Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Photo Attached
                            </span>
                          </div>
                          <p className={`text-[10px] truncate mt-0.5 font-mono ${
                            themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {clothForm.image}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons: Replace via upload or edit URL */}
                      <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
                        <label className={`cursor-pointer px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                          themeMode === 'dark'
                            ? 'bg-[#141A2D] hover:bg-[#1c243e] text-[#E5B869] border-[#E5B869]/40'
                            : 'bg-white hover:bg-slate-100 text-amber-900 border-amber-300 shadow-sm'
                        }`}>
                          {clothImageUploading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ImagePlus className="w-3.5 h-3.5" />
                          )}
                          <span>{clothImageUploading ? 'Uploading...' : 'Replace with New Photo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleClothImageUpload(f);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className={`cursor-pointer border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center transition-all ${
                      themeMode === 'dark'
                        ? 'border-white/[0.15] hover:border-[#E5B869]/70 bg-[#141A2D]/50'
                        : 'border-slate-300 hover:border-[#E5B869]/70 bg-white'
                    }`}>
                      {clothImageUploading ? (
                        <RefreshCw className="w-8 h-8 text-[#E5B869] animate-spin mb-2" />
                      ) : (
                        <ImagePlus className="w-8 h-8 text-[#E5B869] mb-2" />
                      )}
                      <span className={`text-xs font-bold ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {clothImageUploading ? 'Uploading apparel photo to S3...' : 'Upload Garment Photo from Device'}
                      </span>
                      <span className={`text-[10px] mt-0.5 ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        JPG, PNG, WEBP up to 10MB (Automatically hosted on AWS S3)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleClothImageUpload(f);
                        }}
                      />
                    </label>
                  )}

                  {/* Direct Image URL input for flexible URL pasting or editing */}
                  <div className="mt-3 pt-3 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Or Paste Direct Image Link (URL)
                      </span>
                    </div>
                    <input
                      type="url"
                      value={clothForm.image}
                      onChange={(e) => setClothForm({ ...clothForm, image: e.target.value })}
                      placeholder="https://images.unsplash.com/... or https://..."
                      className={`w-full rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-[#E5B869] ${
                        themeMode === 'dark'
                          ? 'bg-[#141A2D] border border-white/[0.1] text-white placeholder:text-slate-500'
                          : 'bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddClothOpen(false)}
                  className="glass-btn px-4 py-2.5 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gold-btn px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Save Apparel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
