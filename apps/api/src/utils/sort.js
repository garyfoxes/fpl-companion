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
  if (!orderBy || !orderBy.field) {
    return teams;
  }

  const key = TEAM_ORDER_FIELD_TO_KEY[orderBy.field];
  if (!key) {
    return teams;
  }

  const direction = orderBy.direction || 'ASC';
  return [...teams].sort((left, right) => compareValues(left[key], right[key], direction));
}

module.exports = {
  sortTeams,
};
