// Financial, Pricing, and Inventory Calculation Utilities for Roman Island POS

/**
 * Dynamically extract all available sizes for a product
 */
export function getProductSizes(product) {
  if (product?.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
    return product.sizes;
  }
  const sizeSet = new Set();
  if (product?.inventory && typeof product.inventory === 'object') {
    Object.values(product.inventory).forEach((branchStock) => {
      if (branchStock && typeof branchStock === 'object') {
        Object.keys(branchStock).forEach((sz) => sizeSet.add(sz));
      }
    });
  }
  if (sizeSet.size > 0) {
    return Array.from(sizeSet);
  }
  return ['S', 'M', 'L', 'XL', 'XXL'];
}

/**
 * Retrieve specific selling and cost price considering variable pricing for sizes
 */
export function getProductPriceForSize(product, size) {
  if (!product) return { sellingPrice: 0, costPrice: 0 };
  if (size && product.sizePrices && product.sizePrices[size]) {
    const sp = product.sizePrices[size];
    const sellingPrice =
      typeof sp === 'number'
        ? sp
        : typeof sp.sellingPrice === 'number'
        ? sp.sellingPrice
        : product.sellingPrice;
    const costPrice =
      typeof sp === 'object' && typeof sp.costPrice === 'number'
        ? sp.costPrice
        : product.costPrice || 0;
    return { sellingPrice, costPrice };
  }
  return {
    sellingPrice: Number(product.sellingPrice) || 0,
    costPrice: Number(product.costPrice) || 0,
  };
}

/**
 * Calculate total stock for a product in a given branch
 */
export function getBranchStock(product, branchId) {
  if (!product?.inventory || !product.inventory[branchId]) return 0;
  const sizeMap = product.inventory[branchId];
  return Object.values(sizeMap).reduce((acc, count) => acc + (Number(count) || 0), 0);
}

/**
 * Calculate stock for a specific size in a branch
 */
export function getSizeStock(product, branchId, size) {
  if (!product?.inventory || !product.inventory[branchId]) return 0;
  return Number(product.inventory[branchId][size]) || 0;
}

/**
 * Calculate subtotal, discount, GST (5%), and grand total for the cart
 */
export function calculateOrderTotals(cart, discountInput) {
  const subtotal = cart.reduce((sum, item) => sum + item.unitSellingPrice * item.quantity, 0);

  let discountAmount = 0;
  if (typeof discountInput === 'string') {
    const cleanStr = discountInput.trim();
    if (cleanStr.endsWith('%')) {
      const pct = parseFloat(cleanStr.replace('%', ''));
      if (!isNaN(pct) && pct > 0) {
        discountAmount = Math.round((subtotal * pct) / 100);
      }
    } else {
      const flat = parseFloat(cleanStr);
      if (!isNaN(flat) && flat > 0) {
        discountAmount = flat;
      }
    }
  } else if (typeof discountInput === 'number' && !isNaN(discountInput)) {
    discountAmount = discountInput;
  }

  // Discount cannot exceed subtotal
  discountAmount = Math.min(Math.max(0, discountAmount), subtotal);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  // Roman Island standard: 5% GST on apparel
  const gstTax = Math.round(taxableAmount * 0.05 * 100) / 100;
  const grandTotal = Math.round((taxableAmount + gstTax) * 100) / 100;
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount,
    taxableAmount,
    gstTax,
    grandTotal,
    totalItemsCount,
  };
}

/**
 * Format standard Indian Rupees
 */
export function formatCurrency(amount) {
  const val = Number(amount) || 0;
  return `₹${val.toLocaleString('en-IN')}`;
}

/**
 * Format readable date-time string
 */
export function formatDateTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
