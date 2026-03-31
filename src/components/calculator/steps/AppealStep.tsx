'use client';

import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import DownloadIcon from '@mui/icons-material/Download';
import EmailIcon from '@mui/icons-material/Email';
import DummyPaymentDialog from '@/components/calculator/DummyPaymentDialog';
import CouponPaymentSection from '@/components/calculator/CouponPaymentSection';
import AppealSignaturePad from '@/components/calculator/AppealSignaturePad';
import AppealMissingFieldsDialog from '@/components/calculator/AppealMissingFieldsDialog';
import { getAppealDocumentMissingItems } from '@/components/calculator/appealDocumentCompleteness';
import {
  buildAppealGeneratePayload,
  isValidAppealEmail,
  withMeasurementErrorClaimed,
} from '@/components/calculator/appealGeneratePayload';
import type { WizardState } from '@/components/calculator/CalculatorWizard';
import { useCalculatorFeatures } from '../CalculatorFeaturesContext';
import { useEmailSend } from '@/hooks/useEmailSend';
import type { StepProps } from '../CalculatorWizard';

const APPEAL_WAIVER_TEXT = `אני החתום מטה, מצהיר ומאשר בזאת, כי מחשבון הארנונה איננו מהווה ייעוץ משפטי ו/או תחליף לייעוץ משפטי וכי כתב ההשגה אשר נערך עבורי מתבסס על נתונים שאני הזנתי במחשבון, והינם לעזר בלבד.

לאחר שעיינתי בתקנון האתר ובמדיניות הפרטיות, אני מצהיר כי לא אבוא בעצמי ו/או באמצעות מי מטעמי בכל טענה ו/או תלונה ו/או תביעה כנגד מחשבון הארנונה ומנהליו בכל מקרה של שימוש במחשבון הארנונה ו בהגשת ההשגה וברור לי כי יתכן ומנהל הארנונה יקבע כי דין ההשגה להידחות ובמקרה כזה אהיה זכאי להגיש ערר בתוך 30 ימים ממועד דחיית ההשגה.

הריני מצהיר כי עם קבלת כתב ההשגה באמצעות האימייל התמלאו התחייבויות מחשבון הארנונה כלפיי ואני אהיה זכאי להגיש את ההשגה באתר העירייה או באמצעות הדואר.

קראתי את התקנון ומדיניות הפרטיות ואני מסכים ומאשר`;

type FlowPhase = 'intro' | 'generating' | 'sign' | 'finalize' | 'done';

export default function AppealStep({ state, dispatch }: StepProps) {
  const { paymentEnabled, appealChargeAmount } = useCalculatorFeatures();
  const { sendEmail } = useEmailSend();
  const [appealWaiverAccepted, setAppealWaiverAccepted] = useState(false);

  const [flow, setFlow] = useState<FlowPhase>('intro');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [draftPdfBase64, setDraftPdfBase64] = useState<string | null>(null);
  const [signedPdfBase64, setSignedPdfBase64] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  /** Optional override (מ"ר) — enables structured תיקון שטחים letter when > 0 */
  const [appealCorrectedAreaInput, setAppealCorrectedAreaInput] = useState(() =>
    state.measurementError != null && state.measurementError.claimed > 0
      ? String(state.measurementError.claimed)
      : '',
  );
  const [missingFieldsDialogOpen, setMissingFieldsDialogOpen] = useState(false);
  const [missingDocumentItems, setMissingDocumentItems] = useState<
    ReturnType<typeof getAppealDocumentMissingItems>
  >([]);

  useEffect(() => {
    dispatch({ type: 'SET_MIA_MESSAGE', payload: 'step-7-default' });
  }, [dispatch]);

  const result = state.calculationResult ?? {};
  const reported = state.bimonthlyPayment ?? 0;
  const calculated = result.calculatedBimonthly ?? result.calculated ?? reported;
  const biMonthlySavings = reported - calculated;
  const annualSavings = biMonthlySavings * 6;
  const cityName = (state.cityData?.cityName as string | undefined)?.trim() || state.citySlug || '';

  const sendInvoice = useCallback(
    (from?: Pick<WizardState, 'email' | 'fullName'>) => {
      const email = from?.email ?? state.email;
      const fullName = from?.fullName ?? state.fullName;
      if (!email?.trim()) return;
      void sendEmail({
        type: 'invoice',
        to: email.trim(),
        payload: {
          fullName,
          itemDescription: 'הכנת מכתב השגה — מחשבון הארנונה',
          amountNis: appealChargeAmount,
          date: new Date().toISOString(),
        },
      }).catch(() => {});
    },
    [appealChargeAmount, sendEmail, state.email, state.fullName],
  );

  const sendAppealPdfToUser = useCallback(
    async (pdfBase64: string): Promise<boolean> => {
      const to = state.email?.trim();
      if (!to || !isValidAppealEmail(to)) {
        setEmailError('כתובת מייל לא תקינה');
        return false;
      }
      const res = await sendEmail({
        type: 'appeal_pdf',
        to,
        payload: {
          fullName: state.fullName,
          cityName,
          reported,
          calculated,
          annualSavings,
          pdfBase64,
        },
      });
      if (!res.success) {
        setEmailError(res.error ?? 'שליחת המייל נכשלה');
        return false;
      }
      setEmailError(null);
      return true;
    },
    [annualSavings, calculated, cityName, reported, sendEmail, state.email, state.fullName],
  );

  const beginGenerationFlow = useCallback(
    async (wizardOverride?: WizardState) => {
    const w = wizardOverride ?? state;
    setGenerateError(null);
    setSignatureError(null);
    setFlow('generating');
    sendInvoice({ email: w.email, fullName: w.fullName });
    try {
      const base = buildAppealGeneratePayload(w);
      const parsedSqm = parseFloat(appealCorrectedAreaInput.trim().replace(',', '.'));
      const fromField = Number.isFinite(parsedSqm) && parsedSqm > 0 ? parsedSqm : 0;
      const fromWizard =
        w.measurementError != null && w.measurementError.claimed > 0
          ? w.measurementError.claimed
          : 0;
      const claimedSqm = fromField > 0 ? fromField : fromWizard;
      const body =
        claimedSqm > 0 ? withMeasurementErrorClaimed(base, claimedSqm) : base;
      const res = await fetch('/api/appeals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string; pdfBase64?: string };
      if (!res.ok) {
        throw new Error(data.error || 'הכנת מכתב ההשגה נכשלה');
      }
      if (!data.pdfBase64) {
        throw new Error('תשובת שרת לא תקינה');
      }
      setDraftPdfBase64(data.pdfBase64);
      setFlow('sign');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'שגיאה';
      setGenerateError(msg);
      setFlow('intro');
    }
  },
    [appealCorrectedAreaInput, sendInvoice, state],
  );

  const startGenerationWithCompletenessCheck = () => {
    const missing = getAppealDocumentMissingItems(state);
    if (missing.length > 0) {
      setMissingDocumentItems(missing);
      setMissingFieldsDialogOpen(true);
      return;
    }
    void beginGenerationFlow();
  };

  const handleSubmit = () => {
    if (paymentEnabled) {
      setPaymentDialogOpen(true);
      return;
    }
    startGenerationWithCompletenessCheck();
  };

  const handlePaymentConfirm = () => {
    setPaymentDialogOpen(false);
    startGenerationWithCompletenessCheck();
  };

  const handleMissingFieldsSubmit = (updates: Partial<WizardState>) => {
    const merged = { ...state, ...updates } as WizardState;
    dispatch({ type: 'UPDATE_FIELDS_BULK', payload: updates });
    setMissingFieldsDialogOpen(false);
    setMissingDocumentItems([]);
    void beginGenerationFlow(merged);
  };

  const handleMissingDialogClose = () => {
    setMissingFieldsDialogOpen(false);
    setMissingDocumentItems([]);
  };

  const handleGoToDataEntryForAppeal = () => {
    setMissingFieldsDialogOpen(false);
    setMissingDocumentItems([]);
    dispatch({ type: 'SET_STEP', step: 2 });
  };

  const handleEmptySignature = () => {
    setSignatureError('נא לחתום באזור החתימה לפני האישור');
  };

  const handleSignatureConfirmed = async (signaturePngBase64: string) => {
    setSignatureError(null);
    if (!isValidAppealEmail(state.email)) {
      setSignatureError('נא למלא כתובת מייל תקינה בשלב פרטי הקשר במחשבון לפני חתימה.');
      return;
    }
    if (!draftPdfBase64) {
      setSignatureError('חסר מסמך — נסו שוב מההתחלה');
      return;
    }

    setFlow('finalize');
    setEmailSent(false);
    setEmailError(null);

    try {
      const applyRes = await fetch('/api/appeals/apply-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftPdfBase64,
          signaturePngBase64,
        }),
      });
      const applyData = (await applyRes.json()) as { error?: string; pdfBase64?: string };
      if (!applyRes.ok) {
        throw new Error(applyData.error || 'מיזוג החתימה נכשל');
      }
      if (!applyData.pdfBase64) {
        throw new Error('תשובת שרת לא תקינה');
      }
      const signed = applyData.pdfBase64;
      setSignedPdfBase64(signed);
      const ok = await sendAppealPdfToUser(signed);
      setEmailSent(ok);
      setFlow('done');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'שגיאה';
      setSignatureError(msg);
      setSignedPdfBase64(null);
      setFlow('sign');
    }
  };

  const handleRetryEmail = async () => {
    if (!signedPdfBase64) return;
    setEmailError(null);
    const ok = await sendAppealPdfToUser(signedPdfBase64);
    setEmailSent(ok);
  };

  const downloadSignedPdf = () => {
    if (!signedPdfBase64) return;
    try {
      const binary = atob(signedPdfBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'michtav-hashaga-chatum.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setEmailError('הורדת הקובץ נכשלה');
    }
  };

  const canStart =
    appealWaiverAccepted && state.fullName.trim().length > 0 && state.calculationResult != null;

  if (flow === 'done') {
    return (
      <Box sx={{ pt: 5 }}>
        {emailSent ? (
          <Alert severity="success" sx={{ mb: 3, fontSize: '1.05rem' }}>
            מכתב ההשגה החתום נשלח לכתובת {state.email?.trim()}.
          </Alert>
        ) : (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {emailError || signatureError || 'לא הצלחנו לשלוח את המייל. ניתן לנסות שוב או להוריד את הקובץ.'}
          </Alert>
        )}

        <Typography textAlign="center" color="text.secondary" sx={{ mb: 3 }}>
          תודה שהשתמשת במחשבון הארנונה
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {signedPdfBase64 && (
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={downloadSignedPdf}>
              הורד PDF חתום
            </Button>
          )}
          {signedPdfBase64 && !emailSent && (
            <Button variant="outlined" startIcon={<EmailIcon />} onClick={() => void handleRetryEmail()}>
              שלח שוב למייל
            </Button>
          )}
          <Button variant="outlined" onClick={() => dispatch({ type: 'RESET_CALCULATOR' })} href="/#hero">
            חזרה לדף הבית
          </Button>
        </Box>
      </Box>
    );
  }

  if (flow === 'generating' || flow === 'finalize') {
    return (
      <Box sx={{ pt: 6, textAlign: 'center' }}>
        <CircularProgress sx={{ mb: 2 }} aria-label="טוען" />
        <Typography>
          {flow === 'generating' ? 'מכינים את מכתב ההשגה…' : 'משלבים חתימה ושולחים למייל…'}
        </Typography>
      </Box>
    );
  }

  if (flow === 'sign' && draftPdfBase64) {
    return (
      <Box>
        <Typography variant="h5" textAlign="center" mb={2}>
          חתימה על מכתב ההשגה
        </Typography>
        {signatureError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSignatureError(null)}>
            {signatureError}
          </Alert>
        )}
        {!isValidAppealEmail(state.email) && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            נדרשת כתובת מייל תקינה בשלב פרטי הקשר כדי לשלוח את המסמך אוטומטית.
          </Alert>
        )}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <AppealSignaturePad
            onConfirm={(png) => void handleSignatureConfirmed(png)}
            onEmptySignature={handleEmptySignature}
            disabled={flow !== 'sign'}
          />
        </Paper>
        <Button variant="outlined" onClick={() => dispatch({ type: 'PREV_STEP' })}>
          חזרה
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" textAlign="center" mb={3}>
        הגשת השגה
      </Typography>

      {/* {generateError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setGenerateError(null)}>
          {generateError}
        </Alert>
      )}

      {paymentEnabled && (
        <CouponPaymentSection state={state} dispatch={dispatch} context="appeal" />
      )} */}

      {/* <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" mb={2}>
          השגה היא בעצם ערעור על חיוב הארנונה. ניתן להגיש השגה תוך 90 יום ממועד קבלת החיוב.
        </Typography>
        <Typography variant="body1" mb={2}>
          בלחיצה אחת נוכל להכין עבורך השגה שמתאימה למידע שהזנת במחשבון.
        </Typography>
        <Typography variant="h6" color="primary.main">
          מחיר: {appealChargeAmount.toLocaleString('he-IL')} ₪
        </Typography>
      </Paper> */}

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          תיקון שטח במכתב (אופציונלי)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          אם אתם טוענים שהשטח לחיוב בשומה שגוי, הזינו כאן את השטח הנכון במ&quot;ר. כך נפעיל את תבנית מכתב
          &quot;תיקון שטחים&quot; המעוצבת (HTML). אם השדה ריק והזנת שטח מתוקן בשלב הזנת הנתונים — נשתמש בו.
        </Typography>
        <TextField
          label='שטח נכון לחיוב (מ"ר)'
          type="text"
          inputMode="decimal"
          value={appealCorrectedAreaInput}
          onChange={(e) => setAppealCorrectedAreaInput(e.target.value.replace(/[^\d.,]/g, ''))}
          fullWidth
          size="small"
          placeholder={state.propertyArea > 0 ? `למשל אם בשומה ${state.propertyArea} ולדעתכם אחר` : ''}
        />
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 2, maxHeight: 320, overflowY: 'auto', lineHeight: 1.8 }}>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
          {APPEAL_WAIVER_TEXT}
        </Typography>
      </Paper>

      <FormControlLabel
        control={
          <Checkbox
            checked={appealWaiverAccepted}
            onChange={(e) => setAppealWaiverAccepted(e.target.checked)}
          />
        }
        label="קראתי את מכתב הויתור ואני מסכים/ה ומאשר/ת"
        sx={{ mb: 3 }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button variant="outlined" onClick={() => dispatch({ type: 'PREV_STEP' })}>
          חזרה
        </Button>
        <Button variant="contained" disabled={!canStart} onClick={handleSubmit}>
          תשלום והכנת השגה
        </Button>
      </Box>

      <DummyPaymentDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        onConfirm={handlePaymentConfirm}
        amountNis={appealChargeAmount}
        title="תשלום השגה (הדגמה)"
        state={state}
        dispatch={dispatch}
        context="appeal"
      />

    

      <AppealMissingFieldsDialog
        open={missingFieldsDialogOpen}
        items={missingDocumentItems}
        state={state}
        onClose={handleMissingDialogClose}
        onSubmit={handleMissingFieldsSubmit}
        onGoToDataEntry={handleGoToDataEntryForAppeal}
      />
    </Box>
  );
}
