'use client';

import React, { useMemo } from 'react';
import {
  Box,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { VideoData } from '../types';

interface VideoBlockProps {
  data: VideoData;
  onUpdate: (data: VideoData) => void;
}

/**
 * Parses YouTube and Vimeo URLs and returns an embeddable URL.
 */
function parseVideoUrl(url: string): string | null {
  if (!url) return null;

  // YouTube: various URL formats
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }

  // Vimeo
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // If it's already an embed URL or other iframe-compatible URL, return it
  if (url.includes('embed') || url.includes('player')) {
    return url;
  }

  return null;
}

export default function VideoBlock({ data, onUpdate }: VideoBlockProps) {
  const embedUrl = useMemo(() => parseVideoUrl(data.url), [data.url]);

  const handleChange = (field: keyof VideoData, value: string) => {
    onUpdate({ ...data, [field]: value });
  };

  return (
    <Box>
      {/* URL Input */}
      <TextField
        fullWidth
        size="small"
        label="Video URL"
        placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
        value={data.url}
        onChange={(e) => handleChange('url', e.target.value)}
        helperText="Supports YouTube and Vimeo URLs"
        sx={{ mb: 2 }}
      />

      {/* iframe Preview */}
      {embedUrl ? (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            paddingTop: '56.25%', // 16:9 aspect ratio
            mb: 2,
            borderRadius: 1,
            overflow: 'hidden',
            backgroundColor: 'grey.100',
          }}
        >
          <Box
            component="iframe"
            src={embedUrl}
            title={data.iframeTitle || 'Embedded video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        </Box>
      ) : data.url ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Could not parse video URL. Supported formats: YouTube, Vimeo, or direct embed URLs.
        </Alert>
      ) : (
        <Box
          sx={{
            width: '100%',
            height: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'grey.50',
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 1,
            mb: 2,
          }}
        >
          <Typography color="text.secondary" variant="body2">
            Enter a video URL above to preview
          </Typography>
        </Box>
      )}

      {/* Caption */}
      <TextField
        fullWidth
        size="small"
        label="Caption"
        placeholder="Video caption"
        value={data.caption}
        onChange={(e) => handleChange('caption', e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* iframe title */}
      <TextField
        fullWidth
        size="small"
        label="iframe Title"
        placeholder="Descriptive title for accessibility"
        value={data.iframeTitle}
        onChange={(e) => handleChange('iframeTitle', e.target.value)}
        helperText="Important for accessibility (screen readers)"
      />
    </Box>
  );
}
