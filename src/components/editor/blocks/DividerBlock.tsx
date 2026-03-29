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
    <Box dir="rtl" lang="he">
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="divider-style-label">סגנון קו</InputLabel>
          <Select
            labelId="divider-style-label"
            value={data.style}
            label="סגנון קו"
            onChange={(e) =>
              onUpdate({ ...data, style: e.target.value as DividerData['style'] })
            }
          >
            <MenuItem value="solid">רציף</MenuItem>
            <MenuItem value="dashed">מקווקו</MenuItem>
            <MenuItem value="dotted">מנוקד</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            צבע:
          </Typography>
          <input
            type="color"
            value={data.color}
            onChange={(e) => onUpdate({ ...data, color: e.target.value })}
            aria-label="צבע מפריד"
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
            inputProps={{ dir: 'ltr', lang: 'en', 'aria-label': 'קוד צבע' }}
            sx={{ width: 100, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.8rem' } }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">
            רוחב:
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
            placeholder="מותאם"
            inputProps={{ dir: 'ltr', lang: 'en' }}
            sx={{ width: 100, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.8rem' } }}
          />
        </Box>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        תצוגה מקדימה:
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
