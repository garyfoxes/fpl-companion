const { sortTeams, sortPlayers } = require('../src/utils/sort');

describe('sortTeams', () => {
  const teams = [
    { id: 1, name: 'Man City', points: 70, strengthDefenceAway: 1280 },
    { id: 2, name: 'Arsenal', points: 68, strengthDefenceAway: 1210 },
    { id: 3, name: 'Liverpool', points: 72, strengthDefenceAway: 1300 },
  ];

  it('sorts by numeric field ASC', () => {
    const sorted = sortTeams(teams, { field: 'strength_defence_away', direction: 'ASC' });
    expect(sorted.map((team) => team.id)).toEqual([2, 1, 3]);
  });

  it('sorts by numeric field DESC', () => {
    const sorted = sortTeams(teams, { field: 'points', direction: 'DESC' });
    expect(sorted.map((team) => team.id)).toEqual([3, 1, 2]);
  });

  it('returns original teams when orderBy is not provided', () => {
    expect(sortTeams(teams, null)).toBe(teams);
  });
});

describe('sortPlayers', () => {
  const players = [
    {
      id: 1,
      webName: 'Haaland',
      totalPoints: 210,
      form: '8.1',
      nowCost: 14,
      transfersInEvent: 50000,
    },
    { id: 2, webName: 'Saka', totalPoints: 180, form: '7.2', nowCost: 10, transfersInEvent: 30000 },
    {
      id: 3,
      webName: 'Salah',
      totalPoints: 195,
      form: '9.0',
      nowCost: 13,
      transfersInEvent: 40000,
    },
  ];

  it('returns original array when orderBy is null', () => {
    expect(sortPlayers(players, null)).toBe(players);
  });

  it('returns original array when orderBy is undefined', () => {
    expect(sortPlayers(players, undefined)).toBe(players);
  });

  it('sorts by totalPoints DESC', () => {
    const sorted = sortPlayers(players, { field: 'totalPoints', direction: 'DESC' });
    expect(sorted.map((p) => p.id)).toEqual([1, 3, 2]);
  });

  it('sorts by form ASC using float comparison (not string compare)', () => {
    const sorted = sortPlayers(players, { field: 'form', direction: 'ASC' });
    // 7.2 < 8.1 < 9.0 — if string-compared "9.0" < "8.1" which would be wrong
    expect(sorted.map((p) => p.id)).toEqual([2, 1, 3]);
  });

  it('sorts by nowCost ASC', () => {
    const sorted = sortPlayers(players, { field: 'nowCost', direction: 'ASC' });
    expect(sorted.map((p) => p.id)).toEqual([2, 3, 1]);
  });

  it('sorts by transfersInEvent ASC', () => {
    const sorted = sortPlayers(players, { field: 'transfersInEvent', direction: 'ASC' });
    expect(sorted.map((p) => p.id)).toEqual([2, 3, 1]);
  });

  it('does not mutate the input array', () => {
    const original = [...players];
    sortPlayers(players, { field: 'totalPoints', direction: 'DESC' });
    expect(players).toEqual(original);
  });
});
