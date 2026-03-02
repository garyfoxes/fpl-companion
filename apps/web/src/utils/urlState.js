export function readIntParam(searchParams, key) {
  const raw = searchParams.get(key);
  if (!raw) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
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
