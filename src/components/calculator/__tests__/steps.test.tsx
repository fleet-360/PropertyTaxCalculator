// @vitest-environment jsdom

/**
 * Step component render tests
 */

vi.mock('@/hooks/useLeadUpdate', () => ({
  useLeadUpdate: () => ({ updateLead: vi.fn(() => Promise.resolve()) }),
}));

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ContactRedirectStep from '@/components/calculator/steps/ContactRedirectStep';
import ResultsGateStep from '@/components/calculator/steps/ResultsGateStep';
import InitialWaiverStep from '@/components/calculator/steps/InitialWaiverStep';
import { CalculatorFeaturesContext } from '@/components/calculator/CalculatorFeaturesContext';
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
  const dispatch = vi.fn();
  const contactState = makeState({ leadId: 'test-lead' });

  it('reason="area" → shows large area message', () => {
    renderWithTheme(
      <ContactRedirectStep reason="area" dispatch={dispatch} state={contactState} />
    );
    expect(screen.getByText('שטח הנכס גדול מ-1,000 מ"ר')).toBeInTheDocument();
  });

  it('reason="designations" → shows multiple designations message', () => {
    renderWithTheme(
      <ContactRedirectStep reason="designations" dispatch={dispatch} state={contactState} />
    );
    expect(screen.getByText('מספר ייעודים עסקיים')).toBeInTheDocument();
  });

  it('reason="city" → shows city not found message', () => {
    renderWithTheme(
      <ContactRedirectStep reason="city" dispatch={dispatch} state={contactState} />
    );
    expect(screen.getByText('העיר אינה קיימת במאגר')).toBeInTheDocument();
  });

  it('reason="other_city" → shows unsupported city message', () => {
    renderWithTheme(
      <ContactRedirectStep reason="other_city" dispatch={dispatch} state={contactState} />
    );
    expect(screen.getByText('העיר שבחרת אינה נתמכת במחשבון')).toBeInTheDocument();
  });

  it('reason="error" → shows error message', () => {
    renderWithTheme(
      <ContactRedirectStep reason="error" dispatch={dispatch} state={contactState} />
    );
    expect(screen.getByText('לא ניתן לבצע חישוב')).toBeInTheDocument();
  });

  it('shows contact buttons', () => {
    renderWithTheme(
      <ContactRedirectStep reason="area" dispatch={dispatch} state={contactState} />
    );
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

  it('outcome="underpaying" with paymentEnabled opens dummy dialog then dispatches NEXT_STEP', () => {
    const state = makeState({
      calculationResult: { outcome: 'underpaying' },
    });
    dispatch.mockClear();
    renderWithTheme(
      <CalculatorFeaturesContext.Provider
        value={{
          paymentEnabled: true,
          calculatorPrice: 42,
          appealPrice: 180,
          calculatorChargeAmount: 42,
          appealChargeAmount: 180,
        }}
      >
        <ResultsGateStep state={state} dispatch={dispatch} />
      </CalculatorFeaturesContext.Provider>
    );
    fireEvent.click(screen.getByText('תשלום וצפייה בתוצאות'));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('תשלום (הדגמה)')).toBeInTheDocument();
    expect(within(dialog).getByText(/סכום להצגה:/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('אישור והמשך'));
    expect(dispatch).toHaveBeenCalledWith({ type: 'NEXT_STEP' });
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
