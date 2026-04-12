'use client';
import * as React from 'react';
import { DragOverlay } from '@dnd-kit/core';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

export interface DragOverlayPortalProps {
  /** Label to show in the overlay while dragging */
  activeLabel: string | null;
}

export default function DragOverlayPortal({ activeLabel }: DragOverlayPortalProps) {
  const theme = useTheme();

  return (
    <DragOverlay dropAnimation={null}>
      {activeLabel ? (
        <Paper
          elevation={4}
          sx={{
            px: 2,
            py: 1,
            border: '2px solid',
            borderColor: 'primary.main',
            bgcolor: 'background.paper',
            transform: 'scale(1.03)',
            maxWidth: 280,
            cursor: 'grabbing',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {activeLabel}
          </Typography>
        </Paper>
      ) : null}
    </DragOverlay>
  );
}
