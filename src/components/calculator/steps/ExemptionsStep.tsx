'use client';

import { useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { StepProps } from '../CalculatorWizard';
import {
  wizardNavRowSx,
  wizardPrimaryButtonSx,
  wizardSecondaryButtonSx,
  wizardSectionHeaderSx,
  wizardSectionTitleSx,
} from '../wizardStyles';
import type { SelectedExemption } from '../CalculatorWizard';
import type { IExemptionSubSection, IExemptionSection } from '@/lib/types/city-tariff';
import type { IPropertyType, ISubType } from '@/lib/models/CityTariff';
import { useLeadUpdate } from '@/hooks/useLeadUpdate';

const MAX_ROWS = 3;

export default function ExemptionsStep({ state, dispatch, sx }: StepProps) {
  const { updateLead } = useLeadUpdate();
  const cityData = state.cityData;
  const isBusiness = state.propertyType === 'business';
  const hasAreaTypeDiscounts = !!(cityData?.areaTypeDiscounts?.length > 0);

  const allExemptionSections: IExemptionSection[] = cityData?.exemptions ?? [];
  const exemptionSections = useMemo(() => {
    const type = state.propertyType; // 'private' | 'business'
    return allExemptionSections.filter(
      (s) => s.applicableTo === 'both' || s.applicableTo === type,
    );
  }, [allExemptionSections, state.propertyType]);

  // ── Mia message on mount ──
  useEffect(() => {
    dispatch({ type: 'SET_MIA_MESSAGE', payload: 'step-3-default' });
  }, [dispatch]);

  // ── Initialize additionalAreas slots when city defines areaTypeDiscounts ──
  useEffect(() => {
    if (!hasAreaTypeDiscounts) return;
    if (state.additionalAreas?.length > 0) return;
    const initial = (cityData.areaTypeDiscounts as { areaType: string }[]).map((d) => ({
      areaType: d.areaType,
      areaSqm: 0,
    }));
    dispatch({ type: 'UPDATE_FIELD', field: 'additionalAreas', value: initial });
  }, [hasAreaTypeDiscounts, state.additionalAreas, cityData, dispatch]);

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

  // ── All subtypes for "טעות בסיווג" dropdown ──
  const allSubtypes: ISubType[] =
    cityData?.types.flatMap((t: IPropertyType) => t.subtypes) ?? [];

  // ── Handlers for the moved fields ──
  const handleAdditionalAreaChange = (index: number, value: number) => {
    // Ensure the array is fully sized (matches areaTypeDiscounts order).
    const discounts = (cityData?.areaTypeDiscounts ?? []) as { areaType: string }[];
    const base =
      state.additionalAreas?.length === discounts.length
        ? state.additionalAreas
        : discounts.map((d, i) => ({
            areaType: d.areaType,
            areaSqm: state.additionalAreas?.[i]?.areaSqm ?? 0,
          }));
    const next = base.map((a, i) => (i === index ? { ...a, areaSqm: value } : a));
    dispatch({ type: 'UPDATE_FIELD', field: 'additionalAreas', value: next });
  };

  const handleClaimedAreaChange = (value: number) => {
    if (value > 0) {
      dispatch({
        type: 'SET_MEASUREMENT_ERROR',
        payload: { claimed: value, attachment: '' },
      });
    } else {
      dispatch({ type: 'SET_MEASUREMENT_ERROR', payload: null });
    }
  };

  const handleSuggestedClassChange = (value: string) => {
    if (value) {
      dispatch({
        type: 'SET_CLASSIFICATION_ERROR',
        payload: { suggested: value },
      });
    } else {
      dispatch({ type: 'SET_CLASSIFICATION_ERROR', payload: null });
    }
  };

  const updateRows = (newRows: SelectedExemption[]) => {
    dispatch({ type: 'SET_SELECTED_EXEMPTIONS', payload: newRows });
  };

  const handleSectionChange = (index: number, sectionCode: string) => {
    const newRows = [...rows];
    newRows[index] = { sectionCode, subSectionCode: '' }; // Reset subsection on category change
    updateRows(newRows);

    // Dispatch Mia message for the selected exemption category
    if (sectionCode) {
      const section = exemptionSections.find((s) => s.sectionCode === sectionCode);
      if (section?.miaMessageId) {
        dispatch({ type: 'SET_MIA_MESSAGE', payload: section.miaMessageId });
      } else {
        dispatch({ type: 'SET_MIA_MESSAGE', payload: 'step-3-default' });
      }
    } else {
      dispatch({ type: 'SET_MIA_MESSAGE', payload: 'step-3-default' });
    }
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

  const handleNext = () => {
    // Filter out zero-area additionalAreas before persisting
    if (hasAreaTypeDiscounts) {
      const filtered = (state.additionalAreas ?? []).filter((a) => a.areaSqm > 0);
      dispatch({ type: 'UPDATE_FIELD', field: 'additionalAreas', value: filtered });
    }
    updateLead(state.leadId, state.calculationIndex, {
      abandonmentStage: 'exemptions',
      selectedExemptions: state.selectedExemptions,
      householdSize: state.householdSize,
      childrenCount: state.childrenCount,
      coveredBalconyArea: state.coveredBalconyArea || undefined,
      storageArea: state.storageArea || undefined,
      parkingArea: state.parkingArea || undefined,
    });
    dispatch({ type: 'NEXT_STEP' });
  };

  const additionalAreaFieldsGridSx = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 150px), 1fr))',
    gap: 2,
    width: '100%',
    minWidth: 0,
  } as const;

  return (
    <Box sx={{ ...sx, justifyContent: 'space-between' }}>
      {/* ─── שטחים נוספים ─── */}
      {hasAreaTypeDiscounts ? (
        <Box sx={{ mb: 3 }}>
          <Box sx={wizardSectionHeaderSx}>
            <Typography sx={wizardSectionTitleSx}>שטחים נוספים</Typography>
          </Box>
          <Box sx={additionalAreaFieldsGridSx}>
            {(cityData.areaTypeDiscounts as { areaType: string; label: string; discountPercent: number }[]).map(
              (d, idx) => {
                const current = state.additionalAreas?.find((a) => a.areaType === d.areaType);
                return (
                  <TextField
                    key={d.areaType}
                    label={`${d.label} (מ"ר)`}
                    type="number"
                    fullWidth
                    size="small"
                    value={current?.areaSqm || ''}
                    onChange={(e) =>
                      handleAdditionalAreaChange(idx, Number(e.target.value))
                    }
                    helperText={`הנחה ${d.discountPercent}%`}
                  />
                );
              },
            )}
          </Box>
        </Box>
      ) : (
        <Box sx={{ mb: 3 }}>
          <Box sx={wizardSectionHeaderSx}>
            <Typography sx={wizardSectionTitleSx}>שטחים נוספים</Typography>
          </Box>
          <Box sx={additionalAreaFieldsGridSx}>
            <TextField
              label='מרפסת מקורה (מ"ר)'
              type="number"
              fullWidth
              size="small"
              value={state.coveredBalconyArea || ''}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_FIELD',
                  field: 'coveredBalconyArea',
                  value: Number(e.target.value),
                })
              }
            />
            <TextField
              label='מחסן (מ"ר)'
              type="number"
              fullWidth
              size="small"
              value={state.storageArea || ''}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_FIELD',
                  field: 'storageArea',
                  value: Number(e.target.value),
                })
              }
            />
            <TextField
              label='חניה (מ"ר)'
              type="number"
              fullWidth
              size="small"
              value={state.parkingArea || ''}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_FIELD',
                  field: 'parkingArea',
                  value: Number(e.target.value),
                })
              }
            />
          </Box>
        </Box>
      )}

      {/* ─── טעות במדידה ─── */}
      <Box sx={{ mb: 3 }}>
        <Box sx={wizardSectionHeaderSx}>
          <Typography sx={wizardSectionTitleSx}>האם יש טעות בשטח הנכס?</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
          <Typography
            component="span"
            variant="body2"
            sx={{ flexShrink: 0, width: '35%' }}
          >
            טעות במדידה
          </Typography>
          <TextField
            type="number"
            placeholder='שטח מתוקן (מ"ר)'
            value={state.measurementError?.claimed || ''}
            onChange={(e) => handleClaimedAreaChange(Number(e.target.value))}
            onFocus={() =>
              dispatch({ type: 'SET_MIA_MESSAGE', payload: 'error-measurement' })
            }
            inputProps={{ 'aria-label': 'שטח מתוקן במטרים רבועים' }}
            size="small"
            sx={{ flex: 1, minWidth: 0 }}
          />
        </Box>
      </Box>

      {/* ─── טעות בסיווג (עסקי בלבד) ─── */}
      {isBusiness && (
        <Box sx={{ mb: 3 }}>
          <Box sx={wizardSectionHeaderSx}>
            <Typography sx={wizardSectionTitleSx}>האם יש טעות בסיווג הנכס?</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
            <Typography
              component="span"
              variant="body2"
              sx={{ flexShrink: 0, width: '35%' }}
            >
              טעות בסיווג
            </Typography>
            <TextField
              select
              value={state.classificationError?.suggested ?? ''}
              onChange={(e) => handleSuggestedClassChange(e.target.value)}
              onFocus={() =>
                dispatch({ type: 'SET_MIA_MESSAGE', payload: 'error-classification' })
              }
              size="small"
              sx={{ flex: 1, minWidth: 0 }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (value: unknown) => {
                  const v = value as string;
                  if (!v) return 'בחר';
                  return allSubtypes.find((s: ISubType) => s.code === v)?.label ?? v;
                },
              }}
              inputProps={{ 'aria-label': 'סיווג מוצע' }}
            >
              <MenuItem value="">בחר</MenuItem>
              {allSubtypes.map((s: ISubType) => (
                <MenuItem key={s.code} value={s.code}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>
      )}

      {/* ─── הנחות ופטורים ─── */}
      <Box sx={wizardSectionHeaderSx}>
        <Typography sx={wizardSectionTitleSx}>הנחות ופטורים</Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        שים לב: לא ניתן לקבל כפל הנחות. תחול ההנחה הגבוהה ביותר בלבד.
      </Alert>

      {exemptionSections.length === 0 && (
        <Typography color="text.secondary" textAlign="center" py={4}>
          לא נמצאו הנחות זמינות לעיר זו
        </Typography>
      )}

      {exemptionSections.length > 0 && (
        <Box>
          {rows.map((row, index) => {
            const filteredSubSections: IExemptionSubSection[] = row.sectionCode
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
                    <MenuItem key={section.sectionLabel + section.sectionCode} value={section.sectionCode}>
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
        </Box>
      )}

      <Box sx={wizardNavRowSx}>
        <Button
          variant="outlined"
          onClick={() => dispatch({ type: 'PREV_STEP' })}
          startIcon={<ChevronRightIcon />}
          sx={wizardSecondaryButtonSx}
        >
          לשלב הקודם
        </Button>
        <Button
          variant="contained"
          endIcon={<ChevronLeftIcon />}
          sx={wizardPrimaryButtonSx}
          onClick={handleNext}
        >
          {hasAnySelection ? 'לשלב הבא' : 'דלג'}
        </Button>
      </Box>
    </Box>
  );
}
