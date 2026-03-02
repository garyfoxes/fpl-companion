function matchesSearch(player, search) {
  if (!search) {
    return true;
  }

  const haystack = [player.firstName, player.lastName, player.webName]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(search.toLowerCase());
}

function filterPlayers(players, args) {
  return players.filter((player) => {
    if (!matchesSearch(player, args.search)) {
      return false;
    }

    if (Number.isInteger(args.teamId) && player.teamId !== args.teamId) {
      return false;
    }

    if (args.position && player.position?.toLowerCase() !== args.position.toLowerCase()) {
      return false;
    }

    return true;
  });
}

function filterFixtures(fixtures, args) {
  return fixtures.filter((fixture) => {
    if (Number.isInteger(args.eventId) && fixture.event !== args.eventId) {
      return false;
    }

    if (
      Number.isInteger(args.teamId) &&
      fixture.teamH !== args.teamId &&
      fixture.teamA !== args.teamId
    ) {
      return false;
    }

    if (typeof args.finished === 'boolean' && fixture.finished !== args.finished) {
      return false;
    }

    return true;
  });
}

module.exports = {
  filterPlayers,
  filterFixtures,
};
