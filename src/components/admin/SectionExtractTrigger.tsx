'use client';

import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import type { SectionKey } from '@/lib/vision/ordinance-extractor';

export interface SectionExtractTriggerProps {
  sectionKey: SectionKey;
  sectionLabel: string;
  onOpen: (key: SectionKey, label: string) => void;
}

export default function SectionExtractTrigger({
  sectionKey,
  sectionLabel,
  onOpen,
}: SectionExtractTriggerProps) {
  return (
    <Tooltip title="חילוץ מתמונה/PDF">
      <IconButton
        component="span"
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onOpen(sectionKey, sectionLabel);
        }}
        sx={{ ml: 'auto' }}
        aria-label={`חילוץ מתמונה או PDF — ${sectionLabel}`}
      >
        <UploadFileIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
