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
    <Box>
      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Style:
        </Typography>
        <ToggleButtonGroup
          value={data.style}
          exclusive
          onChange={handleStyleChange}
          size="small"
        >
          <ToggleButton value="simple">Simple</ToggleButton>
          <ToggleButton value="bordered">Bordered</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Quote text */}
      <TextField
        fullWidth
        multiline
        minRows={3}
        size="small"
        label="Quote Text"
        placeholder="Enter your quote here..."
        value={data.text}
        onChange={(e) => onUpdate({ ...data, text: e.target.value })}
        sx={{ mb: 2 }}
      />

      {/* Author */}
      <TextField
        fullWidth
        size="small"
        label="Author"
        placeholder="Quote author"
        value={data.author}
        onChange={(e) => onUpdate({ ...data, author: e.target.value })}
        sx={{ mb: 2 }}
      />

      {/* Preview */}
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        Preview:
      </Typography>
      <Box
        sx={{
          p: 2,
          backgroundColor: 'grey.50',
          borderRadius: 1,
          ...(data.style === 'bordered'
            ? {
                borderLeft: '4px solid',
                borderLeftColor: 'primary.main',
                pl: 3,
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
