class RedisCacheAdapter {
  constructor() {
    this.available = false;
  }

  async set(_key, _value, _ttlSec) {
    return Promise.resolve();
  }

  async get(_key, _options = {}) {
    return Promise.resolve(null);
  }
}

module.exports = {
  RedisCacheAdapter,
};
