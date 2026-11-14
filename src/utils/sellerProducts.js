// Use the canonical stock field even when it is zero; legacy counts can be stale.
export function getSellerProductStock(product) {
  return Math.max(0, Number(product.stock ?? product.countInStock ?? 0));
}

export function getProductImportSummary(products, { partial = false } = {}) {
  const count = products.length;
  const publishedCount = products.filter(product => ['published', 'active'].includes(product.status)).length;
  const draftCount = count - publishedCount;
  const imported = `${partial ? 'Partially imported' : 'Imported'} ${count} products.`;
  const publication = draftCount > 0
    ? `${publishedCount} live; ${draftCount} saved as drafts. An administrator must publish drafts before they appear in the marketplace.`
    : `${publishedCount} published to the marketplace.`;

  return { count, publishedCount, draftCount, message: `${imported} ${publication}` };
}
