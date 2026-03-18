'use client';

import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { BlockData } from './types';

interface BlockWrapperProps {
  block: BlockData;
  index: number;
  totalBlocks: number;
  onUpdate: (id: string, data: Record<string, any>) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDuplicate: (id: string) => void;
  children: React.ReactNode;
}

const blockTypeLabels: Record<string, string> = {
  heading: 'Heading',
  paragraph: 'Paragraph',
  image: 'Image',
  video: 'Video',
  html: 'HTML',
  quote: 'Quote',
  list: 'List',
  divider: 'Divider',
  button: 'Button',
  spacer: 'Spacer',
};

export default function BlockWrapper({
  block,
  index,
  totalBlocks,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  children,
}: BlockWrapperProps) {
  const [hovered, setHovered] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteConfirm = () => {
    onDelete(block.id);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Box
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        sx={{
          position: 'relative',
          border: '1px solid',
          borderColor: hovered ? 'primary.light' : 'transparent',
          borderRadius: 1,
          transition: 'border-color 0.2s',
          mb: 0,
          '&:hover': {
            boxShadow: '0 0 0 1px rgba(25, 118, 210, 0.12)',
          },
        }}
      >
        {/* Block type label on the left */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 0.75,
            py: 0.25,
            backgroundColor: hovered ? 'primary.main' : 'transparent',
            borderRadius: '4px 0 4px 0',
            transition: 'all 0.2s',
            zIndex: 2,
          }}
        >
          <DragIndicatorIcon
            sx={{
              fontSize: 14,
              color: hovered ? 'primary.contrastText' : 'transparent',
              cursor: 'grab',
            }}
          />
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.65rem',
              fontWeight: 600,
              color: hovered ? 'primary.contrastText' : 'transparent',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              userSelect: 'none',
            }}
          >
            {blockTypeLabels[block.type] || block.type}
          </Typography>
        </Box>

        {/* Toolbar on the top-right */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 0.25,
            px: 0.5,
            py: 0.25,
            backgroundColor: 'background.paper',
            borderRadius: '0 4px 0 4px',
            boxShadow: hovered ? 1 : 0,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.2s',
            zIndex: 2,
          }}
        >
          <Tooltip title="Move Up">
            <span>
              <IconButton
                size="small"
                onClick={() => onMoveUp(block.id)}
                disabled={index === 0}
                sx={{ p: 0.5 }}
              >
                <ArrowUpwardIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Move Down">
            <span>
              <IconButton
                size="small"
                onClick={() => onMoveDown(block.id)}
                disabled={index === totalBlocks - 1}
                sx={{ p: 0.5 }}
              >
                <ArrowDownwardIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Duplicate">
            <IconButton
              size="small"
              onClick={() => onDuplicate(block.id)}
              sx={{ p: 0.5 }}
            >
              <ContentCopyIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => setDeleteDialogOpen(true)}
              sx={{ p: 0.5, color: 'error.main' }}
            >
              <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Block content */}
        <Box sx={{ p: 2, pt: 3.5 }}>
          {children}
        </Box>
      </Box>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
      >
        <DialogTitle>Delete Block</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this {blockTypeLabels[block.type]?.toLowerCase() || ''} block?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
