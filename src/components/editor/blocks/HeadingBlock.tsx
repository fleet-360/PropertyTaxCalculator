'use client';

import React, { useRef, useCallback } from 'react';
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
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import { HeadingData } from '../types';

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
  const editableRef = useRef<HTMLDivElement>(null);

  const handleBlur = useCallback(() => {
    if (editableRef.current) {
      onUpdate({ ...data, text: editableRef.current.innerText });
    }
  }, [data, onUpdate]);

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

  return (
    <Box>
      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 80 }}>
          <InputLabel>Level</InputLabel>
          <Select
            value={data.level}
            label="Level"
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
          value={data.alignment}
          exclusive
          onChange={handleAlignmentChange}
          size="small"
        >
          <ToggleButton value="left">
            <FormatAlignLeftIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="center">
            <FormatAlignCenterIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="right">
            <FormatAlignRightIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Color:
          </Typography>
          <input
            type="color"
            value={data.color}
            onChange={handleColorChange}
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
            sx={{ width: 100, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.8rem' } }}
          />
        </Box>
      </Box>

      {/* Editable heading */}
      <Box
        ref={editableRef}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        sx={{
          fontSize: headingFontSizes[data.level],
          fontWeight: 'bold',
          textAlign: data.alignment,
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
            content: '"Enter heading text..."',
            color: 'text.disabled',
          },
        }}
      >
        {data.text}
      </Box>
    </Box>
  );
}
