const { extractList, extractObject } = require('../src/upstream/payloadExtractors');

describe('payloadExtractors', () => {
  describe('extractList', () => {
    it('returns payload directly when payload is an array', () => {
      expect(extractList([{ id: 1 }], 'players')).toEqual([{ id: 1 }]);
    });

    it('extracts players from bootstrap-static elements fallback', () => {
      const payload = { elements: [{ id: 2 }] };
      expect(extractList(payload, 'players')).toEqual([{ id: 2 }]);
    });

    it('extracts list from payload.data object key', () => {
      const payload = { data: { teams: [{ id: 3 }] } };
      expect(extractList(payload, 'teams')).toEqual([{ id: 3 }]);
    });

    it('extracts list from payload.results fallback', () => {
      const payload = { results: [{ id: 4 }] };
      expect(extractList(payload, 'fixtures')).toEqual([{ id: 4 }]);
    });

    it('returns null when no list can be found', () => {
      expect(extractList({ data: { item: true } }, 'events')).toBeNull();
    });
  });

  describe('extractObject', () => {
    it('extracts object from named key', () => {
      const payload = { player: { id: 1 } };
      expect(extractObject(payload, 'player')).toEqual({ id: 1 });
    });

    it('extracts object from payload.data', () => {
      const payload = { data: { id: 2 } };
      expect(extractObject(payload, 'team')).toEqual({ id: 2 });
    });

    it('returns payload when payload is an object and no key matches', () => {
      const payload = { id: 3 };
      expect(extractObject(payload, 'fixture')).toEqual({ id: 3 });
    });

    it('returns null for non-object payloads', () => {
      expect(extractObject([{ id: 1 }], 'event')).toBeNull();
      expect(extractObject(null, 'event')).toBeNull();
    });
  });
});
