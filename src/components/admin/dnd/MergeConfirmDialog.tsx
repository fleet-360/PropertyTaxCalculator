'use client';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

export interface MergeConfirmDialogProps {
  open: boolean;
  sourceLabel: string;
  targetLabel: string;
  sourceChildCount: number;
  duplicateCodes: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

export default function MergeConfirmDialog({
  open,
  sourceLabel,
  targetLabel,
  sourceChildCount,
  duplicateCodes,
  onConfirm,
  onCancel,
}: MergeConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>מיזוג</DialogTitle>
      <DialogContent>
        <DialogContentText>
          האם למזג את <strong>{sourceLabel || 'ללא שם'}</strong> לתוך{' '}
          <strong>{targetLabel || 'ללא שם'}</strong>?
        </DialogContentText>
        <DialogContentText sx={{ mt: 1 }}>
          {sourceChildCount} פריטים יועברו ליעד.
        </DialogContentText>
        {duplicateCodes.length > 0 && (
          <Alert severity="warning" sx={{ mt: 1.5 }}>
            קודים כפולים ({duplicateCodes.join(', ')}) — הגרסה של היעד תישמר
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>ביטול</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          מזג
        </Button>
      </DialogActions>
    </Dialog>
  );
}
