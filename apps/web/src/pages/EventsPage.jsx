import { useQuery } from '@apollo/client';
import {
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Card,
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { DetailPanel } from '../components/DetailPanel';
import { PageState } from '../components/PageState';
import { EVENT_QUERY, EVENTS_QUERY } from '../lib/queries';
import { readIntParam, setParam } from '../utils/urlState';

export function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = readIntParam(searchParams, 'selected');

  const { data, loading, error } = useQuery(EVENTS_QUERY);
  const detailQuery = useQuery(EVENT_QUERY, {
    variables: { id: selectedId || -1 },
    skip: !selectedId,
  });

  const events = data?.events || [];

  return (
    <Stack spacing={2}>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Events / Gameweeks
      </Typography>

      <PageState
        loading={loading}
        error={error}
        isEmpty={!loading && !error && events.length === 0}
        emptyMessage="No gameweek events available."
      >
        <TableContainer component={Card} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Deadline</TableCell>
                <TableCell>Current</TableCell>
                <TableCell>Next</TableCell>
                <TableCell>Finished</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event) => (
                <TableRow
                  key={event.id}
                  hover
                  selected={event.id === selectedId}
                  onClick={() =>
                    setSearchParams(setParam(searchParams, 'selected', event.id), { replace: true })
                  }
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{event.id}</TableCell>
                  <TableCell>{event.name}</TableCell>
                  <TableCell>{event.deadlineTime || 'TBC'}</TableCell>
                  <TableCell>{event.isCurrent ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{event.isNext ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{event.finished ? 'Yes' : 'No'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </PageState>

      {selectedId && detailQuery.data?.event ? (
        <DetailPanel
          title={`Gameweek details: ${detailQuery.data.event.name}`}
          rows={[
            { label: 'Average Entry Score', value: detailQuery.data.event.averageEntryScore },
            { label: 'Deadline', value: detailQuery.data.event.deadlineTime },
            { label: 'Data Checked', value: String(detailQuery.data.event.dataChecked) },
            { label: 'Previous', value: String(detailQuery.data.event.isPrevious) },
          ]}
        />
      ) : null}
    </Stack>
  );
}
