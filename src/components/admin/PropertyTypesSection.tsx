'use client';
import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import FormHelperText from '@mui/material/FormHelperText';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ALL_ZONES_TARIFF_CODE, ALL_ZONES_LABEL_HE } from '@/lib/tariff-constants';
import SectionExtractTrigger from '@/components/admin/SectionExtractTrigger';
import DraggableListItem from '@/components/admin/dnd/DraggableListItem';
import DragOverlayPortal from '@/components/admin/dnd/DragOverlayPortal';
import MergeConfirmDialog from '@/components/admin/dnd/MergeConfirmDialog';
import { useDndTariffTypes } from '@/hooks/useDndTariffTypes';
import type { SectionKey } from '@/lib/vision/ordinance-extractor';
import type {
  IZoneRate,
  ICityTariffData,
} from '@/lib/types/city-tariff';

// ── Props ───────────────────────────────────────────────────────────
export interface PropertyTypesSectionProps {
  data: ICityTariffData;
  setData: React.Dispatch<React.SetStateAction<ICityTariffData>>;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  errorCount: number;
  accordionSx: object | undefined;
  fieldErr: (path: string) => string | undefined;
  clearFieldErr: (path: string) => void;
  hasPathPrefix: (prefix: string) => boolean;
  listItemErrorSx: (hasErr: boolean) => object | undefined;
  openSectionExtract: (key: SectionKey, label: string) => void;
}

// ── Component ───────────────────────────────────────────────────────
export default function PropertyTypesSection({
  data,
  setData,
  expanded,
  onExpandedChange,
  errorCount,
  accordionSx,
  fieldErr,
  clearFieldErr,
  hasPathPrefix,
  listItemErrorSx,
  openSectionExtract,
}: PropertyTypesSectionProps) {
  // ── Selection state ──────────────────────────────────────────────
  const [selectedTypeIndex, setSelectedTypeIndex] = React.useState<number | null>(() =>
    data.types.length > 0 ? 0 : null,
  );
  const [selectedSubtypeIndex, setSelectedSubtypeIndex] = React.useState<number | null>(() => {
    if (!data.types.length) return null;
    return data.types[0].subtypes.length > 0 ? 0 : null;
  });

  const selectedSubtypesLen =
    selectedTypeIndex !== null ? data.types[selectedTypeIndex]?.subtypes.length ?? 0 : 0;

  React.useEffect(() => {
    if (selectedTypeIndex === null) {
      setSelectedSubtypeIndex(null);
      return;
    }
    if (selectedSubtypesLen === 0) {
      setSelectedSubtypeIndex(null);
      return;
    }
    setSelectedSubtypeIndex((si) => (si === null || si >= selectedSubtypesLen ? 0 : si));
  }, [selectedTypeIndex, selectedSubtypesLen]);

  // ── DnD ─────────────────────────────────────────────────────────
  const dnd = useDndTariffTypes(
    data,
    setData,
    selectedTypeIndex,
    setSelectedTypeIndex,
    selectedSubtypeIndex,
    setSelectedSubtypeIndex,
  );

  const typeIds = React.useMemo(
    () => data.types.map((_, i) => `type-${i}`),
    [data.types],
  );

  const subtypeIds = React.useMemo(
    () =>
      selectedTypeIndex !== null
        ? data.types[selectedTypeIndex]?.subtypes.map(
            (_, i) => `subtype-${selectedTypeIndex}-${i}`,
          ) ?? []
        : [],
    [data.types, selectedTypeIndex],
  );

  // ── Type helpers ────────────────────────────────────────────────
  const addType = () => {
    let newTi = 0;
    setData((prev) => {
      newTi = prev.types.length;
      return {
        ...prev,
        types: [...prev.types, { code: '', label: '', category: 'business', subtypes: [] }],
      };
    });
    setSelectedTypeIndex(newTi);
    setSelectedSubtypeIndex(null);
  };

  const updateType = (ti: number, field: string, value: string) => {
    setData((prev) => {
      const types = [...prev.types];
      types[ti] = { ...types[ti], [field]: value };
      return { ...prev, types };
    });
  };

  const removeType = (ti: number) => {
    const newTypes = data.types.filter((_, i) => i !== ti);
    setData((prev) => ({ ...prev, types: newTypes }));
    setSelectedTypeIndex((prevSel) => {
      if (newTypes.length === 0) return null;
      if (prevSel === null) return 0;
      if (ti < prevSel) return prevSel - 1;
      if (ti === prevSel) return Math.min(prevSel, newTypes.length - 1);
      return prevSel;
    });
  };

  // ── Subtype helpers ─────────────────────────────────────────────
  const addSubtype = (ti: number) => {
    let newSi = 0;
    setData((prev) => {
      const types = [...prev.types];
      newSi = types[ti].subtypes.length;
      types[ti] = {
        ...types[ti],
        subtypes: [
          ...types[ti].subtypes,
          { code: '', label: '', hasSizeRanges: false, isProgressiveRate: false, zones: [] },
        ],
      };
      return { ...prev, types };
    });
    setSelectedTypeIndex(ti);
    setSelectedSubtypeIndex(newSi);
  };

  const updateSubtype = (ti: number, si: number, field: string, value: string | boolean) => {
    setData((prev) => {
      const types = [...prev.types];
      const subtypes = [...types[ti].subtypes];
      subtypes[si] = { ...subtypes[si], [field]: value };
      types[ti] = { ...types[ti], subtypes };
      return { ...prev, types };
    });
  };

  const removeSubtype = (ti: number, si: number) => {
    const newSubs = data.types[ti].subtypes.filter((_, i) => i !== si);
    setData((prev) => {
      const types = [...prev.types];
      types[ti] = {
        ...types[ti],
        subtypes: newSubs,
      };
      return { ...prev, types };
    });
    if (selectedTypeIndex === ti) {
      setSelectedSubtypeIndex((prevSel) => {
        if (newSubs.length === 0) return null;
        if (prevSel === null) return 0;
        if (si < prevSel) return prevSel - 1;
        if (si === prevSel) return Math.min(prevSel, newSubs.length - 1);
        return prevSel;
      });
    }
  };

  // ── Zone rate helpers ───────────────────────────────────────────
  const addZoneRate = (ti: number, si: number) => {
    setData((prev) => {
      const types = [...prev.types];
      const subtypes = [...types[ti].subtypes];
      subtypes[si] = {
        ...subtypes[si],
        zones: [...subtypes[si].zones, { zone: '', zoneLabel: '', rate: 0 }],
      };
      types[ti] = { ...types[ti], subtypes };
      return { ...prev, types };
    });
  };

  const updateZoneRate = (ti: number, si: number, zi: number, field: string, value: string | number) => {
    setData((prev) => {
      const types = [...prev.types];
      const subtypes = [...types[ti].subtypes];
      const zones = [...subtypes[si].zones];
      zones[zi] = { ...zones[zi], [field]: value };
      if (field === 'zone') {
        if (value === ALL_ZONES_TARIFF_CODE) {
          zones[zi].zoneLabel = ALL_ZONES_LABEL_HE;
        } else {
          const found = prev.availableZones.find((z) => z.code === value);
          if (found) zones[zi].zoneLabel = found.label;
        }
      }
      subtypes[si] = { ...subtypes[si], zones };
      types[ti] = { ...types[ti], subtypes };
      return { ...prev, types };
    });
  };

  const removeZoneRate = (ti: number, si: number, zi: number) => {
    setData((prev) => {
      const types = [...prev.types];
      const subtypes = [...types[ti].subtypes];
      subtypes[si] = {
        ...subtypes[si],
        zones: subtypes[si].zones.filter((_, i) => i !== zi),
      };
      types[ti] = { ...types[ti], subtypes };
      return { ...prev, types };
    });
  };

  const duplicateZoneRate = (ti: number, si: number, zi: number) => {
    setData((prev) => {
      const types = [...prev.types];
      const subtypes = [...types[ti].subtypes];
      const zones = [...subtypes[si].zones];
      const src = zones[zi];
      const hasZone = Boolean(src.zone?.trim());
      const copy: IZoneRate = {
        ...src,
        zone: hasZone ? '' : src.zone,
        zoneLabel: hasZone ? '' : src.zoneLabel,
        sizeRanges: src.sizeRanges?.map((sr) => ({ ...sr })),
      };
      zones.splice(zi + 1, 0, copy);
      subtypes[si] = { ...subtypes[si], zones };
      types[ti] = { ...types[ti], subtypes };
      return { ...prev, types };
    });
  };

  // ── Size range helpers ──────────────────────────────────────────
  const addSizeRange = (ti: number, si: number, zi: number) => {
    setData((prev) => {
      const types = [...prev.types];
      const subtypes = [...types[ti].subtypes];
      const zones = [...subtypes[si].zones];
      const prevRanges = [...(zones[zi].sizeRanges || [])];
      if (prevRanges.length > 0) {
        const li = prevRanges.length - 1;
        const last = prevRanges[li];
        if (last.max === -1) {
          prevRanges[li] = { ...last, max: last.min };
        }
      }
      prevRanges.push({ min: 0, max: -1, rate: 0 });
      zones[zi] = {
        ...zones[zi],
        sizeRanges: prevRanges,
      };
      subtypes[si] = { ...subtypes[si], zones };
      types[ti] = { ...types[ti], subtypes };
      return { ...prev, types };
    });
  };

  const updateSizeRange = (ti: number, si: number, zi: number, ri: number, field: string, value: number | string) => {
    setData((prev) => {
      const types = [...prev.types];
      const subtypes = [...types[ti].subtypes];
      const zones = [...subtypes[si].zones];
      const ranges = [...(zones[zi].sizeRanges || [])];
      ranges[ri] = { ...ranges[ri], [field]: value };
      zones[zi] = { ...zones[zi], sizeRanges: ranges };
      subtypes[si] = { ...subtypes[si], zones };
      types[ti] = { ...types[ti], subtypes };
      return { ...prev, types };
    });
  };

  const removeSizeRange = (ti: number, si: number, zi: number, ri: number) => {
    setData((prev) => {
      const types = [...prev.types];
      const subtypes = [...types[ti].subtypes];
      const zones = [...subtypes[si].zones];
      let filtered = (zones[zi].sizeRanges || []).filter((_, i) => i !== ri);
      if (filtered.length > 0) {
        const li = filtered.length - 1;
        filtered = [...filtered];
        filtered[li] = { ...filtered[li], max: -1 };
      }
      zones[zi] = {
        ...zones[zi],
        sizeRanges: filtered,
      };
      subtypes[si] = { ...subtypes[si], zones };
      types[ti] = { ...types[ti], subtypes };
      return { ...prev, types };
    });
  };

  // ── Render ──────────────────────────────────────────────────────
  return (
    <>
    <Accordion
      expanded={expanded}
      onChange={(_, exp) => onExpandedChange(exp)}
      sx={accordionSx}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            סוגי נכס ותעריפים <Chip label={data.types.length} size="small" sx={{ ml: 1 }} />
          </Typography>
          {errorCount > 0 && (
            <Chip size="small" color="error" label={`${errorCount} שגיאות`} />
          )}
          <SectionExtractTrigger
            sectionKey="rates"
            sectionLabel="סוגי נכס ותעריפים"
            onOpen={openSectionExtract}
          />
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        {data.types.length === 0 ? (
          <Button startIcon={<AddIcon />} onClick={addType} variant="outlined">
            הוסף סוג נכס
          </Button>
        ) : (
          <>
            {selectedTypeIndex !== null && data.types[selectedTypeIndex] && (
              <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  עריכת סוג נכס
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                  <TextField
                    size="small"
                    label="קוד סוג"
                    value={data.types[selectedTypeIndex].code}
                    onChange={(e) => {
                      clearFieldErr(`types.${selectedTypeIndex}.code`);
                      updateType(selectedTypeIndex, 'code', e.target.value);
                    }}
                    sx={{ width: 140 }}
                    error={Boolean(fieldErr(`types.${selectedTypeIndex}.code`))}
                    helperText={fieldErr(`types.${selectedTypeIndex}.code`)}
                  />
                  <TextField
                    size="small"
                    label="שם סוג"
                    value={data.types[selectedTypeIndex].label}
                    onChange={(e) => {
                      clearFieldErr(`types.${selectedTypeIndex}.label`);
                      updateType(selectedTypeIndex, 'label', e.target.value);
                    }}
                    sx={{ flex: 1, minWidth: 160 }}
                    error={Boolean(fieldErr(`types.${selectedTypeIndex}.label`))}
                    helperText={fieldErr(`types.${selectedTypeIndex}.label`)}
                  />
                  <FormControl
                    size="small"
                    sx={{ minWidth: 140 }}
                    error={Boolean(fieldErr(`types.${selectedTypeIndex}.category`))}
                  >
                    <InputLabel>קטגוריה</InputLabel>
                    <Select
                      label="קטגוריה"
                      value={(data.types[selectedTypeIndex].category ?? 'private') as 'private' | 'business'}
                      onChange={(e) => {
                        clearFieldErr(`types.${selectedTypeIndex}.category`);
                        updateType(selectedTypeIndex, 'category', e.target.value as 'private' | 'business');
                      }}
                    >
                      <MenuItem value="private">מגורים</MenuItem>
                      <MenuItem value="business">עסקים</MenuItem>
                    </Select>
                    {fieldErr(`types.${selectedTypeIndex}.category`) ? (
                      <FormHelperText>{fieldErr(`types.${selectedTypeIndex}.category`)}</FormHelperText>
                    ) : null}
                  </FormControl>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => removeType(selectedTypeIndex)}
                    aria-label="מחק סוג נכס"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Paper>
            )}

            <DndContext
              id="dnd-property-types"
              sensors={dnd.sensors}
              collisionDetection={dnd.collisionDetection}
              onDragStart={dnd.handleDragStart}
              onDragEnd={dnd.handleDragEnd}
            >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ alignItems: 'stretch', minHeight: 280 }}
            >
              {/* Panel 1: Property Types list */}
              <Paper
                variant="outlined"
                sx={{
                  flex: { sm: '0 0 240px' },
                  maxHeight: { sm: 420 },
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    סוגי נכס
                  </Typography>
                  <Button size="small" fullWidth startIcon={<AddIcon />} onClick={addType} variant="outlined">
                    הוסף סוג
                  </Button>
                </Box>
                <SortableContext items={typeIds} strategy={verticalListSortingStrategy}>
                <List dense disablePadding aria-label="רשימת סוגי נכס">
                  {data.types.map((type, ti) => (
                    <DraggableListItem
                      key={`type-${ti}`}
                      id={`type-${ti}`}
                      mergeEnabled
                      mergeDropId={`merge-type-${ti}`}
                      selected={selectedTypeIndex === ti}
                      onClick={() => {
                        setSelectedTypeIndex(ti);
                        setSelectedSubtypeIndex(type.subtypes.length ? 0 : null);
                      }}
                      ariaCurrent={selectedTypeIndex === ti ? 'true' : undefined}
                      ariaLabel={`בחר סוג ${type.label || type.code || ti}`}
                      sx={listItemErrorSx(hasPathPrefix(`types.${ti}`))}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                            <Typography component="span" variant="body2" sx={{ fontWeight: 600 }}>
                              {type.code || '—'} · {type.label || 'ללא שם'}
                            </Typography>
                            <Chip
                              size="small"
                              label={(type.category ?? 'private') === 'business' ? 'עסקים' : 'מגורים'}
                              color={(type.category ?? 'private') === 'business' ? 'secondary' : 'default'}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={`${type.subtypes.length} תתי־סוג`}
                      />
                    </DraggableListItem>
                  ))}
                </List>
                </SortableContext>
              </Paper>

              {/* Panel 2: SubTypes list */}
              <Paper
                variant="outlined"
                sx={{
                  flex: { sm: '0 0 220px' },
                  maxHeight: { sm: 420 },
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    תתי־סוג
                  </Typography>
                  {selectedTypeIndex !== null && (
                    <Button
                      size="small"
                      fullWidth
                      startIcon={<AddIcon />}
                      onClick={() => addSubtype(selectedTypeIndex)}
                      variant="outlined"
                    >
                      הוסף תת־סוג
                    </Button>
                  )}
                </Box>
                {selectedTypeIndex === null ? (
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      בחר סוג נכס
                    </Typography>
                  </Box>
                ) : data.types[selectedTypeIndex].subtypes.length === 0 ? (
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      אין תתי־סוג — הוסף תת־סוג
                    </Typography>
                  </Box>
                ) : (
                  <SortableContext items={subtypeIds} strategy={verticalListSortingStrategy}>
                  <List dense disablePadding aria-label="רשימת תתי־סוג">
                    {data.types[selectedTypeIndex].subtypes.map((sub, si) => (
                      <DraggableListItem
                        key={`subtype-${selectedTypeIndex}-${si}`}
                        id={`subtype-${selectedTypeIndex}-${si}`}
                        selected={selectedSubtypeIndex === si}
                        onClick={() => setSelectedSubtypeIndex(si)}
                        ariaCurrent={selectedSubtypeIndex === si ? 'true' : undefined}
                        ariaLabel={`בחר תת־סוג ${sub.label || sub?.code || si}`}
                        sx={listItemErrorSx(
                          hasPathPrefix(`types.${selectedTypeIndex}.subtypes.${si}`),
                        )}
                      >
                        <ListItemText
                          primary={`${sub.code || '—'} · ${sub.label || 'ללא שם'}`}
                          secondary={sub.hasSizeRanges ? 'טווחי גודל' : 'תעריף אחיד'}
                        />
                      </DraggableListItem>
                    ))}
                  </List>
                  </SortableContext>
                )}
              </Paper>

              {/* Panel 3: Zone rates detail */}
              <Paper
                variant="outlined"
                sx={{
                  flex: 1,
                  minWidth: 0,
                  maxHeight: { sm: 420 },
                  overflow: 'auto',
                  p: 1.5,
                }}
              >
                {selectedTypeIndex === null || selectedSubtypeIndex === null ? (
                  <Typography variant="body2" color="text.secondary">
                    בחר תת־סוג לעריכת תעריפים
                  </Typography>
                ) : (
                  (() => {
                    const ti = selectedTypeIndex;
                    const si = selectedSubtypeIndex;
                    const sub = data.types[ti].subtypes[si];
                    return (
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                          תעריף: {sub?.label || sub?.code || 'תת־סוג'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                          <TextField
                            size="small"
                            label="קוד תת-סוג"
                            value={sub.code}
                            onChange={(e) => {
                              clearFieldErr(`types.${ti}.subtypes.${si}.code`);
                              updateSubtype(ti, si, 'code', e.target.value);
                            }}
                            sx={{ width: 130 }}
                            error={Boolean(fieldErr(`types.${ti}.subtypes.${si}.code`))}
                            helperText={fieldErr(`types.${ti}.subtypes.${si}.code`)}
                          />
                          <TextField
                            size="small"
                            label="שם תת-סוג"
                            value={sub.label}
                            onChange={(e) => {
                              clearFieldErr(`types.${ti}.subtypes.${si}.label`);
                              updateSubtype(ti, si, 'label', e.target.value);
                            }}
                            sx={{ flex: 1, minWidth: 150 }}
                            error={Boolean(fieldErr(`types.${ti}.subtypes.${si}.label`))}
                            helperText={fieldErr(`types.${ti}.subtypes.${si}.label`)}
                          />
                          <FormControlLabel
                            control={
                              <Checkbox
                                size="small"
                                checked={sub.hasSizeRanges}
                                onChange={(e) => updateSubtype(ti, si, 'hasSizeRanges', e.target.checked)}
                              />
                            }
                            label="טווחי גודל"
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeSubtype(ti, si)}
                            aria-label="מחק תת־סוג"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>

                        {sub.hasSizeRanges && (
                          <Box sx={{ mb: 1, ml: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                              סוג חישוב לפי טווחי גודל (חל על כל האזורים של תת־סוג זה)
                            </Typography>
                            <ToggleButtonGroup
                              exclusive
                              size="small"
                              value={(sub.isProgressiveRate ?? false) ? 'progressive' : 'flat'}
                              onChange={(_, v) => {
                                if (v !== null) {
                                  updateSubtype(ti, si, 'isProgressiveRate', v === 'progressive');
                                }
                              }}
                              aria-label="סוג חישוב טווחי גודל"
                            >
                              <ToggleButton
                                value="progressive"
                                title="כל טווח חל רק על החלק מהשטח שנופל בתוך המדרגה (למשל 60 מ״ר ראשונים בתעריף אחד והמשך במדרגה הבאה)"
                              >
                                מצטבר (מדורג)
                              </ToggleButton>
                              <ToggleButton
                                value="flat"
                                title="נבחר טווח אחד לפי שטח הנכס, והתעריף שלו חל על כל השטח"
                              >
                                קבוע (לפי טווח)
                              </ToggleButton>
                            </ToggleButtonGroup>
                          </Box>
                        )}

                        {sub.zones.map((zr, zi) => {
                          const zPath = `types.${ti}.subtypes.${si}.zones.${zi}`;
                          const zoneFieldMsg = [fieldErr(`${zPath}.zone`), fieldErr(`${zPath}.zoneLabel`)]
                            .filter(Boolean)
                            .join(' — ');
                          return (
                          <Paper
                            key={zi}
                            variant="outlined"
                            sx={{ p: 1, mb: 1, backgroundColor: 'action.hover' }}
                          >
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                              <FormControl size="small" sx={{ minWidth: 140 }} error={Boolean(zoneFieldMsg)}>
                                <InputLabel>אזור</InputLabel>
                                <Select
                                  value={zr.zone}
                                  label="אזור"
                                  onChange={(e) => {
                                    clearFieldErr(`${zPath}.zone`);
                                    clearFieldErr(`${zPath}.zoneLabel`);
                                    updateZoneRate(ti, si, zi, 'zone', e.target.value);
                                  }}
                                >
                                  <MenuItem value={ALL_ZONES_TARIFF_CODE}>
                                    {ALL_ZONES_LABEL_HE} ({ALL_ZONES_TARIFF_CODE})
                                  </MenuItem>
                                  {data.availableZones.map((az) => (
                                    <MenuItem key={az.code} value={az.code}>
                                      {az.label} ({az.code})
                                    </MenuItem>
                                  ))}
                                </Select>
                                {zoneFieldMsg ? <FormHelperText>{zoneFieldMsg}</FormHelperText> : null}
                              </FormControl>
                              {!sub.hasSizeRanges && (
                                <TextField
                                  size="small"
                                  label="תעריף (₪/מ״ר)"
                                  type="number"
                                  value={zr.rate ?? ''}
                                  onChange={(e) =>
                                    updateZoneRate(ti, si, zi, 'rate', parseFloat(e.target.value) || 0)
                                  }
                                  sx={{ width: 130 }}
                                />
                              )}
                              <TextField
                                size="small"
                                label="קוד נכס"
                                value={zr.propertyCode || ''}
                                onChange={(e) => updateZoneRate(ti, si, zi, 'propertyCode', e.target.value)}
                                sx={{ width: 120 }}
                              />
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => duplicateZoneRate(ti, si, zi)}
                                aria-label="שכפול שורת אזור"
                              >
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => removeZoneRate(ti, si, zi)}
                                aria-label="מחק שורת אזור"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>

                            </Box>

                            {sub.hasSizeRanges && (
                              <Box sx={{ mt: 1, ml: 1 }}>
                                {(zr.sizeRanges || []).map((sr, ri) => (
                                  <Box key={ri} sx={{ display: 'flex', gap: 1, mb: 0.5, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                    <TextField
                                      size="small"
                                      label="מ-"
                                      type="number"
                                      value={sr.min}
                                      onChange={(e) => {
                                        clearFieldErr(`${zPath}.sizeRanges.${ri}.min`);
                                        updateSizeRange(ti, si, zi, ri, 'min', parseFloat(e.target.value) || 0);
                                      }}
                                      error={Boolean(fieldErr(`${zPath}.sizeRanges.${ri}.min`))}
                                      helperText={fieldErr(`${zPath}.sizeRanges.${ri}.min`)}
                                    />
                                    <TextField
                                      size="small"
                                      label="עד"
                                      type="number"
                                      value={sr.max}
                                      onChange={(e) => {
                                        clearFieldErr(`${zPath}.sizeRanges.${ri}.max`);
                                        updateSizeRange(ti, si, zi, ri, 'max', parseFloat(e.target.value) || 0);
                                      }}
                                      error={Boolean(fieldErr(`${zPath}.sizeRanges.${ri}.max`))}
                                      helperText={fieldErr(`${zPath}.sizeRanges.${ri}.max`)}
                                    />
                                    <TextField
                                      size="small"
                                      label="תעריף"
                                      type="number"
                                      value={sr.rate}
                                      onChange={(e) => {
                                        clearFieldErr(`${zPath}.sizeRanges.${ri}.rate`);
                                        updateSizeRange(ti, si, zi, ri, 'rate', parseFloat(e.target.value) || 0);
                                      }}
                                      error={Boolean(fieldErr(`${zPath}.sizeRanges.${ri}.rate`))}
                                      helperText={fieldErr(`${zPath}.sizeRanges.${ri}.rate`)}
                                    />
                                    <TextField
                                      size="small"
                                      label="קוד"
                                      value={sr.propertyCode || ''}
                                      onChange={(e) =>
                                        updateSizeRange(ti, si, zi, ri, 'propertyCode', e.target.value)
                                      }
                                    />
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => removeSizeRange(ti, si, zi, ri)}
                                      aria-label="מחק טווח גודל"
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                ))}
                                <Button size="small" startIcon={<AddIcon />} onClick={() => addSizeRange(ti, si, zi)}>
                                  הוסף טווח
                                </Button>
                              </Box>
                            )}
                          </Paper>
                        );
                        })}
                        <Button size="small" startIcon={<AddIcon />} onClick={() => addZoneRate(ti, si)}>
                          הוסף אזור תעריף
                        </Button>
                      </Box>
                    );
                  })()
                )}
              </Paper>
            </Stack>
            <DragOverlayPortal activeLabel={dnd.activeLabel} />
            </DndContext>
          </>
        )}
      </AccordionDetails>
    </Accordion>
    <MergeConfirmDialog {...dnd.mergeDialogProps} />
    </>
  );
}
