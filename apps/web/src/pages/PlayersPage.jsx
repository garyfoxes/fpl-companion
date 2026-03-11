import { useQuery } from '@apollo/client';
import {
  Card,
  CardContent,
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
  TextField,
  Typography,
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { DetailPanel } from '../components/DetailPanel';
import { PageState } from '../components/PageState';
import { PLAYER_QUERY, PLAYERS_QUERY, TEAMS_QUERY } from '../lib/queries';
import { readIntParam, setParam } from '../utils/urlState';

const POSITION_OPTIONS = ['GKP', 'DEF', 'MID', 'FWD'];

export function PlayersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = readIntParam(searchParams, 'selected');

  const search = searchParams.get('q') || '';
  const teamId = readIntParam(searchParams, 'teamId');
  const position = searchParams.get('position') || '';

  const { data, loading, error } = useQuery(PLAYERS_QUERY, {
    variables: {
      search: search || null,
      teamId,
      position: position || null,
      limit: 200,
      offset: 0,
    },
  });

  const teamsQuery = useQuery(TEAMS_QUERY);

  const detailQuery = useQuery(PLAYER_QUERY, {
    variables: { id: selectedId || -1 },
    skip: !selectedId,
  });

  const players = data?.players || [];
  const teamMap = Object.fromEntries((teamsQuery.data?.teams || []).map((t) => [t.id, t]));

  function updateFilter(key, value) {
    let next = setParam(searchParams, key, value);
    next = setParam(next, 'selected', null);
    setSearchParams(next, { replace: true });
  }

  function selectPlayer(id) {
    const next = setParam(searchParams, 'selected', id);
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
                <TableCell>Name</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Team</TableCell>
                <TableCell>Total Points</TableCell>
                <TableCell>Form</TableCell>
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
            { label: 'Selected By %', value: detailQuery.data.player.selectedByPercent },
            { label: 'Price', value: detailQuery.data.player.nowCost },
          ]}
        />
      ) : null}
    </Stack>
  );
}
