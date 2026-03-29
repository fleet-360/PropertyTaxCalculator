'use client';

import React, { useState } from 'react';
import {
  Box,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  Typography,
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { HtmlData } from '../types';

interface HtmlBlockProps {
  data: HtmlData;
  onUpdate: (data: HtmlData) => void;
}

export default function HtmlBlock({ data, onUpdate }: HtmlBlockProps) {
  const [mode, setMode] = useState<'code' | 'preview'>('code');

  const handleModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: 'code' | 'preview' | null,
  ) => {
    if (newMode) {
      setMode(newMode);
    }
  };

  return (
    <Box dir="rtl" lang="he">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1.5,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChange}
          size="small"
          aria-label="מצב תצוגה"
        >
          <ToggleButton value="code" aria-label="קוד">
            <CodeIcon fontSize="small" sx={{ marginInlineEnd: 0.5 }} />
            קוד
          </ToggleButton>
          <ToggleButton value="preview" aria-label="תצוגה מקדימה">
            <VisibilityIcon fontSize="small" sx={{ marginInlineEnd: 0.5 }} />
            תצוגה מקדימה
          </ToggleButton>
        </ToggleButtonGroup>

        <Alert severity="info" icon={false} sx={{ py: 0, px: 1, maxWidth: '100%' }}>
          <Typography variant="caption">
            ה-HTML מוצג כפי שהוא. שימו לב לסיכוני XSS בתוכן ממשתמשים.
          </Typography>
        </Alert>
      </Box>

      {mode === 'code' ? (
        <TextField
          fullWidth
          multiline
          minRows={6}
          maxRows={20}
          value={data.code}
          onChange={(e) => onUpdate({ ...data, code: e.target.value })}
          placeholder="<div>ה-HTML שלך כאן...</div>"
          inputProps={{ dir: 'ltr', lang: 'en', style: { textAlign: 'start' } }}
          sx={{
            '& .MuiInputBase-input': {
              fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
              fontSize: '0.85rem',
              lineHeight: 1.6,
            },
          }}
        />
      ) : (
        <Box
          dir="rtl"
          lang="he"
          sx={{
            minHeight: 100,
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            backgroundColor: 'grey.50',
          }}
        >
          {data.code ? (
            <div dangerouslySetInnerHTML={{ __html: data.code }} />
          ) : (
            <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic' }}>
              אין תוכן HTML לתצוגה מקדימה.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
