import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComparisonPanel } from '../src/components/ComparisonPanel';
import { renderWithProviders } from './testUtils';

const player1 = {
  id: 1,
  webName: 'Haaland',
  totalPoints: 210,
  form: '8.1',
  nowCost: 14,
  goals: 20,
  assists: 5,
  cleanSheets: 0,
  yellowCards: 1,
  redCards: 0,
  bonusPoints: 35,
  bps: 500,
  ictIndex: '62.3',
};

const player2 = {
  id: 2,
  webName: 'Saka',
  totalPoints: 180,
  form: '7.2',
  nowCost: 10,
  goals: 12,
  assists: 10,
  cleanSheets: 5,
  yellowCards: 2,
  redCards: 0,
  bonusPoints: 25,
  bps: 400,
  ictIndex: '55.0',
};

describe('ComparisonPanel', () => {
  it('renders both player names as column headers', async () => {
    renderWithProviders(<ComparisonPanel players={[player1, player2]} onClose={() => {}} />);

    expect(screen.getByRole('columnheader', { name: 'Haaland' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Saka' })).toBeInTheDocument();
  });

  it('renders each stat row label', async () => {
    renderWithProviders(<ComparisonPanel players={[player1, player2]} onClose={() => {}} />);

    expect(screen.getByText('Total Points')).toBeInTheDocument();
    expect(screen.getByText('Form')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('Goals')).toBeInTheDocument();
    expect(screen.getByText('Assists')).toBeInTheDocument();
    expect(screen.getByText('Clean Sheets')).toBeInTheDocument();
    expect(screen.getByText('Yellow Cards')).toBeInTheDocument();
    expect(screen.getByText('Red Cards')).toBeInTheDocument();
    expect(screen.getByText('Bonus')).toBeInTheDocument();
    expect(screen.getByText('BPS')).toBeInTheDocument();
    expect(screen.getByText('ICT Index')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    renderWithProviders(<ComparisonPanel players={[player1, player2]} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
