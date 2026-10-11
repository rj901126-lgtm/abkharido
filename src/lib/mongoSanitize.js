/**
 * Enterprise NoSQL Injection & Prototype Pollution Sanitizer
 * Protects MongoDB / Mongoose against operator injection ($gt, $ne, $where, $regex, etc.)
 * and object prototype pollution (__proto__, constructor, prototype).
 */

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Recursively inspects and cleans objects / arrays of MongoDB operator keys and prototype pollution.
 * @param {*} target - Value to sanitize
 * @param {Object} options - { replaceWith: string (optional), strip: boolean (default true) }
 * @returns {*} Sanitized copy of target
 */
export function sanitize(target, options = { strip: true }) {
  if (target === null || typeof target !== 'object') {
    return target;
  }

  if (Array.isArray(target)) {
    return target.map((item) => sanitize(item, options));
  }

  const clean = {};
  for (const [key, value] of Object.entries(target)) {
    // 1. Guard against prototype pollution
    if (DANGEROUS_KEYS.has(key)) {
      continue;
    }

    // 2. Guard against MongoDB operators starting with '$' or containing '.'
    if (key.startsWith('$') || key.includes('.')) {
      if (options.strip) {
        continue; // Remove the malicious key entirely
      } else {
        const safeKey = key.replace(/^\$/, '_').replace(/\./g, '_');
        clean[safeKey] = sanitize(value, options);
        continue;
      }
    }

    // 3. Recurse into nested objects
    clean[key] = sanitize(value, options);
  }

  return clean;
}

/**
 * Checks if a value contains any MongoDB operators or prototype pollution keys.
 * @param {*} target 
 * @returns {boolean} True if malicious patterns are detected
 */
export function hasNoSqlInjection(target) {
  if (target === null || typeof target !== 'object') {
    if (typeof target === 'string') {
      // Check for common malicious query string patterns like [$ne]= or [$regex]=
      return /\[\s*\$(ne|gt|gte|lt|lte|in|nin|where|regex|exists|or|and)\s*\]/i.test(target);
    }
    return false;
  }

  if (Array.isArray(target)) {
    return target.some(hasNoSqlInjection);
  }

  for (const [key, value] of Object.entries(target)) {
    if (DANGEROUS_KEYS.has(key) || key.startsWith('$') || key.includes('.')) {
      return true;
    }
    if (hasNoSqlInjection(value)) {
      return true;
    }
  }

  return false;
}

export default sanitize;
