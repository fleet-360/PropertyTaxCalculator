'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import SaveIcon from '@mui/icons-material/Save';
import ImageIcon from '@mui/icons-material/Image';
import Alert from '@mui/material/Alert';
import type { ISettingsData } from '@/lib/types/settings';

export default function SettingsFormClient({ initialSettings }: { initialSettings: ISettingsData }) {
  const [settings, setSettings] = React.useState<ISettingsData>(initialSettings);

  React.useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const [saving, setSaving] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const updateField = <K extends keyof ISettingsData>(field: K, value: ISettingsData[K]) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error((errorData as { message?: string }).message || 'שמירה נכשלה');
      }

      setSnackbar({ open: true, message: 'ההגדרות נשמרו בהצלחה', severity: 'success' });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'שגיאה בשמירה',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            הגדרות בלוג
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            הגדרות אתר, SEO וקוד מותאם
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
          {saving ? 'שומר...' : 'שמור'}
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          כללי
        </Typography>

        <TextField
          label="שם האתר"
          fullWidth
          value={settings.siteName}
          onChange={(e) => updateField('siteName', e.target.value)}
          sx={{ mb: 3 }}
        />

        <TextField
          label="תיאור האתר"
          fullWidth
          multiline
          rows={2}
          value={settings.siteDescription}
          onChange={(e) => updateField('siteDescription', e.target.value)}
          sx={{ mb: 3 }}
        />

        <TextField
          label="מחבר ברירת מחדל"
          fullWidth
          value={settings.defaultAuthor}
          onChange={(e) => updateField('defaultAuthor', e.target.value)}
          helperText="שם מחבר למאמרים חדשים"
          sx={{ mb: 3 }}
        />

        <TextField
          label="מאמרים בעמוד"
          type="number"
          fullWidth
          value={settings.postsPerPage}
          onChange={(e) =>
            updateField('postsPerPage', Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1)))
          }
          slotProps={{
            input: { inputProps: { min: 1, max: 100 } },
          }}
          helperText="בין 1 ל־100"
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          SEO ורשתות חברתיות
        </Typography>

        <TextField
          label="כתובת תמונת OG ברירת מחדל"
          fullWidth
          value={settings.defaultOgImage}
          onChange={(e) => updateField('defaultOgImage', e.target.value)}
          placeholder="https://..."
          helperText="תמונה כשאין תמונה ראשית למאמר"
          sx={{ mb: 2 }}
        />

        {settings.defaultOgImage ? (
          <Box
            sx={{
              borderRadius: 1,
              overflow: 'hidden',
              border: 1,
              borderColor: 'divider',
              mb: 3,
              maxWidth: 400,
            }}
          >
            <Box
              component="img"
              src={settings.defaultOgImage}
              alt="תמונת OG"
              sx={{
                width: '100%',
                height: 160,
                objectFit: 'cover',
                display: 'block',
              }}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              height: 80,
              borderRadius: 1,
              border: '2px dashed',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.default',
              mb: 3,
              maxWidth: 400,
            }}
          >
            <ImageIcon sx={{ color: 'text.disabled', fontSize: 32, mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              לא הוגדרה תמונה
            </Typography>
          </Box>
        )}

        <TextField
          label="מזהה Google Analytics"
          fullWidth
          value={settings.googleAnalyticsId}
          onChange={(e) => updateField('googleAnalyticsId', e.target.value)}
          placeholder="G-XXXXXXXXXX"
          helperText="לדוגמה G-XXXXXXXXXX"
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          מתקדם
        </Typography>

        <TextField
          label="קוד מותאם ב־head"
          fullWidth
          multiline
          rows={6}
          value={settings.customHeadCode}
          onChange={(e) => updateField('customHeadCode', e.target.value)}
          placeholder="<!-- סקריפטים, מטא וכו׳ -->"
          helperText="HTML שיוזרק ל־head בכל עמוד"
          slotProps={{
            input: {
              sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
            },
          }}
          sx={{ mb: 3 }}
        />

        <TextField
          label="CSS מותאם"
          fullWidth
          multiline
          rows={8}
          value={settings.customCss}
          onChange={(e) => updateField('customCss', e.target.value)}
          placeholder="/* עיצוב מותאם */"
          helperText="CSS גלובלי"
          slotProps={{
            input: {
              sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
            },
          }}
        />
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
        <Button variant="contained" size="large" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
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
