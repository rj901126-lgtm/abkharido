import fs from 'fs';
import path from 'path';

async function generateInventoryAndBackup() {
  const inventory = new Map();

  // 1. Check products.json (root)
  if (fs.existsSync('products.json')) {
    try {
      const data = JSON.parse(fs.readFileSync('products.json', 'utf-8'));
      for (const p of data) {
        inventory.set(p.id, { ...p, source_root_json: true });
      }
    } catch (e) {
      console.error('Error root json:', e.message);
    }
  }

  // 2. Check api/data/products.json
  if (fs.existsSync('api/data/products.json')) {
    try {
      const data = JSON.parse(fs.readFileSync('api/data/products.json', 'utf-8'));
      for (const p of data) {
        if (!inventory.has(p.id)) {
          inventory.set(p.id, { ...p, source_api_json: true });
        } else {
          inventory.get(p.id).source_api_json = true;
        }
      }
    } catch (e) {
      console.error('Error api json:', e.message);
    }
  }

  // 3. Check server/data/productsData.js
  if (fs.existsSync('server/data/productsData.js')) {
    try {
      const mod = await import('../server/data/productsData.js');
      const data = mod.default || [];
      for (const p of data) {
        if (!inventory.has(p.id)) {
          inventory.set(p.id, { ...p, source_server_data: true });
        } else {
          inventory.get(p.id).source_server_data = true;
        }
      }
    } catch (e) {
      console.error('Error server data:', e.message);
    }
  }

  // 4. Check src/db/mockData.js
  if (fs.existsSync('src/db/mockData.js')) {
    try {
      const mod = await import('../src/db/mockData.js');
      const data = mod.PRODUCTS || [];
      for (const p of data) {
        if (!inventory.has(p.id)) {
          inventory.set(p.id, { ...p, source_mock_data: true });
        } else {
          inventory.get(p.id).source_mock_data = true;
        }
      }
    } catch (e) {
      console.error('Error mock data:', e.message);
    }
  }

  const items = Array.from(inventory.values());
  console.log(`\n================================================================`);
  console.log(`📦 CATALOGUE INVENTORY REPORT (${items.length} UNIQUE SKUs FOUND)`);
  console.log(`================================================================\n`);

  // Ensure backups directory exists
  if (!fs.existsSync('backups')) {
    fs.mkdirSync('backups', { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.resolve(`backups/catalogue_backup_before_patch2_${timestamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(items, null, 2), 'utf-8');
  console.log(`💾 FULL BACKUP TAKEN: ${backupPath} (${items.length} records)\n`);

  const bigBrandRegex = /apple|iphone|ipad|macbook|samsung|galaxy|oneplus|redmi|xiaomi|nike|air max|levi|sony|lg |philips|l'or[eé]al|loreal|lego|hp |hewlett|mrf|ola |vega/i;

  const results = items.map(p => {
    const title = p.name || p.title || '';
    const img = p.image || '';
    const imgHost = img.includes('://') ? img.split('/')[2] : (img ? 'local/relative' : 'missing');
    const realReviews = Array.isArray(p.reviews) ? p.reviews.length : 0;
    const claimedReviews = p.reviewsCount || 0;
    const isBigBrand = bigBrandRegex.test(title) || bigBrandRegex.test(p.id);
    const isUnsplash = img.includes('images.unsplash.com');
    const isCloudinary = img.includes('res.cloudinary.com');

    // Classification
    let categoryClassification = 'OTHER';
    if (isBigBrand) categoryClassification = 'BIG_BRAND_UNAUTHORIZED';
    else if (p.id.startsWith('dummy-') || ['organic-honey-pure', 'office-chair-ergonomic', 'smart-led-tv-4k', 'ceramic-table-lamp', 'wooden-lamp', 'cotton-bedcover', 'mens-slim-shirt', 'casual-cotton-shirt', 'analog-minimalist-watch', 'blackout-window-curtains', 'double-door-refrigerator', 'mechanical-keyboard-pro', 'alchemist-novel'].includes(p.id)) {
      categoryClassification = 'DUMMY_HOUSE_BRAND';
    } else if (p.id === 'signature-wireless-earphone' || p.id === 'sigboom-21') {
      categoryClassification = 'REPORTED_KEEPER';
    }

    return {
      id: p.id,
      title,
      category: p.category,
      price: p.price,
      stock: p.stock,
      imgHost,
      isUnsplash,
      isCloudinary,
      claimedReviews,
      realReviews,
      reviewMismatch: claimedReviews !== realReviews,
      isBigBrand,
      categoryClassification
    };
  });

  // Print classified inventory
  console.log('ID | Title | Classification | Image Host | Claimed Reviews | Real Reviews');
  console.log('-------------------------------------------------------------------------');
  results.forEach(r => {
    console.log(`${r.id} | ${r.title} | ${r.categoryClassification} | ${r.imgHost} | ${r.claimedReviews} | ${r.realReviews}`);
  });

  // Write inventory JSON summary for reports
  const inventoryReportPath = path.resolve('backups/inventory_summary.json');
  fs.writeFileSync(inventoryReportPath, JSON.stringify({
    timestamp,
    backupPath,
    totalCount: items.length,
    items: results
  }, null, 2), 'utf-8');

  console.log(`\nWritten inventory summary to: ${inventoryReportPath}`);
}

generateInventoryAndBackup().catch(err => {
  console.error('Inventory generation failed:', err);
  process.exit(1);
});
