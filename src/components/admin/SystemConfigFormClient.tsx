'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import SaveIcon from '@mui/icons-material/Save';
import Alert from '@mui/material/Alert';
import type { ISystemConfigData } from '@/lib/types/system-config';

export default function SystemConfigFormClient({ initialConfig }: { initialConfig: ISystemConfigData }) {
  const [config, setConfig] = React.useState<ISystemConfigData>(initialConfig);

  React.useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const [saving, setSaving] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const updateField = <K extends keyof ISystemConfigData>(field: K, value: ISystemConfigData[K]) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const updateContactEmail = (
    field: keyof NonNullable<ISystemConfigData['contactEmails']>,
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      contactEmails: {
        ...prev.contactEmails,
        service: prev.contactEmails?.service || '',
        noreply: prev.contactEmails?.noreply || '',
        calculator: prev.contactEmails?.calculator || '',
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/system-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error((errorData as { message?: string }).message || 'שמירה נכשלה');
      }

      setSnackbar({ open: true, message: 'ההגדרות נשמרו בהצלחה', severity: 'success' });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'שגיאה בשמירת ההגדרות',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
          הגדרות מערכת
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          ניהול הגדרות המערכת, תמחור וכתובות מייל
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          בקרת מערכת
        </Typography>

        <Grid container spacing={3}>
          <Grid size={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.paymentEnabled}
                  onChange={(e) => updateField('paymentEnabled', e.target.checked)}
                />
              }
              label="אפשר תשלום באשראי"
            />
            {!config.paymentEnabled && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                תשלום באשראי מושבת - המערכת פועלת ללא גביה
              </Alert>
            )}
          </Grid>

          <Grid size={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.systemEnabled}
                  onChange={(e) => updateField('systemEnabled', e.target.checked)}
                />
              }
              label="מערכת פעילה"
            />
            {!config.systemEnabled && (
              <Alert severity="error" sx={{ mt: 1 }}>
                המערכת במצב תחזוקה - המחשבון אינו זמין למשתמשים
              </Alert>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          תמחור
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="מחיר מחשבון (₪)"
              type="number"
              fullWidth
              value={config.calculatorPrice}
              onChange={(e) => updateField('calculatorPrice', Number(e.target.value))}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="מחיר השגה (₪)"
              type="number"
              fullWidth
              value={config.appealPrice}
              onChange={(e) => updateField('appealPrice', Number(e.target.value))}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={
                config.matchToleranceIsPercent
                  ? 'סטייה מקסימלית לתוצאה "תואם" (%)'
                  : 'סטייה מקסימלית לתוצאה "תואם" (₪ דו־חודשי)'
              }
              type="number"
              fullWidth
              inputProps={{ min: 0 }}
              value={config.matchToleranceValue}
              onChange={(e) => updateField('matchToleranceValue', Number(e.target.value))}
              helperText="הפרש בין תשלום מדווח למחושב: בתוך המרווח נחשב תואם; מחוץ — משלם ביתר או בחסר."
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.matchToleranceIsPercent}
                  onChange={(e) => updateField('matchToleranceIsPercent', e.target.checked)}
                />
              }
              label="המספר למעלה הוא אחוז מהסכום המחושב הדו־חודשי (לא סכום קבוע בשקלים)"
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          כתובות מייל
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="מייל שירות"
              fullWidth
              value={config.contactEmails?.service || ''}
              onChange={(e) => updateContactEmail('service', e.target.value)}
              placeholder="service@example.com"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="מייל noreply"
              fullWidth
              value={config.contactEmails?.noreply || ''}
              onChange={(e) => updateContactEmail('noreply', e.target.value)}
              placeholder="noreply@example.com"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="מייל מחשבון"
              fullWidth
              value={config.contactEmails?.calculator || ''}
              onChange={(e) => updateContactEmail('calculator', e.target.value)}
              placeholder="calculator@example.com"
            />
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'שומר...' : 'שמור הגדרות'}
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
