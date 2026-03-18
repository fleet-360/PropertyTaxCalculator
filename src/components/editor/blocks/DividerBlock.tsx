'use client';

import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Chip,
} from '@mui/material';
import { DividerData } from '../types';

interface DividerBlockProps {
  data: DividerData;
  onUpdate: (data: DividerData) => void;
}

const widthPresets = ['100%', '75%', '50%', '25%'];

export default function DividerBlock({ data, onUpdate }: DividerBlockProps) {
  return (
    <Box>
      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Style</InputLabel>
          <Select
            value={data.style}
            label="Style"
            onChange={(e) =>
              onUpdate({ ...data, style: e.target.value as DividerData['style'] })
            }
          >
            <MenuItem value="solid">Solid</MenuItem>
            <MenuItem value="dashed">Dashed</MenuItem>
            <MenuItem value="dotted">Dotted</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Color:
          </Typography>
          <input
            type="color"
            value={data.color}
            onChange={(e) => onUpdate({ ...data, color: e.target.value })}
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
            onChange={(e) => onUpdate({ ...data, color: e.target.value })}
            sx={{ width: 100, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.8rem' } }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Width:
          </Typography>
          {widthPresets.map((preset) => (
            <Chip
              key={preset}
              label={preset}
              size="small"
              variant={data.width === preset ? 'filled' : 'outlined'}
              color={data.width === preset ? 'primary' : 'default'}
              onClick={() => onUpdate({ ...data, width: preset })}
              sx={{ cursor: 'pointer' }}
            />
          ))}
          <TextField
            size="small"
            value={data.width}
            onChange={(e) => onUpdate({ ...data, width: e.target.value })}
            placeholder="Custom"
            sx={{ width: 100, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.8rem' } }}
          />
        </Box>
      </Box>

      {/* Preview */}
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        Preview:
      </Typography>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          py: 2,
          backgroundColor: 'grey.50',
          borderRadius: 1,
        }}
      >
        <Box
          component="hr"
          sx={{
            width: data.width,
            border: 'none',
            borderTop: `2px ${data.style} ${data.color}`,
            margin: 0,
          }}
        />
      </Box>
    </Box>
  );
}
