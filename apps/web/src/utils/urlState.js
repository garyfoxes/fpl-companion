export function readIntParam(searchParams, key) {
  const raw = searchParams.get(key);
  if (!raw) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function readIntArrayParam(searchParams, key) {
  const raw = searchParams.get(key);
  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s))
    .map((s) => Number.parseInt(s, 10))
    .filter((n) => n > 0);
}

export function readBooleanParam(searchParams, key) {
  const raw = searchParams.get(key);
  if (raw === 'true') {
    return true;
  }

  if (raw === 'false') {
    return false;
  }

  return null;
}

export function setParam(searchParams, key, value) {
  const next = new URLSearchParams(searchParams);
  if (value === null || value === undefined || value === '') {
    next.delete(key);
  } else {
    next.set(key, String(value));
  }

  return next;
}
