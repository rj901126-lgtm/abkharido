// Resolve the same option and price that checkout will charge for a quick add.
export function selectCartProduct(product, colorName, now = Date.now()) {
  const colors = Array.isArray(product.colorModels) ? product.colorModels : [];
  const color = colors.find(item => item.name === colorName) || colors[0];
  const variant = color?.variants?.find(item => Number(item.stock) > 0) || color?.variants?.[0];
  if (colors.length && (!color?.name || !variant?.name)) return null;

  const flashSale = product.flashSale?.isActive && new Date(product.flashSale.endTime).getTime() > now;
  const price = Number(flashSale ? product.flashSale.price : variant?.price ?? product.price);
  if (!Number.isFinite(price) || price < 0) return null;
  const originalPrice = Number(variant?.originalPrice ?? product.originalPrice ?? price);
  const stock = Number(variant?.stock ?? product.stock ?? 0);
  return {
    ...product,
    price,
    originalPrice: Number.isFinite(originalPrice) ? Math.max(price, originalPrice) : price,
    stock: Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 0,
    selectedColor: color?.name || '',
    selectedVariant: variant?.name || '',
    image: color?.primaryImage || color?.images?.[0] || product.image || product.images?.[0] || ''
  };
}
