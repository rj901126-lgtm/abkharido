// Lightweight in-memory rate limiter for serverless Next.js route handlers
const rateLimitStores = new Map(); // keyPrefix -> Map(identifier -> { count, resetTime })

/**
 * Checks if a request exceeds rate limits.
 * 
 * @param {string} prefix - Category name (e.g., 'verify-otp', 'coupons', 'orders')
 * @param {string} identifier - Client IP or phone
 * @param {number} maxRequests - Maximum allowed requests in window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {{ allowed: boolean, remaining: number, resetSeconds: number }}
 */
export function checkRouteRateLimit(prefix, identifier, maxRequests = 20, windowMs = 5 * 60 * 1000) {
  if (!identifier) return { allowed: true, remaining: maxRequests, resetSeconds: 0 };

  if (!rateLimitStores.has(prefix)) {
    rateLimitStores.set(prefix, new Map());
  }

  const store = rateLimitStores.get(prefix);
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetTime) {
    store.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetSeconds: Math.ceil(windowMs / 1000) };
  }

  if (entry.count >= maxRequests) {
    const remainingSeconds = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, resetSeconds: remainingSeconds };
  }

  entry.count += 1;
  return { allowed: true, remaining: maxRequests - entry.count, resetSeconds: Math.ceil((entry.resetTime - now) / 1000) };
}

export function resetAllRateLimits() {
  rateLimitStores.clear();
}

