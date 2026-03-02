const { sortTeams } = require('../src/utils/sort');

describe('sortTeams', () => {
  const teams = [
    { id: 1, name: 'Man City', points: 70, strengthDefenceAway: 1280 },
    { id: 2, name: 'Arsenal', points: 68, strengthDefenceAway: 1210 },
    { id: 3, name: 'Liverpool', points: 72, strengthDefenceAway: 1300 }
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
