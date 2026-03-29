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
import { useTheme } from '@mui/material/styles';
import { ButtonData } from '../types';

interface ButtonBlockProps {
  data: ButtonData;
  onUpdate: (data: ButtonData) => void;
}

export default function ButtonBlock({ data, onUpdate }: ButtonBlockProps) {
  const theme = useTheme();

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
    const currentRels = data.rel ? data.rel.split(' ').filter((r) => r.trim()) : [];
    let newRels: string[];
    if (checked) {
      newRels = [...currentRels, relValue];
    } else {
      newRels = currentRels.filter((r) => r !== relValue);
    }
    onUpdate({ ...data, rel: newRels.join(' ') });
  };

  const relValues = data.rel ? data.rel.split(' ').filter((r) => r.trim()) : [];

  const contrastOnColor = theme.palette.getContrastText(data.color);

  return (
    <Box dir="rtl" lang="he">
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          fullWidth
          size="small"
          label="טקסט הכפתור"
          value={data.text}
          onChange={(e) => handleChange('text', e.target.value)}
          sx={{ flex: 1, minWidth: 160 }}
        />
        <TextField
          fullWidth
          size="small"
          label="כתובת (URL)"
          placeholder="https://example.com"
          value={data.url}
          onChange={(e) => handleChange('url', e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
          inputProps={{ dir: 'ltr', lang: 'en' }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            סגנון:
          </Typography>
          <ToggleButtonGroup
            value={data.style}
            exclusive
            onChange={handleStyleChange}
            size="small"
            aria-label="סגנון כפתור"
          >
            <ToggleButton value="filled" aria-label="מלא">
              מלא
            </ToggleButton>
            <ToggleButton value="outline" aria-label="מתאר">
              מתאר
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            גודל:
          </Typography>
          <ToggleButtonGroup
            value={data.size}
            exclusive
            onChange={handleSizeChange}
            size="small"
            aria-label="גודל כפתור"
          >
            <ToggleButton value="small" aria-label="קטן">
              קטן
            </ToggleButton>
            <ToggleButton value="medium" aria-label="בינוני">
              בינוני
            </ToggleButton>
            <ToggleButton value="large" aria-label="גדול">
              גדול
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              צבע:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <input
                type="color"
                value={data.color}
                onChange={(e) => handleChange('color', e.target.value)}
                aria-label="צבע כפתור"
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
                inputProps={{ dir: 'ltr', lang: 'en', 'aria-label': 'קוד צבע' }}
                sx={{ width: 100, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.8rem' } }}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="button-target-label">יעד קישור</InputLabel>
          <Select
            labelId="button-target-label"
            value={data.target}
            label="יעד קישור"
            onChange={(e) => handleChange('target', e.target.value)}
          >
            <MenuItem value="_self">אותו חלון</MenuItem>
            <MenuItem value="_blank">לשונית חדשה</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="button-tag-label">סוג אלמנט</InputLabel>
          <Select
            labelId="button-tag-label"
            value={data.tag}
            label="סוג אלמנט"
            onChange={(e) => handleChange('tag', e.target.value)}
          >
            <MenuItem value="a">&lt;a&gt; קישור</MenuItem>
            <MenuItem value="button">&lt;button&gt; כפתור</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          מאפייני rel:
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

      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        תצוגה מקדימה:
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
            color: data.style === 'filled' ? contrastOnColor : data.color,
            '&:hover': {
              backgroundColor: data.style === 'filled' ? data.color : 'transparent',
              borderColor: data.color,
              opacity: 0.92,
            },
          }}
        >
          {data.text || 'כפתור'}
        </Button>
      </Box>
    </Box>
  );
}
