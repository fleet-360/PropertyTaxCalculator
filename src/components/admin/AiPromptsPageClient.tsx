'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Switch from '@mui/material/Switch';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import EditIcon from '@mui/icons-material/Edit';
import type { IAiPromptData } from '@/lib/types/ai-prompt';

const CATEGORY_LABELS: Record<string, string> = {
  tax_bill: 'שובר ארנונה',
  ordinance: 'צו ארנונה',
  appeal: 'מכתב השגה',
};

export default function AiPromptsPageClient({
  initialPrompts,
}: {
  initialPrompts: IAiPromptData[];
}) {
  const router = useRouter();
  const [prompts, setPrompts] = React.useState(initialPrompts);

  React.useEffect(() => {
    setPrompts(initialPrompts);
  }, [initialPrompts]);

  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editingPrompt, setEditingPrompt] = React.useState<IAiPromptData | null>(null);
  const [editContent, setEditContent] = React.useState('');
  const [editLabel, setEditLabel] = React.useState('');
  const [editDescription, setEditDescription] = React.useState('');
  const [formLoading, setFormLoading] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const handleOpenEdit = (prompt: IAiPromptData) => {
    setEditingPrompt(prompt);
    setEditContent(prompt.content);
    setEditLabel(prompt.label);
    setEditDescription(prompt.description);
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingPrompt) return;

    try {
      setFormLoading(true);
      const res = await fetch(`/api/ai-prompts/${editingPrompt.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editContent,
          label: editLabel,
          description: editDescription,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error((errData as { error?: string } | null)?.error || 'שמירה נכשלה');
      }

      setSnackbar({ open: true, message: 'הפרומפט עודכן בהצלחה', severity: 'success' });
      setEditDialogOpen(false);
      router.refresh();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'שגיאה בשמירת הפרומפט',
        severity: 'error',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (prompt: IAiPromptData) => {
    try {
      const res = await fetch(`/api/ai-prompts/${prompt.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !prompt.isActive }),
      });
      if (!res.ok) throw new Error('עדכון נכשל');
      setSnackbar({
        open: true,
        message: `הפרומפט ${!prompt.isActive ? 'הופעל' : 'הושבת'}`,
        severity: 'success',
      });
      router.refresh();
    } catch {
      setSnackbar({ open: true, message: 'שגיאה בעדכון הפרומפט', severity: 'error' });
    }
  };

  // Group prompts by category
  const grouped = React.useMemo(() => {
    const map = new Map<string, IAiPromptData[]>();
    for (const p of prompts) {
      const arr = map.get(p.category) || [];
      arr.push(p);
      map.set(p.category, arr);
    }
    return map;
  }, [prompts]);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
          פרומפטים AI
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          ניהול פרומפטים של בינה מלאכותית
        </Typography>
      </Box>

      <Alert severity="warning" sx={{ mb: 3 }}>
        שינויים בפרומפטים משפיעים ישירות על התנהגות ה-AI. מומלץ לבדוק היטב אחרי כל עריכה.
      </Alert>

      {Array.from(grouped.entries()).map(([category, categoryPrompts]) => (
        <Box key={category} sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
            {CATEGORY_LABELS[category] || category}
          </Typography>

          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>שם</TableCell>
                    <TableCell>מפתח</TableCell>
                    <TableCell>משתנים</TableCell>
                    <TableCell>עודכן</TableCell>
                    <TableCell>פעיל</TableCell>
                    <TableCell align="right">פעולות</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categoryPrompts.map((prompt) => (
                    <TableRow key={prompt._id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {prompt.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {prompt.description.slice(0, 60)}
                          {prompt.description.length > 60 ? '...' : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                        >
                          {prompt.key}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {prompt.templateVariables.length === 0 ? (
                            <Typography variant="caption" color="text.secondary">
                              —
                            </Typography>
                          ) : (
                            prompt.templateVariables.map((v) => (
                              <Chip
                                key={v}
                                label={`{{${v}}}`}
                                size="small"
                                variant="outlined"
                                sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                              />
                            ))
                          )}
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(prompt.updatedAt).toLocaleDateString('he-IL')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Switch
                          size="small"
                          checked={prompt.isActive}
                          onChange={() => handleToggleActive(prompt)}
                          inputProps={{ 'aria-label': `הפעלת פרומפט ${prompt.label}` }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="ערוך">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(prompt)}
                            aria-label="עריכה"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      ))}

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          עריכת פרומפט: {editingPrompt?.label}
          <Typography variant="caption" display="block" color="text.secondary">
            מפתח: {editingPrompt?.key} | קטגוריה:{' '}
            {editingPrompt ? CATEGORY_LABELS[editingPrompt.category] || editingPrompt.category : ''}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="שם תצוגה"
              fullWidth
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
            />
            <TextField
              label="תיאור"
              fullWidth
              multiline
              minRows={2}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
            {editingPrompt && editingPrompt.templateVariables.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                  משתני תבנית (placeholders):
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {editingPrompt.templateVariables.map((v) => (
                    <Chip
                      key={v}
                      label={`{{${v}}}`}
                      size="small"
                      color="info"
                      variant="outlined"
                      sx={{ fontFamily: 'monospace' }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            <TextField
              label="תוכן הפרומפט"
              fullWidth
              multiline
              minRows={20}
              maxRows={40}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              slotProps={{
                htmlInput: {
                  style: {
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    lineHeight: 1.6,
                    direction: 'ltr',
                  },
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={formLoading}>
            ביטול
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={formLoading || !editContent.trim()}
          >
            {formLoading ? 'שומר...' : 'שמור'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
