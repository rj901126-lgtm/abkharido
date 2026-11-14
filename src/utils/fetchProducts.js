const PRODUCT_PAGE_SIZE = 50;

// Catalog filters and sorting operate on the full result set. Respect the API's
// page-size limit and retain its ordering while collecting the remaining pages.
export async function fetchAllProducts(query = {}, { baseUrl = '', fetchImpl = fetch, ...requestOptions } = {}) {
  const searchParams = new URLSearchParams(query);
  searchParams.set('limit', String(PRODUCT_PAGE_SIZE));
  const products = [];
  let totalPages = 1;

  for (let page = 1; page <= totalPages; page += 1) {
    searchParams.set('page', String(page));
    const response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}/api/products?${searchParams}`, requestOptions);
    if (!response.ok) throw new Error(`Failed to load products (${response.status})`);

    const data = await response.json();
    const pageProducts = Array.isArray(data) ? data : data?.products;
    if (!Array.isArray(pageProducts)) throw new Error('Invalid product response');
    products.push(...pageProducts);

    if (page === 1 && !Array.isArray(data)) {
      const reportedPages = Number(data.totalPages);
      const total = Number(data.total);
      totalPages = Number.isSafeInteger(reportedPages) && reportedPages > 0
        ? reportedPages
        : (Number.isSafeInteger(total) && total > 0 ? Math.ceil(total / PRODUCT_PAGE_SIZE) : 1);
    }
  }

  return products;
}
