import { useQuery } from '@apollo/client';
import { Box, Card, CardContent, Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { DASHBOARD_QUERY } from '../lib/queries';
import { PageState } from '../components/PageState';

function StatCard({ label, value, to }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, my: 1 }}>
          {value}
        </Typography>
        <Link component={RouterLink} to={to} underline="hover">
          Open
        </Link>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { data, loading, error } = useQuery(DASHBOARD_QUERY);
  const players = data?.players || [];
  const teams = data?.teams || [];
  const fixtures = data?.fixtures || [];
  const events = data?.events || [];
  const current = events.find((event) => event.isCurrent);
  const upcoming = events.find((event) => event.isNext);

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quick overview of Fantasy Premier League entities.
        </Typography>
      </Box>

      <PageState
        loading={loading}
        error={error}
        isEmpty={!loading && !error && !data}
        emptyMessage="No dashboard data available."
      >
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(4, minmax(0, 1fr))',
            },
          }}
        >
          <StatCard label="Players" value={players.length} to="/players" />
          <StatCard label="Teams" value={teams.length} to="/teams" />
          <StatCard label="Fixtures" value={fixtures.length} to="/fixtures" />
          <StatCard label="Gameweeks" value={events.length} to="/events" />
        </Box>

        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6">Current gameweek status</Typography>
            <Typography variant="body2" color="text.secondary">
              Current: {current?.name || 'Unknown'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Next: {upcoming?.name || 'Unknown'}
            </Typography>
          </CardContent>
        </Card>
      </PageState>
    </Stack>
  );
}
