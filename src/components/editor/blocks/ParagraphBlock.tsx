'use client';

import React, { useRef, useCallback } from 'react';
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
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import LinkIcon from '@mui/icons-material/Link';
import FormatClearIcon from '@mui/icons-material/FormatClear';
import InlineToolbar from '../InlineToolbar';
import { ParagraphData } from '../types';

interface ParagraphBlockProps {
  data: ParagraphData;
  onUpdate: (data: ParagraphData) => void;
}

export default function ParagraphBlock({ data, onUpdate }: ParagraphBlockProps) {
  const editableRef = useRef<HTMLDivElement>(null);

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
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  return (
    <Box>
      {/* Formatting Toolbar */}
      <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Bold">
            <IconButton size="small" onClick={() => execCommand('bold')}>
              <FormatBoldIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Italic">
            <IconButton size="small" onClick={() => execCommand('italic')}>
              <FormatItalicIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Underline">
            <IconButton size="small" onClick={() => execCommand('underline')}>
              <FormatUnderlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Insert Link">
            <IconButton size="small" onClick={handleLinkInsert}>
              <LinkIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear Formatting">
            <IconButton size="small" onClick={() => execCommand('removeFormat')}>
              <FormatClearIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem />

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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Size:
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

      {/* Editable content */}
      <Box
        ref={editableRef}
        contentEditable
        suppressContentEditableWarning
        onBlur={captureContent}
        onInput={captureContent}
        dangerouslySetInnerHTML={{ __html: data.html }}
        sx={{
          fontSize: `${data.fontSize}px`,
          textAlign: data.alignment,
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
          '&:empty:before': {
            content: '"Start writing..."',
            color: 'text.disabled',
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
