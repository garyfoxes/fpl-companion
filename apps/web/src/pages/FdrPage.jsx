import { useQuery } from '@apollo/client';
import {
  Box,
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
import { PageState } from '../components/PageState';
import { FDR_COLORS } from '../components/DifficultyChip';
import { FDR_FIXTURES_QUERY, TEAMS_QUERY } from '../lib/queries';
import { readIntParam, setParam } from '../utils/urlState';

const WINDOW_OPTIONS = [3, 5, 8];

export function FdrPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = readIntParam(searchParams, 'window');
  const windowSize = WINDOW_OPTIONS.includes(raw) ? raw : 5;

  const fixturesQuery = useQuery(FDR_FIXTURES_QUERY);
  const teamsQuery = useQuery(TEAMS_QUERY);

  const combinedLoading = fixturesQuery.loading || teamsQuery.loading;
  const combinedError = fixturesQuery.error || teamsQuery.error;
  const fixtures = fixturesQuery.data?.fixtures || [];
  const teams = teamsQuery.data?.teams || [];

  const teamMap = new Map(teams.map((t) => [t.id, t]));

  const rows = teams.map((team) => {
    const teamFixtures = fixtures
      .filter((f) => f.teamH === team.id || f.teamA === team.id)
      .sort((a, b) => a.event - b.event || new Date(a.kickoffTime) - new Date(b.kickoffTime))
      .slice(0, windowSize);

    const slots = teamFixtures.map((f) => {
      const isHome = f.teamH === team.id;
      const opponentId = isHome ? f.teamA : f.teamH;
      const difficulty = isHome ? f.teamHDifficulty : f.teamADifficulty;
      const opponent = teamMap.get(opponentId);
      return {
        opponentShortName: opponent?.shortName || String(opponentId ?? 'N/A'),
        isHome,
        difficulty,
      };
    });

    const validDiffs = slots.filter((s) => s.difficulty !== null && s.difficulty !== undefined);
    const aggregateDifficulty = validDiffs.reduce((sum, s) => sum + s.difficulty, 0);
    const avgDifficulty = validDiffs.length > 0 ? aggregateDifficulty / validDiffs.length : null;
    const isEasyRun = avgDifficulty !== null && avgDifficulty <= 2.5;
    const isHardRun = avgDifficulty !== null && avgDifficulty > 3.5;

    return { team, slots, aggregateDifficulty, isEasyRun, isHardRun };
  });

  rows.sort(
    (a, b) =>
      a.aggregateDifficulty - b.aggregateDifficulty ||
      (a.team.shortName || '').localeCompare(b.team.shortName || '')
  );

  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Fixture Difficulty Rating
      </Typography>

      <FormControl sx={{ minWidth: 120, alignSelf: 'flex-start' }}>
        <InputLabel id="fdr-window-label">Window</InputLabel>
        <Select
          labelId="fdr-window-label"
          value={windowSize}
          label="Window"
          inputProps={{ 'data-testid': 'window-select' }}
          onChange={(e) =>
            setSearchParams(setParam(searchParams, 'window', e.target.value), { replace: true })
          }
        >
          {WINDOW_OPTIONS.map((n) => (
            <MenuItem key={n} value={n}>
              {n}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <PageState
        loading={combinedLoading}
        error={combinedError}
        isEmpty={
          !combinedLoading && !combinedError && (fixtures.length === 0 || teams.length === 0)
        }
        emptyMessage="No upcoming fixtures found."
      >
        <Box sx={{ overflowX: 'auto' }}>
          <TableContainer>
            <Table size="small" data-testid="fdr-matrix">
              <TableHead>
                <TableRow>
                  <TableCell>Team</TableCell>
                  {Array.from({ length: windowSize }, (_, i) => (
                    <TableCell key={i} align="center">
                      {i + 1}
                    </TableCell>
                  ))}
                  <TableCell align="center">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(({ team, slots, aggregateDifficulty, isEasyRun, isHardRun }) => {
                  let rowBg = 'inherit';
                  if (isEasyRun) rowBg = 'success.light';
                  else if (isHardRun) rowBg = 'error.light';
                  return (
                    <TableRow
                      key={team.id}
                      data-testid={`fdr-row-${team.shortName}`}
                      sx={{ bgcolor: rowBg }}
                    >
                      <TableCell>{team.shortName}</TableCell>
                      {Array.from({ length: windowSize }, (_, i) => {
                        const slot = slots[i];
                        if (!slot) {
                          return (
                            <TableCell key={i} align="center" data-testid="fdr-placeholder">
                              –
                            </TableCell>
                          );
                        }
                        return (
                          <TableCell
                            key={i}
                            align="center"
                            sx={{
                              bgcolor: FDR_COLORS[slot.difficulty] || '#ebebe4',
                              color: slot.difficulty >= 4 || slot.difficulty <= 1 ? '#fff' : '#222',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {slot.opponentShortName}
                            <br />({slot.isHome ? 'H' : 'A'})
                          </TableCell>
                        );
                      })}
                      <TableCell align="center" data-testid="fdr-total">
                        {aggregateDifficulty}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </PageState>
    </Stack>
  );
}
