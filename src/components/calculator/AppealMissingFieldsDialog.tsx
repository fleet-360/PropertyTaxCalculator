'use client';

import { useEffect, useMemo, useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import type { WizardState } from '@/components/calculator/CalculatorWizard';
import type { AppealMissingDocumentItem } from '@/components/calculator/appealDocumentCompleteness';
import {
  appealMissingFieldValueAsString,
  parseAppealMissingFieldValue,
  validateAppealMissingFieldValue,
} from '@/components/calculator/appealDocumentCompleteness';

type Props = {
  open: boolean;
  items: AppealMissingDocumentItem[];
  state: WizardState;
  onClose: () => void;
  onSubmit: (updates: Partial<WizardState>) => void;
  onGoToDataEntry: () => void;
};

export default function AppealMissingFieldsDialog({
  open,
  items,
  state,
  onClose,
  onSubmit,
  onGoToDataEntry,
}: Props) {
  const fieldItems = useMemo(
    () => items.filter((i): i is Extract<AppealMissingDocumentItem, { kind: 'field' }> => i.kind === 'field'),
    [items],
  );
  const hasBusinessDesignations = items.some((i) => i.kind === 'businessDesignations');

  const [values, setValues] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;
    const next: Record<string, string> = {};
    for (const it of fieldItems) {
      next[it.key] = appealMissingFieldValueAsString(state, it.key);
    }
    setValues(next);
    setTouched({});
  }, [open, state, fieldItems]);

  const fieldErrors = useMemo(() => {
    const e: Record<string, string> = {};
    for (const it of fieldItems) {
      const raw = values[it.key] ?? '';
      if (!touched[it.key]) continue;
      const msg = validateAppealMissingFieldValue(it.key, raw);
      if (msg) e[it.key] = msg;
    }
    return e;
  }, [fieldItems, values, touched]);

  const canSubmitFields =
    hasBusinessDesignations === false &&
    fieldItems.length > 0 &&
    fieldItems.every((it) => {
      const err = validateAppealMissingFieldValue(it.key, values[it.key] ?? '');
      return err == null;
    });

  const handleFieldChange = (key: string, v: string) => {
    setValues((prev) => ({ ...prev, [key]: v }));
  };

  const handleConfirm = () => {
    if (hasBusinessDesignations) return;
    const mark: Record<string, boolean> = {};
    for (const it of fieldItems) mark[it.key] = true;
    setTouched(mark);
    for (const it of fieldItems) {
      const err = validateAppealMissingFieldValue(it.key, values[it.key] ?? '');
      if (err) return;
    }
    const updates: Partial<WizardState> = {};
    for (const it of fieldItems) {
      const parsed = parseAppealMissingFieldValue(it.key, values[it.key] ?? '');
      (updates as Record<string, unknown>)[it.key] = parsed;
    }
    onSubmit(updates);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="appeal-missing-title">
      <DialogTitle id="appeal-missing-title">השלמת פרטים למכתב ההשגה</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          לפני יצירת המסמך יש למלא את כל הפרטים שלהלן. הם יופיעו במכתב באופן מלא ומסודר.
        </Typography>

        {hasBusinessDesignations && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            לנכס עסקי יש להשלים ייעודי נכס (סוג, תת-סוג, אזור ושטח) בשלב הזנת הנתונים. חזרו לשלב זה,
            מלאו את הטבלה, והמשיכו שוב בתהליך ההשגה.
          </Alert>
        )}

        {fieldItems.map((it) => (
          <TextField
            key={it.key}
            label={it.labelHe}
            value={values[it.key] ?? ''}
            onChange={(e) => handleFieldChange(it.key, e.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, [it.key]: true }))}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            type={it.inputMode === 'email' ? 'email' : it.inputMode === 'tel' ? 'tel' : 'text'}
            inputProps={
              it.key === 'propertyArea'
                ? { inputMode: 'decimal' }
                : it.key === 'idNumber'
                  ? { inputMode: 'numeric', pattern: '[0-9]*' }
                  : undefined
            }
            error={Boolean(fieldErrors[it.key])}
            helperText={fieldErrors[it.key]}
          />
        ))}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: 'wrap' }}>
        <Button onClick={onClose} color="inherit">
          ביטול
        </Button>
        {hasBusinessDesignations ? (
          <Button variant="contained" onClick={() => onGoToDataEntry()}>
            חזרה לשלב הזנת הנתונים
          </Button>
        ) : (
          <Button variant="contained" disabled={!canSubmitFields} onClick={handleConfirm}>
            המשך ליצירת המסמך
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
