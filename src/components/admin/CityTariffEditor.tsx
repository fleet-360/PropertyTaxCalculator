'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Checkbox from '@mui/material/Checkbox';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ALL_ZONES_TARIFF_CODE, ALL_ZONES_LABEL_HE } from '@/lib/tariff-constants';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';

// ── Types ────────────────────────────────────────────────────────────
interface SizeRange {
  min: number;
  max: number;
  rate: number;
  propertyCode?: string;
}

interface ZoneRate {
  zone: string;
  zoneLabel: string;
  rate?: number;
  sizeRanges?: SizeRange[];
  propertyCode?: string;
}

interface SubType {
  code: string;
  label: string;
  hasSizeRanges: boolean;
  /** מצטבר (מדורג) מול קבוע לפי טווח — תואם ל־isProgressiveRate במודל */
  isProgressiveRate?: boolean;
  zones: ZoneRate[];
}

interface PropertyType {
  category?: 'private' | 'business';
  code: string;
  label: string;
  subtypes: SubType[];
}

interface ExemptionRestrictions {
  maxAreaSqm?: number;
  minChildren?: number;
  minHouseholdSize?: number;
}

interface ExemptionSubSection {
  code: string;
  description: string;
  discountPercent: number;
  restrictions: ExemptionRestrictions;
  requiresDocuments: boolean;
  documentTypes: string[];
}

interface ExemptionSection {
  sectionCode: string;
  sectionLabel: string;
  subSections: ExemptionSubSection[];
}

interface AvailableZone {
  code: string;
  label: string;
}

interface CityTariffData {
  _id?: string;
  cityName: string;
  cityNameEn: string;
  slug: string;
  year: number;
  isActive: boolean;
  ordinanceUrl?: string;
  types: PropertyType[];
  exemptions: ExemptionSection[];
  availableZones: AvailableZone[];
}

interface CityTariffEditorProps {
  city?: CityTariffData;
  isNew?: boolean;
}

const emptyCityData: CityTariffData = {
  cityName: '',
  cityNameEn: '',
  slug: '',
  year: new Date().getFullYear(),
  isActive: true,
  ordinanceUrl: '',
  types: [],
  exemptions: [],
  availableZones: [],
};

// ── Component ────────────────────────────────────────────────────────
export default function CityTariffEditor({ city, isNew = false }: CityTariffEditorProps) {
  const router = useRouter();
  const [data, setData] = React.useState<CityTariffData>(city || emptyCityData);
  const [saving, setSaving] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [selectedTypeIndex, setSelectedTypeIndex] = React.useState<number | null>(() =>
    city && city.types.length > 0 ? 0 : null,
  );
  const [selectedSubtypeIndex, setSelectedSubtypeIndex] = React.useState<number | null>(() => {
    if (!city?.types?.length) return null;
    return city.types[0].subtypes.length > 0 ? 0 : null;
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

  // Update slug from English name
  const handleCityNameEnChange = (value: string) => {
    setData((prev) => ({
      ...prev,
      cityNameEn: value,
      slug: isNew ? value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : prev.slug,
    }));
  };

  const handleSave = async () => {
    if (!data.cityName || !data.cityNameEn || !data.slug || !data.year) {
      setSnackbar({ open: true, message: 'נא למלא שדות חובה: שם עיר, שם באנגלית, slug, שנה', severity: 'error' });
      return;
    }

    setSaving(true);
    try {
      const url = isNew ? '/api/cities' : `/api/cities/${data._id}`;
      const method = isNew ? 'POST' : 'PUT';

      const payload = {
        ...data,
        types: data.types.map((t) => ({
          ...t,
          category: t.category ?? 'private',
          subtypes: t.subtypes.map((s) => ({
            ...s,
            isProgressiveRate: s.isProgressiveRate ?? false,
          })),
        })),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      setSnackbar({ open: true, message: isNew ? 'עיר נוצרה בהצלחה' : 'העיר עודכנה בהצלחה', severity: 'success' });
      if (isNew) {
        setTimeout(() => router.push('/admin/cities'), 1000);
      }
    } catch (err) {
      setSnackbar({ open: true, message: err instanceof Error ? err.message : 'שגיאה בשמירה', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ── Zone helpers ────────────────────────────────────────────────────
  const addZone = () => {
    setData((prev) => ({
      ...prev,
      availableZones: [...prev.availableZones, { code: '', label: '' }],
    }));
  };

  const updateZone = (index: number, field: keyof AvailableZone, value: string) => {
    setData((prev) => {
      const zones = [...prev.availableZones];
      zones[index] = { ...zones[index], [field]: value };
      return { ...prev, availableZones: zones };
    });
  };

  const removeZone = (index: number) => {
    setData((prev) => ({
      ...prev,
      availableZones: prev.availableZones.filter((_, i) => i !== index),
    }));
  };

  // ── Type helpers ────────────────────────────────────────────────────
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

  // ── Subtype helpers ─────────────────────────────────────────────────
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

  // ── Zone rate helpers ───────────────────────────────────────────────
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

  // ── Size range helpers ──────────────────────────────────────────────
  const addSizeRange = (ti: number, si: number, zi: number) => {
    setData((prev) => {
      const types = [...prev.types];
      const subtypes = [...types[ti].subtypes];
      const zones = [...subtypes[si].zones];
      zones[zi] = {
        ...zones[zi],
        sizeRanges: [...(zones[zi].sizeRanges || []), { min: 0, max: 0, rate: 0 }],
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
      zones[zi] = {
        ...zones[zi],
        sizeRanges: (zones[zi].sizeRanges || []).filter((_, i) => i !== ri),
      };
      subtypes[si] = { ...subtypes[si], zones };
      types[ti] = { ...types[ti], subtypes };
      return { ...prev, types };
    });
  };

  // ── Exemption helpers ───────────────────────────────────────────────
  const addExemptionSection = () => {
    setData((prev) => ({
      ...prev,
      exemptions: [...prev.exemptions, { sectionCode: '', sectionLabel: '', subSections: [] }],
    }));
  };

  const updateExemptionSection = (ei: number, field: string, value: string) => {
    setData((prev) => {
      const exemptions = [...prev.exemptions];
      exemptions[ei] = { ...exemptions[ei], [field]: value };
      return { ...prev, exemptions };
    });
  };

  const removeExemptionSection = (ei: number) => {
    setData((prev) => ({
      ...prev,
      exemptions: prev.exemptions.filter((_, i) => i !== ei),
    }));
  };

  const addExemptionSubSection = (ei: number) => {
    setData((prev) => {
      const exemptions = [...prev.exemptions];
      exemptions[ei] = {
        ...exemptions[ei],
        subSections: [
          ...exemptions[ei].subSections,
          { code: '', description: '', discountPercent: 0, restrictions: {}, requiresDocuments: false, documentTypes: [] },
        ],
      };
      return { ...prev, exemptions };
    });
  };

  const updateExemptionSubSection = (ei: number, si: number, field: string, value: string | number | boolean) => {
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
    setData((prev) => {
      const exemptions = [...prev.exemptions];
      exemptions[ei] = {
        ...exemptions[ei],
        subSections: exemptions[ei].subSections.filter((_, i) => i !== si),
      };
      return { ...prev, exemptions };
    });
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {isNew ? 'הוספת עיר חדשה' : `עריכת ${data.cityName || 'עיר'}`}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {isNew ? 'הגדרת תעריפי ארנונה לעיר חדשה' : 'עריכת תעריפי ארנונה'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'שומר...' : 'שמור'}
        </Button>
      </Box>

      {/* Section 1: Basic Info */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>פרטי עיר</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="שם העיר (עברית)"
                value={data.cityName}
                onChange={(e) => setData((prev) => ({ ...prev, cityName: e.target.value }))}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="שם העיר (אנגלית)"
                value={data.cityNameEn}
                onChange={(e) => handleCityNameEnChange(e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Slug"
                value={data.slug}
                onChange={(e) => setData((prev) => ({ ...prev, slug: e.target.value }))}
                required
                disabled={!isNew}
                helperText={isNew ? 'נוצר אוטומטית מהשם באנגלית' : 'לא ניתן לשינוי'}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="שנה"
                type="number"
                value={data.year}
                onChange={(e) => setData((prev) => ({ ...prev, year: parseInt(e.target.value, 10) || 0 }))}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={data.isActive}
                    onChange={(e) => setData((prev) => ({ ...prev, isActive: e.target.checked }))}
                    color="success"
                  />
                }
                label="פעיל"
                sx={{ mt: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="קישור לצו ארנונה (URL)"
                value={data.ordinanceUrl || ''}
                onChange={(e) => setData((prev) => ({ ...prev, ordinanceUrl: e.target.value }))}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Section 2: Available Zones */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            אזורים <Chip label={data.availableZones.length} size="small" sx={{ ml: 1 }} />
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {data.availableZones.map((zone, zi) => (
            <Box key={zi} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
              <TextField
                size="small"
                label="קוד"
                value={zone.code}
                onChange={(e) => updateZone(zi, 'code', e.target.value)}
                sx={{ width: 120 }}
              />
              <TextField
                size="small"
                label="שם אזור"
                value={zone.label}
                onChange={(e) => updateZone(zi, 'label', e.target.value)}
                sx={{ flex: 1 }}
              />
              <IconButton size="small" color="error" onClick={() => removeZone(zi)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          <Button size="small" startIcon={<AddIcon />} onClick={addZone} sx={{ mt: 1 }}>
            הוסף אזור
          </Button>
        </AccordionDetails>
      </Accordion>

      {/* Section 3: Property Types & Tariffs — sideways master / detail */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            סוגי נכס ותעריפים <Chip label={data.types.length} size="small" sx={{ ml: 1 }} />
          </Typography>
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
                      onChange={(e) => updateType(selectedTypeIndex, 'code', e.target.value)}
                      sx={{ width: 140 }}
                    />
                    <TextField
                      size="small"
                      label="שם סוג"
                      value={data.types[selectedTypeIndex].label}
                      onChange={(e) => updateType(selectedTypeIndex, 'label', e.target.value)}
                      sx={{ flex: 1, minWidth: 160 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <InputLabel>קטגוריה</InputLabel>
                      <Select
                        label="קטגוריה"
                        value={(data.types[selectedTypeIndex].category ?? 'private') as 'private' | 'business'}
                        onChange={(e) =>
                          updateType(selectedTypeIndex, 'category', e.target.value as 'private' | 'business')
                        }
                      >
                        <MenuItem value="private">מגורים</MenuItem>
                        <MenuItem value="business">עסקים</MenuItem>
                      </Select>
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

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ alignItems: 'stretch', minHeight: 280 }}
              >
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
                  <List dense disablePadding aria-label="רשימת סוגי נכס">
                    {data.types.map((type, ti) => (
                      <ListItemButton
                        key={ti}
                        selected={selectedTypeIndex === ti}
                        onClick={() => {
                          setSelectedTypeIndex(ti);
                          setSelectedSubtypeIndex(type.subtypes.length ? 0 : null);
                        }}
                        aria-current={selectedTypeIndex === ti ? 'true' : undefined}
                        aria-label={`בחר סוג ${type.label || type.code || ti}`}
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
                      </ListItemButton>
                    ))}
                  </List>
                </Paper>

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
                    <List dense disablePadding aria-label="רשימת תתי־סוג">
                      {data.types[selectedTypeIndex].subtypes.map((sub, si) => (
                        <ListItemButton
                          key={si}
                          selected={selectedSubtypeIndex === si}
                          onClick={() => setSelectedSubtypeIndex(si)}
                          aria-current={selectedSubtypeIndex === si ? 'true' : undefined}
                          aria-label={`בחר תת־סוג ${sub.label || sub.code || si}`}
                        >
                          <ListItemText
                            primary={`${sub.code || '—'} · ${sub.label || 'ללא שם'}`}
                            secondary={sub.hasSizeRanges ? 'טווחי גודל' : 'תעריף אחיד'}
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  )}
                </Paper>

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
                            תעריף: {sub.label || sub.code || 'תת־סוג'}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                            <TextField
                              size="small"
                              label="קוד תת-סוג"
                              value={sub.code}
                              onChange={(e) => updateSubtype(ti, si, 'code', e.target.value)}
                              sx={{ width: 130 }}
                            />
                            <TextField
                              size="small"
                              label="שם תת-סוג"
                              value={sub.label}
                              onChange={(e) => updateSubtype(ti, si, 'label', e.target.value)}
                              sx={{ flex: 1, minWidth: 150 }}
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

                          {sub.zones.map((zr, zi) => (
                            <Paper
                              key={zi}
                              variant="outlined"
                              sx={{ p: 1, mb: 1, backgroundColor: 'action.hover' }}
                            >
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                <FormControl size="small" sx={{ minWidth: 140 }}>
                                  <InputLabel>אזור</InputLabel>
                                  <Select
                                    value={zr.zone}
                                    label="אזור"
                                    onChange={(e) => updateZoneRate(ti, si, zi, 'zone', e.target.value)}
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
                                    <Box key={ri} sx={{ display: 'flex', gap: 1, mb: 0.5, alignItems: 'center' }}>
                                      <TextField
                                        size="small"
                                        label="מ-"
                                        type="number"
                                        value={sr.min}
                                        onChange={(e) =>
                                          updateSizeRange(ti, si, zi, ri, 'min', parseFloat(e.target.value) || 0)
                                        }
                                      />
                                      <TextField
                                        size="small"
                                        label="עד"
                                        type="number"
                                        value={sr.max}
                                        onChange={(e) =>
                                          updateSizeRange(ti, si, zi, ri, 'max', parseFloat(e.target.value) || 0)
                                        }
                                      />
                                      <TextField
                                        size="small"
                                        label="תעריף"
                                        type="number"
                                        value={sr.rate}
                                        onChange={(e) =>
                                          updateSizeRange(ti, si, zi, ri, 'rate', parseFloat(e.target.value) || 0)
                                        }
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
                          ))}
                          <Button size="small" startIcon={<AddIcon />} onClick={() => addZoneRate(ti, si)}>
                            הוסף אזור תעריף
                          </Button>
                        </Box>
                      );
                    })()
                  )}
                </Paper>
              </Stack>
            </>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Section 4: Exemptions */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            הנחות / פטורים <Chip label={data.exemptions.length} size="small" sx={{ ml: 1 }} />
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {data.exemptions.map((section, ei) => (
            <Paper key={ei} variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                <TextField
                  size="small"
                  label="קוד סעיף"
                  value={section.sectionCode}
                  onChange={(e) => updateExemptionSection(ei, 'sectionCode', e.target.value)}
                  sx={{ width: 130 }}
                />
                <TextField
                  size="small"
                  label="שם סעיף"
                  value={section.sectionLabel}
                  onChange={(e) => updateExemptionSection(ei, 'sectionLabel', e.target.value)}
                  sx={{ flex: 1 }}
                />
                <IconButton size="small" color="error" onClick={() => removeExemptionSection(ei)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>

              {section.subSections.map((sub, si) => (
                <Paper key={si} variant="outlined" sx={{ p: 1.5, mb: 1, ml: 2, backgroundColor: '#fafafa' }}>
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <TextField
                        size="small"
                        fullWidth
                        label="קוד"
                        value={sub.code}
                        onChange={(e) => updateExemptionSubSection(ei, si, 'code', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <TextField
                        size="small"
                        fullWidth
                        label="אחוז הנחה"
                        type="number"
                        value={sub.discountPercent}
                        onChange={(e) => updateExemptionSubSection(ei, si, 'discountPercent', parseFloat(e.target.value) || 0)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        size="small"
                        fullWidth
                        label="תיאור"
                        value={sub.description}
                        onChange={(e) => updateExemptionSubSection(ei, si, 'description', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 4, sm: 2 }}>
                      <TextField
                        size="small"
                        fullWidth
                        label="שטח מקסימלי"
                        type="number"
                        value={sub.restrictions?.maxAreaSqm ?? ''}
                        onChange={(e) => updateExemptionRestriction(ei, si, 'maxAreaSqm', e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </Grid>
                    <Grid size={{ xs: 4, sm: 2 }}>
                      <TextField
                        size="small"
                        fullWidth
                        label="מינ׳ ילדים"
                        type="number"
                        value={sub.restrictions?.minChildren ?? ''}
                        onChange={(e) => updateExemptionRestriction(ei, si, 'minChildren', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                      />
                    </Grid>
                    <Grid size={{ xs: 4, sm: 2 }}>
                      <TextField
                        size="small"
                        fullWidth
                        label="מינ׳ נפשות"
                        type="number"
                        value={sub.restrictions?.minHouseholdSize ?? ''}
                        onChange={(e) => updateExemptionRestriction(ei, si, 'minHouseholdSize', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={sub.requiresDocuments}
                            onChange={(e) => updateExemptionSubSection(ei, si, 'requiresDocuments', e.target.checked)}
                          />
                        }
                        label="דורש מסמכים"
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 1 }}>
                      <IconButton size="small" color="error" onClick={() => removeExemptionSubSection(ei, si)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
              <Button size="small" startIcon={<AddIcon />} onClick={() => addExemptionSubSection(ei)} sx={{ ml: 2 }}>
                הוסף תת-סעיף
              </Button>
            </Paper>
          ))}
          <Button startIcon={<AddIcon />} onClick={addExemptionSection} variant="outlined" sx={{ mt: 1 }}>
            הוסף סעיף הנחה
          </Button>
        </AccordionDetails>
      </Accordion>

      {/* Bottom save button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" onClick={() => router.push('/admin/cities')}>
          חזרה
        </Button>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
          {saving ? 'שומר...' : 'שמור'}
        </Button>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
