const POSITION_MAP = {
  1: 'GKP',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

function asNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true' || value === 1 || value === '1') {
    return true;
  }

  if (value === 'false' || value === 0 || value === '0') {
    return false;
  }

  return false;
}

function asString(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function mapPlayer(item) {
  const id = asNumber(item.id ?? item.code ?? item.player_id);
  if (!id) {
    return null;
  }

  const firstName = asString(item.first_name ?? item.firstName) || '';
  const lastName = asString(item.second_name ?? item.last_name ?? item.lastName) || '';

  return {
    id,
    firstName,
    lastName,
    webName: asString(item.web_name ?? item.webName) || `${firstName} ${lastName}`.trim(),
    teamId: asNumber(item.team ?? item.teamId ?? item.team_id),
    position:
      asString(item.position) ||
      POSITION_MAP[asNumber(item.element_type ?? item.elementType)] ||
      'UNK',
    nowCost: asNumber(item.now_cost ?? item.nowCost),
    selectedByPercent: asString(item.selected_by_percent ?? item.selectedByPercent),
    form: asString(item.form),
    totalPoints: asNumber(item.total_points ?? item.totalPoints),
    status: asString(item.status) || 'unknown',
    // Season stats
    goals: asNumber(item.goals_scored),
    assists: asNumber(item.assists),
    minutes: asNumber(item.minutes),
    cleanSheets: asNumber(item.clean_sheets),
    yellowCards: asNumber(item.yellow_cards),
    redCards: asNumber(item.red_cards),
    bps: asNumber(item.bps),
    bonusPoints: asNumber(item.bonus),
    // ICT Index
    influence: asString(item.influence),
    creativity: asString(item.creativity),
    threat: asString(item.threat),
    ictIndex: asString(item.ict_index),
    influenceRank: asNumber(item.influence_rank),
    creativityRank: asNumber(item.creativity_rank),
    threatRank: asNumber(item.threat_rank),
    ictIndexRank: asNumber(item.ict_index_rank),
    // xG
    expectedGoals: asString(item.expected_goals),
    expectedAssists: asString(item.expected_assists),
    expectedGoalInvolvements: asString(item.expected_goal_involvements),
    // Price
    costChangeEvent: asNumber(item.cost_change_event),
    costChangeStart: asNumber(item.cost_change_start),
    // Availability
    news: asString(item.news),
    chanceOfPlayingThisRound: asNumber(item.chance_of_playing_this_round),
    chanceOfPlayingNextRound: asNumber(item.chance_of_playing_next_round),
    // Transfers
    transfersInEvent: asNumber(item.transfers_in_event),
    transfersOutEvent: asNumber(item.transfers_out_event),
  };
}

function mapTeam(item) {
  const id = asNumber(item.id ?? item.team_id);
  const name = asString(item.name);
  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    shortName: asString(item.short_name ?? item.shortName),
    code: asNumber(item.code),
    played: asNumber(item.played),
    win: asNumber(item.win),
    draw: asNumber(item.draw),
    loss: asNumber(item.loss),
    points: asNumber(item.points),
    strength: asNumber(item.strength),
    strengthOverallHome: asNumber(item.strength_overall_home ?? item.strengthOverallHome),
    strengthOverallAway: asNumber(item.strength_overall_away ?? item.strengthOverallAway),
    strengthAttackHome: asNumber(item.strength_attack_home ?? item.strengthAttackHome),
    strengthAttackAway: asNumber(item.strength_attack_away ?? item.strengthAttackAway),
    strengthDefenceHome: asNumber(item.strength_defence_home ?? item.strengthDefenceHome),
    strengthDefenceAway: asNumber(item.strength_defence_away ?? item.strengthDefenceAway),
    pulseId: asNumber(item.pulse_id ?? item.pulseId),
    form: asString(item.form),
    position: asNumber(item.position),
  };
}

function mapFixture(item) {
  const id = asNumber(item.id ?? item.fixture_id);
  if (!id) {
    return null;
  }

  return {
    id,
    event: asNumber(item.event ?? item.event_id),
    kickoffTime: asString(item.kickoff_time ?? item.kickoffTime),
    teamH: asNumber(item.team_h ?? item.teamH),
    teamA: asNumber(item.team_a ?? item.teamA),
    teamHScore: asNumber(item.team_h_score ?? item.teamHScore),
    teamAScore: asNumber(item.team_a_score ?? item.teamAScore),
    finished: asBoolean(item.finished),
    started: asBoolean(item.started),
    teamHDifficulty: asNumber(item.team_h_difficulty ?? item.teamHDifficulty),
    teamADifficulty: asNumber(item.team_a_difficulty ?? item.teamADifficulty),
  };
}

function mapEvent(item) {
  const id = asNumber(item.id ?? item.event_id);
  if (!id) {
    return null;
  }

  return {
    id,
    name: asString(item.name) || `Gameweek ${id}`,
    deadlineTime: asString(item.deadline_time ?? item.deadlineTime),
    averageEntryScore: asNumber(item.average_entry_score ?? item.averageEntryScore),
    finished: asBoolean(item.finished),
    dataChecked: asBoolean(item.data_checked ?? item.dataChecked),
    isCurrent: asBoolean(item.is_current ?? item.isCurrent),
    isNext: asBoolean(item.is_next ?? item.isNext),
    isPrevious: asBoolean(item.is_previous ?? item.isPrevious),
  };
}

function mapArray(items, mapper, entityName) {
  let dropped = 0;
  const mapped = items
    .map((item) => mapper(item))
    .filter((item) => {
      if (item) {
        return true;
      }
      dropped += 1;
      return false;
    });

  if (dropped > 0) {
    console.warn(`Dropped ${dropped} invalid ${entityName} record(s) from upstream payload.`);
  }

  return mapped;
}

module.exports = {
  mapPlayer,
  mapTeam,
  mapFixture,
  mapEvent,
  mapArray,
};
