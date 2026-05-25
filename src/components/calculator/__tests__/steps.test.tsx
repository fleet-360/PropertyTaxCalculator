// @vitest-environment jsdom

/**
 * Step component render tests
 */

vi.mock('@/hooks/useLeadUpdate', () => ({
  useLeadUpdate: () => ({ updateLead: vi.fn(() => Promise.resolve()) }),
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import ContactRedirectStep from '@/components/calculator/steps/ContactRedirectStep';
import ResultsGateStep from '@/components/calculator/steps/ResultsGateStep';
import InitialWaiverStep from '@/components/calculator/steps/InitialWaiverStep';
import { CalculatorFeaturesContext } from '@/components/calculator/CalculatorFeaturesContext';
import { initialState, type WizardState } from '@/components/calculator/CalculatorWizard';
import theme from '@/theme/theme';

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

  beforeEach(() => {
    dispatch.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

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
    expect(
      screen.getByText(/כאשר לנכס עסקי יש יותר מייעוד אחד/),
    ).toBeInTheDocument();
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

  it('shows callback and restart buttons', () => {
    renderWithTheme(
      <ContactRedirectStep reason="area" dispatch={dispatch} state={contactState} />
    );
    expect(screen.getByRole('button', { name: /רוצה שיחזרו אלי/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /חזרה להתחלה/ })).toBeInTheDocument();
  });

  it('opens dialog, saves lead via PUT, then resets calculator', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithTheme(
      <ContactRedirectStep reason="area" dispatch={dispatch} state={contactState} />
    );

    fireEvent.click(screen.getByRole('button', { name: /רוצה שיחזרו אלי/ }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/שם מלא/), {
      target: { value: 'ישראל ישראלי' },
    });
    fireEvent.change(screen.getByLabelText(/^טלפון$/), {
      target: { value: '0501234567' },
    });
    fireEvent.change(screen.getByLabelText(/אימייל/), {
      target: { value: 'test@example.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^שליחה$/ }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/leads/test-lead',
        expect.objectContaining({ method: 'PUT' }),
      );
      expect(dispatch).toHaveBeenCalledWith({ type: 'RESET_CALCULATOR' });
    });
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

  it('outcome="overpaying" → shows discount headline', () => {
    const state = makeState({
      calculationResult: { outcome: 'overpaying', savingsBimonthly: 200 },
    });
    renderWithTheme(<ResultsGateStep state={state} dispatch={dispatch} />);
    expect(screen.getByText(/הנחה משמעותית/)).toBeInTheDocument();
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
    expect(within(dialog).getByText('תשלום מאובטח')).toBeInTheDocument();
    expect(within(dialog).getByText(/מסך תשלום לדוגמה/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('שלם והמשך'));
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
    expect(screen.getByText(/שמירת הנתונים האישיים/)).toBeInTheDocument();
    expect(screen.getByText('קראתי ואני מסכים/ה')).toBeInTheDocument();
  });

  it('next button disabled when checkbox unchecked', () => {
    renderWithTheme(<InitialWaiverStep state={state} dispatch={dispatch} />);
    const nextButton = screen.getByText('לשלב הבא');
    expect(nextButton).toBeDisabled();
  });

  it('next button enabled when checkbox checked', () => {
    renderWithTheme(<InitialWaiverStep state={state} dispatch={dispatch} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    const nextButton = screen.getByText('לשלב הבא');
    expect(nextButton).toBeEnabled();
  });
});
