'use client';

import { useState, useEffect, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';
import type { IMiaMessageData } from '@/lib/types/mia-message';

export interface MiaMessagePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (messageId: string) => void;
  currentMessageId?: string;
}

export default function MiaMessagePickerModal({
  open,
  onClose,
  onSelect,
  currentMessageId,
}: MiaMessagePickerModalProps) {
  const [messages, setMessages] = useState<IMiaMessageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newMsg, setNewMsg] = useState({ messageId: '', title: '', description: '' });
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mia-messages?all=true');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchMessages();
      setShowCreate(false);
      setCreateError('');
      setNewMsg({ messageId: '', title: '', description: '' });
    }
  }, [open, fetchMessages]);

  const handleCreate = async () => {
    if (!newMsg.messageId.trim() || !newMsg.title.trim() || !newMsg.description.trim()) {
      setCreateError('יש למלא את כל השדות');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch('/api/mia-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newMsg, isActive: true }),
      });
      if (res.status === 409) {
        setCreateError('מזהה הודעה כבר קיים');
        return;
      }
      if (!res.ok) {
        const err = await res.json();
        setCreateError(err.error || 'שגיאה ביצירת הודעה');
        return;
      }
      onSelect(newMsg.messageId.trim());
    } catch {
      setCreateError('שגיאה ביצירת הודעה');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>בחירת הודעת מיה</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <List dense disablePadding>
              {/* Clear selection option */}
              <ListItemButton
                selected={!currentMessageId}
                onClick={() => onSelect('')}
              >
                <ListItemText
                  primary={
                    <Typography variant="body2" color="text.secondary">
                      ללא הודעה
                    </Typography>
                  }
                />
              </ListItemButton>
              <Divider />

              {messages.map((msg) => (
                <ListItemButton
                  key={msg.messageId}
                  selected={currentMessageId === msg.messageId}
                  onClick={() => onSelect(msg.messageId)}
                  sx={{ opacity: msg.isActive ? 1 : 0.5 }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {msg.title}
                        </Typography>
                        {!msg.isActive && <Chip label="לא פעיל" size="small" color="default" />}
                      </Box>
                    }
                    secondary={
                      msg.description.length > 80
                        ? `${msg.description.slice(0, 80)}...`
                        : msg.description
                    }
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', ml: 1 }}>
                    {msg.messageId}
                  </Typography>
                </ListItemButton>
              ))}
            </List>

            <Divider sx={{ my: 1 }} />

            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setShowCreate((prev) => !prev)}
              sx={{ textTransform: 'none' }}
            >
              {showCreate ? 'ביטול יצירה' : 'יצירת הודעה חדשה'}
            </Button>

            <Collapse in={showCreate}>
              <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {createError && <Alert severity="error">{createError}</Alert>}
                <TextField
                  size="small"
                  label="מזהה הודעה (messageId)"
                  value={newMsg.messageId}
                  onChange={(e) => setNewMsg((prev) => ({ ...prev, messageId: e.target.value }))}
                  placeholder="e.g. exemption-seniors"
                />
                <TextField
                  size="small"
                  label="כותרת"
                  value={newMsg.title}
                  onChange={(e) => setNewMsg((prev) => ({ ...prev, title: e.target.value }))}
                />
                <TextField
                  size="small"
                  label="תיאור"
                  value={newMsg.description}
                  onChange={(e) => setNewMsg((prev) => ({ ...prev, description: e.target.value }))}
                  multiline
                  minRows={2}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleCreate}
                  disabled={creating}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  {creating ? 'יוצר...' : 'יצירה ובחירה'}
                </Button>
              </Box>
            </Collapse>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ביטול</Button>
      </DialogActions>
    </Dialog>
  );
}
