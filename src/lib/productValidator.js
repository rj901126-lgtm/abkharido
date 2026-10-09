/**
 * Product Data Validation and Sanitization Module
 * Enforces Patch 3 requirements for product creation, publishing, and public projection.
 */

const FORBIDDEN_IMAGE_PATTERNS = [
  'placeholder',
  'dummyimage',
  'via.placeholder.com',
  'example.com',
  'fake'
];

/**
 * Checks whether an image URL is a placeholder or fake asset.
 */
export function isPlaceholderImage(url) {
  if (!url || typeof url !== 'string') return true;
  const lower = url.toLowerCase().trim();
  return FORBIDDEN_IMAGE_PATTERNS.some(pat => lower.includes(pat));
}

/**
 * Validates product data before saving or publishing.
 * Enforces:
 * - Stable ID, human name, description, category, integer price, integer stock, at least 1 image
 * - inStock is derived from stock, not a separate boolean
 * - Publishing is restricted to admin/super_admin
 */
export function validateProductData(data, user = null, isUpdate = false) {
  const errors = [];
  const sanitized = { ...data };

  // 1. Stable ID
  if (!isUpdate || sanitized.id) {
    if (!sanitized.id || typeof sanitized.id !== 'string') {
      errors.push('Product ID is required and must be a string.');
    } else {
      const trimmedId = sanitized.id.trim().toLowerCase();
      if (!/^[a-z0-9-]+$/.test(trimmedId) || trimmedId.length < 3 || trimmedId.length > 100) {
        errors.push('Product ID must be lowercase alphanumeric with hyphens (3-100 characters).');
      }
      sanitized.id = trimmedId;
    }
  }

  // 2. Human Name
  if (!isUpdate || sanitized.name !== undefined) {
    if (!sanitized.name || typeof sanitized.name !== 'string' || sanitized.name.trim().length < 3) {
      errors.push('Product name must be at least 3 characters.');
    } else {
      sanitized.name = sanitized.name.trim().substring(0, 200);
    }
  }

  // 3. Category
  if (!isUpdate || sanitized.category !== undefined) {
    if (!sanitized.category || typeof sanitized.category !== 'string' || sanitized.category.trim().length === 0) {
      errors.push('Category is required.');
    } else {
      sanitized.category = sanitized.category.trim().toLowerCase();
    }
  }

  // 4. Description
  if (!isUpdate || sanitized.description !== undefined) {
    if (!sanitized.description || typeof sanitized.description !== 'string' || sanitized.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters.');
    } else {
      sanitized.description = sanitized.description.trim();
    }
  }

  // 5. Integer Price
  if (!isUpdate || sanitized.price !== undefined) {
    const numPrice = Number(sanitized.price);
    if (isNaN(numPrice) || numPrice <= 0 || !Number.isInteger(numPrice)) {
      errors.push('Price must be a positive integer in INR (e.g. ₹999).');
    } else {
      sanitized.price = Math.floor(numPrice);
    }
  }

  // 6. Original Price (Optional MRP)
  if (sanitized.originalPrice !== undefined && sanitized.originalPrice !== null && sanitized.originalPrice !== '') {
    const numOriginal = Number(sanitized.originalPrice);
    if (!isNaN(numOriginal) && numOriginal > 0) {
      sanitized.originalPrice = Math.floor(numOriginal);
    } else {
      delete sanitized.originalPrice;
    }
  }

  // 7. Integer Stock & Derived inStock
  if (!isUpdate || sanitized.stock !== undefined) {
    const numStock = Number(sanitized.stock);
    if (isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
      errors.push('Stock must be an integer >= 0.');
    } else {
      sanitized.stock = Math.floor(numStock);
    }
  }
  // inStock is ALWAYS strictly derived from stock
  if (sanitized.stock !== undefined) {
    sanitized.inStock = sanitized.stock > 0;
  }

  // 8. Images Check
  let imageList = [];
  if (Array.isArray(sanitized.images)) {
    imageList = sanitized.images.filter(img => typeof img === 'string' && img.trim().length > 0 && !isPlaceholderImage(img));
  } else if (sanitized.image && typeof sanitized.image === 'string' && !isPlaceholderImage(sanitized.image)) {
    imageList = [sanitized.image.trim()];
  }

  if (sanitized.image && isPlaceholderImage(sanitized.image)) {
    errors.push('Placeholder or mock image URLs are not permitted.');
  }

  // 9. Status & Publishing Authority
  const requestedStatus = sanitized.status || 'draft';
  const allowedStatuses = ['draft', 'review', 'published', 'archived', 'active'];
  if (!allowedStatuses.includes(requestedStatus)) {
    errors.push(`Invalid product status. Allowed: ${allowedStatuses.join(', ')}`);
  }

  const isAdmin = user && (user.isAdmin || user.role === 'admin' || user.role === 'super_admin');

  if (requestedStatus === 'published' || requestedStatus === 'active') {
    if (!isAdmin) {
      errors.push('Only administrators can publish products to the live store.');
    }

    // Strict validation for published products
    if (imageList.length < 1) {
      errors.push('A published product requires at least 1 real product image.');
    }
  }

  // 10. Tax & Compliance
  if (sanitized.gstRate !== undefined) {
    const gst = Number(sanitized.gstRate);
    sanitized.gstRate = !isNaN(gst) && gst >= 0 ? gst : 18;
  }
  if (sanitized.warrantyMonths !== undefined) {
    const wm = parseInt(sanitized.warrantyMonths, 10);
    sanitized.warrantyMonths = !isNaN(wm) && wm >= 0 ? wm : 0;
  }
  if (sanitized.hsnCode) {
    sanitized.hsnCode = String(sanitized.hsnCode).trim();
  }

  // 11. Strip internal and forbidden fields from payload
  delete sanitized.rating;
  delete sanitized.reviewsCount;
  delete sanitized.reviews;
  delete sanitized.userCommissionRate;
  delete sanitized.influencerCommissionRate;
  delete sanitized.adminCommission;
  delete sanitized.costPrice;

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedProduct: sanitized
  };
}

/**
 * Public Product DTO projection.
 * Prevents leakage of internal commissions, audit logs, cost prices,
 * and derives inStock, reviewsCount, and rating strictly from real data.
 */
export function toPublicProductDTO(product) {
  if (!product) return null;

  const stock = typeof product.stock === 'number' ? Math.floor(product.stock) : 0;
  const inStock = stock > 0;

  // Real review counts strictly from review documents
  const reviews = Array.isArray(product.reviews) ? product.reviews : [];
  const reviewsCount = reviews.length;
  const rating = reviewsCount > 0
    ? Math.round((reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviewsCount) * 10) / 10
    : 0;

  // Filter placeholder images
  const rawImages = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : (product.image ? [product.image] : []);
  const cleanImages = rawImages.filter(img => typeof img === 'string' && !isPlaceholderImage(img));
  const primaryImage = product.image && !isPlaceholderImage(product.image)
    ? product.image
    : (cleanImages[0] || '');

  return {
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.description,
    price: typeof product.price === 'number' ? Math.floor(product.price) : 0,
    originalPrice: product.originalPrice ? Math.floor(Number(product.originalPrice)) : undefined,
    stock,
    inStock,
    image: primaryImage,
    images: cleanImages,
    rating,
    reviewsCount,
    warrantyMonths: Number(product.warrantyMonths) || 0,
    hsnCode: product.hsnCode || '',
    gstRate: Number(product.gstRate) || 18,
    highlights: product.highlights || [],
    features: product.features || [],
    specs: product.specs || [],
    specifications: product.specifications || product.specs || [],
    colorModels: (product.colorModels || []).map(cm => ({
      name: cm.name,
      primaryImage: cm.primaryImage && !isPlaceholderImage(cm.primaryImage) ? cm.primaryImage : '',
      images: (cm.images || []).filter(img => !isPlaceholderImage(img)),
      variants: (cm.variants || []).map(v => ({
        name: v.name,
        price: typeof v.price === 'number' ? Math.floor(v.price) : 0,
        originalPrice: v.originalPrice ? Math.floor(Number(v.originalPrice)) : undefined,
        discount: v.discount,
        stock: typeof v.stock === 'number' ? Math.floor(v.stock) : 0
      }))
    })),
    hasProCare: Boolean(product.hasProCare),
    sellerShopName: product.sellerShopName || product.sellerName || 'AbKharido Verified Store',
    sellerId: product.sellerId || '',
    status: product.status || 'published',
    flashSale: product.flashSale?.isActive ? {
      isActive: true,
      price: Math.floor(Number(product.flashSale.price) || 0),
      endTime: product.flashSale.endTime
    } : undefined
  };
}
