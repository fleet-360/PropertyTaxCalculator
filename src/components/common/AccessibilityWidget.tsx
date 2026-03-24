'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Fab,
  Popover,
  Box,
  Typography,
  Switch,
  IconButton,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

const STORAGE_KEY = 'a11y-settings';

interface A11ySettings {
  textSize: 'normal' | 'large' | 'larger';
  highContrast: boolean;
  noAnimations: boolean;
  highlightLinks: boolean;
  bigCursor: boolean;
}

const DEFAULT_SETTINGS: A11ySettings = {
  textSize: 'normal',
  highContrast: false,
  noAnimations: false,
  highlightLinks: false,
  bigCursor: false,
};

const CLASS_MAP: Record<string, string> = {
  large: 'a11y-large-text',
  larger: 'a11y-larger-text',
  highContrast: 'a11y-high-contrast',
  noAnimations: 'a11y-no-animations',
  highlightLinks: 'a11y-highlight-links',
  bigCursor: 'a11y-big-cursor',
};

function applySettings(settings: A11ySettings) {
  const html = document.documentElement;

  // Remove all a11y classes first
  Object.values(CLASS_MAP).forEach((cls) => html.classList.remove(cls));

  // Apply text size
  if (settings.textSize === 'large') html.classList.add(CLASS_MAP.large);
  if (settings.textSize === 'larger') html.classList.add(CLASS_MAP.larger);

  // Apply toggles
  if (settings.highContrast) html.classList.add(CLASS_MAP.highContrast);
  if (settings.noAnimations) html.classList.add(CLASS_MAP.noAnimations);
  if (settings.highlightLinks) html.classList.add(CLASS_MAP.highlightLinks);
  if (settings.bigCursor) html.classList.add(CLASS_MAP.bigCursor);
}

function loadSettings(): A11ySettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: A11ySettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export default function AccessibilityWidget() {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [settings, setSettings] = useState<A11ySettings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const saved = loadSettings();
    setSettings(saved);
    applySettings(saved);
    setMounted(true);
  }, []);

  const updateSettings = useCallback((partial: Partial<A11ySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      applySettings(next);
      saveSettings(next);
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    applySettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const open = Boolean(anchorEl);

  if (!mounted) return null;

  return (
    <>
      <Fab
        aria-label="הגדרות נגישות"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          position: 'fixed',
          bottom: { xs: 16, md: 24 },
          left: { xs: 16, md: 24 },
          zIndex: 9999,
          bgcolor: '#1a4fdb',
          color: '#fff',
          width: { xs: 52, md: 56 },
          height: { xs: 52, md: 56 },
          fontSize: '28px',
          '&:hover': { bgcolor: '#1640b5' },
          boxShadow: '0 4px 20px rgba(26,79,219,0.4)',
        }}
      >
        <span aria-hidden="true" style={{ fontSize: '28px', lineHeight: 1 }}>♿</span>
      </Fab>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: 300, sm: 340 },
              borderRadius: '16px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
              overflow: 'hidden',
            },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            pb: 1.5,
            bgcolor: '#1a4fdb',
            color: '#fff',
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: '16px' }}>
            <span aria-hidden="true">♿</span> הגדרות נגישות
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              aria-label="איפוס הגדרות נגישות"
              onClick={handleReset}
              size="small"
              sx={{ color: '#fff' }}
            >
              <RestartAltIcon fontSize="small" />
            </IconButton>
            <IconButton
              aria-label="סגור הגדרות נגישות"
              onClick={() => setAnchorEl(null)}
              size="small"
              sx={{ color: '#fff' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Body */}
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Text Size */}
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: '14px', mb: 1, color: '#333' }}>
              גודל טקסט
            </Typography>
            <ToggleButtonGroup
              value={settings.textSize}
              exclusive
              onChange={(_, val) => {
                if (val !== null) updateSettings({ textSize: val });
              }}
              fullWidth
              size="small"
              aria-label="גודל טקסט"
            >
              <ToggleButton value="normal" aria-label="גודל רגיל">
                <Typography sx={{ fontSize: '13px' }}>רגיל</Typography>
              </ToggleButton>
              <ToggleButton value="large" aria-label="גודל גדול">
                <Typography sx={{ fontSize: '15px', fontWeight: 600 }}>גדול</Typography>
              </ToggleButton>
              <ToggleButton value="larger" aria-label="גודל גדול מאוד">
                <Typography sx={{ fontSize: '17px', fontWeight: 700 }}>גדול מאוד</Typography>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Divider />

          {/* High Contrast */}
          <SettingRow
            label="ניגודיות גבוהה"
            checked={settings.highContrast}
            onChange={(v) => updateSettings({ highContrast: v })}
          />

          {/* Disable Animations */}
          <SettingRow
            label="השבתת אנימציות"
            checked={settings.noAnimations}
            onChange={(v) => updateSettings({ noAnimations: v })}
          />

          {/* Highlight Links */}
          <SettingRow
            label="הדגשת קישורים"
            checked={settings.highlightLinks}
            onChange={(v) => updateSettings({ highlightLinks: v })}
          />

          {/* Big Cursor */}
          <SettingRow
            label="סמן גדול"
            checked={settings.bigCursor}
            onChange={(v) => updateSettings({ bigCursor: v })}
          />
        </Box>
      </Popover>
    </>
  );
}

function SettingRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Typography sx={{ fontSize: '14px', color: '#333' }}>{label}</Typography>
      <Switch
        checked={checked}
        onChange={(_, v) => onChange(v)}
        inputProps={{ 'aria-label': label }}
        size="small"
      />
    </Box>
  );
}
