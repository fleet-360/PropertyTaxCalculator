'use client';

import React, { useRef, useCallback, useLayoutEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import { HeadingData, normalizeBlockTextAlignment } from '../types';

interface HeadingBlockProps {
  data: HeadingData;
  onUpdate: (data: HeadingData) => void;
}

const headingFontSizes: Record<string, string> = {
  h1: '2rem',
  h2: '1.75rem',
  h3: '1.5rem',
  h4: '1.25rem',
  h5: '1.1rem',
  h6: '1rem',
};

export default function HeadingBlock({ data, onUpdate }: HeadingBlockProps) {
  const theme = useTheme();
  const editableRef = useRef<HTMLDivElement>(null);

  const captureText = useCallback(() => {
    if (editableRef.current) {
      const text = editableRef.current.innerText;
      if (text !== data.text) {
        onUpdate({ ...data, text });
      }
    }
  }, [data, onUpdate]);

  // Avoid React resetting contentEditable children on re-renders (caret jump / RTL glitches).
  useLayoutEffect(() => {
    const el = editableRef.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.innerText !== data.text) {
      el.textContent = data.text;
    }
  }, [data.text]);

  const handleLevelChange = (level: HeadingData['level']) => {
    onUpdate({ ...data, level });
  };

  const handleAlignmentChange = (
    _event: React.MouseEvent<HTMLElement>,
    alignment: HeadingData['alignment'] | null,
  ) => {
    if (alignment) {
      onUpdate({ ...data, alignment });
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...data, color: e.target.value });
  };

  const alignment = normalizeBlockTextAlignment(data.alignment);

  return (
    <Box dir="rtl" lang="he">
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel id="heading-level-label">רמת כותרת</InputLabel>
          <Select
            labelId="heading-level-label"
            value={data.level}
            label="רמת כותרת"
            onChange={(e) => handleLevelChange(e.target.value as HeadingData['level'])}
          >
            <MenuItem value="h1">H1</MenuItem>
            <MenuItem value="h2">H2</MenuItem>
            <MenuItem value="h3">H3</MenuItem>
            <MenuItem value="h4">H4</MenuItem>
            <MenuItem value="h5">H5</MenuItem>
            <MenuItem value="h6">H6</MenuItem>
          </Select>
        </FormControl>

        <ToggleButtonGroup
          value={alignment}
          exclusive
          onChange={handleAlignmentChange}
          size="small"
          aria-label="יישור כותרת"
        >
          <ToggleButton value="start" aria-label="יישור לתחילת שורה">
            <FormatAlignRightIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="center" aria-label="יישור למרכז">
            <FormatAlignCenterIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="end" aria-label="יישור לסוף שורה">
            <FormatAlignLeftIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            צבע:
          </Typography>
          <input
            type="color"
            value={data.color}
            onChange={handleColorChange}
            aria-label="צבע כותרת"
            style={{
              width: 32,
              height: 32,
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              padding: 0,
            }}
          />
          <TextField
            size="small"
            value={data.color}
            onChange={handleColorChange}
            inputProps={{ dir: 'ltr', lang: 'en', 'aria-label': 'קוד צבע' }}
            sx={{ width: 100, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.8rem' } }}
          />
        </Box>
      </Box>

      <Box
        ref={editableRef}
        contentEditable
        suppressContentEditableWarning
        dir="rtl"
        lang="he"
        onBlur={captureText}
        onInput={captureText}
        sx={{
          fontSize: headingFontSizes[data.level],
          fontFamily: theme.typography.fontFamily,
          fontWeight: 'bold',
          textAlign: alignment,
          color: data.color,
          outline: 'none',
          minHeight: '1.5em',
          p: 1,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          '&:focus': {
            borderColor: 'primary.main',
          },
          '&:empty:before': {
            content: '"הזן טקסט כותרת..."',
            color: 'text.disabled',
          },
        }}
      />
    </Box>
  );
}
