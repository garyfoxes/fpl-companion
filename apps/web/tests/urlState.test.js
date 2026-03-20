import { readBooleanParam, readIntArrayParam, readIntParam, setParam } from '../src/utils/urlState';

describe('urlState utils', () => {
  it('reads integer params safely', () => {
    const params = new URLSearchParams('teamId=5&bad=abc');
    expect(readIntParam(params, 'teamId')).toBe(5);
    expect(readIntParam(params, 'bad')).toBeNull();
  });

  it('reads boolean params safely', () => {
    const params = new URLSearchParams('finished=true&started=false');
    expect(readBooleanParam(params, 'finished')).toBe(true);
    expect(readBooleanParam(params, 'started')).toBe(false);
    expect(readBooleanParam(params, 'missing')).toBeNull();
  });

  it('sets and removes params', () => {
    const params = new URLSearchParams('q=salah');
    const next = setParam(params, 'teamId', 1);
    expect(next.get('teamId')).toBe('1');

    const removed = setParam(next, 'q', null);
    expect(removed.has('q')).toBe(false);
  });

  describe('readIntArrayParam', () => {
    it('returns integer array from valid comma-separated string', () => {
      const params = new URLSearchParams('compare=1,2,3');
      expect(readIntArrayParam(params, 'compare')).toEqual([1, 2, 3]);
    });

    it('filters out non-integer values from mixed string', () => {
      const params = new URLSearchParams('compare=1,abc,3');
      expect(readIntArrayParam(params, 'compare')).toEqual([1, 3]);
    });

    it('returns empty array when param is missing', () => {
      const params = new URLSearchParams('');
      expect(readIntArrayParam(params, 'compare')).toEqual([]);
    });
  });
});
