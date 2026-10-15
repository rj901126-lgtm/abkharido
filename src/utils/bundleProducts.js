const productId = product => String(product?.id || product?._id || product?.slug || '');
const positiveStock = value => Number.isFinite(Number(value)) && Number(value) >= 1;

// Bundle entries must use the same catalogue options and prices as checkout.
export function bundleCartProduct(product, selection = {}, now = Date.now()) {
  if (!productId(product) || !['published', 'active'].includes(product.status) || product.isArchived || product.inStock === false) return null;

  const colors = Array.isArray(product.colorModels) ? product.colorModels : [];
  let color, variant;
  if (colors.length) {
    color = selection.selectedColor
      ? colors.find(item => item.name === selection.selectedColor)
      : colors.find(item => item.variants?.some(option => positiveStock(option.stock)));
    if (!color) return null;
    variant = selection.selectedVariant
      ? color.variants?.find(item => item.name === selection.selectedVariant)
      : color.variants?.find(item => positiveStock(item.stock));
    if (!variant?.name || !color.name || !positiveStock(variant.stock)) return null;
  }

  const stock = Number(variant ? variant.stock : product.stock);
  const flashSale = product.flashSale?.isActive && new Date(product.flashSale.endTime).getTime() > now;
  const price = Number(flashSale ? product.flashSale.price : variant ? variant.price : product.price);
  if (!positiveStock(stock) || !Number.isFinite(price) || price < 0) return null;
  const originalPrice = Number(variant ? variant.originalPrice : product.originalPrice);

  return {
    ...product,
    id: product.id || product._id || product.slug,
    price,
    originalPrice: Number.isFinite(originalPrice) && originalPrice > price ? originalPrice : price,
    stock: Math.floor(stock),
    selectedColor: color?.name || '',
    selectedVariant: variant?.name || '',
    image: color?.primaryImage || color?.images?.[0] || product.image || product.images?.[0] || ''
  };
}

export function buildAvailableBundle(currentProduct, products, selection = {}, now = Date.now()) {
  const main = bundleCartProduct(currentProduct, selection, now);
  if (!main) return [];
  const seen = new Set([productId(main)]);
  const accessories = (Array.isArray(products) ? products : [])
    .filter(product => {
      const id = productId(product);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .map(product => bundleCartProduct(product, {}, now))
    .filter(Boolean)
    .sort((a, b) => Number(b.category === main.category) - Number(a.category === main.category))
    .slice(0, 2);

  return accessories.length ? [{ ...main, isMain: true }, ...accessories.map(product => ({ ...product, isMain: false }))] : [];
}

export function bundleFitsInCart(items, cart = []) {
  const option = value => String(value || '').toLowerCase().trim();
  return items.every(item => {
    const quantity = cart.reduce((total, entry) => {
      const product = entry.product;
      const same = productId(product) === productId(item)
        && option(product?.selectedColor || product?.color) === option(item.selectedColor)
        && option(product?.selectedVariant || product?.variant) === option(item.selectedVariant);
      return total + (same ? Number(entry.quantity || 0) : 0);
    }, 0);
    return Number.isFinite(quantity) && quantity + 1 <= item.stock;
  });
}
