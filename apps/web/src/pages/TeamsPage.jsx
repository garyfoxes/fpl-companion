import { useQuery } from '@apollo/client';
import {
  Card,
  CardContent,
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
import { TEAM_QUERY, TEAMS_QUERY } from '../lib/queries';
import { readIntParam, setParam } from '../utils/urlState';

export function TeamsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = readIntParam(searchParams, 'selected');
  const search = searchParams.get('q') || '';

  const { data, loading, error } = useQuery(TEAMS_QUERY);
  const detailQuery = useQuery(TEAM_QUERY, {
    variables: { id: selectedId || -1 },
    skip: !selectedId,
  });

  const teams = (data?.teams || []).filter((team) =>
    team.name.toLowerCase().includes(search.toLowerCase())
  );

  function updateSearch(value) {
    const next = setParam(searchParams, 'q', value);
    setSearchParams(setParam(next, 'selected', null), { replace: true });
  }

  function selectTeam(id) {
    setSearchParams(setParam(searchParams, 'selected', id), { replace: true });
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Teams
      </Typography>

      <Card variant="outlined">
        <CardContent>
          <TextField
            label="Search team"
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            fullWidth
          />
        </CardContent>
      </Card>

      <PageState
        loading={loading}
        error={error}
        isEmpty={!loading && !error && teams.length === 0}
        emptyMessage="No teams matched your filters."
      >
        <TableContainer component={Card} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Short Name</TableCell>
                <TableCell>Strength</TableCell>
                <TableCell>Position</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teams.map((team) => (
                <TableRow
                  key={team.id}
                  hover
                  onClick={() => selectTeam(team.id)}
                  selected={team.id === selectedId}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{team.name}</TableCell>
                  <TableCell>{team.shortName ?? 'N/A'}</TableCell>
                  <TableCell>{team.strength ?? 'N/A'}</TableCell>
                  <TableCell>{team.position ?? 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </PageState>

      {selectedId && detailQuery.data?.team ? (
        <DetailPanel
          title={`Team details: ${detailQuery.data.team.name}`}
          rows={[
            { label: 'Short Name', value: detailQuery.data.team.shortName },
            { label: 'Strength', value: detailQuery.data.team.strength },
            { label: 'Form', value: detailQuery.data.team.form },
            { label: 'Position', value: detailQuery.data.team.position },
            {
              label: 'Played',
              value:
                detailQuery.data.team.win !== null &&
                detailQuery.data.team.win !== undefined &&
                detailQuery.data.team.draw !== null &&
                detailQuery.data.team.draw !== undefined &&
                detailQuery.data.team.loss !== null &&
                detailQuery.data.team.loss !== undefined
                  ? detailQuery.data.team.win +
                    detailQuery.data.team.draw +
                    detailQuery.data.team.loss
                  : null,
            },
            { label: 'Win', value: detailQuery.data.team.win },
            { label: 'Draw', value: detailQuery.data.team.draw },
            { label: 'Loss', value: detailQuery.data.team.loss },
            { label: 'Points', value: detailQuery.data.team.points },
            { label: 'Strength Overall (H)', value: detailQuery.data.team.strengthOverallHome },
            { label: 'Strength Overall (A)', value: detailQuery.data.team.strengthOverallAway },
            { label: 'Strength Attack (H)', value: detailQuery.data.team.strengthAttackHome },
            { label: 'Strength Attack (A)', value: detailQuery.data.team.strengthAttackAway },
            { label: 'Strength Defence (H)', value: detailQuery.data.team.strengthDefenceHome },
            { label: 'Strength Defence (A)', value: detailQuery.data.team.strengthDefenceAway },
          ]}
        />
      ) : null}
    </Stack>
  );
}
