class InMemoryCache {
  constructor(nowFn = () => Date.now()) {
    this.nowFn = nowFn;
    this.store = new Map();
  }

  async set(key, value, ttlSec) {
    const ttlMs = Math.max(ttlSec, 1) * 1000;
    this.store.set(key, {
      value,
      expiresAt: this.nowFn() + ttlMs
    });
  }

  async get(key, options = {}) {
    const record = this.store.get(key);
    if (!record) {
      return null;
    }

    const isExpired = record.expiresAt <= this.nowFn();
    if (isExpired && !options.allowStale) {
      return null;
    }

    return {
      value: record.value,
      isStale: isExpired
    };
  }
}

module.exports = {
  InMemoryCache
};
