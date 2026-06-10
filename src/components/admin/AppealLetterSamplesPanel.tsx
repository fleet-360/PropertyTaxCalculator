'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DocumentPreviewPopover from '@/components/common/DocumentPreviewPopover';
import {
  appealSampleDraftDisplayName,
  appealSampleDraftHasFile,
  type IAppealSampleDraftSlot,
} from '@/lib/types/appeal-letter-sample';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const APPEAL_SAMPLE_PDF_MIME = 'application/pdf';

export default function AppealLetterSamplesPanel({
  draftSlots,
  onDraftChange,
  disabled = false,
  error: externalError,
  onError,
}: {
  draftSlots: IAppealSampleDraftSlot[];
  onDraftChange: (slots: IAppealSampleDraftSlot[]) => void;
  disabled?: boolean;
  error?: string | null;
  onError?: (message: string | null) => void;
}) {
  const [localError, setLocalError] = React.useState<string | null>(null);
  const error = externalError ?? localError;

  const setError = (msg: string | null) => {
    setLocalError(msg);
    onError?.(msg);
  };

  const updateSlot = (slot: number, patch: Partial<IAppealSampleDraftSlot>) => {
    onDraftChange(
      draftSlots.map((d) => (d.slot === slot ? { ...d, ...patch } : d)),
    );
  };

  const handlePickFile = (slot: number, file: File) => {
    setError(null);
    if (file.type !== APPEAL_SAMPLE_PDF_MIME) {
      setError('ניתן להעלות קובצי PDF בלבד');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('הקובץ גדול מ-10MB');
      return;
    }
    updateSlot(slot, { pendingFile: file, removed: false });
  };

  const handleRemove = (slot: number) => {
    setError(null);
    updateSlot(slot, { pendingFile: null, removed: true });
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
        דוגמאות PDF למכתב השגה
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        עד 3 קבצי PDF שיישלחו ל-Gemini כדוגמאות למבנה מכתב. השינויים יישמרו בלחיצה על &quot;שמור&quot;.
      </Typography>

      {error && (
        <Typography variant="body2" color="error.main" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} useFlexGap>
        {draftSlots.map((draft) => {
          const inputId = `appeal-sample-upload-${draft.slot}`;
          const displayName = appealSampleDraftDisplayName(draft);
          const hasFile = appealSampleDraftHasFile(draft);
          const previewSrc = draft.pendingFile
            ? URL.createObjectURL(draft.pendingFile)
            : hasFile && !draft.removed
              ? `/api/admin/appeal-samples/preview?slot=${draft.slot}`
              : undefined;

          return (
            <Card
              key={draft.slot}
              variant="outlined"
              sx={{
                flex: 1,
                minWidth: 0,
                borderStyle: hasFile ? 'solid' : 'dashed',
              }}
            >
              <CardContent sx={{ pb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  דוגמה {draft.slot}
                </Typography>
                {displayName ? (
                  <Typography variant="body2" noWrap title={displayName}>
                    {displayName}
                    {draft.pendingFile && (
                      <Typography component="span" variant="caption" color="warning.main" sx={{ mr: 0.5 }}>
                        {' '}
                        (טרם נשמר)
                      </Typography>
                    )}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    לא הועלה קובץ
                  </Typography>
                )}
              </CardContent>
              <CardActions sx={{ pt: 0, flexWrap: 'wrap', gap: 0.5 }}>
                {hasFile && previewSrc && (
                  <DocumentPreviewPopover
                    documentUrl={previewSrc}
                    previewSrc={draft.pendingFile ? previewSrc : `/api/admin/appeal-samples/preview?slot=${draft.slot}`}
                    title={`דוגמת מכתב השגה ${draft.slot}`}
                    triggerLabel="צפייה"
                    triggerAriaLabel={`צפייה בדוגמה ${draft.slot}`}
                    downloadFileName={displayName ?? undefined}
                    triggerVariant="outlined"
                  />
                )}
                <Button
                  component="label"
                  htmlFor={inputId}
                  variant="outlined"
                  size="small"
                  startIcon={<UploadFileIcon />}
                  disabled={disabled}
                >
                  {hasFile ? 'החלף' : 'העלה PDF'}
                </Button>
                <input
                  id={inputId}
                  type="file"
                  accept="application/pdf,.pdf"
                  hidden
                  disabled={disabled}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (f) handlePickFile(draft.slot, f);
                  }}
                />
                {hasFile && (
                  <Tooltip title="הסר קובץ">
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        aria-label={`הסר דוגמה ${draft.slot}`}
                        disabled={disabled}
                        onClick={() => handleRemove(draft.slot)}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
              </CardActions>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
}
