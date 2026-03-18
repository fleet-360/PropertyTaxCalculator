'use client';

import React, { useState } from 'react';
import {
  IconButton,
  Popover,
  Box,
  Typography,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TitleIcon from '@mui/icons-material/Title';
import NotesIcon from '@mui/icons-material/Notes';
import ImageIcon from '@mui/icons-material/Image';
import VideocamIcon from '@mui/icons-material/Videocam';
import CodeIcon from '@mui/icons-material/Code';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import SmartButtonIcon from '@mui/icons-material/SmartButton';
import ExpandIcon from '@mui/icons-material/Expand';
import { BlockType } from './types';

interface AddBlockButtonProps {
  onAdd: (type: BlockType) => void;
}

const blockOptions: { type: BlockType; label: string; icon: React.ReactNode }[] = [
  { type: 'heading', label: 'Title', icon: <TitleIcon /> },
  { type: 'paragraph', label: 'Paragraph', icon: <NotesIcon /> },
  { type: 'image', label: 'Image', icon: <ImageIcon /> },
  { type: 'video', label: 'Video', icon: <VideocamIcon /> },
  { type: 'html', label: 'HTML', icon: <CodeIcon /> },
  { type: 'quote', label: 'Quote', icon: <FormatQuoteIcon /> },
  { type: 'list', label: 'List', icon: <FormatListBulletedIcon /> },
  { type: 'divider', label: 'Divider', icon: <HorizontalRuleIcon /> },
  { type: 'button', label: 'Button', icon: <SmartButtonIcon /> },
  { type: 'spacer', label: 'Spacer', icon: <ExpandIcon /> },
];

export default function AddBlockButton({ onAdd }: AddBlockButtonProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (type: BlockType) => {
    onAdd(type);
    handleClose();
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.5 }}>
      <Tooltip title="Add Block">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: '50%',
            width: 32,
            height: 32,
            color: 'text.secondary',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'primary.main',
              color: 'primary.main',
              backgroundColor: 'action.hover',
            },
          }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        slotProps={{
          paper: {
            sx: { p: 2, maxWidth: 360 },
          },
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
          Add Block
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 0.5,
          }}
        >
          {blockOptions.map((option) => (
            <Tooltip key={option.type} title={option.label} placement="top">
              <Box
                onClick={() => handleSelect(option.type)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1,
                  borderRadius: 1,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <Box sx={{ color: 'text.secondary', display: 'flex' }}>
                  {option.icon}
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    mt: 0.5,
                    fontSize: '0.65rem',
                    color: 'text.secondary',
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}
                >
                  {option.label}
                </Typography>
              </Box>
            </Tooltip>
          ))}
        </Box>
      </Popover>
    </Box>
  );
}
