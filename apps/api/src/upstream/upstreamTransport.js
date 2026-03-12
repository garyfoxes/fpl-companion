const {
  UpstreamTimeoutError,
  UpstreamUnavailableError,
  BadUpstreamResponseError,
} = require('../errors/upstreamErrors');

function getPathCandidates(pathname) {
  const pathFallbacks = {
    '/api/players': [
      '/players',
      '/api/v1/players',
      '/v1/players',
      '/api/bootstrap-static/',
      '/api/bootstrap-static',
      '/bootstrap-static/',
      '/bootstrap-static',
    ],
    '/api/teams': [
      '/teams',
      '/api/v1/teams',
      '/v1/teams',
      '/api/bootstrap-static/',
      '/api/bootstrap-static',
      '/bootstrap-static/',
      '/bootstrap-static',
    ],
    '/api/events': [
      '/events',
      '/api/v1/events',
      '/v1/events',
      '/api/bootstrap-static/',
      '/api/bootstrap-static',
      '/bootstrap-static/',
      '/bootstrap-static',
    ],
    '/api/fixtures': ['/fixtures', '/api/fixtures/', '/api/v1/fixtures', '/v1/fixtures'],
  };

  const candidates = [pathname];
  for (const fallbackPath of pathFallbacks[pathname] || []) {
    if (!candidates.includes(fallbackPath)) {
      candidates.push(fallbackPath);
    }
  }

  return candidates;
}

function createRequestTargets(baseUrls, pathname) {
  const pathCandidates = getPathCandidates(pathname);
  const requestTargets = [];

  for (const baseUrl of baseUrls) {
    for (const pathCandidate of pathCandidates) {
      requestTargets.push({
        baseUrl,
        path: pathCandidate,
      });
    }
  }

  return requestTargets;
}

async function requestUpstreamJson({ fetchImpl, baseUrls, timeoutMs, pathname }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const requestTargets = createRequestTargets(baseUrls, pathname);
    let payload;
    let allCandidatesWereNotFound = true;
    let lastFailureMessage = null;

    for (let i = 0; i < requestTargets.length; i += 1) {
      const target = requestTargets[i];
      const response = await fetchImpl(`${target.baseUrl}${target.path}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      const isLastCandidate = i === requestTargets.length - 1;

      if (!response.ok) {
        lastFailureMessage = `Upstream returned ${response.status} for ${target.path}`;

        if (response.status !== 404) {
          allCandidatesWereNotFound = false;
        }

        const shouldTryFallback = response.status === 404 && !isLastCandidate;

        if (shouldTryFallback) {
          continue;
        }

        throw new UpstreamUnavailableError(lastFailureMessage, response.status);
      }

      allCandidatesWereNotFound = false;

      try {
        payload = await response.json();
        break;
      } catch {
        lastFailureMessage = `Failed to parse upstream JSON for ${target.path}`;

        if (!isLastCandidate) {
          continue;
        }

        throw new BadUpstreamResponseError(lastFailureMessage);
      }
    }

    if (payload === undefined) {
      const triedPaths = requestTargets.map((target) => `${target.baseUrl}${target.path}`);
      const message = allCandidatesWereNotFound
        ? `Upstream returned 404 for ${pathname}; tried URLs: ${triedPaths.join(', ')}`
        : `Upstream request failed for ${pathname}${lastFailureMessage ? `: ${lastFailureMessage}` : ''}`;
      const statusCode = allCandidatesWereNotFound ? 404 : 503;
      throw new UpstreamUnavailableError(message, statusCode);
    }

    return payload;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new UpstreamTimeoutError(`Upstream timed out for ${pathname}`);
    }

    if (error.code && error.code.startsWith('UPSTREAM_')) {
      throw error;
    }

    throw new UpstreamUnavailableError(`Failed upstream request for ${pathname}: ${error.message}`);
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = {
  getPathCandidates,
  createRequestTargets,
  requestUpstreamJson,
};
