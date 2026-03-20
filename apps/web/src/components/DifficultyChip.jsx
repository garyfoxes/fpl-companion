import { Box } from '@mui/material';

export const FDR_COLORS = {
  1: '#257d5a',
  2: '#00ff87',
  3: '#ebebe4',
  4: '#ff005a',
  5: '#80072d',
};

export function DifficultyChip({ value }) {
  if (value === null || value === undefined) return <>–</>;
  const bg = FDR_COLORS[value] || '#ebebe4';
  const dark = value >= 4 || value <= 1;
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 22,
        borderRadius: 1,
        backgroundColor: bg,
        color: dark ? '#fff' : '#222',
        fontSize: '0.75rem',
        fontWeight: 700,
      }}
    >
      {value}
    </Box>
  );
}
