/**
 * AbKharido Enterprise Excel & CSV Bulk Product Listing Engine
 * Handles CSV parsing, column mapping, input sanitization, live validation, and sample template generation.
 */

// Supported product categories
export const VALID_CATEGORIES = ['electronics', 'mobiles', 'fashion', 'home', 'sports', 'beauty', 'appliances'];

/**
 * Parses a single CSV line into tokens, properly handling quotes and commas within quotes
 */
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let insideQuote = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Maps varying user column headers to standard product fields
 */
function normalizeHeaderName(rawHeader) {
  const clean = rawHeader.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (['title', 'productname', 'name', 'itemname', 'producttitle'].includes(clean)) return 'name';
  if (['price', 'sellingprice', 'offerprice', 'finalprice', 'discountedprice'].includes(clean)) return 'price';
  if (['mrp', 'originalprice', 'listprice', 'regularprice'].includes(clean)) return 'originalPrice';
  if (['category', 'cat', 'department', 'type'].includes(clean)) return 'category';
  if (['image', 'imageurl', 'photourl', 'img', 'picture', 'photo'].includes(clean)) return 'image';
  if (['stock', 'inventory', 'quantity', 'qty', 'countinstock', 'units'].includes(clean)) return 'countInStock';
  if (['description', 'desc', 'details', 'features', 'highlights'].includes(clean)) return 'description';
  if (['brand', 'manufacturer', 'company'].includes(clean)) return 'brand';
  return clean;
}

/**
 * Parses raw CSV/Excel text into validated product objects
 */
export function parseCsvProducts(csvText) {
  if (!csvText || typeof csvText !== 'string') {
    return { validProducts: [], errors: ['File is empty or unreadable'], totalRows: 0 };
  }

  // Remove UTF-8 BOM if present
  let cleanText = csvText.replace(/^\uFEFF/, '');
  const rawLines = cleanText.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (rawLines.length < 2) {
    return { validProducts: [], errors: ['CSV must contain a header row and at least 1 product row'], totalRows: 0 };
  }

  const rawHeaders = parseCsvLine(rawLines[0]);
  const headers = rawHeaders.map(h => normalizeHeaderName(h));

  const validProducts = [];
  const errors = [];

  for (let i = 1; i < rawLines.length; i++) {
    const rowNumber = i + 1;
    const values = parseCsvLine(rawLines[i]);

    if (values.length === 0 || (values.length === 1 && values[0] === '')) {
      continue;
    }

    const rowData = {};
    headers.forEach((header, idx) => {
      rowData[header] = values[idx] !== undefined ? values[idx] : '';
    });

    // Validate required fields
    const name = rowData.name ? rowData.name.trim() : '';
    const rawPrice = rowData.price ? String(rowData.price).replace(/[^0-9.]/g, '') : '';
    const price = parseFloat(rawPrice);

    if (!name) {
      errors.push({ row: rowNumber, error: 'Product name/title is required', data: rowData });
      continue;
    }

    if (isNaN(price) || price <= 0) {
      errors.push({ row: rowNumber, error: `Invalid price: "${rowData.price || ''}"`, data: rowData });
      continue;
    }

    const rawOrigPrice = rowData.originalPrice ? String(rowData.originalPrice).replace(/[^0-9.]/g, '') : '';
    const originalPrice = parseFloat(rawOrigPrice) || price;

    let category = (rowData.category || 'electronics').toLowerCase().trim();
    if (!VALID_CATEGORIES.includes(category)) {
      category = 'electronics'; // fallback default
    }

    const rawStock = rowData.countInStock ? String(rowData.countInStock).replace(/[^0-9]/g, '') : '50';
    const countInStock = parseInt(rawStock, 10) || 50;

    const image = rowData.image && rowData.image.startsWith('http')
      ? rowData.image.trim()
      : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80';

    const description = rowData.description 
      ? rowData.description.trim() 
      : `High performance ${name} with official manufacturer warranty and fast air dispatch.`;

    const brand = rowData.brand ? rowData.brand.trim() : 'AbKharido Verified';
    const shelfLifeDays = parseInt(String(rowData.shelflifedays || rowData.shelflife || rowData.expiry || '0').replace(/[^0-9]/g, ''), 10) || 0;
    const replenishCycleDays = parseInt(String(rowData.replenishcycledays || rowData.replenish || '0').replace(/[^0-9]/g, ''), 10) || 0;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}-${i}`;

    validProducts.push({
      id: slug,
      name,
      category,
      price,
      originalPrice: originalPrice >= price ? originalPrice : price,
      image,
      countInStock,
      inStock: countInStock > 0,
      description,
      brand,
      hasExpiry: shelfLifeDays > 0 || replenishCycleDays > 0,
      shelfLifeDays,
      replenishCycleDays,
      rating: 4.8,
      reviewsCount: 1,
      specs: [
        { key: 'Brand', value: brand },
        { key: 'Condition', value: 'Brand New (Sealed)' },
        { key: 'Warranty', value: '1 Year Brand Warranty' }
      ]
    });

  }

  return {
    validProducts,
    errors,
    totalRows: rawLines.length - 1
  };
}

/**
 * Returns a ready sample CSV template string that opens cleanly in Excel / Google Sheets
 */
export function generateSampleCsvTemplate() {
  const headers = ['Product Name', 'Category', 'Selling Price (₹)', 'Original MRP (₹)', 'Stock Units', 'Image URL', 'Brand', 'Shelf Life (Days)', 'Replenish Cycle (Days)', 'Description'];
  const sampleRows = [
    [
      'boAt Rockerz 450 Bluetooth On-Ear Headphones',
      'electronics',
      '1499',
      '3990',
      '120',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      'boAt',
      '0',
      '0',
      '15-hour playback with 40mm dynamic drivers and deep bass.'
    ],

    [
      'Noise ColorFit Pro 4 Smartwatch 1.72" HD Display',
      'electronics',
      '1999',
      '4999',
      '85',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
      'Noise',
      'Bluetooth calling, 100 sports modes, and SpO2 heart tracking.'
    ],
    [
      'Men Regular Fit Solid Cotton Casual Shirt - Navy Blue',
      'fashion',
      '799',
      '1999',
      '60',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
      'AbKharido Couture',
      '100% breathable combed cotton with spread collar.'
    ],
    [
      'Stainless Steel Insulated Water Bottle 1000ml',
      'home',
      '499',
      '1299',
      '200',
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800',
      'Milton',
      '24 hours hot and cold double-wall vacuum insulation.'
    ],
    [
      'High Speed 65W GaN Fast Wall Charger for Phone & Laptop',
      'mobiles',
      '1299',
      '2499',
      '95',
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800',
      'Anker',
      'Dual Type-C and USB-A fast charging with smart power allocation.'
    ]
  ];

  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...sampleRows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
  ].join('\r\n');

  return csvContent;
}

/**
 * Triggers instant browser file download of sample template
 */
export function downloadSampleTemplate() {
  if (typeof window === 'undefined') return;
  const content = generateSampleCsvTemplate();
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'abkharido_bulk_products_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
