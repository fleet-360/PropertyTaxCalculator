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
    <Box>
      {/* Mode Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChange}
          size="small"
        >
          <ToggleButton value="code">
            <CodeIcon fontSize="small" sx={{ mr: 0.5 }} />
            Code
          </ToggleButton>
          <ToggleButton value="preview">
            <VisibilityIcon fontSize="small" sx={{ mr: 0.5 }} />
            Preview
          </ToggleButton>
        </ToggleButtonGroup>

        <Alert severity="info" icon={false} sx={{ py: 0, px: 1 }}>
          <Typography variant="caption">
            HTML is rendered as-is. Be cautious of XSS when using user-generated content.
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
          placeholder="<div>Your HTML here...</div>"
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
              No HTML content to preview.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
