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
import { ImageData } from '../types';

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

  return (
    <Box>
      {/* URL Input */}
      <TextField
        fullWidth
        size="small"
        label="Image URL"
        placeholder="https://example.com/image.jpg"
        value={data.url}
        onChange={(e) => handleChange('url', e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* Image Preview */}
      {data.url && (
        <Box
          sx={{
            mb: 2,
            textAlign: data.alignment,
          }}
        >
          <Box
            component="img"
            src={data.url}
            alt={data.alt || 'Image preview'}
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

      {/* Alt text */}
      <TextField
        fullWidth
        size="small"
        label="Alt Text"
        placeholder="Describe the image"
        value={data.alt}
        onChange={(e) => handleChange('alt', e.target.value)}
        helperText="Required for SEO and accessibility"
        sx={{ mb: 2 }}
        error={!data.alt && !!data.url}
      />

      {/* Title */}
      <TextField
        fullWidth
        size="small"
        label="Title Attribute"
        placeholder="Image title (tooltip on hover)"
        value={data.title}
        onChange={(e) => handleChange('title', e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* Caption */}
      <TextField
        fullWidth
        size="small"
        label="Caption"
        placeholder="Image caption (shown below image)"
        value={data.caption}
        onChange={(e) => handleChange('caption', e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* Width and Alignment row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
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
              onClick={() => handleChange('width', preset)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
          <TextField
            size="small"
            value={data.width}
            onChange={(e) => handleChange('width', e.target.value)}
            placeholder="Custom (e.g. 300px)"
            sx={{ width: 130, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.8rem' } }}
          />
        </Box>

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
      </Box>

      {/* Link */}
      <TextField
        fullWidth
        size="small"
        label="Link (optional)"
        placeholder="https://example.com (wraps image in a link)"
        value={data.link}
        onChange={(e) => handleChange('link', e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* Loading strategy */}
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Loading</InputLabel>
        <Select
          value={data.loading}
          label="Loading"
          onChange={(e) => handleChange('loading', e.target.value)}
        >
          <MenuItem value="lazy">Lazy (recommended)</MenuItem>
          <MenuItem value="eager">Eager</MenuItem>
        </Select>
      </FormControl>

      {!data.alt && data.url && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Alt text is missing. This is important for SEO and accessibility.
        </Alert>
      )}
    </Box>
  );
}
