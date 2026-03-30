'use client';

import { useState, useMemo, type MouseEvent } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export interface DocumentPreviewPopoverProps {
  documentUrl: string;
  /** When set (e.g. `/api/view-pdf/{slug}`), iframe and download use this proxy; download appends `?download=1`. */
  previewSrc?: string;
  title: string;
  triggerLabel: string;
  triggerAriaLabel?: string;
  downloadLabel?: string;
  downloadFileName?: string;
}

function defaultFileNameFromUrl(url: string): string {
  try {
    const path = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'https://localhost').pathname;
    const base = path.split('/').pop() ?? '';
    return base || 'document.pdf';
  } catch {
    const segment = url.split('/').pop()?.split('?')[0];
    return segment && segment.includes('.') ? segment : 'document.pdf';
  }
}

export default function DocumentPreviewPopover({
  documentUrl,
  previewSrc,
  title,
  triggerLabel,
  triggerAriaLabel,
  downloadLabel = 'הורדת הקובץ',
  downloadFileName,
}: DocumentPreviewPopoverProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const iframeSrc = previewSrc ?? documentUrl;

  const downloadHref = useMemo(() => {
    if (previewSrc) {
      const sep = previewSrc.includes('?') ? '&' : '?';
      return `${previewSrc}${sep}download=1`;
    }
    return documentUrl;
  }, [previewSrc, documentUrl]);

  const resolvedDownloadName = useMemo(
    () => downloadFileName ?? defaultFileNameFromUrl(documentUrl),
    [downloadFileName, documentUrl],
  );

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        type="button"
        variant="text"
        color="primary"
        onClick={handleOpen}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={triggerAriaLabel ?? triggerLabel}
        sx={{ textTransform: 'none', fontWeight: 600 }}
      >
        {triggerLabel}
      </Button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        aria-labelledby="document-preview-popover-title"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            sx: {
              maxWidth: 'min(900px, 95vw)',
              maxHeight: 'min(90vh, 900px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            },
          },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            bgcolor: 'background.paper',
            maxHeight: 'min(90vh, 900px)',
          }}
        >
          <Typography variant="subtitle1" component="h2" id="document-preview-popover-title">
            {title}
          </Typography>
          <Box
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              overflow: 'hidden',
              flex: '1 1 auto',
              minHeight: { xs: '45vh', sm: '55vh' },
              maxHeight: '65vh',
            }}
          >
            <Box
              component="iframe"
              src={iframeSrc}
              title={title}
              sx={{
                display: 'block',
                width: 1,
                height: 1,
                minHeight: { xs: '45vh', sm: '55vh' },
                border: 0,
              }}
            />
          </Box>
          <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
            <Button
              component="a"
              href={downloadHref}
              download={previewSrc ? undefined : resolvedDownloadName}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              color="primary"
            >
              {downloadLabel}
            </Button>
            <Button type="button" variant="outlined" color="inherit" onClick={handleClose}>
              סגירה
            </Button>
          </Stack>
        </Paper>
      </Popover>
    </>
  );
}
