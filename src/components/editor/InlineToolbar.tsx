'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Paper,
  IconButton,
  Tooltip,
  Divider,
  TextField,
  Box,
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

interface InlineToolbarProps {
  /** The container element to watch for text selection */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Called after any formatting command is applied */
  onFormat?: () => void;
}

export default function InlineToolbar({ containerRef, onFormat }: InlineToolbarProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const toolbarRef = useRef<HTMLDivElement>(null);
  const savedSelection = useRef<Range | null>(null);

  const updatePosition = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      setVisible(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // Check if the selection is within our container
    const range = selection.getRangeAt(0);
    if (!container.contains(range.commonAncestorContainer)) {
      setVisible(false);
      return;
    }

    const rect = range.getBoundingClientRect();
    if (rect.width === 0) {
      setVisible(false);
      return;
    }

    setPosition({
      top: rect.top - 48,
      left: rect.left + rect.width / 2,
    });
    setVisible(true);
  }, [containerRef]);

  useEffect(() => {
    const handleSelectionChange = () => {
      // Small delay to let selection stabilize
      requestAnimationFrame(updatePosition);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [updatePosition]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    onFormat?.();
  };

  const handleBold = () => execCommand('bold');
  const handleItalic = () => execCommand('italic');
  const handleUnderline = () => execCommand('underline');
  const handleStrikethrough = () => execCommand('strikeThrough');

  const handleLinkOpen = () => {
    // Save the current selection before opening link input
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedSelection.current = selection.getRangeAt(0).cloneRange();
    }
    setShowLinkInput(true);
    setLinkUrl('');
  };

  const handleLinkInsert = () => {
    // Restore the saved selection
    if (savedSelection.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection.current);
      }
    }
    if (linkUrl.trim()) {
      execCommand('createLink', linkUrl.trim());
    }
    setShowLinkInput(false);
    setLinkUrl('');
    savedSelection.current = null;
  };

  const handleUnlink = () => {
    execCommand('unlink');
  };

  const handleLinkCancel = () => {
    setShowLinkInput(false);
    setLinkUrl('');
    // Restore the saved selection
    if (savedSelection.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection.current);
      }
    }
    savedSelection.current = null;
  };

  if (!visible) return null;

  return (
    <Paper
      ref={toolbarRef}
      elevation={8}
      sx={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)',
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        px: 0.5,
        py: 0.25,
        borderRadius: 1,
        backgroundColor: 'background.paper',
      }}
      onMouseDown={(e) => {
        // Prevent toolbar clicks from clearing the selection
        e.preventDefault();
      }}
    >
      {showLinkInput ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 0.5 }}>
          <TextField
            size="small"
            placeholder="https://..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLinkInsert();
              if (e.key === 'Escape') handleLinkCancel();
            }}
            sx={{ width: 200, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.85rem' } }}
            autoFocus
          />
          <IconButton size="small" onClick={handleLinkInsert} color="primary">
            <CheckIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={handleLinkCancel}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <>
          <Tooltip title="Bold (Ctrl+B)">
            <IconButton size="small" onClick={handleBold}>
              <FormatBoldIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Italic (Ctrl+I)">
            <IconButton size="small" onClick={handleItalic}>
              <FormatItalicIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Underline (Ctrl+U)">
            <IconButton size="small" onClick={handleUnderline}>
              <FormatUnderlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Strikethrough">
            <IconButton size="small" onClick={handleStrikethrough}>
              <StrikethroughSIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title="Insert Link">
            <IconButton size="small" onClick={handleLinkOpen}>
              <LinkIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Remove Link">
            <IconButton size="small" onClick={handleUnlink}>
              <LinkOffIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      )}
    </Paper>
  );
}
