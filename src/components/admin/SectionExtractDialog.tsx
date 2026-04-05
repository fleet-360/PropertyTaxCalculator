'use client';

import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import type { ICityTariffData } from '@/lib/types/city-tariff';
import type { SectionKey } from '@/lib/vision/ordinance-extractor';

// ── Constants ────────────────────────────────────────────────────────

const MAX_TOTAL_SIZE_MB = 50;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
];

const ACCEPT_STRING = '.pdf,.png,.jpg,.jpeg,.webp';

// ── Types ────────────────────────────────────────────────────────────

type DialogStep = 'upload' | 'processing' | 'results';

interface ProgressData {
  pass: number;
  total: number;
  label: string;
  percent: number;
}

interface SectionExtractDialogProps {
  open: boolean;
  onClose: () => void;
  sectionKey: SectionKey;
  sectionLabel: string;
  existingData: ICityTariffData;
  onSectionExtracted: (data: Partial<ICityTariffData>) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────

function isValidFileType(type: string): boolean {
  return ACCEPTED_FILE_TYPES.includes(type);
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s} שניות`;
}

function buildResultSummary(
  sectionKey: SectionKey,
  data: Partial<ICityTariffData>,
): Array<{ label: string; count: number }> {
  const items: Array<{ label: string; count: number }> = [];

  switch (sectionKey) {
    case 'metadata':
      if (data.cityName) items.push({ label: `עיר: ${data.cityName}`, count: -1 });
      if (data.year) items.push({ label: `שנה: ${data.year}`, count: -1 });
      break;
    case 'zones':
      items.push({ label: 'אזורים', count: data.availableZones?.length ?? 0 });
      break;
    case 'rates':
      items.push({ label: 'סוגי נכסים', count: data.types?.length ?? 0 });
      items.push({
        label: 'תת-סוגים',
        count: data.types?.reduce((sum, t) => sum + t.subtypes.length, 0) ?? 0,
      });
      break;
    case 'exemptions':
      items.push({ label: 'קטגוריות הנחה', count: data.exemptions?.length ?? 0 });
      items.push({
        label: 'הנחות',
        count: data.exemptions?.reduce((sum, s) => sum + s.subSections.length, 0) ?? 0,
      });
      break;
    case 'extras':
      items.push({ label: 'הנחות שטח', count: data.areaTypeDiscounts?.length ?? 0 });
      items.push({ label: 'אגרות', count: data.cityFees?.length ?? 0 });
      break;
  }

  return items;
}

// ── Component ────────────────────────────────────────────────────────

export default function SectionExtractDialog({
  open,
  onClose,
  sectionKey,
  sectionLabel,
  existingData,
  onSectionExtracted,
}: SectionExtractDialogProps) {
  const [step, setStep] = React.useState<DialogStep>('upload');
  const [files, setFiles] = React.useState<File[]>([]);
  const [fileError, setFileError] = React.useState('');
  const [customPrompt, setCustomPrompt] = React.useState('');
  const [progress, setProgress] = React.useState<ProgressData>({ pass: 0, total: 1, label: '', percent: 0 });
  const [result, setResult] = React.useState<Partial<ICityTariffData> | null>(null);
  const [warnings, setWarnings] = React.useState<string[]>([]);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [extractionError, setExtractionError] = React.useState('');
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setStep('upload');
      setFiles([]);
      setFileError('');
      setCustomPrompt('');
      setProgress({ pass: 0, total: 1, label: '', percent: 0 });
      setResult(null);
      setWarnings([]);
      setErrors([]);
      setExtractionError('');
      setElapsedSeconds(0);
    }
  }, [open]);

  // Elapsed time timer
  React.useEffect(() => {
    if (step === 'processing') {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  // ── File handling ──────────────────────────────────────────────────

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;
    setFileError('');

    const validFiles: File[] = [];
    for (let i = 0; i < newFiles.length; i++) {
      const f = newFiles[i];
      if (!isValidFileType(f.type)) {
        setFileError(`סוג קובץ לא נתמך: ${f.name}. נתמכים: PDF, PNG, JPEG, WebP`);
        return;
      }
      validFiles.push(f);
    }

    const allFiles = [...files, ...validFiles];
    const totalSize = allFiles.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      setFileError(`גודל כל הקבצים (${(totalSize / 1024 / 1024).toFixed(1)}MB) חורג מהמקסימום (${MAX_TOTAL_SIZE_MB}MB)`);
      return;
    }

    setFiles(allFiles);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    // Reset the input so the same file can be added again if removed
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError('');
  };

  // ── Extraction ─────────────────────────────────────────────────────

  const startExtraction = async () => {
    if (files.length === 0) return;

    setStep('processing');
    setExtractionError('');

    const formData = new FormData();
    for (const f of files) {
      formData.append('file', f);
    }
    formData.append('sectionKey', sectionKey);

    // Build context: existing section data + zones for rates
    const context: Record<string, unknown> = {};

    // Always pass existing data for smart merge
    const sectionExistingData: Record<string, unknown> = {};
    if (sectionKey === 'zones' && existingData.availableZones.length > 0) {
      sectionExistingData.availableZones = existingData.availableZones;
    } else if (sectionKey === 'rates' && existingData.types.length > 0) {
      sectionExistingData.types = existingData.types;
    } else if (sectionKey === 'exemptions' && existingData.exemptions.length > 0) {
      sectionExistingData.exemptions = existingData.exemptions;
    } else if (sectionKey === 'extras') {
      if ((existingData.areaTypeDiscounts ?? []).length > 0) {
        sectionExistingData.areaTypeDiscounts = existingData.areaTypeDiscounts;
      }
      if ((existingData.cityFees ?? []).length > 0) {
        sectionExistingData.cityFees = existingData.cityFees;
      }
    }
    if (Object.keys(sectionExistingData).length > 0) {
      context.existingData = sectionExistingData;
    }

    // Rates also need zones for prompt context
    if (sectionKey === 'rates' && existingData.availableZones.length > 0) {
      context.availableZones = existingData.availableZones;
    }

    if (Object.keys(context).length > 0) {
      formData.append('context', JSON.stringify(context));
    }

    // Add custom prompt if provided
    if (customPrompt.trim()) {
      formData.append('customPrompt', customPrompt.trim());
    }

    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch('/api/vision/extract-ordinance-section', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ error: 'שגיאת שרת' }));
        throw new Error(errorBody.error || `שגיאה ${res.status}`);
      }

      if (!res.body) throw new Error('אין תגובה מהשרת');

      // Read SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const eventBlock of events) {
          const lines = eventBlock.split('\n');
          let eventType = '';
          let eventData = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) eventType = line.slice(7);
            if (line.startsWith('data: ')) eventData = line.slice(6);
          }

          if (!eventType || !eventData) continue;

          try {
            const parsed = JSON.parse(eventData);

            if (eventType === 'progress') {
              setProgress(parsed);
            } else if (eventType === 'complete') {
              setResult(parsed.data);
              setWarnings(parsed.warnings || []);
              setErrors(parsed.errors || []);
              setStep('results');
            } else if (eventType === 'error') {
              if (parsed.partialData && Object.keys(parsed.partialData).length > 0) {
                setResult(parsed.partialData);
                setWarnings(parsed.warnings || []);
                setErrors(parsed.errors || []);
                setStep('results');
              } else {
                setExtractionError(
                  parsed.errors?.join(', ') || parsed.message || 'שגיאה בתהליך החילוץ',
                );
                setStep('upload');
              }
            }
          } catch {
            // Skip malformed events
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      setExtractionError((error as Error).message || 'שגיאה בתהליך החילוץ');
      setStep('upload');
    }
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    setStep('upload');
  };

  const handleApply = () => {
    if (!result) return;
    onSectionExtracted(result);
  };

  // ── Render ─────────────────────────────────────────────────────────

  const summaryItems = result ? buildResultSummary(sectionKey, result) : [];

  return (
    <Dialog
      open={open}
      onClose={step === 'processing' ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      dir="rtl"
    >
      <DialogTitle>
        חילוץ {sectionLabel} מתמונה/PDF
      </DialogTitle>

      <DialogContent>
        {/* ── Upload Step ──────────────────────────────────────────── */}
        {step === 'upload' && (
          <Box>
            {extractionError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {extractionError}
              </Alert>
            )}

            <Box
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              sx={{
                border: '2px dashed',
                borderColor: files.length > 0 ? 'success.main' : 'divider',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: 'primary.main' },
              }}
              onClick={() => document.getElementById('section-extract-file-input')?.click()}
            >
              <input
                id="section-extract-file-input"
                type="file"
                accept={ACCEPT_STRING}
                multiple
                hidden
                onChange={handleFileChange}
              />
              <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body1" gutterBottom>
                גרור תמונה או PDF של החלק הרלוונטי ל{sectionLabel}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                PDF, PNG, JPEG או WebP (עד {MAX_TOTAL_SIZE_MB}MB). ניתן להעלות מספר קבצים.
              </Typography>
            </Box>

            {fileError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {fileError}
              </Alert>
            )}

            {/* Selected files list */}
            {files.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {files.map((f, i) => (
                  <Alert
                    key={`${f.name}-${i}`}
                    severity="success"
                    sx={{ mt: 0.5 }}
                    action={
                      <IconButton size="small" onClick={() => removeFile(i)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    {f.name} ({(f.size / 1024 / 1024).toFixed(1)}MB)
                  </Alert>
                ))}
              </Box>
            )}

            {/* Custom prompt */}
            <TextField
              label="הנחיות נוספות (אופציונלי)"
              placeholder='לדוגמה: "העמוד מכיל רק תעריפי מגורים באזור ב"'
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              multiline
              minRows={2}
              maxRows={4}
              fullWidth
              sx={{ mt: 2 }}
            />

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              המערכת תחלץ רק את ה{sectionLabel} מהקבצים שהועלו.
              התהליך עשוי לקחת עד דקה.
            </Typography>
          </Box>
        )}

        {/* ── Processing Step ──────────────────────────────────────── */}
        {step === 'processing' && (
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" gutterBottom sx={{ fontWeight: 500 }}>
              {progress.label || 'מתחיל...'}
            </Typography>

            <LinearProgress
              variant="determinate"
              value={progress.percent}
              sx={{ height: 8, borderRadius: 4, mb: 2 }}
            />

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                מחלץ {sectionLabel}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatTime(elapsedSeconds)}
              </Typography>
            </Stack>
          </Box>
        )}

        {/* ── Results Step ─────────────────────────────────────────── */}
        {step === 'results' && result && (
          <Box>
            <Alert severity={errors.length > 0 ? 'warning' : 'success'} sx={{ mb: 2 }}>
              {errors.length > 0
                ? 'החילוץ הושלם עם שגיאות חלקיות — בדוק את הנתונים'
                : 'החילוץ הושלם בהצלחה!'}
            </Alert>

            <Typography variant="subtitle2" gutterBottom>
              סיכום:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2, gap: 1 }}>
              {summaryItems.map((item, i) => (
                <Chip
                  key={i}
                  label={item.count === -1 ? item.label : `${item.count} ${item.label}`}
                  variant="outlined"
                  color={item.count === 0 ? 'warning' : 'primary'}
                />
              ))}
            </Stack>

            {/* Warnings */}
            {warnings.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  אזהרות:
                </Typography>
                <List dense disablePadding>
                  {warnings.map((w, i) => (
                    <ListItem key={i} disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <WarningAmberIcon fontSize="small" color="warning" />
                      </ListItemIcon>
                      <ListItemText primary={w} primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  שגיאות:
                </Typography>
                <List dense disablePadding>
                  {errors.map((e, i) => (
                    <ListItem key={i} disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <ErrorIcon fontSize="small" color="error" />
                      </ListItemIcon>
                      <ListItemText primary={e} primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            <Alert severity="info" sx={{ mt: 1 }}>
              לחיצה על &quot;החל שינויים&quot; תעדכן את הנתונים בעורך. לא יישמר עד שתלחץ &quot;שמור&quot;.
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {step === 'upload' && (
          <>
            <Button onClick={onClose}>ביטול</Button>
            <Button
              variant="contained"
              onClick={startExtraction}
              disabled={files.length === 0}
              startIcon={<CheckCircleIcon />}
            >
              התחל חילוץ
            </Button>
          </>
        )}

        {step === 'processing' && (
          <Button onClick={handleCancel} color="error">
            ביטול
          </Button>
        )}

        {step === 'results' && (
          <>
            <Button onClick={onClose}>ביטול</Button>
            <Button
              variant="contained"
              onClick={handleApply}
              disabled={!result || Object.keys(result).length === 0}
              startIcon={<CheckCircleIcon />}
            >
              החל שינויים
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
