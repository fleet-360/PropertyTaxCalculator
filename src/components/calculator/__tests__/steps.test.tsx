// @vitest-environment jsdom

/**
 * Step component render tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ContactRedirectStep from '@/components/calculator/steps/ContactRedirectStep';
import ResultsGateStep from '@/components/calculator/steps/ResultsGateStep';
import InitialWaiverStep from '@/components/calculator/steps/InitialWaiverStep';
import { initialState, type WizardState } from '@/components/calculator/CalculatorWizard';

// Simple RTL theme for MUI
const theme = createTheme({ direction: 'rtl' });

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

function makeState(overrides: Partial<WizardState> = {}): WizardState {
  return { ...initialState, ...overrides };
}

// ═══════════════════════════════════════════════════════════════════════
// ContactRedirectStep
// ═══════════════════════════════════════════════════════════════════════

describe('ContactRedirectStep', () => {
  it('reason="area" → shows large area message', () => {
    renderWithTheme(<ContactRedirectStep reason="area" />);
    expect(screen.getByText('שטח הנכס גדול מ-1,000 מ"ר')).toBeInTheDocument();
  });

  it('reason="designations" → shows multiple designations message', () => {
    renderWithTheme(<ContactRedirectStep reason="designations" />);
    expect(screen.getByText('מספר ייעודים עסקיים')).toBeInTheDocument();
  });

  it('reason="city" → shows city not found message', () => {
    renderWithTheme(<ContactRedirectStep reason="city" />);
    expect(screen.getByText('העיר אינה קיימת במאגר')).toBeInTheDocument();
  });

  it('reason="other_city" → shows unsupported city message', () => {
    renderWithTheme(<ContactRedirectStep reason="other_city" />);
    expect(screen.getByText('העיר שבחרת אינה נתמכת במחשבון')).toBeInTheDocument();
  });

  it('reason="error" → shows error message', () => {
    renderWithTheme(<ContactRedirectStep reason="error" />);
    expect(screen.getByText('לא ניתן לבצע חישוב')).toBeInTheDocument();
  });

  it('shows contact buttons', () => {
    renderWithTheme(<ContactRedirectStep reason="area" />);
    expect(screen.getByText('התקשר אלינו')).toBeInTheDocument();
    expect(screen.getByText('שלח מייל')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// ResultsGateStep
// ═══════════════════════════════════════════════════════════════════════

describe('ResultsGateStep', () => {
  const dispatch = vi.fn();

  it('shows loading when isLoading', () => {
    const state = makeState({ isLoading: true, calculationResult: null });
    renderWithTheme(<ResultsGateStep state={state} dispatch={dispatch} />);
    expect(screen.getByText('מחשב תוצאות...')).toBeInTheDocument();
  });

  it('outcome="match" → shows match message', () => {
    const state = makeState({
      calculationResult: { outcome: 'match' },
    });
    renderWithTheme(<ResultsGateStep state={state} dispatch={dispatch} />);
    expect(screen.getByText(/החישוב תואם/)).toBeInTheDocument();
  });

  it('outcome="overpaying" → shows eligible for discount', () => {
    const state = makeState({
      calculationResult: { outcome: 'overpaying', savingsBimonthly: 200 },
    });
    renderWithTheme(<ResultsGateStep state={state} dispatch={dispatch} />);
    expect(screen.getByText(/זכאי להנחה/)).toBeInTheDocument();
  });

  it('outcome="underpaying" → shows mismatch', () => {
    const state = makeState({
      calculationResult: { outcome: 'underpaying' },
    });
    renderWithTheme(<ResultsGateStep state={state} dispatch={dispatch} />);
    expect(screen.getByText(/אין התאמה/)).toBeInTheDocument();
  });

  it('match outcome shows reset button', () => {
    const state = makeState({
      calculationResult: { outcome: 'match' },
    });
    renderWithTheme(<ResultsGateStep state={state} dispatch={dispatch} />);
    expect(screen.getByText('חזרה להתחלה')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// InitialWaiverStep
// ═══════════════════════════════════════════════════════════════════════

describe('InitialWaiverStep', () => {
  const dispatch = vi.fn();
  const state = makeState();

  it('renders waiver text and checkbox', () => {
    renderWithTheme(<InitialWaiverStep state={state} dispatch={dispatch} />);
    expect(screen.getByText('אישור תנאים')).toBeInTheDocument();
    expect(screen.getByText('קראתי ואני מסכים/ה')).toBeInTheDocument();
  });

  it('next button disabled when checkbox unchecked', () => {
    renderWithTheme(<InitialWaiverStep state={state} dispatch={dispatch} />);
    const nextButton = screen.getByText('המשך לשלב הבא');
    expect(nextButton).toBeDisabled();
  });

  it('next button enabled when checkbox checked', () => {
    renderWithTheme(<InitialWaiverStep state={state} dispatch={dispatch} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    const nextButton = screen.getByText('המשך לשלב הבא');
    expect(nextButton).toBeEnabled();
  });
});
