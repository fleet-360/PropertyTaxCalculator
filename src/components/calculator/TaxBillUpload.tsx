'use client';

import { useState, useRef, useCallback, Dispatch } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import type { WizardState, WizardAction } from './CalculatorWizard';
import type { ExtractionResult } from '@/lib/vision/types';
import type { TaxBillData } from '@/lib/vision/document-types/tax-bill';

// ── Field labels (Hebrew) ──────────────────────────────────────────

const FIELD_LABELS: Record<keyof TaxBillData, string> = {
  fullName: 'שם מלא',
  idNumber: 'ת.ז.',
  propertyNumber: 'מספר נכס',
  propertyId: 'זיהוי נכס',
  address: 'כתובת',
  block: 'גוש',
  parcel: 'חלקה',
  propertyPurposeDescription: 'ייעוד הנכס',
  subTypeDescription: 'סוג הנכס',
  classificationCode: 'קוד סיווג',
  zone: 'אזור',
  propertyArea: 'שטח הנכס (מ"ר)',
  coveredBalconyArea: 'מרפסת מקורה (מ"ר)',
  storageArea: 'מחסן (מ"ר)',
  parkingArea: 'חניה (מ"ר)',
  bimonthlyPayment: 'תשלום (₪)',
  annualPayment: 'תשלום שנתי (₪)',
  paymentPeriod: 'תקופת תשלום',
  ratePerSqm: 'תעריף למ"ר (₪)',
};

// ── Confidence indicator ───────────────────────────────────────────

function ConfidenceChip({ confidence }: { confidence: string }) {
  switch (confidence) {
    case 'high':
      return (
        <Chip
          icon={<CheckCircleIcon />}
          label="גבוה"
          color="success"
          size="small"
          variant="outlined"
        />
      );
    case 'medium':
      return (
        <Chip
          icon={<WarningIcon />}
          label="בינוני"
          color="warning"
          size="small"
          variant="outlined"
        />
      );
    default:
      return (
        <Chip
          icon={<ErrorIcon />}
          label="נמוך"
          color="error"
          size="small"
          variant="outlined"
        />
      );
  }
}

// ── Accepted file types ────────────────────────────────────────────

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf';

// ── Component ──────────────────────────────────────────────────────

interface TaxBillUploadProps {
  dispatch: Dispatch<WizardAction>;
  /** Called after fields are dispatched to wizard state */
  onExtracted?: () => void;
  /** When true, file is stored but extraction only happens via triggerExtraction() */
  deferExtraction?: boolean;
  /** Called when a file is selected (deferred mode) — parent stores the File */
  onFileReady?: (file: File | null) => void;
}

export default function TaxBillUpload({ dispatch, onExtracted, deferExtraction, onFileReady }: TaxBillUploadProps) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'ready' | 'success' | 'error'>('idle');
  const [extractionResult, setExtractionResult] = useState<ExtractionResult<TaxBillData> | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyFields = useCallback((result: ExtractionResult<TaxBillData>) => {
    if (!result?.data) return;
    const fieldsToApply: Partial<WizardState> = {};
    for (const [key, field] of Object.entries(result.data)) {
      if (field && field.value !== undefined && field.value !== null) {
        // Map extraction field names to wizard state field names
        if (key === 'bimonthlyPayment') {
          // Store as reportedPayment in wizard state
          (fieldsToApply as Record<string, unknown>)['reportedPayment'] = field.value;
        } else if (key === 'propertyPurposeDescription' || key === 'subTypeDescription' ||
                   key === 'ratePerSqm' || key === 'annualPayment') {
          // These are extraction-only display fields — don't push to wizard state
        } else {
          (fieldsToApply as Record<string, unknown>)[key] = field.value;
        }
      }
    }

    dispatch({ type: 'UPDATE_FIELDS_BULK', payload: fieldsToApply });
    onExtracted?.();
  }, [dispatch, onExtracted]);

  const handleFileSelect = useCallback(async (file: File) => {
    setErrorMessage('');
    setExtractionResult(null);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    setSelectedFileName(file.name);

    // In deferred mode, just store the file — don't extract yet
    if (deferExtraction) {
      setStatus('ready');
      onFileReady?.(file);
      return;
    }

    // Immediate extraction mode
    setStatus('uploading');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', 'tax_bill');

      const response = await fetch('/api/vision/extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result: ExtractionResult<TaxBillData> = await response.json();
      setExtractionResult(result);
      setStatus(result.success ? 'success' : 'error');

      if (!result.success) {
        setErrorMessage(result.warnings.join('. ') || 'לא ניתן היה לחלץ נתונים מהמסמך');
      } else {
        applyFields(result);
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'שגיאה בעיבוד המסמך'
      );
    }
  }, [applyFields, deferExtraction, onFileReady]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleReset = useCallback(() => {
    setStatus('idle');
    setExtractionResult(null);
    setErrorMessage('');
    setPreviewUrl(null);
    setSelectedFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileReady?.(null);
  }, [onFileReady]);

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>

      {/* ── Upload zone ── */}
      {status === 'idle' && (
        <Box
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          sx={{
            border: '2px dashed',
            borderColor: 'primary.main',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            '&:hover': { backgroundColor: 'action.hover' },
          }}
        >
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="body1" color="primary">
            צלם או העלה שובר ארנונה
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            JPG, PNG, PDF — עד 10MB
          </Typography>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            onChange={handleInputChange}
            hidden
          />
        </Box>
      )}

      {/* ── File ready (deferred mode) ── */}
      {status === 'ready' && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          {previewUrl && (
            <Box
              component="img"
              src={previewUrl}
              alt="Preview"
              sx={{ maxWidth: 200, maxHeight: 150, mb: 2, borderRadius: 1 }}
            />
          )}
          <Alert severity="info" sx={{ mb: 1 }}>
            הקובץ {selectedFileName} טעון ומוכן — הנתונים יחולצו בלחיצה על &quot;הבא&quot;
          </Alert>
          <Button variant="outlined" size="small" onClick={handleReset}>
            החלף קובץ
          </Button>
        </Box>
      )}

      {/* ── Loading ── */}
      {status === 'uploading' && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          {previewUrl && (
            <Box
              component="img"
              src={previewUrl}
              alt="Preview"
              sx={{ maxWidth: 200, maxHeight: 150, mb: 2, borderRadius: 1, opacity: 0.7 }}
            />
          )}
          <CircularProgress sx={{ mb: 2 }} />
          <Typography>מעבד את המסמך...</Typography>
        </Box>
      )}

      {/* ── Error ── */}
      {status === 'error' && (
        <Box>
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
          <Button variant="outlined" size="small" onClick={handleReset}>
            נסה שוב
          </Button>
        </Box>
      )}

      {/* ── Success — fields already applied, show summary ── */}
      {status === 'success' && extractionResult && (
        <Box>
          <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
            חולצו ומולאו {Object.keys(extractionResult.data).length} שדות מהמסמך
            {extractionResult.processingTimeMs && (
              <Typography variant="caption" component="span" sx={{ mr: 1 }}>
                ({(extractionResult.processingTimeMs / 1000).toFixed(1)} שניות)
              </Typography>
            )}
          </Alert>

          {extractionResult.warnings.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {extractionResult.warnings.join('. ')}
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            {Object.entries(extractionResult.data).map(([key, field]) => {
              if (!field) return null;
              const label = FIELD_LABELS[key as keyof TaxBillData] || key;
              return (
                <Box
                  key={key}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 0.5,
                    px: 1,
                    '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2" fontWeight="medium">
                    {label}:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" dir="ltr">
                      {String(field.value)}
                    </Typography>
                    <ConfidenceChip confidence={field.confidence} />
                  </Box>
                </Box>
              );
            })}
          </Box>

          <Typography variant="caption" color="text.secondary">
            הנתונים ימולאו אוטומטית בטופס בשלב הבא.
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
