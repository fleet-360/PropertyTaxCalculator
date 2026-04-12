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
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SectionExtractTrigger from '@/components/admin/SectionExtractTrigger';
import MiaMessagePickerModal from '@/components/common/MiaMessagePickerModal';
import DraggableListItem from '@/components/admin/dnd/DraggableListItem';
import DragOverlayPortal from '@/components/admin/dnd/DragOverlayPortal';
import MergeConfirmDialog from '@/components/admin/dnd/MergeConfirmDialog';
import { useDndExemptions } from '@/hooks/useDndExemptions';
import type { SectionKey } from '@/lib/vision/ordinance-extractor';
import type { ICityTariffData } from '@/lib/types/city-tariff';

// ── Props ───────────────────────────────────────────────────────────
export interface ExemptionsSectionProps {
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
export default function ExemptionsSection({
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
}: ExemptionsSectionProps) {
  // ── Selection state ──────────────────────────────────────────────
  const [selectedExemptionSectionIndex, setSelectedExemptionSectionIndex] = React.useState<number | null>(() =>
    data.exemptions.length > 0 ? 0 : null,
  );
  const [selectedExemptionSubIndex, setSelectedExemptionSubIndex] = React.useState<number | null>(() => {
    if (!data.exemptions.length) return null;
    return data.exemptions[0].subSections.length > 0 ? 0 : null;
  });

  const [miaPickerOpen, setMiaPickerOpen] = React.useState(false);

  const selectedExemptionSubsLen =
    selectedExemptionSectionIndex !== null
      ? data.exemptions[selectedExemptionSectionIndex]?.subSections.length ?? 0
      : 0;

  React.useEffect(() => {
    if (selectedExemptionSectionIndex === null) {
      setSelectedExemptionSubIndex(null);
      return;
    }
    if (selectedExemptionSubsLen === 0) {
      setSelectedExemptionSubIndex(null);
      return;
    }
    setSelectedExemptionSubIndex((ssi) =>
      ssi === null || ssi >= selectedExemptionSubsLen ? 0 : ssi,
    );
  }, [selectedExemptionSectionIndex, selectedExemptionSubsLen]);

  // ── DnD ─────────────────────────────────────────────────────────
  const dnd = useDndExemptions(
    data,
    setData,
    selectedExemptionSectionIndex,
    setSelectedExemptionSectionIndex,
    selectedExemptionSubIndex,
    setSelectedExemptionSubIndex,
  );

  const sectionIds = React.useMemo(
    () => data.exemptions.map((_, i) => `exemption-${i}`),
    [data.exemptions],
  );

  const subSectionIds = React.useMemo(
    () =>
      selectedExemptionSectionIndex !== null
        ? data.exemptions[selectedExemptionSectionIndex]?.subSections.map(
            (_, i) => `exsub-${selectedExemptionSectionIndex}-${i}`,
          ) ?? []
        : [],
    [data.exemptions, selectedExemptionSectionIndex],
  );

  // ── Exemption helpers ───────────────────────────────────────────
  const addExemptionSection = () => {
    let newEi = 0;
    setData((prev) => {
      newEi = prev.exemptions.length;
      return {
        ...prev,
        exemptions: [
          ...prev.exemptions,
          { sectionCode: '', sectionLabel: '', miaMessageId: '', applicableTo: 'private' as const, subSections: [] },
        ],
      };
    });
    setSelectedExemptionSectionIndex(newEi);
    setSelectedExemptionSubIndex(null);
  };

  const updateExemptionSection = (ei: number, field: string, value: string) => {
    setData((prev) => {
      const exemptions = [...prev.exemptions];
      exemptions[ei] = { ...exemptions[ei], [field]: value };
      return { ...prev, exemptions };
    });
  };

  const removeExemptionSection = (ei: number) => {
    const newSecs = data.exemptions.filter((_, i) => i !== ei);
    setData((prev) => ({ ...prev, exemptions: newSecs }));
    setSelectedExemptionSectionIndex((prevSel) => {
      if (newSecs.length === 0) return null;
      if (prevSel === null) return 0;
      if (ei < prevSel) return prevSel - 1;
      if (ei === prevSel) return Math.min(prevSel, newSecs.length - 1);
      return prevSel;
    });
  };

  const addExemptionSubSection = (ei: number) => {
    let newSi = 0;
    setData((prev) => {
      const exemptions = [...prev.exemptions];
      newSi = exemptions[ei].subSections.length;
      exemptions[ei] = {
        ...exemptions[ei],
        subSections: [
          ...exemptions[ei].subSections,
          {
            code: '',
            description: '',
            discountPercent: 0,
            restrictions: {},
            requiresDocuments: false,
            documentTypes: [],
          },
        ],
      };
      return { ...prev, exemptions };
    });
    setSelectedExemptionSectionIndex(ei);
    setSelectedExemptionSubIndex(newSi);
  };

  const updateExemptionSubSection = (
    ei: number,
    si: number,
    field: string,
    value: string | number | boolean | string[],
  ) => {
    setData((prev) => {
      const exemptions = [...prev.exemptions];
      const subs = [...exemptions[ei].subSections];
      subs[si] = { ...subs[si], [field]: value };
      exemptions[ei] = { ...exemptions[ei], subSections: subs };
      return { ...prev, exemptions };
    });
  };

  const updateExemptionRestriction = (ei: number, si: number, field: string, value: number | undefined) => {
    setData((prev) => {
      const exemptions = [...prev.exemptions];
      const subs = [...exemptions[ei].subSections];
      subs[si] = { ...subs[si], restrictions: { ...subs[si].restrictions, [field]: value } };
      exemptions[ei] = { ...exemptions[ei], subSections: subs };
      return { ...prev, exemptions };
    });
  };

  const removeExemptionSubSection = (ei: number, si: number) => {
    const newSubs = data.exemptions[ei].subSections.filter((_, i) => i !== si);
    setData((prev) => {
      const exemptions = [...prev.exemptions];
      exemptions[ei] = {
        ...exemptions[ei],
        subSections: newSubs,
      };
      return { ...prev, exemptions };
    });
    if (selectedExemptionSectionIndex === ei) {
      setSelectedExemptionSubIndex((prevSel) => {
        if (newSubs.length === 0) return null;
        if (prevSel === null) return 0;
        if (si < prevSel) return prevSel - 1;
        if (si === prevSel) return Math.min(prevSel, newSubs.length - 1);
        return prevSel;
      });
    }
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
              הנחות / פטורים <Chip label={data.exemptions.length} size="small" sx={{ ml: 1 }} />
            </Typography>
            {errorCount > 0 && (
              <Chip size="small" color="error" label={`${errorCount} שגיאות`} />
            )}
            <SectionExtractTrigger
              sectionKey="exemptions"
              sectionLabel="הנחות ופטורים"
              onOpen={openSectionExtract}
            />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {data.exemptions.length === 0 ? (
            <Button startIcon={<AddIcon />} onClick={addExemptionSection} variant="outlined">
              הוסף סעיף הנחה
            </Button>
          ) : (
            <>
              {selectedExemptionSectionIndex !== null && data.exemptions[selectedExemptionSectionIndex] && (
                <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    עריכת סעיף הנחה
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField
                      size="small"
                      label="קוד סעיף"
                      value={data.exemptions[selectedExemptionSectionIndex].sectionCode}
                      onChange={(e) => {
                        clearFieldErr(`exemptions.${selectedExemptionSectionIndex}.sectionCode`);
                        updateExemptionSection(selectedExemptionSectionIndex, 'sectionCode', e.target.value);
                      }}
                      sx={{ width: 140 }}
                      error={Boolean(fieldErr(`exemptions.${selectedExemptionSectionIndex}.sectionCode`))}
                      helperText={fieldErr(`exemptions.${selectedExemptionSectionIndex}.sectionCode`)}
                    />
                    <TextField
                      size="small"
                      label="שם סעיף"
                      value={data.exemptions[selectedExemptionSectionIndex].sectionLabel}
                      onChange={(e) => {
                        clearFieldErr(`exemptions.${selectedExemptionSectionIndex}.sectionLabel`);
                        updateExemptionSection(selectedExemptionSectionIndex, 'sectionLabel', e.target.value);
                      }}
                      sx={{ flex: 1, minWidth: 160 }}
                      error={Boolean(fieldErr(`exemptions.${selectedExemptionSectionIndex}.sectionLabel`))}
                      helperText={fieldErr(`exemptions.${selectedExemptionSectionIndex}.sectionLabel`)}
                    />
                    <Box sx={{ mt: 1 }}>
                      <TextField
                        select
                        size="small"
                        label="חל על סוג נכס"
                        value={data.exemptions[selectedExemptionSectionIndex].applicableTo ?? 'private'}
                        onChange={(e) =>
                          updateExemptionSection(selectedExemptionSectionIndex, 'applicableTo', e.target.value)
                        }
                        sx={{ width: 180 }}
                      >
                        <MenuItem value="private">מגורים</MenuItem>
                        <MenuItem value="business">עסקי</MenuItem>
                        <MenuItem value="both">שניהם</MenuItem>
                      </TextField>
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeExemptionSection(selectedExemptionSectionIndex)}
                      aria-label="מחק סעיף הנחה"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ChatBubbleOutlineIcon />}
                      onClick={() => setMiaPickerOpen(true)}
                      sx={{ textTransform: 'none' }}
                    >
                      הודעת מיה
                    </Button>
                    {data.exemptions[selectedExemptionSectionIndex].miaMessageId && (
                      <Chip
                        label={data.exemptions[selectedExemptionSectionIndex].miaMessageId}
                        size="small"
                        onDelete={() => updateExemptionSection(selectedExemptionSectionIndex, 'miaMessageId', '')}
                      />
                    )}
                  </Box>
                </Paper>
              )}

              <DndContext
                id="dnd-exemptions"
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
                {/* Panel 1: Exemption sections list */}
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
                      סעיפי הנחה
                    </Typography>
                    <Button size="small" fullWidth startIcon={<AddIcon />} onClick={addExemptionSection} variant="outlined">
                      הוסף סעיף
                    </Button>
                  </Box>
                  <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
                  <List dense disablePadding aria-label="רשימת סעיפי הנחה">
                    {data.exemptions.map((section, ei) => (
                      <DraggableListItem
                        key={`exemption-${ei}`}
                        id={`exemption-${ei}`}
                        mergeEnabled
                        mergeDropId={`merge-exemption-${ei}`}
                        selected={selectedExemptionSectionIndex === ei}
                        onClick={() => {
                          setSelectedExemptionSectionIndex(ei);
                          setSelectedExemptionSubIndex(section.subSections.length ? 0 : null);
                        }}
                        ariaCurrent={selectedExemptionSectionIndex === ei ? 'true' : undefined}
                        ariaLabel={`בחר סעיף ${section.sectionLabel || section.sectionCode || ei}`}
                        sx={listItemErrorSx(hasPathPrefix(`exemptions.${ei}`))}
                      >
                        <ListItemText
                          primary={
                            <Typography component="span" variant="body2" sx={{ fontWeight: 600 }}>
                              {section.sectionCode || '—'} · {section.sectionLabel || 'ללא שם'}
                            </Typography>
                          }
                          secondary={`${section.subSections.length} תתי־סעיף`}
                        />
                      </DraggableListItem>
                    ))}
                  </List>
                  </SortableContext>
                </Paper>

                {/* Panel 2: Sub-sections list */}
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
                      תתי־סעיף
                    </Typography>
                    {selectedExemptionSectionIndex !== null && (
                      <Button
                        size="small"
                        fullWidth
                        startIcon={<AddIcon />}
                        onClick={() => addExemptionSubSection(selectedExemptionSectionIndex)}
                        variant="outlined"
                      >
                        הוסף תת־סעיף
                      </Button>
                    )}
                  </Box>
                  {selectedExemptionSectionIndex === null ? (
                    <Box sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        בחר סעיף הנחה
                      </Typography>
                    </Box>
                  ) : data.exemptions[selectedExemptionSectionIndex].subSections.length === 0 ? (
                    <Box sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        אין תתי־סעיף — הוסף תת־סעיף
                      </Typography>
                    </Box>
                  ) : (
                    <SortableContext items={subSectionIds} strategy={verticalListSortingStrategy}>
                    <List dense disablePadding aria-label="רשימת תתי־סעיף">
                      {data.exemptions[selectedExemptionSectionIndex].subSections.map((sub, ssi) => (
                        <DraggableListItem
                          key={`exsub-${selectedExemptionSectionIndex}-${ssi}`}
                          id={`exsub-${selectedExemptionSectionIndex}-${ssi}`}
                          selected={selectedExemptionSubIndex === ssi}
                          onClick={() => setSelectedExemptionSubIndex(ssi)}
                          ariaCurrent={selectedExemptionSubIndex === ssi ? 'true' : undefined}
                          ariaLabel={`בחר תת־סעיף ${sub.code || sub.description || ssi}`}
                          sx={listItemErrorSx(
                            hasPathPrefix(
                              `exemptions.${selectedExemptionSectionIndex}.subSections.${ssi}`,
                            ),
                          )}
                        >
                          <ListItemText
                            primary={`${sub.code || '—'} · ${sub.discountPercent}%`}
                            secondary={sub.description ? `${sub.description.slice(0, 48)}${sub.description.length > 48 ? '…' : ''}` : '—'}
                          />
                        </DraggableListItem>
                      ))}
                    </List>
                    </SortableContext>
                  )}
                </Paper>

                {/* Panel 3: Sub-section detail */}
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
                  {selectedExemptionSectionIndex === null || selectedExemptionSubIndex === null ? (
                    <Typography variant="body2" color="text.secondary">
                      בחר תת־סעיף לעריכת פרטי ההנחה
                    </Typography>
                  ) : (
                    (() => {
                      const ei = selectedExemptionSectionIndex;
                      const ssi = selectedExemptionSubIndex;
                      const sub = data.exemptions[ei].subSections[ssi];
                      const docTypes = Array.isArray(sub.documentTypes) ? sub.documentTypes : [];
                      return (
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                            תת־סעיף: {sub.code || sub.description?.slice(0, 40) || 'תת־סעיף'}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mb: 1.5, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            <TextField
                              size="small"
                              label="קוד תת־סעיף"
                              value={sub.code}
                              onChange={(e) => {
                                clearFieldErr(`exemptions.${ei}.subSections.${ssi}.code`);
                                updateExemptionSubSection(ei, ssi, 'code', e.target.value);
                              }}
                              sx={{ width: 130 }}
                              error={Boolean(fieldErr(`exemptions.${ei}.subSections.${ssi}.code`))}
                              helperText={fieldErr(`exemptions.${ei}.subSections.${ssi}.code`)}
                            />
                            <TextField
                              size="small"
                              label="אחוז הנחה"
                              type="number"
                              value={sub.discountPercent}
                              onChange={(e) => {
                                clearFieldErr(`exemptions.${ei}.subSections.${ssi}.discountPercent`);
                                updateExemptionSubSection(
                                  ei,
                                  ssi,
                                  'discountPercent',
                                  parseFloat(e.target.value) || 0,
                                );
                              }}
                              sx={{ width: 120 }}
                              error={Boolean(fieldErr(`exemptions.${ei}.subSections.${ssi}.discountPercent`))}
                              helperText={fieldErr(`exemptions.${ei}.subSections.${ssi}.discountPercent`)}
                            />
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeExemptionSubSection(ei, ssi)}
                              aria-label="מחק תת־סעיף"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <TextField
                            size="small"
                            fullWidth
                            label="תיאור"
                            value={sub.description}
                            onChange={(e) => {
                              clearFieldErr(`exemptions.${ei}.subSections.${ssi}.description`);
                              updateExemptionSubSection(ei, ssi, 'description', e.target.value);
                            }}
                            sx={{ mb: 1.5 }}
                            multiline
                            minRows={2}
                            error={Boolean(fieldErr(`exemptions.${ei}.subSections.${ssi}.description`))}
                            helperText={fieldErr(`exemptions.${ei}.subSections.${ssi}.description`)}
                          />

                          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.75 }}>
                            הגבלות (אופציונלי)
                          </Typography>
                          <Paper variant="outlined" sx={{ p: 1, mb: 1.5, backgroundColor: 'action.hover' }}>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                              <TextField
                                size="small"
                                label="שטח מקס׳ (מ״ר)"
                                type="number"
                                value={sub.restrictions?.maxAreaSqm ?? ''}
                                onChange={(e) =>
                                  updateExemptionRestriction(
                                    ei,
                                    ssi,
                                    'maxAreaSqm',
                                    e.target.value ? parseFloat(e.target.value) : undefined,
                                  )
                                }
                                sx={{ width: 130 }}
                              />
                              <TextField
                                size="small"
                                label="מינ׳ ילדים"
                                type="number"
                                value={sub.restrictions?.minChildren ?? ''}
                                onChange={(e) =>
                                  updateExemptionRestriction(
                                    ei,
                                    ssi,
                                    'minChildren',
                                    e.target.value ? parseInt(e.target.value, 10) : undefined,
                                  )
                                }
                                sx={{ width: 110 }}
                              />
                              <TextField
                                size="small"
                                label="מינ׳ נפשות במשפחה"
                                type="number"
                                value={sub.restrictions?.minHouseholdSize ?? ''}
                                onChange={(e) =>
                                  updateExemptionRestriction(
                                    ei,
                                    ssi,
                                    'minHouseholdSize',
                                    e.target.value ? parseInt(e.target.value, 10) : undefined,
                                  )
                                }
                                sx={{ width: 150 }}
                              />
                            </Box>
                          </Paper>

                          <FormControlLabel
                            control={
                              <Checkbox
                                size="small"
                                checked={sub.requiresDocuments}
                                onChange={(e) =>
                                  updateExemptionSubSection(ei, ssi, 'requiresDocuments', e.target.checked)
                                }
                              />
                            }
                            label="דורש מסמכים"
                            sx={{ mb: 1 }}
                          />
                          <TextField
                            size="small"
                            fullWidth
                            label="סוגי מסמכים (מופרדים בפסיק)"
                            value={docTypes.join(', ')}
                            onChange={(e) => {
                              const parts = e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean);
                              updateExemptionSubSection(ei, ssi, 'documentTypes', parts);
                            }}
                            disabled={!sub.requiresDocuments}
                            helperText={
                              sub.requiresDocuments
                                ? 'הפרדה בפסיק בין סוגי מסמכים'
                                : 'סמן ״דורש מסמכים״ כדי לערוך רשימה'
                            }
                          />
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

      {/* Mia message picker for exemption sections */}
      <MiaMessagePickerModal
        open={miaPickerOpen}
        onClose={() => setMiaPickerOpen(false)}
        onSelect={(messageId) => {
          if (selectedExemptionSectionIndex !== null) {
            updateExemptionSection(selectedExemptionSectionIndex, 'miaMessageId', messageId);
          }
          setMiaPickerOpen(false);
        }}
        currentMessageId={
          selectedExemptionSectionIndex !== null
            ? data.exemptions[selectedExemptionSectionIndex]?.miaMessageId
            : undefined
        }
      />
      <MergeConfirmDialog {...dnd.mergeDialogProps} />
    </>
  );
}
