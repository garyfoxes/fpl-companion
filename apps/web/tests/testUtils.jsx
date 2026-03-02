import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { theme } from '../src/theme';

export function renderWithProviders(ui, { mocks = [], route = '/' } = {}) {
  return render(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </ThemeProvider>
    </MockedProvider>
  );
}
