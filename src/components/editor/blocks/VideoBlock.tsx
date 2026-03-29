'use client';

import React, { useMemo } from 'react';
import { Box, TextField, Typography, Alert } from '@mui/material';
import { VideoData } from '../types';

interface VideoBlockProps {
  data: VideoData;
  onUpdate: (data: VideoData) => void;
}

function parseVideoUrl(url: string): string | null {
  if (!url) return null;

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

  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

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
    <Box dir="rtl" lang="he">
      <TextField
        fullWidth
        size="small"
        label="כתובת וידאו"
        placeholder="https://www.youtube.com/watch?v=... או https://vimeo.com/..."
        value={data.url}
        onChange={(e) => handleChange('url', e.target.value)}
        helperText="נתמך: YouTube, Vimeo או כתובת הטמעה ישירה"
        sx={{ mb: 2 }}
        inputProps={{ dir: 'ltr', lang: 'en' }}
      />

      {embedUrl ? (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            paddingTop: '56.25%',
            mb: 2,
            borderRadius: 1,
            overflow: 'hidden',
            backgroundColor: 'grey.100',
          }}
        >
          <Box
            component="iframe"
            src={embedUrl}
            title={data.iframeTitle || 'וידאו מוטמע'}
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
          לא ניתן לפרש את כתובת הווידאו. נתמך: YouTube, Vimeo או כתובת iframe.
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
            הזן כתובת וידאו לתצוגה מקדימה
          </Typography>
        </Box>
      )}

      <TextField
        fullWidth
        size="small"
        label="כיתוב"
        placeholder="כיתוב לווידאו"
        value={data.caption}
        onChange={(e) => handleChange('caption', e.target.value)}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        size="small"
        label="כותרת iframe (נגישות)"
        placeholder="תיאור קצר לקוראי מסך"
        value={data.iframeTitle}
        onChange={(e) => handleChange('iframeTitle', e.target.value)}
        helperText="חשוב לנגישות (קוראי מסך)"
      />
    </Box>
  );
}
