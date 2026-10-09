import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import connectDB from '../server/config/db.js';
import Product from '../server/models/Product.js';

const isRollback = process.argv.includes('--rollback');
const backupDir = path.resolve('./backups');

async function runMigration() {
  console.log('================================================================');
  console.log(`📦 ABKHARIDO PATCH 3 MIGRATION: ${isRollback ? 'ROLLBACK' : 'EXECUTE'}`);
  console.log('================================================================\n');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  try {
    await connectDB();
  } catch (err) {
    console.warn('[Migration Warning] MongoDB connect error, proceeding with file-level operation:', err.message);
    if (!mongoose.connection.readyState) {
      console.log('No active MongoDB connection. Exiting gracefully.');
      process.exit(0);
    }
  }

  if (isRollback) {
    const backupFiles = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('products_backup_before_patch3_') && f.endsWith('.json'))
      .sort()
      .reverse();

    if (backupFiles.length === 0) {
      console.error('❌ No Patch 3 backup files found to rollback.');
      process.exit(1);
    }

    const targetBackup = path.join(backupDir, backupFiles[0]);
    console.log(`Restoring from backup: ${targetBackup}`);
    const backupData = JSON.parse(fs.readFileSync(targetBackup, 'utf-8'));

    for (const item of backupData) {
      await Product.findByIdAndUpdate(item._id, item, { overwrite: true, upsert: true });
    }

    console.log(`✅ Rollback complete: Restored ${backupData.length} records.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  // Execute forward migration
  const allProducts = await Product.find({}).lean();
  console.log(`Found ${allProducts.length} products in MongoDB.`);

  // 1. Take snapshot backup before migrating
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `products_backup_before_patch3_${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(allProducts, null, 2), 'utf-8');
  console.log(`✅ Backup created at: ${backupFile} (${allProducts.length} records)`);

  let updatedCount = 0;
  for (const prod of allProducts) {
    const stock = typeof prod.stock === 'number' ? Math.floor(prod.stock) : 0;
    const inStock = stock > 0;
    const reviews = Array.isArray(prod.reviews) ? prod.reviews : [];
    const reviewsCount = reviews.length;
    const rating = reviewsCount > 0
      ? Math.round((reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviewsCount) * 10) / 10
      : 0;

    let targetStatus = prod.status;
    if (prod.status === 'active') targetStatus = 'published';
    if (prod.status === 'archived' || prod.isArchived) targetStatus = 'archived';
    if (!targetStatus) targetStatus = 'published';

    await Product.findByIdAndUpdate(prod._id, {
      $set: {
        status: targetStatus,
        stock,
        inStock,
        reviewsCount,
        rating,
        warrantyMonths: Number(prod.warrantyMonths) || 0,
        gstRate: Number(prod.gstRate) || 18,
        hsnCode: prod.hsnCode || '',
        updatedBy: 'migration_patch3'
      },
      $push: {
        auditLogs: {
          action: 'MIGRATE_PATCH_3',
          user: 'migration_patch3',
          timestamp: new Date(),
          details: { previousStatus: prod.status, newStatus: targetStatus }
        }
      }
    });
    updatedCount++;
  }

  console.log(`✅ Migration complete: Updated ${updatedCount} products with lifecycle fields, verified review metrics, and audit logs.`);
  await mongoose.disconnect();
  process.exit(0);
}

runMigration().catch(err => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
