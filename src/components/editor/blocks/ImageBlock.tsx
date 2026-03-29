'use client';

import React from 'react';
import {
  Box,
  TextField,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
} from '@mui/material';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import { ImageData, normalizeBlockTextAlignment } from '../types';

interface ImageBlockProps {
  data: ImageData;
  onUpdate: (data: ImageData) => void;
}

const widthPresets = ['100%', '75%', '50%'];

export default function ImageBlock({ data, onUpdate }: ImageBlockProps) {
  const handleChange = (field: keyof ImageData, value: string) => {
    onUpdate({ ...data, [field]: value });
  };

  const handleAlignmentChange = (
    _event: React.MouseEvent<HTMLElement>,
    alignment: ImageData['alignment'] | null,
  ) => {
    if (alignment) {
      onUpdate({ ...data, alignment });
    }
  };

  const alignment = normalizeBlockTextAlignment(data.alignment, { defaultAlign: 'center' });

  return (
    <Box dir="rtl" lang="he">
      <TextField
        fullWidth
        size="small"
        label="כתובת תמונה (URL)"
        placeholder="https://example.com/image.jpg"
        value={data.url}
        onChange={(e) => handleChange('url', e.target.value)}
        sx={{ mb: 2 }}
        inputProps={{ dir: 'ltr', lang: 'en' }}
      />

      {data.url && (
        <Box
          sx={{
            mb: 2,
            textAlign: alignment,
          }}
        >
          <Box
            component="img"
            src={data.url}
            alt={data.alt || 'תצוגה מקדימה של תמונה'}
            sx={{
              maxWidth: '100%',
              width: data.width,
              height: 'auto',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
            }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </Box>
      )}

      <TextField
        fullWidth
        size="small"
        label="טקסט חלופי (alt)"
        placeholder="תיאור קצר של התמונה"
        value={data.alt}
        onChange={(e) => handleChange('alt', e.target.value)}
        helperText="חשוב לנגישות ולקידום (SEO)"
        sx={{ mb: 2 }}
        error={!data.alt && !!data.url}
      />

      <TextField
        fullWidth
        size="small"
        label="כותרת (title)"
        placeholder="מוצג בעת מעבר עכבר"
        value={data.title}
        onChange={(e) => handleChange('title', e.target.value)}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        size="small"
        label="כיתוב"
        placeholder="כיתוב שיוצג מתחת לתמונה"
        value={data.caption}
        onChange={(e) => handleChange('caption', e.target.value)}
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
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
              onClick={() => handleChange('width', preset)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
          <TextField
            size="small"
            value={data.width}
            onChange={(e) => handleChange('width', e.target.value)}
            placeholder="מותאם (למשל 300px)"
            inputProps={{ dir: 'ltr', lang: 'en' }}
            sx={{ width: 140, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.8rem' } }}
          />
        </Box>

        <ToggleButtonGroup
          value={alignment}
          exclusive
          onChange={handleAlignmentChange}
          size="small"
          aria-label="יישור תמונה"
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
      </Box>

      <TextField
        fullWidth
        size="small"
        label="קישור (אופציונלי)"
        placeholder="https://... — עוטף את התמונה בקישור"
        value={data.link}
        onChange={(e) => handleChange('link', e.target.value)}
        sx={{ mb: 2 }}
        inputProps={{ dir: 'ltr', lang: 'en' }}
      />

      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel id="image-loading-label">טעינת תמונה</InputLabel>
        <Select
          labelId="image-loading-label"
          value={data.loading}
          label="טעינת תמונה"
          onChange={(e) => handleChange('loading', e.target.value)}
        >
          <MenuItem value="lazy">עצלן (מומלץ)</MenuItem>
          <MenuItem value="eager">מיידי</MenuItem>
        </Select>
      </FormControl>

      {!data.alt && data.url && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          חסר טקסט חלופי (alt). מומלץ למלא לנגישות ולקידום האתר.
        </Alert>
      )}
    </Box>
  );
}
