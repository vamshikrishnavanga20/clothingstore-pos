import fs from 'fs';
import path from 'path';
import {
  Branch,
  Category,
  Product,
  Order,
  OrderItem,
  BranchId,
  AnalyticsSummary,
  AnalyticsReportRange,
  SalesDayTrend,
  TopSellingItem,
  ItemSalesPerformance,
  getProductPriceForSize,
  PaymentMethod,
  CustomerProfile,
  CustomerTier,
  InvoiceNotification,
} from './types';

interface StoreDatabase {
  branches: Branch[];
  categories: Category[];
  products: Product[];
  orders: Order[];
  customers?: CustomerProfile[];
}

function resolveDatabasePath(): string {
  // If running in Vercel or AWS Lambda, the root deployment directory is read-only.
  // /tmp is the only writable directory in serverless runtime.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpPath = path.join('/tmp', 'store_data.json');
    if (!fs.existsSync(tmpPath)) {
      const defaultPath = path.join(process.cwd(), 'data', 'store_data.json');
      try {
        if (fs.existsSync(defaultPath)) {
          fs.copyFileSync(defaultPath, tmpPath);
        }
      } catch (e) {
        console.warn('Could not initialize /tmp/store_data.json from default bundle:', e);
      }
    }
    return tmpPath;
  }
  return path.join(process.cwd(), 'data', 'store_data.json');
}

const DB_PATH = resolveDatabasePath();

const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'branch-1',
    name: 'Branch 1 - Downtown Flagship',
    code: 'B1',
    location: 'Road No. 36, Jubilee Hills, Hyderabad',
    phone: '+91 98765 43210',
    status: 'Active',
  },
  {
    id: 'branch-2',
    name: 'Branch 2 - Uptown Galleria',
    code: 'B2',
    location: 'Inorbit Mall Ground Floor, Hitech City',
    phone: '+91 98765 43211',
    status: 'Active',
  },
];

const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Checks',
    slug: 'checks',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?q=80&w=400&auto=format&fit=crop',
    description: 'Timeless plaid and check patterns tailored for all occasions.',
  },
  {
    id: 'cat-2',
    name: 'Streetwear',
    slug: 'streetwear',
    image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=400&auto=format&fit=crop',
    description: 'Modern urban aesthetics, oversized cuts, and utility silhouettes.',
  },
  {
    id: 'cat-3',
    name: 'Sneakers',
    slug: 'sneakers',
    image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=400&auto=format&fit=crop',
    description: 'Curated hype and daily lifestyle footwear collections.',
  },
  {
    id: 'cat-4',
    name: 'Essentials',
    slug: 'essentials',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400&auto=format&fit=crop',
    description: 'Heavyweight organic cotton tees, sweatpants, and daily staples.',
  },
  {
    id: 'cat-5',
    name: 'Formals',
    slug: 'formals',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=400&auto=format&fit=crop',
    description: 'Impeccable linen shirts, trousers, and blazers.',
  },
  {
    id: 'cat-6',
    name: 'Ethnic',
    slug: 'ethnic',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=400&auto=format&fit=crop',
    description: 'Artisanal kurtas and occasion-wear crafted with premium silk blends.',
  },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Heritage Flannel Shirt',
    sku: 'CHK-01-FLN',
    category: 'Checks',
    description: 'Double-brushed pure cotton heavy flannel shirt with horn buttons.',
    costPrice: 650,
    sellingPrice: 1499,
    tag: 'Bestseller',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?q=80&w=800&auto=format&fit=crop',
    inventory: {
      'branch-1': { S: 14, M: 22, L: 18, XL: 10, XXL: 5 },
      'branch-2': { S: 8, M: 15, L: 12, XL: 6, XXL: 4 },
    },
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    name: 'Oversized Cargo Denim',
    sku: 'STR-02-DNM',
    category: 'Streetwear',
    description: '14oz Japanese twill washed cargo jeans with 6 deep utility pockets.',
    costPrice: 950,
    sellingPrice: 2199,
    tag: 'New',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=800&auto=format&fit=crop',
    inventory: {
      'branch-1': { S: 10, M: 18, L: 16, XL: 8, XXL: 3 },
      'branch-2': { S: 12, M: 14, L: 15, XL: 9, XXL: 2 },
    },
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    name: 'Retro High-Top Jordans',
    sku: 'SNK-03-RET',
    category: 'Sneakers',
    description: 'Full-grain tumbled leather high-top sneaker with cushioned air unit.',
    costPrice: 5200,
    sellingPrice: 9500,
    tag: 'Limited',
    image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=800&auto=format&fit=crop',
    sizes: ['7', '8', '9', '10', '11'],
    inventory: {
      'branch-1': { '7': 4, '8': 6, '9': 8, '10': 5, '11': 2 },
      'branch-2': { '7': 3, '8': 5, '9': 6, '10': 4, '11': 1 },
    },
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    name: 'Heavyweight Boxy Tee',
    sku: 'ESS-04-TEE',
    category: 'Essentials',
    description: '280 GSM heavyweight combed cotton tee with ribbed neck and drop shoulder.',
    costPrice: 350,
    sellingPrice: 899,
    tag: 'Bestseller',
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop',
    inventory: {
      'branch-1': { S: 25, M: 35, L: 30, XL: 20, XXL: 12 },
      'branch-2': { S: 20, M: 28, L: 25, XL: 15, XXL: 8 },
    },
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    name: 'Monochrome Shacket',
    sku: 'CHK-05-SHK',
    category: 'Checks',
    description: 'Heavyweight wool-blend outerwear shirt with chest pockets.',
    costPrice: 780,
    sellingPrice: 1799,
    tag: 'Trending',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=800&auto=format&fit=crop',
    inventory: {
      'branch-1': { S: 8, M: 12, L: 14, XL: 6, XXL: 2 },
      'branch-2': { S: 6, M: 10, L: 11, XL: 4, XXL: 1 },
    },
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-6',
    name: 'Utility Tech Vest',
    sku: 'STR-06-VST',
    category: 'Streetwear',
    description: 'Water-resistant ripstop nylon tactical vest with dual zipper and MOLLE loops.',
    costPrice: 550,
    sellingPrice: 1299,
    tag: '',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop',
    inventory: {
      'branch-1': { S: 12, M: 16, L: 14, XL: 8, XXL: 3 },
      'branch-2': { S: 9, M: 12, L: 10, XL: 5, XXL: 2 },
    },
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-7',
    name: 'French Linen Button-Down',
    sku: 'FRM-07-LIN',
    category: 'Formals',
    description: '100% Normandy certified linen regular fit formal shirt.',
    costPrice: 820,
    sellingPrice: 1899,
    tag: 'New',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop',
    inventory: {
      'branch-1': { S: 15, M: 20, L: 18, XL: 12, XXL: 5 },
      'branch-2': { S: 10, M: 18, L: 15, XL: 9, XXL: 4 },
    },
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-8',
    name: 'Royal Raw Silk Kurta',
    sku: 'ETH-08-KRT',
    category: 'Ethnic',
    description: 'Handwoven tussar silk kurta with subtle embroidery at collar and cuffs.',
    costPrice: 1450,
    sellingPrice: 3499,
    tag: 'Trending',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop',
    inventory: {
      'branch-1': { S: 6, M: 12, L: 10, XL: 8, XXL: 4 },
      'branch-2': { S: 8, M: 14, L: 12, XL: 7, XXL: 3 },
    },
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Helper to generate initial realistic orders
function generateSeedOrders(): Order[] {
  const sampleOrders: Order[] = [
    {
      id: 'ord-101',
      billingId: 'BILL-B1-2026-0001',
      branchId: 'branch-1',
      branchName: 'Branch 1 - Downtown Flagship',
      items: [
        {
          productId: 'prod-1',
          productName: 'Heritage Flannel Shirt',
          category: 'Checks',
          image: 'https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?q=80&w=800&auto=format&fit=crop',
          size: 'M',
          quantity: 2,
          unitCostPrice: 650,
          unitSellingPrice: 1499,
          subtotal: 2998,
          grossProfit: 2998 - 1300,
        },
        {
          productId: 'prod-4',
          productName: 'Heavyweight Boxy Tee',
          category: 'Essentials',
          image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop',
          size: 'L',
          quantity: 1,
          unitCostPrice: 350,
          unitSellingPrice: 899,
          subtotal: 899,
          grossProfit: 899 - 350,
        },
      ],
      subtotal: 3897,
      discount: 0,
      tax: 194.85,
      total: 4091.85,
      totalCost: 1650,
      grossProfit: 2247,
      paymentMethod: 'UPI',
      customerName: 'Kavita Reddy',
      customerPhone: '9848011223',
      source: 'web-pos',
      cashierName: 'Rahul (Downtown)',
      status: 'Completed',
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
    {
      id: 'ord-102',
      billingId: 'BILL-B2-2026-0002',
      branchId: 'branch-2',
      branchName: 'Branch 2 - Uptown Galleria',
      items: [
        {
          productId: 'prod-3',
          productName: 'Retro High-Top Jordans',
          category: 'Sneakers',
          image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=800&auto=format&fit=crop',
          size: 'L',
          quantity: 1,
          unitCostPrice: 5200,
          unitSellingPrice: 9500,
          subtotal: 9500,
          grossProfit: 4300,
        },
      ],
      subtotal: 9500,
      discount: 500,
      tax: 450,
      total: 9450,
      totalCost: 5200,
      grossProfit: 3800,
      paymentMethod: 'Card',
      customerName: 'Aditya Varma',
      customerPhone: '9877234123',
      source: 'mobile-expo',
      cashierName: 'Sneha (Uptown Expo)',
      status: 'Completed',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 'ord-103',
      billingId: 'BILL-B1-2026-0003',
      branchId: 'branch-1',
      branchName: 'Branch 1 - Downtown Flagship',
      items: [
        {
          productId: 'prod-2',
          productName: 'Oversized Cargo Denim',
          category: 'Streetwear',
          image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=800&auto=format&fit=crop',
          size: 'M',
          quantity: 1,
          unitCostPrice: 950,
          unitSellingPrice: 2199,
          subtotal: 2199,
          grossProfit: 1249,
        },
        {
          productId: 'prod-5',
          productName: 'Monochrome Shacket',
          category: 'Checks',
          image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=800&auto=format&fit=crop',
          size: 'L',
          quantity: 1,
          unitCostPrice: 780,
          unitSellingPrice: 1799,
          subtotal: 1799,
          grossProfit: 1019,
        },
      ],
      subtotal: 3998,
      discount: 200,
      tax: 189.9,
      total: 3987.9,
      totalCost: 1730,
      grossProfit: 2068,
      paymentMethod: 'UPI',
      customerName: 'Vikram Seth',
      customerPhone: '9123456780',
      source: 'web-pos',
      cashierName: 'Rahul (Downtown)',
      status: 'Completed',
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      id: 'ord-104',
      billingId: 'BILL-B2-2026-0004',
      branchId: 'branch-2',
      branchName: 'Branch 2 - Uptown Galleria',
      items: [
        {
          productId: 'prod-8',
          productName: 'Royal Raw Silk Kurta',
          category: 'Ethnic',
          image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop',
          size: 'XL',
          quantity: 1,
          unitCostPrice: 1450,
          unitSellingPrice: 3499,
          subtotal: 3499,
          grossProfit: 2049,
        },
      ],
      subtotal: 3499,
      discount: 0,
      tax: 174.95,
      total: 3673.95,
      totalCost: 1450,
      grossProfit: 2049,
      paymentMethod: 'Cash',
      customerName: 'Sanjay Kumar',
      customerPhone: '9988776655',
      source: 'mobile-expo',
      cashierName: 'Sneha (Uptown Expo)',
      status: 'Completed',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'ord-105',
      billingId: 'BILL-B1-2026-0005',
      branchId: 'branch-1',
      branchName: 'Branch 1 - Downtown Flagship',
      items: [
        {
          productId: 'prod-7',
          productName: 'French Linen Button-Down',
          category: 'Formals',
          image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop',
          size: 'M',
          quantity: 2,
          unitCostPrice: 820,
          unitSellingPrice: 1899,
          subtotal: 3798,
          grossProfit: 3798 - 1640,
        },
      ],
      subtotal: 3798,
      discount: 0,
      tax: 189.9,
      total: 3987.9,
      totalCost: 1640,
      grossProfit: 2158,
      paymentMethod: 'Card',
      customerName: 'Rohan Sharma',
      customerPhone: '9765432109',
      source: 'web-pos',
      cashierName: 'Rahul (Downtown)',
      status: 'Completed',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'ord-106',
      billingId: 'BILL-B2-2026-0006',
      branchId: 'branch-2',
      branchName: 'Branch 2 - Uptown Galleria',
      items: [
        {
          productId: 'prod-4',
          productName: 'Heavyweight Boxy Tee',
          category: 'Essentials',
          image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop',
          size: 'M',
          quantity: 3,
          unitCostPrice: 350,
          unitSellingPrice: 899,
          subtotal: 2697,
          grossProfit: 2697 - 1050,
        },
      ],
      subtotal: 2697,
      discount: 100,
      tax: 129.85,
      total: 2726.85,
      totalCost: 1050,
      grossProfit: 1547,
      paymentMethod: 'UPI',
      customerName: 'Ananya Rao',
      customerPhone: '9845123987',
      source: 'mobile-expo',
      cashierName: 'Pooja (Uptown Expo)',
      status: 'Completed',
      createdAt: new Date().toISOString(),
    },
  ];
  return sampleOrders;
}

function generateSeedCustomers(): CustomerProfile[] {
  return [
    {
      id: 'cust-1',
      phone: '9877234123',
      name: 'Aditya Varma',
      tier: 'Gold',
      loyaltyPoints: 450,
      totalSpend: 14500,
      ordersCount: 3,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      lastVisit: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 'cust-2',
      phone: '9845123987',
      name: 'Ananya Rao',
      tier: 'Black Elite',
      loyaltyPoints: 1250,
      totalSpend: 48200,
      ordersCount: 7,
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      lastVisit: new Date().toISOString(),
    },
    {
      id: 'cust-3',
      phone: '9876543210',
      name: 'Vikramaditya Singhania',
      tier: 'Black Elite',
      loyaltyPoints: 2400,
      totalSpend: 76000,
      ordersCount: 12,
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      lastVisit: new Date().toISOString(),
    },
  ];
}

// In-memory cache + file sync
let cachedDb: StoreDatabase | null = null;

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

export function getDatabase(): StoreDatabase {
  if (cachedDb) {
    if (!cachedDb.customers || cachedDb.customers.length === 0) {
      cachedDb.customers = generateSeedCustomers();
    }
    return cachedDb;
  }

  try {
    if (fs.existsSync(DB_PATH)) {
      const fileData = fs.readFileSync(DB_PATH, 'utf-8');
      cachedDb = JSON.parse(fileData);
      if (!cachedDb!.customers || cachedDb!.customers.length === 0) {
        cachedDb!.customers = generateSeedCustomers();
        saveDatabase(cachedDb!);
      }
      return cachedDb!;
    }
  } catch (error) {
    console.warn('Could not read existing store_data.json, seeding new data.', error);
  }

  const initialData: StoreDatabase = {
    branches: INITIAL_BRANCHES,
    categories: INITIAL_CATEGORIES,
    products: INITIAL_PRODUCTS,
    orders: generateSeedOrders(),
    customers: generateSeedCustomers(),
  };

  saveDatabase(initialData);
  cachedDb = initialData;
  return initialData;
}

export function saveDatabase(data: StoreDatabase): void {
  cachedDb = data;
  try {
    ensureDirectoryExistence(DB_PATH);
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write store_data.json to ' + DB_PATH, error);
    try {
      const fallbackTmp = path.join('/tmp', 'store_data.json');
      ensureDirectoryExistence(fallbackTmp);
      fs.writeFileSync(fallbackTmp, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e2) {
      console.warn('Failed to write to /tmp fallback:', e2);
    }
  }
}

// Products
export function getProducts(category?: string, search?: string): Product[] {
  const db = getDatabase();
  let result = (db.products || []).filter((p) => p && p.id && p.name);

  if (category && category !== 'All') {
    const targetCat = category.toLowerCase();
    result = result.filter(
      (p) => (p.category || '').toLowerCase() === targetCat
    );
  }

  if (search && search.trim() !== '') {
    const q = search.toLowerCase();
    result = result.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q)
    );
  }

  return result;
}

export function getProductById(id: string): Product | undefined {
  const db = getDatabase();
  return db.products.find((p) => p.id === id);
}

export function createProduct(newProd: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
  const db = getDatabase();
  const product: Product = {
    ...newProd,
    id: `prod-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.products.unshift(product);
  saveDatabase(db);
  return product;
}

export function updateProduct(id: string, updates: Partial<Product>): Product | null {
  const db = getDatabase();
  const index = db.products.findIndex((p) => p.id === id);
  if (index === -1) return null;

  db.products[index] = {
    ...db.products[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveDatabase(db);
  return db.products[index];
}

export function deleteProduct(id: string): boolean {
  const db = getDatabase();
  const initialLength = db.products.length;
  db.products = db.products.filter((p) => p.id !== id);
  if (db.products.length !== initialLength) {
    saveDatabase(db);
    return true;
  }
  return false;
}

// Categories
export function getCategories(): Category[] {
  const db = getDatabase();
  return (db.categories || []).map((c) => ({
    ...c,
    itemCount: (db.products || []).filter(
      (p) => p && (p.category || '').toLowerCase() === (c.name || '').toLowerCase()
    ).length,
  }));
}

export function createCategory(cat: Omit<Category, 'id'>): Category {
  const db = getDatabase();
  const newCat: Category = {
    ...cat,
    id: `cat-${Date.now()}`,
    slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'),
  };
  db.categories.push(newCat);
  saveDatabase(db);
  return newCat;
}

export function updateCategory(id: string, updates: Partial<Category>): Category | null {
  const db = getDatabase();
  const index = db.categories.findIndex((c) => c.id === id);
  if (index === -1) return null;

  db.categories[index] = { ...db.categories[index], ...updates };
  saveDatabase(db);
  return db.categories[index];
}

export function deleteCategory(id: string): boolean {
  const db = getDatabase();
  const cat = db.categories.find((c) => c.id === id);
  if (!cat) return false;

  db.categories = db.categories.filter((c) => c.id !== id);
  saveDatabase(db);
  return true;
}

// -----------------------------------------------------------------------------
// CUSTOMER LOYALTY & VIP TIERING ENGINE
// -----------------------------------------------------------------------------

export function calculateCustomerTier(totalSpend: number): CustomerTier {
  if (totalSpend >= 35000) return 'Black Elite';
  if (totalSpend >= 10000) return 'Gold';
  return 'Silver';
}

export function getEarnRateForTier(tier: CustomerTier): number {
  switch (tier) {
    case 'Black Elite':
      return 0.07; // 7% rewards
    case 'Gold':
      return 0.05; // 5% rewards
    case 'Silver':
    default:
      return 0.03; // 3% rewards
  }
}

export function getCustomerByPhone(phone: string): CustomerProfile | null {
  const cleanPhone = (phone || '').replace(/\D/g, '');
  if (!cleanPhone || cleanPhone.length !== 10) return null;
  const db = getDatabase();
  const customers = db.customers || [];
  return customers.find((c) => c.phone.replace(/\D/g, '') === cleanPhone) || null;
}

export function getOrCreateCustomer(phone: string, name?: string): CustomerProfile {
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const db = getDatabase();
  db.customers = db.customers || [];
  let customer = db.customers.find((c) => c.phone.replace(/\D/g, '') === cleanPhone);

  if (!customer) {
    customer = {
      id: `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      phone: cleanPhone,
      name: name && name.trim() ? name.trim() : 'Walk-in Guest',
      tier: 'Silver',
      loyaltyPoints: 0,
      totalSpend: 0,
      ordersCount: 0,
      createdAt: new Date().toISOString(),
      lastVisit: new Date().toISOString(),
    };
    db.customers.push(customer);
    saveDatabase(db);
  } else if (
    name &&
    name.trim() &&
    (customer.name === 'Walk-in Guest' ||
      customer.name === 'VIP Client' ||
      customer.name === 'Regular Store Guest')
  ) {
    customer.name = name.trim();
    saveDatabase(db);
  }

  return customer;
}

export function awardLoyaltyAndRecordSpend(
  phone: string,
  name: string,
  orderTotal: number,
  pointsRedeemed: number = 0
): { customer: CustomerProfile; pointsEarned: number } {
  const db = getDatabase();
  const customer = getOrCreateCustomer(phone, name);

  // 1. Deduct redeemed points
  if (pointsRedeemed > 0) {
    customer.loyaltyPoints = Math.max(0, customer.loyaltyPoints - pointsRedeemed);
  }

  // 2. Calculate tier earn rate and new points
  const earnRate = getEarnRateForTier(customer.tier);
  const pointsEarned = Math.round(orderTotal * earnRate);
  customer.loyaltyPoints += pointsEarned;

  // 3. Accumulate spend & orders count
  customer.totalSpend = Number((customer.totalSpend + orderTotal).toFixed(2));
  customer.ordersCount += 1;
  customer.lastVisit = new Date().toISOString();

  // 4. Update VIP tier based on new lifetime spend
  customer.tier = calculateCustomerTier(customer.totalSpend);

  if (name && name.trim() && customer.name === 'Walk-in Guest') {
    customer.name = name.trim();
  }

  saveDatabase(db);
  return { customer, pointsEarned };
}

export function getAllCustomers(): CustomerProfile[] {
  const db = getDatabase();
  return db.customers || [];
}

// Orders & In-Store Billing
export function getOrders(branchId?: BranchId): Order[] {
  const db = getDatabase();
  let orders = [...db.orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  if (branchId) {
    orders = orders.filter((o) => o.branchId === branchId);
  }
  return orders;
}

export function createOrder(data: {
  branchId: BranchId;
  items: Array<{
    productId: string;
    size: string;
    quantity: number;
  }>;
  discount?: number;
  paymentMethod: 'Cash' | 'UPI' | 'Card';
  customerName?: string;
  customerPhone?: string;
  pointsRedeemed?: number;
  cashierName?: string;
  source?: 'web-pos' | 'mobile-expo';
}): { order: Order; success: boolean; message?: string } {
  const db = getDatabase();
  const branch = db.branches.find((b) => b.id === data.branchId);
  if (!branch) {
    return { order: null as any, success: false, message: 'Invalid Branch ID' };
  }

  // Calculate items, prices, and verify/deduct branch stock
  let subtotal = 0;
  let totalCost = 0;
  const orderItems: OrderItem[] = [];

  for (const item of data.items) {
    const prod = db.products.find((p) => p.id === item.productId);
    if (!prod) {
      return {
        order: null as any,
        success: false,
        message: `Product ${item.productId} not found`,
      };
    }

    const currentStock = prod.inventory[data.branchId]?.[item.size] ?? 0;
    if (currentStock < item.quantity) {
      return {
        order: null as any,
        success: false,
        message: `Insufficient stock for ${prod.name} (Size ${item.size}) at ${branch.name}. Available: ${currentStock}`,
      };
    }

    const { sellingPrice: unitSelling, costPrice: unitCost } = getProductPriceForSize(prod, item.size);
    const itemSubtotal = unitSelling * item.quantity;
    const itemCost = unitCost * item.quantity;
    subtotal += itemSubtotal;
    totalCost += itemCost;

    orderItems.push({
      productId: prod.id,
      productName: prod.name,
      category: prod.category,
      image: prod.image,
      size: item.size,
      quantity: item.quantity,
      unitCostPrice: unitCost,
      unitSellingPrice: unitSelling,
      subtotal: itemSubtotal,
      grossProfit: itemSubtotal - itemCost,
    });

    // Deduct stock for this branch
    prod.inventory[data.branchId][item.size] -= item.quantity;
    prod.updatedAt = new Date().toISOString();
  }

  const baseDiscount = data.discount || 0;
  const pointsRedeemed = Math.max(0, Number(data.pointsRedeemed) || 0);
  const totalDiscount = baseDiscount + pointsRedeemed;
  const taxable = Math.max(0, subtotal - totalDiscount);
  const tax = Number((taxable * 0.05).toFixed(2)); // 5% GST
  const grandTotal = Number((taxable + tax).toFixed(2));
  const grossProfit = Number((subtotal - totalDiscount - totalCost).toFixed(2));

  // Generate Unique Billing ID: BILL-B1-YYYYMMDD-XXXX
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const branchCode = branch.code || (data.branchId === 'branch-1' ? 'B1' : data.branchId === 'branch-2' ? 'B2' : 'B3');
  const todayPrefix = `BILL-${branchCode}-${todayStr}-`;
  const existingTodayNums = db.orders
    .filter((o) => o.billingId && o.billingId.startsWith(todayPrefix))
    .map((o) => {
      const parts = o.billingId.split('-');
      const seqStr = parts[parts.length - 1];
      return parseInt(seqStr, 10);
    })
    .filter((n) => !isNaN(n));
  const nextSeq = existingTodayNums.length > 0 ? Math.max(...existingTodayNums) + 1 : db.orders.filter((o) => o.branchId === data.branchId).length + 1;
  const billingId = `${todayPrefix}${String(nextSeq).padStart(4, '0')}`;

  // Customer Loyalty Accrual & Tier Evaluation
  let pointsEarned = 0;
  let customerTier: CustomerTier | undefined = undefined;
  const rawPhone = (data.customerPhone || '').replace(/\D/g, '');

  if (rawPhone.length === 10) {
    const loyalty = awardLoyaltyAndRecordSpend(
      rawPhone,
      data.customerName || 'Walk-in Guest',
      grandTotal,
      pointsRedeemed
    );
    pointsEarned = loyalty.pointsEarned;
    customerTier = loyalty.customer.tier;
  }

  const order: Order = {
    id: `ord-${Date.now()}`,
    billingId,
    branchId: data.branchId,
    branchName: branch.name,
    items: orderItems,
    subtotal,
    discount: totalDiscount,
    tax,
    total: grandTotal,
    totalCost,
    grossProfit,
    paymentMethod: data.paymentMethod,
    customerName: data.customerName || 'Walk-in Guest',
    customerPhone: data.customerPhone || 'N/A',
    pointsEarned,
    pointsRedeemed,
    customerTier,
    source: data.source || 'web-pos',
    cashierName: data.cashierName || 'Staff Cashier',
    status: 'Completed',
    createdAt: new Date().toISOString(),
  };

  db.orders.unshift(order);
  saveDatabase(db);

  return { order, success: true };
}

export function getOrderByIdOrBillingId(query: string): Order | undefined {
  if (!query) return undefined;
  const q = query.trim().toLowerCase();
  const db = getDatabase();
  return db.orders.find(
    (o) => o.id.toLowerCase() === q || o.billingId.toLowerCase() === q
  );
}

export function addOrderNotification(
  orderIdOrBillingId: string,
  notification: InvoiceNotification
): Order | null {
  if (!orderIdOrBillingId) return null;
  const q = orderIdOrBillingId.trim().toLowerCase();
  const db = getDatabase();
  const order = db.orders.find(
    (o) => o.id.toLowerCase() === q || o.billingId.toLowerCase() === q
  );
  if (!order) return null;

  if (!order.notifications) {
    order.notifications = [];
  }
  order.notifications.push(notification);
  saveDatabase(db);
  return order;
}

/**
 * Return / Refund Order
 * - Restores item quantities back into the branch inventory matrix (prod.inventory[branchId][size] += qty)
 * - Sets order status to 'Refunded'
 * - Gross Revenue & Profit automatically deduct this refund because getAnalytics() calculates only o.status === 'Completed'
 */
export function returnOrder(
  orderIdOrBillingId: string,
  options?: {
    reason?: string;
    cashierName?: string;
    returnedItems?: Array<{ productId: string; size: string; quantity: number }>;
  }
): {
  order: Order | null;
  success: boolean;
  message?: string;
  restockedSummary?: Array<{ productName: string; size: string; quantity: number }>;
} {
  const db = getDatabase();
  const q = (orderIdOrBillingId || '').trim().toLowerCase();
  const orderIndex = db.orders.findIndex(
    (o) => o.id.toLowerCase() === q || o.billingId.toLowerCase() === q
  );

  if (orderIndex === -1) {
    return { order: null, success: false, message: 'Invoice / Order not found' };
  }

  const order = db.orders[orderIndex];

  if (order.status === 'Refunded') {
    return { order, success: false, message: 'Order is already marked as Refunded' };
  }

  const restockedSummary: Array<{ productName: string; size: string; quantity: number }> = [];

  // 1. Restock items back into branch inventory matrix
  if (options?.returnedItems && options.returnedItems.length > 0) {
    // Partial return
    for (const retItem of options.returnedItems) {
      const prod = db.products.find((p) => p.id === retItem.productId);
      if (prod) {
        if (!prod.inventory[order.branchId]) {
          prod.inventory[order.branchId] = {};
        }
        const prevStock = prod.inventory[order.branchId][retItem.size] || 0;
        prod.inventory[order.branchId][retItem.size] = prevStock + retItem.quantity;
        prod.updatedAt = new Date().toISOString();

        restockedSummary.push({
          productName: prod.name,
          size: retItem.size,
          quantity: retItem.quantity,
        });
      }
    }
  } else {
    // Full return of all order items
    for (const item of order.items) {
      const prod = db.products.find((p) => p.id === item.productId);
      if (prod) {
        if (!prod.inventory[order.branchId]) {
          prod.inventory[order.branchId] = {};
        }
        const prevStock = prod.inventory[order.branchId][item.size] || 0;
        prod.inventory[order.branchId][item.size] = prevStock + item.quantity;
        prod.updatedAt = new Date().toISOString();

        restockedSummary.push({
          productName: prod.name,
          size: item.size,
          quantity: item.quantity,
        });
      }
    }
  }

  // 2. Mark order status as Refunded and record metadata
  order.status = 'Refunded';
  order.refundedAt = new Date().toISOString();
  order.returnReason = options?.reason || 'Customer Return / Exchange';
  order.refundAmount = order.total;

  db.orders[orderIndex] = order;
  saveDatabase(db);

  return { order, success: true, restockedSummary };
}

/**
 * Edit / Update In-Store Invoice
 * - Updates customer info or payment tender
 * - Adjusts item quantities: restocks back to branch matrix if quantity decreased; deducts if increased
 * - Recalculates subtotal, 5% GST tax, total, and profit
 */
export function updateOrderInvoice(
  orderIdOrBillingId: string,
  updates: {
    customerName?: string;
    customerPhone?: string;
    paymentMethod?: PaymentMethod;
    discount?: number;
    notes?: string;
    items?: Array<{ productId: string; size: string; quantity: number }>;
  }
): {
  order: Order | null;
  success: boolean;
  message?: string;
} {
  const db = getDatabase();
  const q = (orderIdOrBillingId || '').trim().toLowerCase();
  const orderIndex = db.orders.findIndex(
    (o) => o.id.toLowerCase() === q || o.billingId.toLowerCase() === q
  );

  if (orderIndex === -1) {
    return { order: null, success: false, message: 'Invoice / Order not found' };
  }

  const order = db.orders[orderIndex];

  if (updates.customerName !== undefined) order.customerName = updates.customerName;
  if (updates.customerPhone !== undefined) order.customerPhone = updates.customerPhone;
  if (updates.paymentMethod !== undefined) order.paymentMethod = updates.paymentMethod;
  if (updates.notes !== undefined) order.notes = updates.notes;

  // Adjust item quantities if items are specified
  if (updates.items && Array.isArray(updates.items)) {
    let newSubtotal = 0;
    let newTotalCost = 0;
    const newOrderItems: OrderItem[] = [];

    for (const newItem of updates.items) {
      const prod = db.products.find((p) => p.id === newItem.productId);
      if (!prod) {
        return { order: null, success: false, message: `Product ${newItem.productId} not found` };
      }

      // Find original item in the order to calculate quantity delta
      const origItem = order.items.find(
        (i) => i.productId === newItem.productId && i.size === newItem.size
      );
      const oldQty = origItem ? origItem.quantity : 0;
      const delta = newItem.quantity - oldQty; // >0 means add more, <0 means return / reduce

      if (delta > 0) {
        // More stock needed: verify availability in branch
        const available = prod.inventory[order.branchId]?.[newItem.size] ?? 0;
        if (available < delta) {
          return {
            order: null,
            success: false,
            message: `Insufficient stock for ${prod.name} (${newItem.size}). Available to add: ${available}`,
          };
        }
        prod.inventory[order.branchId][newItem.size] -= delta;
      } else if (delta < 0) {
        // Returned / reduced quantity: restock difference into branch inventory matrix
        if (!prod.inventory[order.branchId]) {
          prod.inventory[order.branchId] = {};
        }
        prod.inventory[order.branchId][newItem.size] =
          (prod.inventory[order.branchId][newItem.size] || 0) + Math.abs(delta);
      }
      prod.updatedAt = new Date().toISOString();

      if (newItem.quantity > 0) {
        const { sellingPrice: unitSelling, costPrice: unitCost } = getProductPriceForSize(
          prod,
          newItem.size
        );
        const itemSubtotal = unitSelling * newItem.quantity;
        const itemCost = unitCost * newItem.quantity;
        newSubtotal += itemSubtotal;
        newTotalCost += itemCost;

        newOrderItems.push({
          productId: prod.id,
          productName: prod.name,
          category: prod.category,
          image: prod.image,
          size: newItem.size,
          quantity: newItem.quantity,
          unitCostPrice: unitCost,
          unitSellingPrice: unitSelling,
          subtotal: itemSubtotal,
          grossProfit: itemSubtotal - itemCost,
        });
      }
    }

    const discountAmount = updates.discount !== undefined ? updates.discount : order.discount;
    const taxable = Math.max(0, newSubtotal - discountAmount);
    const tax = Number((taxable * 0.05).toFixed(2));
    const grandTotal = Number((taxable + tax).toFixed(2));
    const grossProfit = Number((newSubtotal - discountAmount - newTotalCost).toFixed(2));

    order.items = newOrderItems;
    order.subtotal = newSubtotal;
    order.discount = discountAmount;
    order.tax = tax;
    order.total = grandTotal;
    order.totalCost = newTotalCost;
    order.grossProfit = grossProfit;

    if (newOrderItems.length === 0) {
      order.status = 'Refunded';
      order.refundedAt = new Date().toISOString();
      order.returnReason = 'All items returned / removed from invoice';
    }
  }

  db.orders[orderIndex] = order;
  saveDatabase(db);

  return { order, success: true };
}

// Inventory management
export function updateInventoryStock(
  productId: string,
  branchId: BranchId,
  size: string,
  quantity: number
): boolean {
  const db = getDatabase();
  const prod = db.products.find((p) => p.id === productId);
  if (!prod) return false;

  if (!prod.inventory[branchId]) {
    prod.inventory[branchId] = {};
  }

  prod.inventory[branchId][size] = Math.max(0, quantity);
  if (prod.sizes && !prod.sizes.includes(size)) {
    prod.sizes.push(size);
  }
  prod.updatedAt = new Date().toISOString();
  saveDatabase(db);
  return true;
}

// Dynamic Branches CRUD
export function getBranches(): Branch[] {
  const db = getDatabase();
  return db.branches || [];
}

export function getBranchById(id: string): Branch | undefined {
  const db = getDatabase();
  return db.branches.find((b) => b.id === id);
}

export function createBranch(data: {
  name: string;
  code?: string;
  city?: string;
  location: string;
  phone: string;
  managerName?: string;
}): Branch {
  const db = getDatabase();
  const branchId = `branch-${Date.now().toString().slice(-4)}`;
  const code = data.code || `B${db.branches.length + 1}`;

  const newBranch: Branch = {
    id: branchId,
    name: data.name,
    code,
    city: data.city || 'Hyderabad',
    location: data.location,
    phone: data.phone,
    managerName: data.managerName || 'Assigned Manager',
    status: 'Active',
  };

  db.branches.push(newBranch);

  // Auto-provision inventory slots for this new branch across all existing products
  db.products.forEach((prod) => {
    if (!prod.inventory[branchId]) {
      prod.inventory[branchId] = { S: 5, M: 8, L: 8, XL: 5, XXL: 2 };
    }
  });

  saveDatabase(db);
  return newBranch;
}

export function updateBranch(id: string, updates: Partial<Branch>): Branch | null {
  const db = getDatabase();
  const idx = db.branches.findIndex((b) => b.id === id);
  if (idx === -1) return null;

  db.branches[idx] = { ...db.branches[idx], ...updates };

  // If name changed, update past orders' branchName for consistency
  if (updates.name) {
    db.orders.forEach((o) => {
      if (o.branchId === id) {
        o.branchName = updates.name!;
      }
    });
  }

  saveDatabase(db);
  return db.branches[idx];
}

export function deleteBranch(id: string): boolean {
  const db = getDatabase();
  if (db.branches.length <= 1) return false; // Preserve at least one primary branch
  const initial = db.branches.length;
  db.branches = db.branches.filter((b) => b.id !== id);
  if (db.branches.length !== initial) {
    saveDatabase(db);
    return true;
  }
  return false;
}

// Deep Analytics Engine (Revenue, Gross Profit, Custom Bar Charts, Top Sellers, Multi-Range & Custom Date)
export function getAnalytics(
  branchId?: BranchId,
  range: AnalyticsReportRange = '7d',
  startDateStr?: string,
  endDateStr?: string,
  customOrders?: Order[]
): AnalyticsSummary {
  const db = getDatabase();
  const sourceOrders = customOrders && Array.isArray(customOrders) && customOrders.length > 0 ? customOrders : db.orders;
  let orders = sourceOrders.filter((o) => o.status === 'Completed');

  if (branchId && branchId !== 'all') {
    orders = orders.filter((o) => o.branchId === branchId);
  }

  // Determine target dates and filter window
  const targetDates: { key: string; label: string }[] = [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (range === 'today') {
    const now = new Date();
    const todayUtc = now.toISOString().slice(0, 10);
    const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    // Filter completed orders created today (checks both local and UTC date strings)
    orders = orders.filter((o) => {
      const oDate = o.createdAt.slice(0, 10);
      return oDate === todayUtc || oDate === todayLocal;
    });

    targetDates.push({ key: todayLocal, label: 'Today' });
  } else if (range === 'custom' && startDateStr) {
    const start = new Date(startDateStr);
    const end = endDateStr ? new Date(endDateStr) : new Date(startDateStr);
    
    // Normalize to midnight UTC/local
    const diffMs = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.max(1, Math.min(60, Math.round(diffMs / (1000 * 3600 * 24)) + 1));
    
    const baseDate = start <= end ? start : end;
    for (let i = 0; i < diffDays; i++) {
      const cur = new Date(baseDate);
      cur.setDate(baseDate.getDate() + i);
      const key = cur.toISOString().slice(0, 10);
      const label = `${days[cur.getDay()]} (${cur.getDate()}/${cur.getMonth() + 1})`;
      targetDates.push({ key, label });
    }

    const minKey = targetDates[0].key;
    const maxKey = targetDates[targetDates.length - 1].key;
    orders = orders.filter((o) => {
      const oKey = o.createdAt.slice(0, 10);
      return oKey >= minKey && oKey <= maxKey;
    });
  } else if (range === '30d') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      targetDates.push({ key, label });
    }
    const minKey = targetDates[0].key;
    orders = orders.filter((o) => o.createdAt.slice(0, 10) >= minKey);
  } else {
    // Default 7 days
    range = '7d';
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = `${days[d.getDay()]} (${d.getDate()}/${d.getMonth() + 1})`;
      targetDates.push({ key, label });
    }
    const minKey = targetDates[0].key;
    orders = orders.filter((o) => o.createdAt.slice(0, 10) >= minKey);
  }

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalCost = orders.reduce((sum, o) => sum + o.totalCost, 0);
  const grossProfit = orders.reduce((sum, o) => sum + o.grossProfit, 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Dynamic branch summaries for the filtered orders
  const branchSummaries = db.branches.map((b) => {
    const bOrders = orders.filter((o) => o.branchId === b.id);
    return {
      branchId: b.id,
      branchName: b.name,
      revenue: Number(bOrders.reduce((acc, o) => acc + o.total, 0).toFixed(2)),
      orders: bOrders.length,
      grossProfit: Number(bOrders.reduce((acc, o) => acc + o.grossProfit, 0).toFixed(2)),
    };
  });

  // Intra-day or Daily Trends for Trajectory Visualizer
  let trends: SalesDayTrend[] = [];
  if (range === 'today') {
    // 2-hour interval time slots across active store hours
    const slots = [
      { startH: 8, endH: 10, label: '08:00' },
      { startH: 10, endH: 12, label: '10:00' },
      { startH: 12, endH: 14, label: '12:00' },
      { startH: 14, endH: 16, label: '14:00' },
      { startH: 16, endH: 18, label: '16:00' },
      { startH: 18, endH: 20, label: '18:00' },
      { startH: 20, endH: 22, label: '20:00' },
      { startH: 22, endH: 24, label: '22:00' },
    ];

    trends = slots.map((slot) => {
      const slotOrders = orders.filter((o) => {
        const orderDate = new Date(o.createdAt);
        const h = orderDate.getHours();
        return h >= slot.startH && h < slot.endH;
      });

      const branchBreakdown: Record<string, number> = {};
      db.branches.forEach((b) => {
        const bOrders = slotOrders.filter((o) => o.branchId === b.id);
        branchBreakdown[b.id] = Number(bOrders.reduce((acc, o) => acc + o.total, 0).toFixed(2));
      });

      const rev = slotOrders.reduce((acc, o) => acc + o.total, 0);
      const cost = slotOrders.reduce((acc, o) => acc + o.totalCost, 0);
      const gp = slotOrders.reduce((acc, o) => acc + o.grossProfit, 0);

      return {
        date: slot.label,
        revenue: Number(rev.toFixed(2)),
        cost: Number(cost.toFixed(2)),
        grossProfit: Number(gp.toFixed(2)),
        ordersCount: slotOrders.length,
        branchBreakdown,
      };
    });
  } else {
    trends = targetDates.map(({ key, label }) => {
      const dayOrders = orders.filter((o) => o.createdAt.slice(0, 10) === key);

      const branchBreakdown: Record<string, number> = {};
      db.branches.forEach((b) => {
        const bOrders = dayOrders.filter((o) => o.branchId === b.id);
        branchBreakdown[b.id] = Number(bOrders.reduce((acc, o) => acc + o.total, 0).toFixed(2));
      });

      const rev = dayOrders.reduce((acc, o) => acc + o.total, 0);
      const cost = dayOrders.reduce((acc, o) => acc + o.totalCost, 0);
      const gp = dayOrders.reduce((acc, o) => acc + o.grossProfit, 0);

      return {
        date: label,
        revenue: Number(rev.toFixed(2)),
        cost: Number(cost.toFixed(2)),
        grossProfit: Number(gp.toFixed(2)),
        ordersCount: dayOrders.length,
        branchBreakdown,
      };
    });
  }

  // Comprehensive Garment Sales & Units Ledger across ALL catalog items
  const allItemSales: ItemSalesPerformance[] = db.products.map((prod) => {
    let unitsSold = 0;
    let totalRev = 0;
    let totalProf = 0;
    const sizesSold: Record<string, number> = {};

    orders.forEach((ord) => {
      ord.items.forEach((it) => {
        if (it.productId === prod.id) {
          unitsSold += it.quantity;
          totalRev += it.subtotal;
          totalProf += it.grossProfit;
          if (it.size) {
            sizesSold[it.size] = (sizesSold[it.size] || 0) + it.quantity;
          }
        }
      });
    });

    // Calculate current stock (filtered branch or across all branches)
    let currentStock = 0;
    if (prod.inventory) {
      if (branchId && branchId !== 'all') {
        const bStock = prod.inventory[branchId];
        if (bStock && typeof bStock === 'object') {
          currentStock = Object.values(bStock).reduce(
            (acc, qty) => acc + (typeof qty === 'number' ? qty : 0),
            0
          );
        }
      } else {
        Object.values(prod.inventory).forEach((bStock) => {
          if (bStock && typeof bStock === 'object') {
            currentStock += Object.values(bStock).reduce(
              (acc, qty) => acc + (typeof qty === 'number' ? qty : 0),
              0
            );
          }
        });
      }
    }

    const sharePct =
      totalRevenue > 0 ? Number(((totalRev / totalRevenue) * 100).toFixed(1)) : 0;

    return {
      productId: prod.id,
      name: prod.name,
      sku: prod.sku || `SKU-${prod.id.slice(-4)}`,
      category: prod.category,
      image: prod.image,
      sellingPrice: prod.sellingPrice,
      costPrice: prod.costPrice,
      unitsSold,
      totalRevenue: Number(totalRev.toFixed(2)),
      totalProfit: Number(totalProf.toFixed(2)),
      currentStock,
      sharePct,
      sizesSold,
    };
  });

  // Sort: First by revenue descending, then by unitsSold descending
  allItemSales.sort((a, b) => {
    if (b.totalRevenue !== a.totalRevenue) {
      return b.totalRevenue - a.totalRevenue;
    }
    return b.unitsSold - a.unitsSold;
  });

  // Top Selling Items (sold items only, up to 5)
  const topSellingItems: TopSellingItem[] = allItemSales
    .filter((it) => it.unitsSold > 0)
    .slice(0, 5)
    .map((item) => ({
      productId: item.productId,
      name: item.name,
      category: item.category,
      image: item.image,
      unitsSold: item.unitsSold,
      totalRevenue: item.totalRevenue,
      totalProfit: item.totalProfit,
      sharePct: item.sharePct,
    }));

  // Fallback if no items were sold yet in the active period
  if (topSellingItems.length === 0 && allItemSales.length > 0) {
    topSellingItems.push({
      productId: allItemSales[0].productId,
      name: allItemSales[0].name,
      category: allItemSales[0].category,
      image: allItemSales[0].image,
      unitsSold: 0,
      totalRevenue: 0,
      totalProfit: 0,
      sharePct: 0,
    });
  }

  return {
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    grossProfit: Number(grossProfit.toFixed(2)),
    grossMarginPct: Number(grossMarginPct.toFixed(1)),
    totalOrders,
    averageOrderValue: Number(averageOrderValue.toFixed(2)),
    branchSummaries,
    trends,
    topSellingItems,
    allItemSales,
    reportRange: range,
    startDate: startDateStr || targetDates[0]?.key,
    endDate: endDateStr || targetDates[targetDates.length - 1]?.key,
  };
}
