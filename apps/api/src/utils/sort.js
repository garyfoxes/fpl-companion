const TEAM_ORDER_FIELD_TO_KEY = {
  id: 'id',
  name: 'name',
  short_name: 'shortName',
  code: 'code',
  played: 'played',
  win: 'win',
  draw: 'draw',
  loss: 'loss',
  points: 'points',
  position: 'position',
  strength: 'strength',
  strength_overall_home: 'strengthOverallHome',
  strength_overall_away: 'strengthOverallAway',
  strength_attack_home: 'strengthAttackHome',
  strength_attack_away: 'strengthAttackAway',
  strength_defence_home: 'strengthDefenceHome',
  strength_defence_away: 'strengthDefenceAway',
  pulse_id: 'pulseId',
};

function compareValues(a, b, direction) {
  const dir = direction === 'DESC' ? -1 : 1;

  if (a === b) {
    return 0;
  }

  if (a === null || a === undefined) {
    return 1;
  }

  if (b === null || b === undefined) {
    return -1;
  }

  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b) * dir;
  }

  return (a < b ? -1 : 1) * dir;
}

function sortTeams(teams, orderBy) {
  if (!orderBy?.field) {
    return teams;
  }

  const key = TEAM_ORDER_FIELD_TO_KEY[orderBy.field];
  if (!key) {
    return teams;
  }

  const direction = orderBy.direction || 'ASC';
  return [...teams].sort((left, right) => compareValues(left[key], right[key], direction));
}

const PLAYER_ORDER_FIELD_TO_KEY = {
  totalPoints: 'totalPoints',
  form: 'form',
  nowCost: 'nowCost',
  transfersInEvent: 'transfersInEvent',
};

function sortPlayers(players, orderBy) {
  if (!orderBy?.field) {
    return players;
  }

  const key = PLAYER_ORDER_FIELD_TO_KEY[orderBy.field];
  if (!key) {
    return players;
  }

  const direction = orderBy.direction || 'ASC';

  return [...players].sort((left, right) => {
    let a = left[key];
    let b = right[key];

    // form is a decimal string like "8.1" — parse for correct numeric comparison
    if (key === 'form') {
      a = a !== null && a !== undefined ? Number.parseFloat(a) : null;
      b = b !== null && b !== undefined ? Number.parseFloat(b) : null;
    }

    return compareValues(a, b, direction);
  });
}

module.exports = {
  sortTeams,
  sortPlayers,
};
