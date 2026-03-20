import { useQuery } from '@apollo/client';
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { ComparisonPanel } from '../components/ComparisonPanel';
import { DetailPanel } from '../components/DetailPanel';
import { PageState } from '../components/PageState';
import { PLAYER_QUERY, PLAYERS_BY_IDS_QUERY, PLAYERS_QUERY, TEAMS_QUERY } from '../lib/queries';
import { readIntArrayParam, readIntParam, setParam } from '../utils/urlState';

const POSITION_OPTIONS = ['GKP', 'DEF', 'MID', 'FWD'];
const SORT_ALLOWLIST = new Set(['totalPoints', 'form', 'nowCost']);

function formatTransfers(player) {
  if (player.transfersInEvent === null || player.transfersInEvent === undefined) return 'N/A';
  const inStr = `\u2191${player.transfersInEvent.toLocaleString()}`;
  const outStr =
    player.transfersOutEvent !== null && player.transfersOutEvent !== undefined
      ? ` / \u2193${player.transfersOutEvent.toLocaleString()}`
      : '';
  return `${inStr}${outStr}`;
}

export function PlayersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = readIntParam(searchParams, 'selected');

  const search = searchParams.get('q') || '';
  const teamId = readIntParam(searchParams, 'teamId');
  const position = searchParams.get('position') || '';
  const sortField = SORT_ALLOWLIST.has(searchParams.get('sortField'))
    ? searchParams.get('sortField')
    : null;
  const sortDir = searchParams.get('sortDir') || 'DESC';
  const compareIds = readIntArrayParam(searchParams, 'compare');

  const sortDirection = sortDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const orderBy = sortField ? { field: sortField, direction: sortDirection } : null;

  const { data, loading, error } = useQuery(PLAYERS_QUERY, {
    variables: {
      search: search || null,
      teamId,
      position: position || null,
      orderBy,
      limit: 200,
      offset: 0,
    },
  });

  const teamsQuery = useQuery(TEAMS_QUERY);

  const detailQuery = useQuery(PLAYER_QUERY, {
    variables: { id: selectedId || -1 },
    skip: !selectedId,
  });

  const compareQuery = useQuery(PLAYERS_BY_IDS_QUERY, {
    variables: { ids: compareIds },
    skip: compareIds.length < 2,
  });

  const players = data?.players || [];
  const teamMap = Object.fromEntries((teamsQuery.data?.teams || []).map((t) => [t.id, t]));
  const comparePlayers = compareQuery.data?.playersByIds || [];
  const showComparison = compareIds.length >= 2;

  function updateFilter(key, value) {
    let next = setParam(searchParams, key, value);
    next = setParam(next, 'selected', null);
    setSearchParams(next, { replace: true });
  }

  function selectPlayer(id) {
    const next = setParam(searchParams, 'selected', id);
    setSearchParams(next, { replace: true });
  }

  function handleSortClick(field) {
    let next;
    if (sortField === field) {
      const newDir = sortDir.toUpperCase() === 'ASC' ? 'DESC' : 'ASC';
      next = setParam(searchParams, 'sortDir', newDir);
    } else {
      next = setParam(searchParams, 'sortField', field);
      next = setParam(next, 'sortDir', 'DESC');
    }
    next = setParam(next, 'selected', null);
    setSearchParams(next, { replace: true });
  }

  function toggleCompare(id) {
    const ids = new Set(compareIds);
    if (ids.has(id)) {
      ids.delete(id);
    } else if (ids.size < 3) {
      ids.add(id);
    }
    const next = setParam(searchParams, 'compare', ids.size > 0 ? [...ids].join(',') : null);
    setSearchParams(next, { replace: true });
  }

  function clearComparison() {
    const next = setParam(searchParams, 'compare', null);
    setSearchParams(next, { replace: true });
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Players
      </Typography>

      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Search player"
              value={search}
              onChange={(event) => updateFilter('q', event.target.value)}
              fullWidth
            />
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel id="players-team-filter">Team</InputLabel>
              <Select
                labelId="players-team-filter"
                value={teamId || ''}
                label="Team"
                onChange={(event) => updateFilter('teamId', event.target.value || null)}
              >
                <MenuItem value="">All teams</MenuItem>
                {(teamsQuery.data?.teams || []).map((team) => (
                  <MenuItem key={team.id} value={team.id}>
                    {team.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel id="players-position-filter">Position</InputLabel>
              <Select
                labelId="players-position-filter"
                value={position}
                label="Position"
                onChange={(event) => updateFilter('position', event.target.value || null)}
              >
                <MenuItem value="">All positions</MenuItem>
                {POSITION_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {compareIds.length >= 2 && (
        <Button
          variant="outlined"
          onClick={showComparison ? clearComparison : () => {}}
          sx={{ alignSelf: 'flex-start' }}
        >
          Compare ({compareIds.length})
        </Button>
      )}

      {showComparison && comparePlayers.length >= 2 && (
        <ComparisonPanel players={comparePlayers} onClose={clearComparison} />
      )}

      <PageState
        loading={loading || teamsQuery.loading}
        error={error || teamsQuery.error}
        isEmpty={!loading && !error && players.length === 0}
        emptyMessage="No players matched your filters."
      >
        <TableContainer component={Card} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell>Name</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Team</TableCell>
                <TableCell
                  sortDirection={sortField === 'totalPoints' ? sortDir.toLowerCase() : false}
                >
                  <TableSortLabel
                    active={sortField === 'totalPoints'}
                    direction={sortField === 'totalPoints' ? sortDir.toLowerCase() : 'desc'}
                    onClick={() => handleSortClick('totalPoints')}
                  >
                    Total Points
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortField === 'form' ? sortDir.toLowerCase() : false}>
                  <TableSortLabel
                    active={sortField === 'form'}
                    direction={sortField === 'form' ? sortDir.toLowerCase() : 'desc'}
                    onClick={() => handleSortClick('form')}
                  >
                    Form
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortField === 'nowCost' ? sortDir.toLowerCase() : false}>
                  <TableSortLabel
                    active={sortField === 'nowCost'}
                    direction={sortField === 'nowCost' ? sortDir.toLowerCase() : 'desc'}
                    onClick={() => handleSortClick('nowCost')}
                  >
                    Price
                  </TableSortLabel>
                </TableCell>
                <TableCell>Transfers (GW)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {players.map((player) => (
                <TableRow
                  key={player.id}
                  hover
                  onClick={() => selectPlayer(player.id)}
                  selected={player.id === selectedId}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={compareIds.includes(player.id)}
                      size="small"
                      onChange={() => toggleCompare(player.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell>{player.webName}</TableCell>
                  <TableCell>{player.position}</TableCell>
                  <TableCell>
                    {(teamMap[player.teamId]?.shortName ||
                      teamMap[player.teamId]?.name ||
                      player.teamId) ??
                      'N/A'}
                  </TableCell>
                  <TableCell>{player.totalPoints ?? 'N/A'}</TableCell>
                  <TableCell>{player.form ?? 'N/A'}</TableCell>
                  <TableCell>{player.nowCost ?? 'N/A'}</TableCell>
                  <TableCell>{formatTransfers(player)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </PageState>

      {selectedId && detailQuery.data?.player ? (
        <DetailPanel
          title={`Player details: ${detailQuery.data.player.webName}`}
          rows={[
            { label: 'First Name', value: detailQuery.data.player.firstName },
            { label: 'Last Name', value: detailQuery.data.player.lastName },
            { label: 'Status', value: detailQuery.data.player.status },
            { label: 'News', value: detailQuery.data.player.news },
            {
              label: 'Chance of Playing (This Round)',
              value: detailQuery.data.player.chanceOfPlayingThisRound,
            },
            {
              label: 'Chance of Playing (Next Round)',
              value: detailQuery.data.player.chanceOfPlayingNextRound,
            },
            { label: 'Selected By %', value: detailQuery.data.player.selectedByPercent },
            { label: 'Price', value: detailQuery.data.player.nowCost },
            { label: 'Price Change (Event)', value: detailQuery.data.player.costChangeEvent },
            { label: 'Price Change (Start)', value: detailQuery.data.player.costChangeStart },
            { label: 'Goals', value: detailQuery.data.player.goals },
            { label: 'Assists', value: detailQuery.data.player.assists },
            { label: 'Minutes', value: detailQuery.data.player.minutes },
            { label: 'Clean Sheets', value: detailQuery.data.player.cleanSheets },
            { label: 'Yellow Cards', value: detailQuery.data.player.yellowCards },
            { label: 'Red Cards', value: detailQuery.data.player.redCards },
            { label: 'BPS', value: detailQuery.data.player.bps },
            { label: 'Bonus Points', value: detailQuery.data.player.bonusPoints },
            { label: 'Influence', value: detailQuery.data.player.influence },
            { label: 'Creativity', value: detailQuery.data.player.creativity },
            { label: 'Threat', value: detailQuery.data.player.threat },
            { label: 'ICT Index', value: detailQuery.data.player.ictIndex },
            { label: 'Influence Rank', value: detailQuery.data.player.influenceRank },
            { label: 'Creativity Rank', value: detailQuery.data.player.creativityRank },
            { label: 'Threat Rank', value: detailQuery.data.player.threatRank },
            { label: 'ICT Index Rank', value: detailQuery.data.player.ictIndexRank },
            { label: 'xG', value: detailQuery.data.player.expectedGoals },
            { label: 'xA', value: detailQuery.data.player.expectedAssists },
            { label: 'xGI', value: detailQuery.data.player.expectedGoalInvolvements },
            { label: 'Transfers In (Event)', value: detailQuery.data.player.transfersInEvent },
            { label: 'Transfers Out (Event)', value: detailQuery.data.player.transfersOutEvent },
          ]}
        />
      ) : null}
    </Stack>
  );
}
