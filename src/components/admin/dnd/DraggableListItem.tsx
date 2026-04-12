'use client';
import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import ListItemButton from '@mui/material/ListItemButton';
import Box from '@mui/material/Box';
import { alpha, useTheme } from '@mui/material/styles';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import MergeIcon from '@mui/icons-material/CallMerge';

export interface DraggableListItemProps {
  /** Unique id for this sortable/droppable item */
  id: string;
  /** Whether this item is currently selected */
  selected?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional sx from parent (e.g. error styling) */
  sx?: object;
  /** aria-current */
  ariaCurrent?: 'true' | undefined;
  /** aria-label */
  ariaLabel?: string;
  /** Children — the ListItemText, etc. */
  children: React.ReactNode;
  /** If true, this item can be a merge target (another item of same type can be dropped on it) */
  mergeEnabled?: boolean;
  /** Droppable id for the merge zone — must differ from the sortable id */
  mergeDropId?: string;
  /** Whether a cross-container move is hovering over this item (e.g. subtype → type) */
  isMoveOver?: boolean;
}

export default function DraggableListItem({
  id,
  selected,
  onClick,
  sx,
  ariaCurrent,
  ariaLabel,
  children,
  mergeEnabled = false,
  mergeDropId,
  isMoveOver = false,
}: DraggableListItemProps) {
  const theme = useTheme();
  const [hovered, setHovered] = React.useState(false);

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  // Inner merge droppable zone — MUST be a separate DOM element
  const { setNodeRef: setMergeRef, isOver: isMergeDropOver } = useDroppable({
    id: mergeDropId || `merge-${id}`,
    disabled: !mergeEnabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    position: 'relative' as const,
  };

  // Merge visual: dashed secondary border + tinted bg
  const mergeSx = isMergeDropOver
    ? {
        border: '2px dashed',
        borderColor: 'secondary.main',
        bgcolor: alpha(theme.palette.secondary.main, 0.12),
      }
    : {};

  // Move visual: success-tinted bg
  const moveSx = isMoveOver
    ? {
        bgcolor: alpha(theme.palette.success.main, 0.1),
        border: '2px solid',
        borderColor: 'success.main',
      }
    : {};

  return (
    <ListItemButton
      ref={setSortableRef}
      style={style}
      selected={selected}
      onClick={onClick}
      aria-current={ariaCurrent}
      aria-label={ariaLabel}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        ...sx,
        ...mergeSx,
        ...moveSx,
        pr: 1,
      }}
      {...attributes}
    >
      {/* Merge droppable overlay — separate element with its own ref */}
      {mergeEnabled && (
        <Box
          ref={setMergeRef}
          sx={{
            position: 'absolute',
            inset: '15% 10%',
            borderRadius: 1,
            zIndex: 1,
            // Visual indicator when merge is hovered
            ...(isMergeDropOver
              ? {
                  border: '2px dashed',
                  borderColor: 'secondary.main',
                  bgcolor: alpha(theme.palette.secondary.main, 0.08),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }
              : {}),
          }}
        >
          {isMergeDropOver && (
            <MergeIcon sx={{ color: 'secondary.main', fontSize: 18, opacity: 0.7 }} />
          )}
        </Box>
      )}

      {/* Drag handle */}
      <Box
        {...listeners}
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
          opacity: hovered || isDragging ? 0.7 : 0,
          transition: 'opacity 0.15s',
          mr: 0.5,
          touchAction: 'none',
          position: 'relative',
          zIndex: 2,
        }}
        aria-label="גרור לשינוי סדר או מיזוג"
      >
        <DragIndicatorIcon fontSize="small" color="action" />
      </Box>
      <Box sx={{ position: 'relative', zIndex: 2, flex: 1, minWidth: 0 }}>
        {children}
      </Box>
    </ListItemButton>
  );
}
