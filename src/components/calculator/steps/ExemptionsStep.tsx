'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import type { StepProps } from '../CalculatorWizard';
import type { SelectedExemption } from '../CalculatorWizard';
import type { IExemptionSubSection, IExemptionSection } from '@/lib/types/city-tariff';

const MAX_ROWS = 3;

export default function ExemptionsStep({ state, dispatch }: StepProps) {
  const exemptionSections: IExemptionSection[] = state.cityData?.exemptions ?? [];
  const rows = state.selectedExemptions.length > 0
    ? state.selectedExemptions
    : [{ sectionCode: '', subSectionCode: '' }];

  // Check if any selected exemption requires restriction fields
  const needsHouseholdSize = useMemo(() => {
    return rows.some((row) => {
      if (!row.subSectionCode) return false;
      const section = exemptionSections.find((s) => s.sectionCode === row.sectionCode);
      const sub = section?.subSections?.find((s) => s.code === row.subSectionCode);
      return sub?.restrictions?.minHouseholdSize;
    });
  }, [rows, exemptionSections]);

  const needsChildrenCount = useMemo(() => {
    return rows.some((row) => {
      if (!row.subSectionCode) return false;
      const section = exemptionSections.find((s) => s.sectionCode === row.sectionCode);
      const sub = section?.subSections?.find((s) => s.code === row.subSectionCode);
      return sub?.restrictions?.minChildren;
    });
  }, [rows, exemptionSections]);

  const updateRows = (newRows: SelectedExemption[]) => {
    dispatch({ type: 'SET_SELECTED_EXEMPTIONS', payload: newRows });
  };

  const handleSectionChange = (index: number, sectionCode: string) => {
    const newRows = [...rows];
    newRows[index] = { sectionCode, subSectionCode: '' }; // Reset subsection on category change
    updateRows(newRows);
  };

  const handleSubSectionChange = (index: number, subSectionCode: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], subSectionCode };
    updateRows(newRows);
  };

  const handleAddRow = () => {
    if (rows.length < MAX_ROWS) {
      updateRows([...rows, { sectionCode: '', subSectionCode: '' }]);
    }
  };

  const handleRemoveRow = (index: number) => {
    const newRows = rows.filter((_, i) => i !== index);
    updateRows(newRows.length > 0 ? newRows : [{ sectionCode: '', subSectionCode: '' }]);
  };

  const hasAnySelection = rows.some((r) => r.subSectionCode);

  return (
    <Box>
      <Typography variant="h5" textAlign="center" mb={2}>
        הנחות וזכאויות
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        שים לב: לא ניתן לקבל כפל הנחות. תחול ההנחה הגבוהה ביותר בלבד.
      </Alert>

      {exemptionSections.length === 0 && (
        <Typography color="text.secondary" textAlign="center" py={4}>
          לא נמצאו הנחות זמינות לעיר זו
        </Typography>
      )}

      {exemptionSections.length > 0 && (
        <>
          {rows.map((row, index) => {
            const filteredSubSections = row.sectionCode
              ? exemptionSections.find((s) => s.sectionCode === row.sectionCode)?.subSections ?? []
              : [];

            return (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  alignItems: 'flex-start',
                  mb: 2,
                }}
              >
                {/* Category dropdown */}
                <TextField
                  select
                  label="קטגוריה"
                  value={row.sectionCode}
                  onChange={(e) => handleSectionChange(index, e.target.value)}
                  sx={{ flex: 1 }}
                  size="small"
                >
                  <MenuItem value="" disabled>
                    בחר קטגוריה
                  </MenuItem>
                  {exemptionSections.map((section) => (
                    <MenuItem key={section.sectionCode} value={section.sectionCode}>
                      {section.sectionLabel}
                    </MenuItem>
                  ))}
                </TextField>

                {/* Subcategory dropdown */}
                <TextField
                  select
                  label="הנחה"
                  value={row.subSectionCode}
                  onChange={(e) => handleSubSectionChange(index, e.target.value)}
                  disabled={!row.sectionCode}
                  sx={{ flex: 1.5 }}
                  size="small"
                >
                  <MenuItem value="" disabled>
                    בחר הנחה
                  </MenuItem>
                  {filteredSubSections.map((sub) => (
                    <MenuItem key={sub.code} value={sub.code}>
                      {sub.description} — {sub.discountPercent}%
                    </MenuItem>
                  ))}
                </TextField>

                {/* Remove row button */}
                {rows.length > 1 && (
                  <IconButton
                    onClick={() => handleRemoveRow(index)}
                    size="small"
                    sx={{ mt: 0.5 }}
                    aria-label="הסר הנחה"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            );
          })}

          {/* Add row button */}
          {rows.length < MAX_ROWS && (
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddRow}
              size="small"
              sx={{ mb: 2, textTransform: 'none' }}
            >
              הוסף הנחה
            </Button>
          )}

          {/* Global restriction fields */}
          {(needsHouseholdSize || needsChildrenCount) && (
            <Box sx={{ display: 'flex', gap: 2, mt: 2, mb: 2 }}>
              {needsHouseholdSize && (
                <TextField
                  label="גודל משק בית"
                  type="number"
                  value={state.householdSize}
                  onChange={(e) =>
                    dispatch({ type: 'UPDATE_FIELD', field: 'householdSize', value: Number(e.target.value) })
                  }
                  size="small"
                  sx={{ flex: 1 }}
                  slotProps={{ htmlInput: { min: 1 } }}
                />
              )}
              {needsChildrenCount && (
                <TextField
                  label="מספר ילדים"
                  type="number"
                  value={state.childrenCount}
                  onChange={(e) =>
                    dispatch({ type: 'UPDATE_FIELD', field: 'childrenCount', value: Number(e.target.value) })
                  }
                  size="small"
                  sx={{ flex: 1 }}
                  slotProps={{ htmlInput: { min: 0 } }}
                />
              )}
            </Box>
          )}
        </>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button variant="outlined" onClick={() => dispatch({ type: 'PREV_STEP' })}>
          חזרה
        </Button>
        <Button variant="contained" onClick={() => dispatch({ type: 'NEXT_STEP' })}>
          {hasAnySelection ? 'הבא' : 'דלג'}
        </Button>
      </Box>
    </Box>
  );
}
