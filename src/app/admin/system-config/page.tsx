'use client';
import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import SaveIcon from '@mui/icons-material/Save';

interface SystemConfig {
  _id: string;
  paymentEnabled: boolean;
  systemEnabled: boolean;
  calculatorPrice: number;
  appealPrice: number;
  contactEmails?: {
    service: string;
    noreply: string;
    calculator: string;
  };
}

const defaultConfig: SystemConfig = {
  _id: '',
  paymentEnabled: true,
  systemEnabled: true,
  calculatorPrice: 0,
  appealPrice: 0,
  contactEmails: {
    service: '',
    noreply: '',
    calculator: '',
  },
};

export default function SystemConfigPage() {
  const [config, setConfig] = React.useState<SystemConfig>(defaultConfig);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch config on mount
  React.useEffect(() => {
    async function fetchConfig() {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('/api/system-config');
        if (!res.ok) throw new Error('Failed to fetch system config');
        const data = await res.json();
        setConfig({
          _id: data._id || '',
          paymentEnabled: data.paymentEnabled ?? true,
          systemEnabled: data.systemEnabled ?? true,
          calculatorPrice: data.calculatorPrice ?? 0,
          appealPrice: data.appealPrice ?? 0,
          contactEmails: {
            service: data.contactEmails?.service || '',
            noreply: data.contactEmails?.noreply || '',
            calculator: data.contactEmails?.calculator || '',
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const updateField = <K extends keyof SystemConfig>(field: K, value: SystemConfig[K]) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const updateContactEmail = (field: keyof NonNullable<SystemConfig['contactEmails']>, value: string) => {
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
        throw new Error(errorData.message || 'Failed to save system config');
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

  if (loading) {
    return (
      <Box>
        <Box sx={{ mb: 4 }}>
          <Skeleton width={200} height={40} />
          <Skeleton width={300} height={24} sx={{ mt: 1 }} />
        </Box>
        <Paper sx={{ p: 3, mb: 3 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={56} sx={{ mb: 2 }} />
          ))}
        </Paper>
        <Paper sx={{ p: 3, mb: 3 }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={56} sx={{ mb: 2 }} />
          ))}
        </Paper>
        <Paper sx={{ p: 3 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={56} sx={{ mb: 2 }} />
          ))}
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
          הגדרות מערכת
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          ניהול הגדרות המערכת, תמחור וכתובות מייל
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Card 1 — System Control */}
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

      {/* Card 2 — Pricing */}
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
        </Grid>
      </Paper>

      {/* Card 3 — Email Addresses */}
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
              placeholder="service@arnonacal.com"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="מייל noreply"
              fullWidth
              value={config.contactEmails?.noreply || ''}
              onChange={(e) => updateContactEmail('noreply', e.target.value)}
              placeholder="noreplay@arnonacal.com"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="מייל מחשבון"
              fullWidth
              value={config.contactEmails?.calculator || ''}
              onChange={(e) => updateContactEmail('calculator', e.target.value)}
              placeholder="mahshevon@arninacal.com"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Bottom Save Button */}
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

      {/* Snackbar */}
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
