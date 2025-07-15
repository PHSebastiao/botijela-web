// API Response Cache Manager
// Handles caching for API responses with TTL and invalidation

class CacheManager {
  constructor(ttl = 30000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  // Generate cache key from URL and options
  getCacheKey(url, options) {
    return `${options.method || "GET"}:${url}:${JSON.stringify(
      options.data || {}
    )}`;
  }

  // Check if cached item is still valid
  isValid(timestamp) {
    return Date.now() - timestamp < this.ttl;
  }

  // Get cached item if valid
  get(url, options) {
    const key = this.getCacheKey(url, options);
    const cached = this.cache.get(key);
    
    if (cached && this.isValid(cached.timestamp)) {
      return cached.data;
    }
    
    return null;
  }

  // Store item in cache
  set(url, options, data) {
    const key = this.getCacheKey(url, options);
    this.cache.set(key, {
      data: data,
      timestamp: Date.now(),
    });
  }

  // Invalidate cache entries matching pattern
  invalidate(urlPattern) {
    const keysToDelete = [];
    for (const [key, value] of this.cache.entries()) {
      if (key.includes(urlPattern)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  // Clear all cache
  clear() {
    this.cache.clear();
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Global cache instance
window.cacheManager = new CacheManager();
