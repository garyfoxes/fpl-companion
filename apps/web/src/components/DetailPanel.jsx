import { Box, Card, CardContent, Typography } from '@mui/material';

export function DetailPanel({ title, rows }) {
  return (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gap: 1,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
            },
          }}
        >
          {rows.map((row) => (
            <Box key={row.label}>
              <Typography variant="body2" color="text.secondary">
                {row.label}
              </Typography>
              <Typography variant="body1">{row.value ?? 'N/A'}</Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
