'use client';

import React from 'react';
import {
  Box,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Typography,
  Button,
} from '@mui/material';
import { ButtonData } from '../types';

interface ButtonBlockProps {
  data: ButtonData;
  onUpdate: (data: ButtonData) => void;
}

export default function ButtonBlock({ data, onUpdate }: ButtonBlockProps) {
  const handleChange = (field: keyof ButtonData, value: string) => {
    onUpdate({ ...data, [field]: value });
  };

  const handleStyleChange = (
    _event: React.MouseEvent<HTMLElement>,
    style: ButtonData['style'] | null,
  ) => {
    if (style) {
      onUpdate({ ...data, style });
    }
  };

  const handleSizeChange = (
    _event: React.MouseEvent<HTMLElement>,
    size: ButtonData['size'] | null,
  ) => {
    if (size) {
      onUpdate({ ...data, size });
    }
  };

  const handleRelChange = (relValue: string, checked: boolean) => {
    const currentRels = data.rel
      ? data.rel.split(' ').filter((r) => r.trim())
      : [];
    let newRels: string[];
    if (checked) {
      newRels = [...currentRels, relValue];
    } else {
      newRels = currentRels.filter((r) => r !== relValue);
    }
    onUpdate({ ...data, rel: newRels.join(' ') });
  };

  const relValues = data.rel ? data.rel.split(' ').filter((r) => r.trim()) : [];

  return (
    <Box>
      {/* Text and URL */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          label="Button Text"
          value={data.text}
          onChange={(e) => handleChange('text', e.target.value)}
        />
        <TextField
          fullWidth
          size="small"
          label="URL"
          placeholder="https://example.com"
          value={data.url}
          onChange={(e) => handleChange('url', e.target.value)}
        />
      </Box>

      {/* Style, Size, Color */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            Style:
          </Typography>
          <ToggleButtonGroup
            value={data.style}
            exclusive
            onChange={handleStyleChange}
            size="small"
          >
            <ToggleButton value="filled">Filled</ToggleButton>
            <ToggleButton value="outline">Outline</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            Size:
          </Typography>
          <ToggleButtonGroup
            value={data.size}
            exclusive
            onChange={handleSizeChange}
            size="small"
          >
            <ToggleButton value="small">Small</ToggleButton>
            <ToggleButton value="medium">Medium</ToggleButton>
            <ToggleButton value="large">Large</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Color:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <input
                type="color"
                value={data.color}
                onChange={(e) => handleChange('color', e.target.value)}
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
                onChange={(e) => handleChange('color', e.target.value)}
                sx={{ width: 100, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.8rem' } }}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Target, Tag */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Target</InputLabel>
          <Select
            value={data.target}
            label="Target"
            onChange={(e) => handleChange('target', e.target.value)}
          >
            <MenuItem value="_self">Same Window</MenuItem>
            <MenuItem value="_blank">New Tab</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Tag</InputLabel>
          <Select
            value={data.tag}
            label="Tag"
            onChange={(e) => handleChange('tag', e.target.value)}
          >
            <MenuItem value="a">&lt;a&gt; (Link)</MenuItem>
            <MenuItem value="button">&lt;button&gt;</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Rel attributes */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          Rel Attributes:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {['nofollow', 'sponsored', 'ugc', 'noopener', 'noreferrer'].map((rel) => (
            <FormControlLabel
              key={rel}
              control={
                <Checkbox
                  size="small"
                  checked={relValues.includes(rel)}
                  onChange={(e) => handleRelChange(rel, e.target.checked)}
                />
              }
              label={<Typography variant="caption">{rel}</Typography>}
            />
          ))}
        </Box>
      </Box>

      {/* Button preview */}
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        Preview:
      </Typography>
      <Box
        sx={{
          p: 2,
          backgroundColor: 'grey.50',
          borderRadius: 1,
          textAlign: 'center',
        }}
      >
        <Button
          variant={data.style === 'filled' ? 'contained' : 'outlined'}
          size={data.size}
          sx={{
            backgroundColor: data.style === 'filled' ? data.color : 'transparent',
            borderColor: data.color,
            color: data.style === 'filled' ? '#fff' : data.color,
            '&:hover': {
              backgroundColor: data.style === 'filled' ? data.color : `${data.color}10`,
              borderColor: data.color,
              opacity: 0.9,
            },
          }}
        >
          {data.text || 'Button'}
        </Button>
      </Box>
    </Box>
  );
}
