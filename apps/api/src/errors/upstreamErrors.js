class UpstreamError extends Error {
  constructor(message, code, statusCode) {
    super(message);
    this.name = 'UpstreamError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

class UpstreamTimeoutError extends UpstreamError {
  constructor(message = 'Upstream request timed out') {
    super(message, 'UPSTREAM_TIMEOUT', 504);
    this.name = 'UpstreamTimeoutError';
  }
}

class UpstreamUnavailableError extends UpstreamError {
  constructor(message = 'Upstream service unavailable', statusCode = 503) {
    super(message, 'UPSTREAM_UNAVAILABLE', statusCode);
    this.name = 'UpstreamUnavailableError';
  }
}

class BadUpstreamResponseError extends UpstreamError {
  constructor(message = 'Upstream response shape was invalid') {
    super(message, 'BAD_UPSTREAM_RESPONSE', 502);
    this.name = 'BadUpstreamResponseError';
  }
}

module.exports = {
  UpstreamError,
  UpstreamTimeoutError,
  UpstreamUnavailableError,
  BadUpstreamResponseError,
};
