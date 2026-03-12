const { createRequestTargets, requestUpstreamJson } = require('../src/upstream/upstreamTransport');
const {
  BadUpstreamResponseError,
  UpstreamTimeoutError,
  UpstreamUnavailableError,
} = require('../src/errors/upstreamErrors');

function createMockResponse(payload, ok = true, status = 200) {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(payload),
  };
}

function createInvalidJsonResponse(status = 200) {
  return {
    ok: true,
    status,
    json: jest.fn().mockRejectedValue(new Error('Unexpected token < in JSON')),
  };
}

describe('upstreamTransport', () => {
  it('builds request targets in base URL order and path fallback order', () => {
    const targets = createRequestTargets(['https://a.test', 'https://b.test'], '/api/fixtures');

    expect(targets.map((target) => `${target.baseUrl}${target.path}`)).toEqual([
      'https://a.test/api/fixtures',
      'https://a.test/fixtures',
      'https://a.test/api/fixtures/',
      'https://a.test/api/v1/fixtures',
      'https://a.test/v1/fixtures',
      'https://b.test/api/fixtures',
      'https://b.test/fixtures',
      'https://b.test/api/fixtures/',
      'https://b.test/api/v1/fixtures',
      'https://b.test/v1/fixtures',
    ]);
  });

  it('continues to fallback path candidates on 404 and returns parsed payload', async () => {
    const fetchImpl = jest.fn((url) => {
      if (url.endsWith('/api/players')) {
        return Promise.resolve(createMockResponse({}, false, 404));
      }

      if (url.endsWith('/players')) {
        return Promise.resolve(createMockResponse({ players: [{ id: 7 }] }));
      }

      return Promise.resolve(createMockResponse({}, false, 500));
    });

    const payload = await requestUpstreamJson({
      fetchImpl,
      baseUrls: ['https://example.test'],
      timeoutMs: 500,
      pathname: '/api/players',
    });

    expect(payload).toEqual({ players: [{ id: 7 }] });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://example.test/api/players',
      expect.objectContaining({ method: 'GET' })
    );
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://example.test/players',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('continues after non-JSON candidate and succeeds on later fallback', async () => {
    const fetchImpl = jest.fn((url) => {
      if (url.endsWith('/api/teams')) {
        return Promise.resolve(createMockResponse({}, false, 404));
      }

      if (url.endsWith('/teams')) {
        return Promise.resolve(createInvalidJsonResponse());
      }

      if (url.endsWith('/api/v1/teams') || url.endsWith('/v1/teams')) {
        return Promise.resolve(createMockResponse({}, false, 404));
      }

      if (url.endsWith('/api/bootstrap-static/')) {
        return Promise.resolve(createMockResponse({ teams: [{ id: 1, name: 'Arsenal' }] }));
      }

      return Promise.resolve(createMockResponse({}, false, 404));
    });

    const payload = await requestUpstreamJson({
      fetchImpl,
      baseUrls: ['https://example.test'],
      timeoutMs: 500,
      pathname: '/api/teams',
    });

    expect(payload).toEqual({ teams: [{ id: 1, name: 'Arsenal' }] });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://example.test/api/bootstrap-static/',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('falls back to later base URLs when all candidates on current base URL return 404', async () => {
    const fetchImpl = jest.fn((url) => {
      if (url.startsWith('https://primary.test')) {
        return Promise.resolve(createMockResponse({}, false, 404));
      }

      if (url === 'https://secondary.test/api/fixtures/') {
        return Promise.resolve(createMockResponse({ fixtures: [{ id: 11 }] }));
      }

      return Promise.resolve(createMockResponse({}, false, 404));
    });

    const payload = await requestUpstreamJson({
      fetchImpl,
      baseUrls: ['https://primary.test', 'https://secondary.test'],
      timeoutMs: 500,
      pathname: '/api/fixtures',
    });

    expect(payload).toEqual({ fixtures: [{ id: 11 }] });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://secondary.test/api/fixtures/',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('maps abort failures to upstream timeout error', async () => {
    const fetchImpl = jest.fn().mockRejectedValue({ name: 'AbortError' });

    await expect(
      requestUpstreamJson({
        fetchImpl,
        baseUrls: ['https://example.test'],
        timeoutMs: 500,
        pathname: '/api/events',
      })
    ).rejects.toBeInstanceOf(UpstreamTimeoutError);
  });

  it('maps network failures to upstream unavailable error', async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new Error('socket hang up'));

    await expect(
      requestUpstreamJson({
        fetchImpl,
        baseUrls: ['https://example.test'],
        timeoutMs: 500,
        pathname: '/api/events',
      })
    ).rejects.toBeInstanceOf(UpstreamUnavailableError);
  });

  it('preserves bad-upstream-response errors for invalid JSON on final candidate', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(createInvalidJsonResponse());

    try {
      await requestUpstreamJson({
        fetchImpl,
        baseUrls: ['https://example.test'],
        timeoutMs: 500,
        pathname: '/api/events',
      });
      throw new Error('Expected requestUpstreamJson to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(BadUpstreamResponseError);
      expect(error).toMatchObject({
        code: 'BAD_UPSTREAM_RESPONSE',
        statusCode: 502,
      });
    }
  });
});
