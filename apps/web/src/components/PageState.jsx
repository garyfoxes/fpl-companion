import { Alert, Box, Skeleton, Stack, Typography } from '@mui/material';

export function PageState({ loading, error, isEmpty, emptyMessage, children }) {
  if (loading) {
    return (
      <Stack spacing={1} aria-label="loading-state">
        <Typography variant="body2" color="text.secondary">
          Loading data...
        </Typography>
        <Skeleton variant="rounded" height={36} />
        <Skeleton variant="rounded" height={36} />
        <Skeleton variant="rounded" height={36} />
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert severity="error" role="alert">
        Unable to load data. {error.message}
      </Alert>
    );
  }

  if (isEmpty) {
    return <Alert severity="info">{emptyMessage}</Alert>;
  }

  return <Box>{children}</Box>;
}
