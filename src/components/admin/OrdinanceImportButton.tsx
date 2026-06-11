'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import OrdinanceImportDialog from './OrdinanceImportDialog';
import type { ICityTariffData } from '@/lib/types/city-tariff';

interface OrdinanceImportButtonProps {
  mode: 'create' | 'update';
  existingCityId?: string;
  onOrdinanceImported?: (data: ICityTariffData) => void;
}

export default function OrdinanceImportButton({
  mode,
  existingCityId,
  onOrdinanceImported,
}: OrdinanceImportButtonProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<UploadFileIcon />}
        onClick={() => setOpen(true)}
      >
        {mode === 'update' ? 'עדכון מצו ארנונה' : 'ייבוא מצו ארנונה'}
      </Button>

      <OrdinanceImportDialog
        open={open}
        onClose={() => setOpen(false)}
        mode={mode}
        existingCityId={existingCityId}
        onOrdinanceImported={onOrdinanceImported}
      />
    </>
  );
}
