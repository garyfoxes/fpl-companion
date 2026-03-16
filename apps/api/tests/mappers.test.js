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
      goals_scored: 18,
      assists: 9,
      minutes: 2700,
      clean_sheets: 0,
      yellow_cards: 2,
      red_cards: 0,
      bps: 450,
      bonus: 30,
      influence: '120.5',
      creativity: '98.2',
      threat: '200.1',
      ict_index: '50.3',
      influence_rank: 5,
      creativity_rank: 8,
      threat_rank: 3,
      ict_index_rank: 4,
      expected_goals: '15.34',
      expected_assists: '8.11',
      expected_goal_involvements: '23.45',
      cost_change_event: 1,
      cost_change_start: -2,
      news: '',
      chance_of_playing_this_round: null,
      chance_of_playing_next_round: null,
      transfers_in_event: 50000,
      transfers_out_event: 12000,
    });

    expect(mapped.id).toBe(10);
    expect(mapped.position).toBe('MID');
    expect(mapped.webName).toBe('Salah');
    // Season stats
    expect(mapped.goals).toBe(18);
    expect(mapped.assists).toBe(9);
    expect(mapped.minutes).toBe(2700);
    expect(mapped.cleanSheets).toBe(0);
    expect(mapped.yellowCards).toBe(2);
    expect(mapped.redCards).toBe(0);
    expect(mapped.bps).toBe(450);
    expect(mapped.bonusPoints).toBe(30);
    // ICT
    expect(mapped.influence).toBe('120.5');
    expect(mapped.creativity).toBe('98.2');
    expect(mapped.threat).toBe('200.1');
    expect(mapped.ictIndex).toBe('50.3');
    expect(mapped.influenceRank).toBe(5);
    expect(mapped.creativityRank).toBe(8);
    expect(mapped.threatRank).toBe(3);
    expect(mapped.ictIndexRank).toBe(4);
    // xG
    expect(mapped.expectedGoals).toBe('15.34');
    expect(mapped.expectedAssists).toBe('8.11');
    expect(mapped.expectedGoalInvolvements).toBe('23.45');
    // Price
    expect(mapped.costChangeEvent).toBe(1);
    expect(mapped.costChangeStart).toBe(-2);
    // Availability — empty string news maps to null
    expect(mapped.news).toBeNull();
    expect(mapped.chanceOfPlayingThisRound).toBeNull();
    expect(mapped.chanceOfPlayingNextRound).toBeNull();
    // Transfers
    expect(mapped.transfersInEvent).toBe(50000);
    expect(mapped.transfersOutEvent).toBe(12000);
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

  it('preserves ICT/xG string-decimal fields', () => {
    const mapped = mapPlayer({
      id: 1,
      first_name: 'X',
      second_name: 'Y',
      team: 1,
      influence: '0.0',
      creativity: '12.34',
      threat: '56.78',
      ict_index: '9.99',
      expected_goals: '0.12',
      expected_assists: '3.45',
      expected_goal_involvements: '3.57',
    });
    expect(mapped.influence).toBe('0.0');
    expect(mapped.creativity).toBe('12.34');
    expect(mapped.threat).toBe('56.78');
    expect(mapped.ictIndex).toBe('9.99');
    expect(mapped.expectedGoals).toBe('0.12');
    expect(mapped.expectedAssists).toBe('3.45');
    expect(mapped.expectedGoalInvolvements).toBe('3.57');
  });

  it('maps null and empty news correctly', () => {
    const withEmpty = mapPlayer({ id: 1, first_name: 'A', second_name: 'B', team: 1, news: '' });
    expect(withEmpty.news).toBeNull();

    const withNews = mapPlayer({
      id: 2,
      first_name: 'A',
      second_name: 'B',
      team: 1,
      news: 'Knee injury',
    });
    expect(withNews.news).toBe('Knee injury');

    const withNull = mapPlayer({ id: 3, first_name: 'A', second_name: 'B', team: 1, news: null });
    expect(withNull.news).toBeNull();
  });

  it('maps null chance_of_playing fields to null', () => {
    const mapped = mapPlayer({
      id: 1,
      first_name: 'A',
      second_name: 'B',
      team: 1,
      chance_of_playing_this_round: null,
      chance_of_playing_next_round: null,
    });
    expect(mapped.chanceOfPlayingThisRound).toBeNull();
    expect(mapped.chanceOfPlayingNextRound).toBeNull();
  });

  it('maps non-null chance_of_playing fields', () => {
    const mapped = mapPlayer({
      id: 1,
      first_name: 'A',
      second_name: 'B',
      team: 1,
      chance_of_playing_this_round: 75,
      chance_of_playing_next_round: 50,
    });
    expect(mapped.chanceOfPlayingThisRound).toBe(75);
    expect(mapped.chanceOfPlayingNextRound).toBe(50);
  });
});
