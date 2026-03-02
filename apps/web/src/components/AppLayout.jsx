import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/players', label: 'Players' },
  { to: '/teams', label: 'Teams' },
  { to: '/fixtures', label: 'Fixtures' },
  { to: '/events', label: 'Gameweeks' }
];

export function AppLayout({ children }) {
  const location = useLocation();
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fbff 0%, #f2f5f9 100%)' }}>
      <AppBar position="static" color="inherit" elevation={1}>
        <Toolbar sx={{ flexDirection: isCompact ? 'column' : 'row', alignItems: isCompact ? 'flex-start' : 'center' }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, py: 1 }}>
            FPL Companion
          </Typography>
          <Stack direction="row" spacing={1} sx={{ py: 1, flexWrap: 'wrap' }}>
            {navItems.map((item) => {
              const selected = location.pathname === item.to;
              return (
                <Button
                  key={item.to}
                  component={RouterLink}
                  to={item.to}
                  variant={selected ? 'contained' : 'text'}
                  color={selected ? 'primary' : 'inherit'}
                >
                  {item.label}
                </Button>
              );
            })}
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {children}
      </Container>
    </Box>
  );
}
