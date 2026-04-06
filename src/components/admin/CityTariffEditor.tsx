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
import OrdinanceImportButton from '@/components/admin/OrdinanceImportButton';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import MiaMessagePickerModal from '@/components/common/MiaMessagePickerModal';
import SectionExtractDialog from '@/components/admin/SectionExtractDialog';
import SectionExtractTrigger from '@/components/admin/SectionExtractTrigger';
import type { SectionKey } from '@/lib/vision/ordinance-extractor';
import {
  normalizeCityTariffPayload,
  validateCityTariffPayload,
  validationIssuesToFieldMap,
  accordionSectionForValidationPath,
} from '@/lib/validateCityTariffPayload';
import type {
  ISizeRange,
  IZoneRate,
  ISubType,
  IPropertyType,
  IExemptionRestrictions,
  IExemptionSubSection,
  IExemptionSection,
  IAvailableZone,
  IAreaTypeDiscount,
  ICityFee,
  ICityTariffData,
} from '@/lib/types/city-tariff';
import { CITY_SLUG_PATTERN } from '@/lib/services/blobUploadService';

interface CityTariffEditorProps {
  city?: ICityTariffData;
  isNew?: boolean;
}

const emptyCityData: ICityTariffData = {
  cityName: '',
  cityNameEn: '',
  slug: '',
  year: new Date().getFullYear(),
  isActive: true,
  ordinanceUrl: '',
  types: [],
  exemptions: [],
  availableZones: [],
  areaTypeDiscounts: [],
  cityFees: [],
};

// ── Component ────────────────────────────────────────────────────────
export default function CityTariffEditor({ city, isNew = false }: CityTariffEditorProps) {
  const router = useRouter();
  const [data, setData] = React.useState<ICityTariffData>(city || emptyCityData);
  const [saving, setSaving] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [importedFromOrdinance, setImportedFromOrdinance] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [miaPickerOpen, setMiaPickerOpen] = React.useState(false);
  const [expandedAccordion, setExpandedAccordion] = React.useState({
    basic: true,
    zones: true,
    types: true,
    exemptions: true,
    areaTypeDiscounts: true,
    cityFees: true,
  });

  const [sectionExtractOpen, setSectionExtractOpen] = React.useState<SectionKey | null>(null);
  const [sectionExtractLabel, setSectionExtractLabel] = React.useState('');

  const [origin, setOrigin] = React.useState('');
  const [ordinanceUploading, setOrdinanceUploading] = React.useState(false);
  const [ordinanceUploadErr, setOrdinanceUploadErr] = React.useState<string | null>(null);
  const ordinanceFileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setOrigin(typeof window !== 'undefined' ? window.location.origin : '');
  }, []);

  const clearFieldErr = React.useCallback((path: string) => {
    setFieldErrors((prev) => {
      if (!(path in prev)) return prev;
      const next = { ...prev };
      delete next[path];
      return next;
    });
  }, []);

  const fieldErr = (path: string) => fieldErrors[path];

  const [selectedTypeIndex, setSelectedTypeIndex] = React.useState<number | null>(() =>
    city && city.types.length > 0 ? 0 : null,
  );
  const [selectedSubtypeIndex, setSelectedSubtypeIndex] = React.useState<number | null>(() => {
    if (!city?.types?.length) return null;
    return city.types[0].subtypes.length > 0 ? 0 : null;
  });

  const [selectedExemptionSectionIndex, setSelectedExemptionSectionIndex] = React.useState<number | null>(() =>
    city && city.exemptions.length > 0 ? 0 : null,
  );
  const [selectedExemptionSubIndex, setSelectedExemptionSubIndex] = React.useState<number | null>(() => {
    if (!city?.exemptions?.length) return null;
    return city.exemptions[0].subSections.length > 0 ? 0 : null;
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

  const hasOrdinanceImportData = typeof window !== 'undefined' && !!sessionStorage?.getItem('ordinanceImportData');
  // ── Load imported ordinance data from sessionStorage ──────────────
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('fromOrdinance') !== 'true') return;

    try {
      const stored = sessionStorage.getItem('ordinanceImportData');
      if (!stored) return;
      console.log('stored', stored);
      const imported: ICityTariffData = JSON.parse(stored);
      sessionStorage.removeItem('ordinanceImportData');

      // For update mode: merge imported data but keep the _id
      const merged = city ? { ...imported, _id: city._id } : imported;
      setData(merged);
      setImportedFromOrdinance(true);

      // Auto-select first items if available
      if (merged.types.length > 0) {
        setSelectedTypeIndex(0);
        if (merged.types[0].subtypes.length > 0) setSelectedSubtypeIndex(0);
      }
      if (merged.exemptions.length > 0) {
        setSelectedExemptionSectionIndex(0);
        if (merged.exemptions[0].subSections.length > 0) setSelectedExemptionSubIndex(0);
      }
    } catch {
      // Ignore parse errors
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasOrdinanceImportData]);

  // Update slug from English name
  const handleCityNameEnChange = (value: string) => {
    clearFieldErr('cityNameEn');
    clearFieldErr('slug');
    setData((prev) => ({
      ...prev,
      cityNameEn: value,
      slug: isNew ? value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : prev.slug,
    }));
  };

  // ── Section extraction handlers ──────────────────────────────────
  const openSectionExtract = (key: SectionKey, label: string) => {
    if (key === 'rates' && data.availableZones.length === 0) {
      setSnackbar({ open: true, message: 'יש להגדיר אזורים לפני חילוץ תעריפים', severity: 'error' });
      return;
    }
    setSectionExtractLabel(label);
    setSectionExtractOpen(key);
  };

  const handleSectionExtracted = (sectionData: Partial<ICityTariffData>) => {
    setData((prev) => ({ ...prev, ...sectionData }));
    setSectionExtractOpen(null);
    setSnackbar({ open: true, message: 'הנתונים חולצו בהצלחה — בדוק ושמור', severity: 'success' });
  };

  const handleSave = async () => {
    const normalized = normalizeCityTariffPayload(data);
    console.log(normalized);
    const issues = validateCityTariffPayload(normalized);
    if (issues.length > 0) {
      setFieldErrors(validationIssuesToFieldMap(issues));
      setExpandedAccordion((prev) => {
        const next = { ...prev };
        for (const issue of issues) {
          next[accordionSectionForValidationPath(issue.path)] = true;
        }
        return next;
      });
      setSnackbar({
        open: true,
        message: `נמצאו ${issues.length} בעיות אימות — נא לתקן לפי השדות המסומנים`,
        severity: 'error',
      });
      return;
    }

    setFieldErrors({});
    setSaving(true);
    try {
      const url = isNew ? '/api/cities' : `/api/cities/${data._id}`;
      const method = isNew ? 'POST' : 'PUT';

      const payload = { ...data, types: normalized.types, exemptions: normalized.exemptions };

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

  const slugTrim = data.slug.trim();
  const slugValid = CITY_SLUG_PATTERN.test(slugTrim);
  const hasOrdinance = Boolean(data.ordinanceUrl?.trim());
  const publicOrdinanceShareUrl =
    origin && slugValid && hasOrdinance
      ? `${origin}/api/view-pdf/${encodeURIComponent(slugTrim)}`
      : '';

  const handleCopyPublicOrdinanceLink = async () => {
    if (!publicOrdinanceShareUrl) return;
    try {
      await navigator.clipboard.writeText(publicOrdinanceShareUrl);
      setSnackbar({ open: true, message: 'הקישור הועתק ללוח', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'לא ניתן להעתיק את הקישור', severity: 'error' });
    }
  };

  const handleOrdinanceFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !slugValid) return;

    setOrdinanceUploading(true);
    setOrdinanceUploadErr(null);
    clearFieldErr('ordinanceUrl');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'orders');
    formData.append('citySlug', slugTrim);

    try {
      const res = await fetch('/api/admin/blob-upload', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = typeof body.error === 'string' && body.error ? body.error : 'שגיאה בהעלאת הקובץ';
        setOrdinanceUploadErr(msg);
        setSnackbar({ open: true, message: msg, severity: 'error' });
        return;
      }
      const url = typeof body.url === 'string' ? body.url.trim() : '';
      if (!url) {
        const msg = 'תגובת השרת לא כללה קישור לקובץ';
        setOrdinanceUploadErr(msg);
        setSnackbar({ open: true, message: msg, severity: 'error' });
        return;
      }
      setData((prev) => ({ ...prev, ordinanceUrl: url }));
      setSnackbar({ open: true, message: 'צו הארנונה הועלה בהצלחה', severity: 'success' });
    } catch {
      const msg = 'שגיאת רשת בהעלאת הקובץ';
      setOrdinanceUploadErr(msg);
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setOrdinanceUploading(false);
    }
  };

  const ordinanceFieldHelper = (() => {
    if (fieldErr('ordinanceUrl')) return fieldErr('ordinanceUrl');
    if (ordinanceUploadErr) return ordinanceUploadErr;
    if (!slugValid) return 'נא להגדיר Slug תקין לפני העלאת צו הארנונה';
    if (isNew && hasOrdinance) return 'הקישור הציבורי יעבוד לאחר שמירת העיר בפעם הראשונה';
    return undefined;
  })();

  // ── Zone helpers ────────────────────────────────────────────────────
  const addZone = () => {
    setData((prev) => ({
      ...prev,
      availableZones: [...prev.availableZones, { code: '', label: '' }],
    }));
  };

  const updateZone = (index: number, field: keyof IAvailableZone, value: string) => {
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

  // ── Size range helpers ──────────────────────────────────────────────
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

  // ── Exemption helpers ───────────────────────────────────────────────
  const addExemptionSection = () => {
    let newEi = 0;
    setData((prev) => {
      newEi = prev.exemptions.length;
      return {
        ...prev,
        exemptions: [...prev.exemptions, { sectionCode: '', sectionLabel: '', miaMessageId: '', subSections: [] }],
      };
    });
    setSelectedExemptionSectionIndex(newEi);
    setSelectedExemptionSubIndex(null);
  };

  const updateExemptionSection = (ei: number, field: string, value: string) => {
    console.log(ei, field, value);
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

  return (
    <Box>
      {/* Ordinance import banner */}
      {importedFromOrdinance && (
        <Alert severity="info" sx={{ mb: 3 }} onClose={() => setImportedFromOrdinance(false)}>
          נתונים יובאו מצו ארנונה באמצעות AI — נא לסקור ולתקן לפני שמירה
        </Alert>
      )}

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
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!isNew && city?._id && (
            <OrdinanceImportButton mode="update" existingCityId={city._id} />
          )}
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'שומר...' : 'שמור'}
          </Button>
        </Box>
      </Box>

      {/* Section 1: Basic Info */}
      <Accordion
        expanded={expandedAccordion.basic}
        onChange={(_, exp) => setExpandedAccordion((prev) => ({ ...prev, basic: exp }))}
      >
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
                onChange={(e) => {
                  clearFieldErr('cityName');
                  setData((prev) => ({ ...prev, cityName: e.target.value }));
                }}
                required
                error={Boolean(fieldErr('cityName'))}
                helperText={fieldErr('cityName')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="שם העיר (אנגלית)"
                value={data.cityNameEn}
                onChange={(e) => handleCityNameEnChange(e.target.value)}
                required
                error={Boolean(fieldErr('cityNameEn'))}
                helperText={fieldErr('cityNameEn')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Slug"
                value={data.slug}
                onChange={(e) => {
                  clearFieldErr('slug');
                  setData((prev) => ({ ...prev, slug: e.target.value }));
                }}
                required
                disabled={!isNew}
                error={Boolean(fieldErr('slug'))}
                helperText={
                  fieldErr('slug') ?? (isNew ? 'נוצר אוטומטית מהשם באנגלית' : 'לא ניתן לשינוי')
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="שנה"
                type="number"
                value={data.year}
                onChange={(e) => {
                  clearFieldErr('year');
                  setData((prev) => ({ ...prev, year: parseInt(e.target.value, 10) || 0 }));
                }}
                required
                error={Boolean(fieldErr('year'))}
                helperText={fieldErr('year')}
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
              <input
                ref={ordinanceFileInputRef}
                type="file"
                accept="application/pdf"
                hidden
                onChange={handleOrdinanceFileSelected}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'flex-start' }}>
                <TextField
                  fullWidth
                  label="קישור לצו הארנונה (להעתקה)"
                  value={publicOrdinanceShareUrl}
                  size="small"
                  placeholder={
                    !hasOrdinance
                      ? 'אין קובץ מקושר — העלו צו ארנונה'
                      : !slugValid
                        ? 'הגדירו Slug תקין לקבלת הקישור הציבורי'
                        : ''
                  }
                  slotProps={{
                    input: {
                      readOnly: true,
                      endAdornment: publicOrdinanceShareUrl ? (
                        <InputAdornment position="end" >
                          <IconButton
                            edge="end"
                            onClick={handleCopyPublicOrdinanceLink}
                            aria-label="העתקת לצו הארנונה"
                            size="small"
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ) : undefined,
                    },
                  }}
                  error={Boolean(fieldErr('ordinanceUrl') || ordinanceUploadErr)}
                  helperText={ordinanceFieldHelper}
                />
                <Button
                  variant="outlined"
                  startIcon={ordinanceUploading ? <CircularProgress size={18} color="inherit" /> : <UploadFileIcon />}
                  onClick={() => ordinanceFileInputRef.current?.click()}
                  disabled={!slugValid || ordinanceUploading}
                  sx={{ flexShrink: 0, mt: { xs: 0, sm: 1 } }}
                  aria-label="העלאת קובץ צו ארנונה"
                >
                  {ordinanceUploading ? 'מעלה…' : 'העלאת צו ארנונה'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Section 2: Available Zones */}
      <Accordion
        expanded={expandedAccordion.zones}
        onChange={(_, exp) => setExpandedAccordion((prev) => ({ ...prev, zones: exp }))}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              אזורים <Chip label={data.availableZones.length} size="small" sx={{ ml: 1 }} />
            </Typography>
            <SectionExtractTrigger sectionKey="zones" sectionLabel="אזורים" onOpen={openSectionExtract} />
          </Stack>  
        </AccordionSummary>
        <AccordionDetails>
          {data.availableZones.map((zone, zi) => (
            <Box key={zi} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'flex-start' }}>
              <TextField
                size="small"
                label="קוד"
                value={zone.code}
                onChange={(e) => {
                  clearFieldErr(`availableZones.${zi}.code`);
                  updateZone(zi, 'code', e.target.value);
                }}
                sx={{ width: 120 }}
                error={Boolean(fieldErr(`availableZones.${zi}.code`))}
                helperText={fieldErr(`availableZones.${zi}.code`)}
              />
              <TextField
                size="small"
                label="שם אזור"
                value={zone.label}
                onChange={(e) => {
                  clearFieldErr(`availableZones.${zi}.label`);
                  updateZone(zi, 'label', e.target.value);
                }}
                sx={{ flex: 1 }}
                error={Boolean(fieldErr(`availableZones.${zi}.label`))}
                helperText={fieldErr(`availableZones.${zi}.label`)}
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
      <Accordion
        expanded={expandedAccordion.types}
        onChange={(_, exp) => setExpandedAccordion((prev) => ({ ...prev, types: exp }))}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              סוגי נכס ותעריפים <Chip label={data.types.length} size="small" sx={{ ml: 1 }} />
            </Typography>
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
                    {data.types.sort((a, b) => a.code.localeCompare(b.code)).map((type, ti) => (
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
                          aria-label={`בחר תת־סוג ${sub.label || sub?.code || si}`}
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
            </>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Section 4: Exemptions — same master / detail pattern as Property Types */}
      <Accordion
        expanded={expandedAccordion.exemptions}
        onChange={(_, exp) => setExpandedAccordion((prev) => ({ ...prev, exemptions: exp }))}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              הנחות / פטורים <Chip label={data.exemptions.length} size="small" sx={{ ml: 1 }} />
            </Typography>
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
                      סעיפי הנחה
                    </Typography>
                    <Button size="small" fullWidth startIcon={<AddIcon />} onClick={addExemptionSection} variant="outlined">
                      הוסף סעיף
                    </Button>
                  </Box>
                  <List dense disablePadding aria-label="רשימת סעיפי הנחה">
                    {data.exemptions.map((section, ei) => (
                      <ListItemButton
                        key={ei}
                        selected={selectedExemptionSectionIndex === ei}
                        onClick={() => {
                          setSelectedExemptionSectionIndex(ei);
                          setSelectedExemptionSubIndex(section.subSections.length ? 0 : null);
                        }}
                        aria-current={selectedExemptionSectionIndex === ei ? 'true' : undefined}
                        aria-label={`בחר סעיף ${section.sectionLabel || section.sectionCode || ei}`}
                      >
                        <ListItemText
                          primary={
                            <Typography component="span" variant="body2" sx={{ fontWeight: 600 }}>
                              {section.sectionCode || '—'} · {section.sectionLabel || 'ללא שם'}
                            </Typography>
                          }
                          secondary={`${section.subSections.length} תתי־סעיף`}
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
                    <List dense disablePadding aria-label="רשימת תתי־סעיף">
                      {data.exemptions[selectedExemptionSectionIndex].subSections.map((sub, ssi) => (
                        <ListItemButton
                          key={ssi}
                          selected={selectedExemptionSubIndex === ssi}
                          onClick={() => setSelectedExemptionSubIndex(ssi)}
                          aria-current={selectedExemptionSubIndex === ssi ? 'true' : undefined}
                          aria-label={`בחר תת־סעיף ${sub.code || sub.description || ssi}`}
                        >
                          <ListItemText
                            primary={`${sub.code || '—'} · ${sub.discountPercent}%`}
                            secondary={sub.description ? `${sub.description.slice(0, 48)}${sub.description.length > 48 ? '…' : ''}` : '—'}
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
            </>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Section 5: Area Type Discounts */}
      <Accordion
        expanded={expandedAccordion.areaTypeDiscounts}
        onChange={(_, exp) => setExpandedAccordion((prev) => ({ ...prev, areaTypeDiscounts: exp }))}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              הנחות שטח <Chip label={(data.areaTypeDiscounts ?? []).length} size="small" sx={{ ml: 1 }} />
            </Typography>
            <SectionExtractTrigger
              sectionKey="extras"
              sectionLabel="הנחות שטח ואגרות"
              onOpen={openSectionExtract}
            />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {(data.areaTypeDiscounts ?? []).map((d, di) => (
            <Paper key={di} variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start" flexWrap="wrap" useFlexGap>
                <TextField
                  label="קוד סוג שטח"
                  size="small"
                  value={d.areaType}
                  onChange={(e) => {
                    clearFieldErr(`areaTypeDiscounts.${di}.areaType`);
                    setData((prev) => {
                      const arr = [...(prev.areaTypeDiscounts ?? [])];
                      arr[di] = { ...arr[di], areaType: e.target.value };
                      return { ...prev, areaTypeDiscounts: arr };
                    });
                  }}
                  error={!!fieldErr(`areaTypeDiscounts.${di}.areaType`)}
                  helperText={fieldErr(`areaTypeDiscounts.${di}.areaType`)}
                  sx={{ flex: '1 1 140px' }}
                />
                <TextField
                  label="שם בעברית"
                  size="small"
                  value={d.label}
                  onChange={(e) => {
                    clearFieldErr(`areaTypeDiscounts.${di}.label`);
                    setData((prev) => {
                      const arr = [...(prev.areaTypeDiscounts ?? [])];
                      arr[di] = { ...arr[di], label: e.target.value };
                      return { ...prev, areaTypeDiscounts: arr };
                    });
                  }}
                  error={!!fieldErr(`areaTypeDiscounts.${di}.label`)}
                  helperText={fieldErr(`areaTypeDiscounts.${di}.label`)}
                  sx={{ flex: '1 1 140px' }}
                />
                <TextField
                  label="אחוז הנחה"
                  size="small"
                  type="number"
                  value={d.discountPercent}
                  onChange={(e) => {
                    clearFieldErr(`areaTypeDiscounts.${di}.discountPercent`);
                    setData((prev) => {
                      const arr = [...(prev.areaTypeDiscounts ?? [])];
                      arr[di] = { ...arr[di], discountPercent: Number(e.target.value) };
                      return { ...prev, areaTypeDiscounts: arr };
                    });
                  }}
                  error={!!fieldErr(`areaTypeDiscounts.${di}.discountPercent`)}
                  helperText={fieldErr(`areaTypeDiscounts.${di}.discountPercent`)}
                  sx={{ flex: '0 1 120px' }}
                  slotProps={{ htmlInput: { min: 0, max: 100 } }}
                />
                <TextField
                  label='מינימום ₪/מ"ר'
                  size="small"
                  type="number"
                  value={d.minimumRatePerSqm}
                  onChange={(e) => {
                    clearFieldErr(`areaTypeDiscounts.${di}.minimumRatePerSqm`);
                    setData((prev) => {
                      const arr = [...(prev.areaTypeDiscounts ?? [])];
                      arr[di] = { ...arr[di], minimumRatePerSqm: Number(e.target.value) };
                      return { ...prev, areaTypeDiscounts: arr };
                    });
                  }}
                  error={!!fieldErr(`areaTypeDiscounts.${di}.minimumRatePerSqm`)}
                  helperText={fieldErr(`areaTypeDiscounts.${di}.minimumRatePerSqm`)}
                  sx={{ flex: '0 1 120px' }}
                  slotProps={{ htmlInput: { min: 0 } }}
                />
                <IconButton
                  color="error"
                  onClick={() => {
                    setData((prev) => ({
                      ...prev,
                      areaTypeDiscounts: (prev.areaTypeDiscounts ?? []).filter((_, i) => i !== di),
                    }));
                  }}
                  aria-label="מחק הנחת שטח"
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            </Paper>
          ))}
          <Button
            startIcon={<AddIcon />}
            onClick={() => {
              setData((prev) => ({
                ...prev,
                areaTypeDiscounts: [
                  ...(prev.areaTypeDiscounts ?? []),
                  { areaType: '', label: '', discountPercent: 0, minimumRatePerSqm: 0 },
                ],
              }));
            }}
          >
            הוסף סוג שטח
          </Button>
        </AccordionDetails>
      </Accordion>

      {/* Section 6: City Fees */}
      <Accordion
        expanded={expandedAccordion.cityFees}
        onChange={(_, exp) => setExpandedAccordion((prev) => ({ ...prev, cityFees: exp }))}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              אגרות נוספות <Chip label={(data.cityFees ?? []).length} size="small" sx={{ ml: 1 }} />
            </Typography>
            <SectionExtractTrigger
              sectionKey="extras"
              sectionLabel="הנחות שטח ואגרות"
              onOpen={openSectionExtract}
            />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {(data.cityFees ?? []).map((f, fi) => (
            <Paper key={fi} variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start" flexWrap="wrap" useFlexGap>
                <TextField
                  label="שם אגרה"
                  size="small"
                  value={f.name}
                  onChange={(e) => {
                    clearFieldErr(`cityFees.${fi}.name`);
                    setData((prev) => {
                      const arr = [...(prev.cityFees ?? [])];
                      arr[fi] = { ...arr[fi], name: e.target.value };
                      return { ...prev, cityFees: arr };
                    });
                  }}
                  error={!!fieldErr(`cityFees.${fi}.name`)}
                  helperText={fieldErr(`cityFees.${fi}.name`)}
                  sx={{ flex: '1 1 180px' }}
                />
                <TextField
                  label="עלות דו-חודשית (₪)"
                  size="small"
                  type="number"
                  value={f.amount}
                  onChange={(e) => {
                    clearFieldErr(`cityFees.${fi}.amount`);
                    setData((prev) => {
                      const arr = [...(prev.cityFees ?? [])];
                      arr[fi] = { ...arr[fi], amount: Number(e.target.value) };
                      return { ...prev, cityFees: arr };
                    });
                  }}
                  error={!!fieldErr(`cityFees.${fi}.amount`)}
                  helperText={fieldErr(`cityFees.${fi}.amount`)}
                  sx={{ flex: '0 1 150px' }}
                  slotProps={{ htmlInput: { min: 0 } }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={f.isMandatory}
                      onChange={(e) => {
                        setData((prev) => {
                          const arr = [...(prev.cityFees ?? [])];
                          arr[fi] = { ...arr[fi], isMandatory: e.target.checked };
                          return { ...prev, cityFees: arr };
                        });
                      }}
                    />
                  }
                  label="חובה"
                />
                <IconButton
                  color="error"
                  onClick={() => {
                    setData((prev) => ({
                      ...prev,
                      cityFees: (prev.cityFees ?? []).filter((_, i) => i !== fi),
                    }));
                  }}
                  aria-label="מחק אגרה"
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            </Paper>
          ))}
          <Button
            startIcon={<AddIcon />}
            onClick={() => {
              setData((prev) => ({
                ...prev,
                cityFees: [
                  ...(prev.cityFees ?? []),
                  { name: '', amount: 0, isMandatory: false },
                ],
              }));
            }}
          >
            הוסף אגרה
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

      {/* Section extract dialog */}
      {sectionExtractOpen && (
        <SectionExtractDialog
          open
          onClose={() => setSectionExtractOpen(null)}
          sectionKey={sectionExtractOpen}
          sectionLabel={sectionExtractLabel}
          existingData={data}
          onSectionExtracted={handleSectionExtracted}
        />
      )}

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
    </Box>
  );
}
