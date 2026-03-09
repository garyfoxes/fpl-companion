import { formatDate } from '../src/utils/formatDate';

describe('formatDate', () => {
  it('returns TBC for null', () => {
    expect(formatDate(null)).toBe('TBC');
  });

  it('returns TBC for empty string', () => {
    expect(formatDate('')).toBe('TBC');
  });

  it('returns TBC for undefined', () => {
    expect(formatDate(undefined)).toBe('TBC');
  });

  it('returns TBC for an invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('TBC');
  });

  it('formats a valid ISO date string including month and day', () => {
    const result = formatDate('2026-08-12T15:00:00Z');
    expect(result).toMatch(/Aug/);
    expect(result).toMatch(/12/);
  });

  it('formats another valid ISO date string', () => {
    const result = formatDate('2026-08-10T17:30:00Z');
    expect(result).toMatch(/Aug/);
    expect(result).toMatch(/10/);
  });
});
