'use client';

import React from 'react';
import {
  Box,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
} from '@mui/material';
import { QuoteData } from '../types';

interface QuoteBlockProps {
  data: QuoteData;
  onUpdate: (data: QuoteData) => void;
}

export default function QuoteBlock({ data, onUpdate }: QuoteBlockProps) {
  const handleStyleChange = (
    _event: React.MouseEvent<HTMLElement>,
    style: QuoteData['style'] | null,
  ) => {
    if (style) {
      onUpdate({ ...data, style });
    }
  };

  return (
    <Box dir="rtl" lang="he">
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary">
          סגנון:
        </Typography>
        <ToggleButtonGroup
          value={data.style}
          exclusive
          onChange={handleStyleChange}
          size="small"
          aria-label="סגנון ציטוט"
        >
          <ToggleButton value="simple" aria-label="פשוט">
            פשוט
          </ToggleButton>
          <ToggleButton value="bordered" aria-label="עם מסגרת">
            עם מסגרת
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <TextField
        fullWidth
        multiline
        minRows={3}
        size="small"
        label="טקסט הציטוט"
        placeholder="הזן את הציטוט כאן..."
        value={data.text}
        onChange={(e) => onUpdate({ ...data, text: e.target.value })}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        size="small"
        label="מחבר"
        placeholder="שם המחבר (אופציונלי)"
        value={data.author}
        onChange={(e) => onUpdate({ ...data, author: e.target.value })}
        sx={{ mb: 2 }}
      />

      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        תצוגה מקדימה:
      </Typography>
      <Box
        dir="rtl"
        lang="he"
        sx={{
          p: 2,
          backgroundColor: 'grey.50',
          borderRadius: 1,
          ...(data.style === 'bordered'
            ? {
                borderInlineStartWidth: 4,
                borderInlineStartStyle: 'solid',
                borderInlineStartColor: 'primary.main',
                paddingInlineStart: 3,
              }
            : {}),
        }}
      >
        <Typography
          variant="body1"
          sx={{
            fontStyle: 'italic',
            lineHeight: 1.7,
            color: 'text.primary',
          }}
        >
          &ldquo;{data.text}&rdquo;
        </Typography>
        {data.author && (
          <Typography
            variant="body2"
            sx={{
              mt: 1,
              color: 'text.secondary',
              fontWeight: 500,
            }}
          >
            &mdash; {data.author}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
