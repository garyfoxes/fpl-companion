function extractList(payload, key) {
  if (Array.isArray(payload)) {
    return payload;
  }

  const keyCandidates = {
    players: ['players', 'elements'],
    teams: ['teams'],
    fixtures: ['fixtures'],
    events: ['events'],
  }[key] || [key];

  const candidates = [
    payload?.data,
    ...keyCandidates.map((candidateKey) => payload?.[candidateKey]),
    payload?.results,
    payload?.response,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (candidate && typeof candidate === 'object') {
      for (const candidateKey of keyCandidates) {
        if (Array.isArray(candidate[candidateKey])) {
          return candidate[candidateKey];
        }
      }
    }
  }

  return null;
}

function extractObject(payload, key) {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    if (payload[key] && typeof payload[key] === 'object') {
      return payload[key];
    }

    if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
      return payload.data;
    }

    return payload;
  }

  return null;
}

module.exports = {
  extractList,
  extractObject,
};
