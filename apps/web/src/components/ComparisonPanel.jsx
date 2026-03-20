import {
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

const STAT_ROWS = [
  { label: 'Total Points', key: 'totalPoints' },
  { label: 'Form', key: 'form' },
  { label: 'Price', key: 'nowCost' },
  { label: 'Goals', key: 'goals' },
  { label: 'Assists', key: 'assists' },
  { label: 'Clean Sheets', key: 'cleanSheets' },
  { label: 'Yellow Cards', key: 'yellowCards' },
  { label: 'Red Cards', key: 'redCards' },
  { label: 'Bonus', key: 'bonusPoints' },
  { label: 'BPS', key: 'bps' },
  { label: 'ICT Index', key: 'ictIndex' },
];

export function ComparisonPanel({ players, onClose }) {
  if (!players || players.length === 0) return null;

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Player Comparison</Typography>
          <Button size="small" onClick={onClose}>
            Close
          </Button>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Stat</TableCell>
                {players.map((player) => (
                  <TableCell key={player.id}>{player.webName}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {STAT_ROWS.map(({ label, key }) => (
                <TableRow key={key}>
                  <TableCell>{label}</TableCell>
                  {players.map((player) => (
                    <TableCell key={player.id}>{player[key] ?? 'N/A'}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
