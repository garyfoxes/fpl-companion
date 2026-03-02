const { mapPlayer, mapTeam, mapFixture, mapEvent, mapArray } = require('../src/upstream/mappers');

describe('mappers', () => {
  it('maps a player payload', () => {
    const mapped = mapPlayer({
      id: 10,
      first_name: 'Mo',
      second_name: 'Salah',
      web_name: 'Salah',
      team: 1,
      element_type: 3,
      now_cost: 125,
      selected_by_percent: '45.3',
      form: '7.5',
      total_points: 200,
      status: 'a',
    });

    expect(mapped.id).toBe(10);
    expect(mapped.position).toBe('MID');
    expect(mapped.webName).toBe('Salah');
  });

  it('maps team, fixture and event payloads', () => {
    expect(
      mapTeam({
        id: 2,
        name: 'Arsenal',
        short_name: 'ARS',
        points: 67,
        strength_defence_away: 1210,
        pulse_id: 3,
      })
    ).toMatchObject({
      id: 2,
      name: 'Arsenal',
      shortName: 'ARS',
      points: 67,
      strengthDefenceAway: 1210,
      pulseId: 3,
    });
    expect(mapFixture({ id: 3, event: 5, team_h: 1, team_a: 2, finished: false })).toMatchObject({
      id: 3,
      event: 5,
    });
    expect(mapEvent({ id: 7, name: 'Gameweek 7', is_current: true })).toMatchObject({
      id: 7,
      isCurrent: true,
    });
  });

  it('returns null for invalid required fields', () => {
    expect(mapPlayer({ first_name: 'MissingId' })).toBeNull();
    expect(mapTeam({ id: 1 })).toBeNull();
    expect(mapFixture({ event: 2 })).toBeNull();
    expect(mapEvent({ name: 'No id' })).toBeNull();
  });

  it('filters invalid mapped items from mapArray', () => {
    const mapped = mapArray([{ id: 1, name: 'A' }, { bad: true }], mapTeam, 'teams');
    expect(mapped).toHaveLength(1);
    expect(mapped[0].id).toBe(1);
  });
});
