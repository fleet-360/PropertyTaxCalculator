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
import SaveIcon from '@mui/icons-material/Save';
import ImageIcon from '@mui/icons-material/Image';

interface SettingsData {
  siteName: string;
  siteDescription: string;
  defaultAuthor: string;
  postsPerPage: number;
  defaultOgImage: string;
  googleAnalyticsId: string;
  customHeadCode: string;
  customCss: string;
}

const defaultSettings: SettingsData = {
  siteName: '',
  siteDescription: '',
  defaultAuthor: '',
  postsPerPage: 10,
  defaultOgImage: '',
  googleAnalyticsId: '',
  customHeadCode: '',
  customCss: '',
};

export default function SettingsPage() {
  const [settings, setSettings] = React.useState<SettingsData>(defaultSettings);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch settings on mount
  React.useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('/api/settings');
        if (!res.ok) throw new Error('Failed to fetch settings');
        const data = await res.json();
        setSettings({
          siteName: data.siteName || '',
          siteDescription: data.siteDescription || '',
          defaultAuthor: data.defaultAuthor || '',
          postsPerPage: data.postsPerPage || 10,
          defaultOgImage: data.defaultOgImage || '',
          googleAnalyticsId: data.googleAnalyticsId || '',
          customHeadCode: data.customHeadCode || '',
          customCss: data.customCss || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const updateField = <K extends keyof SettingsData>(field: K, value: SettingsData[K]) => {
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
        throw new Error(errorData.message || 'Failed to save settings');
      }

      setSnackbar({ open: true, message: 'Settings saved successfully', severity: 'success' });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to save settings',
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
        <Paper sx={{ p: 3 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={56} sx={{ mb: 2 }} />
          ))}
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
            Settings
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Configure your blog settings
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* General Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          General
        </Typography>

        <TextField
          label="Site Name"
          fullWidth
          value={settings.siteName}
          onChange={(e) => updateField('siteName', e.target.value)}
          sx={{ mb: 3 }}
        />

        <TextField
          label="Site Description"
          fullWidth
          multiline
          rows={2}
          value={settings.siteDescription}
          onChange={(e) => updateField('siteDescription', e.target.value)}
          sx={{ mb: 3 }}
        />

        <TextField
          label="Default Author"
          fullWidth
          value={settings.defaultAuthor}
          onChange={(e) => updateField('defaultAuthor', e.target.value)}
          helperText="Default author name for new posts"
          sx={{ mb: 3 }}
        />

        <TextField
          label="Posts Per Page"
          type="number"
          fullWidth
          value={settings.postsPerPage}
          onChange={(e) => updateField('postsPerPage', Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1)))}
          slotProps={{
            input: { inputProps: { min: 1, max: 100 } },
          }}
          helperText="Number of posts displayed per page (1-100)"
        />
      </Paper>

      {/* SEO & Social */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          SEO & Social
        </Typography>

        <TextField
          label="Default OG Image URL"
          fullWidth
          value={settings.defaultOgImage}
          onChange={(e) => updateField('defaultOgImage', e.target.value)}
          placeholder="https://example.com/og-default.jpg"
          helperText="Default Open Graph image for posts without a featured image"
          sx={{ mb: 2 }}
        />

        {settings.defaultOgImage ? (
          <Box
            sx={{
              borderRadius: 1,
              overflow: 'hidden',
              border: '1px solid #e0e0e0',
              mb: 3,
              maxWidth: 400,
            }}
          >
            <Box
              component="img"
              src={settings.defaultOgImage}
              alt="Default OG"
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
              border: '2px dashed #e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fafafa',
              mb: 3,
              maxWidth: 400,
            }}
          >
            <ImageIcon sx={{ color: '#ccc', fontSize: 32, mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No image set
            </Typography>
          </Box>
        )}

        <TextField
          label="Google Analytics ID"
          fullWidth
          value={settings.googleAnalyticsId}
          onChange={(e) => updateField('googleAnalyticsId', e.target.value)}
          placeholder="G-XXXXXXXXXX"
          helperText="Your Google Analytics measurement ID (e.g. G-XXXXXXXXXX)"
        />
      </Paper>

      {/* Advanced */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Advanced
        </Typography>

        <TextField
          label="Custom Head Code"
          fullWidth
          multiline
          rows={6}
          value={settings.customHeadCode}
          onChange={(e) => updateField('customHeadCode', e.target.value)}
          placeholder="<!-- Add scripts, meta tags, etc. -->"
          helperText="HTML code injected into the <head> of every page"
          slotProps={{
            input: {
              sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
            },
          }}
          sx={{ mb: 3 }}
        />

        <TextField
          label="Custom CSS"
          fullWidth
          multiline
          rows={8}
          value={settings.customCss}
          onChange={(e) => updateField('customCss', e.target.value)}
          placeholder="/* Custom styles */"
          helperText="Custom CSS applied globally across the blog"
          slotProps={{
            input: {
              sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
            },
          }}
        />
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
          {saving ? 'Saving...' : 'Save Settings'}
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
