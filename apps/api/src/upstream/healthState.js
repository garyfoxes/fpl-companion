function createHealthState() {
  return {
    lastSuccessAt: null,
    lastFailureAt: null,
    lastError: null,
  };
}

function markHealthSuccess(health) {
  health.lastSuccessAt = new Date().toISOString();
  health.lastError = null;
}

function markHealthFailure(health, error) {
  health.lastFailureAt = new Date().toISOString();
  health.lastError = error.message;
}

function createReadinessPayload(health, upstreamReachable) {
  return {
    status: upstreamReachable ? 'ok' : 'degraded',
    upstreamReachable,
    lastSuccessAt: health.lastSuccessAt,
    lastFailureAt: health.lastFailureAt,
    lastError: health.lastError,
  };
}

module.exports = {
  createHealthState,
  markHealthSuccess,
  markHealthFailure,
  createReadinessPayload,
};
