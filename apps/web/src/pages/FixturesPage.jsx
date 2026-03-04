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
  Typography,
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { DetailPanel } from '../components/DetailPanel';
import { PageState } from '../components/PageState';
import { EVENTS_QUERY, FIXTURE_QUERY, FIXTURES_QUERY, TEAMS_QUERY } from '../lib/queries';
import { readBooleanParam, readIntParam, setParam } from '../utils/urlState';

export function FixturesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedId = readIntParam(searchParams, 'selected');
  const eventId = readIntParam(searchParams, 'eventId');
  const teamId = readIntParam(searchParams, 'teamId');
  const finished = readBooleanParam(searchParams, 'finished');

  const fixturesQuery = useQuery(FIXTURES_QUERY, {
    variables: {
      eventId,
      teamId,
      finished,
      limit: 300,
      offset: 0,
    },
  });

  const teamsQuery = useQuery(TEAMS_QUERY);
  const eventsQuery = useQuery(EVENTS_QUERY);

  const detailQuery = useQuery(FIXTURE_QUERY, {
    variables: { id: selectedId || -1 },
    skip: !selectedId,
  });

  function updateFilter(key, value) {
    let next = setParam(searchParams, key, value);
    next = setParam(next, 'selected', null);
    setSearchParams(next, { replace: true });
  }

  const combinedError = fixturesQuery.error || teamsQuery.error || eventsQuery.error;
  const combinedLoading = fixturesQuery.loading || teamsQuery.loading || eventsQuery.loading;
  const fixtures = fixturesQuery.data?.fixtures || [];

  const teamMap = Object.fromEntries((teamsQuery.data?.teams || []).map((t) => [t.id, t]));

  function teamLabel(id) {
    return teamMap[id]?.shortName || teamMap[id]?.name || String(id ?? 'N/A');
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Fixtures
      </Typography>

      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel id="fixture-event-filter">Gameweek</InputLabel>
              <Select
                labelId="fixture-event-filter"
                value={eventId || ''}
                label="Gameweek"
                onChange={(event) => updateFilter('eventId', event.target.value || null)}
              >
                <MenuItem value="">All gameweeks</MenuItem>
                {(eventsQuery.data?.events || []).map((event) => (
                  <MenuItem key={event.id} value={event.id}>
                    {event.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel id="fixture-team-filter">Team</InputLabel>
              <Select
                labelId="fixture-team-filter"
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
              <InputLabel id="fixture-finished-filter">Status</InputLabel>
              <Select
                labelId="fixture-finished-filter"
                value={finished === null ? '' : String(finished)}
                label="Status"
                onChange={(event) => {
                  if (!event.target.value) {
                    updateFilter('finished', null);
                  } else {
                    updateFilter('finished', event.target.value);
                  }
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Finished</MenuItem>
                <MenuItem value="false">Upcoming/Live</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      <PageState
        loading={combinedLoading}
        error={combinedError}
        isEmpty={!combinedLoading && !combinedError && fixtures.length === 0}
        emptyMessage="No fixtures matched your filters."
      >
        <TableContainer component={Card} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Gameweek</TableCell>
                <TableCell>Home</TableCell>
                <TableCell>Away</TableCell>
                <TableCell>Kickoff</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fixtures.map((fixture) => (
                <TableRow
                  key={fixture.id}
                  hover
                  selected={fixture.id === selectedId}
                  onClick={() =>
                    setSearchParams(setParam(searchParams, 'selected', fixture.id), {
                      replace: true,
                    })
                  }
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{fixture.id}</TableCell>
                  <TableCell>{fixture.event ?? 'N/A'}</TableCell>
                  <TableCell>{teamLabel(fixture.teamH)}</TableCell>
                  <TableCell>{teamLabel(fixture.teamA)}</TableCell>
                  <TableCell>{fixture.kickoffTime || 'TBC'}</TableCell>
                  <TableCell>{fixture.finished ? 'Finished' : 'Not finished'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </PageState>

      {selectedId && detailQuery.data?.fixture ? (
        <DetailPanel
          title={`Fixture details: #${detailQuery.data.fixture.id}`}
          rows={[
            { label: 'Home Score', value: detailQuery.data.fixture.teamHScore },
            { label: 'Away Score', value: detailQuery.data.fixture.teamAScore },
            { label: 'Home Difficulty', value: detailQuery.data.fixture.teamHDifficulty },
            { label: 'Away Difficulty', value: detailQuery.data.fixture.teamADifficulty },
            { label: 'Started', value: String(detailQuery.data.fixture.started) },
          ]}
        />
      ) : null}
    </Stack>
  );
}
