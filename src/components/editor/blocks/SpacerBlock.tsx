'use client';

import React from 'react';
import {
  Box,
  Slider,
  TextField,
  Typography,
} from '@mui/material';
import { SpacerData } from '../types';

interface SpacerBlockProps {
  data: SpacerData;
  onUpdate: (data: SpacerData) => void;
}

export default function SpacerBlock({ data, onUpdate }: SpacerBlockProps) {
  const handleSliderChange = (_event: Event, value: number | number[]) => {
    onUpdate({ ...data, height: value as number });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0 && value <= 500) {
      onUpdate({ ...data, height: value });
    }
  };

  return (
    <Box>
      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 3, mb: 2, alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          Height:
        </Typography>
        <Slider
          value={data.height}
          onChange={handleSliderChange}
          min={10}
          max={200}
          step={5}
          valueLabelDisplay="auto"
          valueLabelFormat={(v) => `${v}px`}
          sx={{ flex: 1 }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <TextField
            size="small"
            type="number"
            value={data.height}
            onChange={handleInputChange}
            inputProps={{ min: 10, max: 500, step: 5 }}
            sx={{ width: 80, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.85rem' } }}
          />
          <Typography variant="caption" color="text.secondary">
            px
          </Typography>
        </Box>
      </Box>

      {/* Visual preview */}
      <Box
        sx={{
          height: data.height,
          backgroundColor: 'action.hover',
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'height 0.2s',
        }}
      >
        <Typography variant="caption" color="text.disabled">
          {data.height}px spacer
        </Typography>
      </Box>
    </Box>
  );
}
