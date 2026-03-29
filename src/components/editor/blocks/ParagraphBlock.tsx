'use client';

import React, { useRef, useCallback, useLayoutEffect } from 'react';
import {
  Box,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import LinkIcon from '@mui/icons-material/Link';
import FormatClearIcon from '@mui/icons-material/FormatClear';
import InlineToolbar from '../InlineToolbar';
import { ParagraphData, normalizeBlockTextAlignment } from '../types';

interface ParagraphBlockProps {
  data: ParagraphData;
  onUpdate: (data: ParagraphData) => void;
}

const EMPTY_PARAGRAPH_HTML = '<p><br></p>';

export default function ParagraphBlock({ data, onUpdate }: ParagraphBlockProps) {
  const theme = useTheme();
  const editableRef = useRef<HTMLDivElement>(null);

  // Avoid dangerouslySetInnerHTML on every render: parent updates html each keystroke,
  // which resets the DOM and jumps the caret to the start (breaks RTL typing).
  useLayoutEffect(() => {
    const el = editableRef.current;
    if (!el) return;
    if (document.activeElement === el) return;
    const next = data.html?.trim() ? data.html : EMPTY_PARAGRAPH_HTML;
    if (el.innerHTML !== next) {
      el.innerHTML = next;
    }
  }, [data.html]);

  const captureContent = useCallback(() => {
    if (editableRef.current) {
      const html = editableRef.current.innerHTML;
      if (html !== data.html) {
        onUpdate({ ...data, html });
      }
    }
  }, [data, onUpdate]);

  const handleAlignmentChange = (
    _event: React.MouseEvent<HTMLElement>,
    alignment: ParagraphData['alignment'] | null,
  ) => {
    if (alignment) {
      onUpdate({ ...data, alignment });
    }
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseInt(e.target.value, 10);
    if (!isNaN(size) && size > 0 && size <= 72) {
      onUpdate({ ...data, fontSize: size });
    }
  };

  const execCommand = (command: string, value?: string) => {
    editableRef.current?.focus();
    document.execCommand(command, false, value);
    captureContent();
  };

  const handleLinkInsert = () => {
    const url = prompt('הזן כתובת (URL):');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const alignment = normalizeBlockTextAlignment(data.alignment);

  return (
    <Box>
      {/* Formatting Toolbar */}
      <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="מודגש">
            <IconButton size="small" onClick={() => execCommand('bold')} aria-label="מודגש">
              <FormatBoldIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="נטוי">
            <IconButton size="small" onClick={() => execCommand('italic')} aria-label="נטוי">
              <FormatItalicIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="קו תחתון">
            <IconButton size="small" onClick={() => execCommand('underline')} aria-label="קו תחתון">
              <FormatUnderlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="הוספת קישור">
            <IconButton size="small" onClick={handleLinkInsert} aria-label="הוספת קישור">
              <LinkIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="ניקוי עיצוב">
            <IconButton size="small" onClick={() => execCommand('removeFormat')} aria-label="ניקוי עיצוב">
              <FormatClearIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem />

        <ToggleButtonGroup
          value={alignment}
          exclusive
          onChange={handleAlignmentChange}
          size="small"
          aria-label="יישור פסקה"
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            גודל:
          </Typography>
          <TextField
            size="small"
            type="number"
            value={data.fontSize}
            onChange={handleFontSizeChange}
            inputProps={{ min: 8, max: 72, step: 1 }}
            sx={{ width: 70, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.8rem' } }}
          />
          <Typography variant="caption" color="text.secondary">
            px
          </Typography>
        </Box>
      </Box>

      {/* Inline toolbar (appears on text selection) */}
      <InlineToolbar containerRef={editableRef} onFormat={captureContent} />

      {/* Editable content — HTML synced in useLayoutEffect when not focused */}
      <Box
        ref={editableRef}
        contentEditable
        suppressContentEditableWarning
        dir="rtl"
        lang="he"
        onBlur={captureContent}
        onInput={captureContent}
        sx={{
          fontSize: `${data.fontSize}px`,
          fontFamily: theme.typography.fontFamily,
          textAlign: alignment,
          outline: 'none',
          minHeight: '3em',
          lineHeight: 1.7,
          p: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          '&:focus': {
            borderColor: 'primary.main',
          },
          '& a': {
            color: 'primary.main',
            textDecoration: 'underline',
          },
        }}
      />
    </Box>
  );
}
