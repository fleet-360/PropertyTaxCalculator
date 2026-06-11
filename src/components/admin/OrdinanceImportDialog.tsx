'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import type { ICityTariffData } from '@/lib/types/city-tariff';

// ── Constants ────────────────────────────────────────────────────────

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const SESSION_STORAGE_KEY = 'ordinanceImportData';

// ── Types ────────────────────────────────────────────────────────────

type DialogStep = 'upload' | 'processing' | 'results';

interface ProgressData {
  pass: number;
  total: number;
  label: string;
  percent: number;
}

interface OrdinanceImportDialogProps {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'update';
  existingCityId?: string;
  /** When provided (editor is already open), apply data in-place instead of navigating. */
  onOrdinanceImported?: (data: ICityTariffData) => void;
}

// ── Component ────────────────────────────────────────────────────────

export default function OrdinanceImportDialog({
  open,
  onClose,
  mode,
  existingCityId,
  onOrdinanceImported,
}: OrdinanceImportDialogProps) {
  const router = useRouter();
  const [step, setStep] = React.useState<DialogStep>('upload');
  const [file, setFile] = React.useState<File | null>(null);
  const [fileError, setFileError] = React.useState('');
  const [progress, setProgress] = React.useState<ProgressData>({ pass: 0, total: 5, label: '', percent: 0 });
  const [result, setResult] = React.useState<ICityTariffData | null>(null);
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
      setFile(null);
      setFileError('');
      setProgress({ pass: 0, total: 5, label: '', percent: 0 });
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== 'application/pdf') {
      setFileError('נדרש קובץ PDF בלבד');
      return;
    }
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`גודל הקובץ חורג מהמקסימום (${MAX_FILE_SIZE_MB}MB)`);
      return;
    }

    setFile(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setFileError('');
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;

    if (dropped.type !== 'application/pdf') {
      setFileError('נדרש קובץ PDF בלבד');
      return;
    }
    if (dropped.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`גודל הקובץ חורג מהמקסימום (${MAX_FILE_SIZE_MB}MB)`);
      return;
    }

    setFile(dropped);
  };

  // ── Extraction ─────────────────────────────────────────────────────

  const startExtraction = async () => {
    if (!file) return;

    setStep('processing');
    setExtractionError('');

    const formData = new FormData();
    formData.append('file', file);
    if (existingCityId) {
      formData.append('existingCityId', existingCityId);
    }

    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch('/api/vision/extract-ordinance', {
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
        buffer = events.pop() || ''; // Keep incomplete event in buffer

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
              if (parsed.partialData) {
                setResult(parsed.partialData);
                setWarnings(parsed.warnings || []);
                setErrors(parsed.errors || []);
                setStep('results');
              } else {
                setExtractionError(parsed.message || 'שגיאה בתהליך החילוץ');
                setStep('upload');
              }
            }
          } catch {
            // Skip malformed events
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') return; // User cancelled
      setExtractionError((error as Error).message || 'שגיאה בתהליך החילוץ');
      setStep('upload');
    }
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    setStep('upload');
  };

  // ── Open in editor ─────────────────────────────────────────────────

  const handleOpenInEditor = () => {
    if (!result) return;

    if (onOrdinanceImported) {
      onOrdinanceImported(result);
      onClose();
      return;
    }

    // Create flow from cities list: store for the new-city editor to pick up on mount
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(result));
    router.push('/admin/cities/new?fromOrdinance=true');
    onClose();
  };

  // ── Helpers ────────────────────────────────────────────────────────

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s} שניות`;
  };

  const countSubtypes = (data: ICityTariffData) =>
    data.types.reduce((sum, t) => sum + t.subtypes.length, 0);

  const countExemptionSubs = (data: ICityTariffData) =>
    data.exemptions.reduce((sum, s) => sum + s.subSections.length, 0);

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <Dialog
      open={open}
      onClose={step === 'processing' ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      dir="rtl"
    >
      <DialogTitle>
        {mode === 'update' ? 'עדכון מצו ארנונה' : 'ייבוא צו ארנונה'}
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
                borderColor: file ? 'success.main' : 'divider',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: 'primary.main' },
              }}
              onClick={() => document.getElementById('ordinance-file-input')?.click()}
            >
              <input
                id="ordinance-file-input"
                type="file"
                accept="application/pdf"
                hidden
                onChange={handleFileChange}
              />
              <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body1" gutterBottom>
                גרור קובץ PDF של צו ארנונה לכאן
              </Typography>
              <Typography variant="body2" color="text.secondary">
                או לחץ לבחירת קובץ (עד {MAX_FILE_SIZE_MB}MB)
              </Typography>
            </Box>

            {fileError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {fileError}
              </Alert>
            )}

            {file && (
              <Alert severity="success" sx={{ mt: 1 }}>
                {file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)
              </Alert>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              המערכת תנתח את הצו באמצעות AI ותחלץ את כל התעריפים, האזורים, ההנחות והאגרות.
              התהליך עשוי לקחת 1-3 דקות.
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
                שלב {progress.pass || 1} מתוך {progress.total}
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
                ? 'החילוץ הושלם עם שגיאות חלקיות — מומלץ לבדוק בעורך'
                : 'החילוץ הושלם בהצלחה!'}
            </Alert>

            <Typography variant="subtitle2" gutterBottom>
              סיכום:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2, gap: 1 }}>
              {result.cityName && (
                <Chip label={`עיר: ${result.cityName}`} color="primary" variant="outlined" />
              )}
              {result.year > 0 && (
                <Chip label={`שנה: ${result.year}`} color="primary" variant="outlined" />
              )}
              <Chip
                label={`${result.availableZones.length} אזורים`}
                variant="outlined"
              />
              <Chip
                label={`${result.types.length} סוגי נכסים`}
                variant="outlined"
              />
              <Chip
                label={`${countSubtypes(result)} תת-סוגים`}
                variant="outlined"
              />
              <Chip
                label={`${result.exemptions.length} קטגוריות הנחה`}
                variant="outlined"
              />
              <Chip
                label={`${countExemptionSubs(result)} הנחות`}
                variant="outlined"
              />
              {result.areaTypeDiscounts.length > 0 && (
                <Chip
                  label={`${result.areaTypeDiscounts.length} הנחות שטח`}
                  variant="outlined"
                />
              )}
              {result.cityFees.length > 0 && (
                <Chip
                  label={`${result.cityFees.length} אגרות`}
                  variant="outlined"
                />
              )}
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
              disabled={!file}
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
            <Button onClick={onClose}>סגור</Button>
            <Button
              variant="contained"
              onClick={handleOpenInEditor}
              disabled={!result}
            >
              {onOrdinanceImported ? 'החל בעורך' : 'פתח בעורך לסקירה ושמירה'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
