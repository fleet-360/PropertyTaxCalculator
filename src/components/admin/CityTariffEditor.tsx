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
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { alpha, useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import OrdinanceImportButton from '@/components/admin/OrdinanceImportButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SectionExtractDialog from '@/components/admin/SectionExtractDialog';
import SectionExtractTrigger from '@/components/admin/SectionExtractTrigger';
import PropertyTypesSection from '@/components/admin/PropertyTypesSection';
import ExemptionsSection from '@/components/admin/ExemptionsSection';
import type { SectionKey } from '@/lib/vision/ordinance-extractor';
import {
  normalizeCityTariffPayload,
  validateCityTariffPayload,
  validationIssuesToFieldMap,
  accordionSectionForValidationPath,
  formatValidationIssueLocation,
  type CityTariffAccordionSection,
  type CityTariffValidationIssue,
} from '@/lib/validateCityTariffPayload';
import type {
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
  const theme = useTheme();
  const router = useRouter();
  const [data, setData] = React.useState<ICityTariffData>(city || emptyCityData);
  const [saving, setSaving] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [importedFromOrdinance, setImportedFromOrdinance] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [validationIssuesList, setValidationIssuesList] = React.useState<CityTariffValidationIssue[] | null>(null);
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

  const sectionErrorCount = React.useMemo(() => {
    const c: Record<CityTariffAccordionSection, number> = {
      basic: 0,
      zones: 0,
      types: 0,
      exemptions: 0,
      areaTypeDiscounts: 0,
      cityFees: 0,
    };
    for (const k of Object.keys(fieldErrors)) {
      c[accordionSectionForValidationPath(k)] += 1;
    }
    return c;
  }, [fieldErrors]);

  const hasPathPrefix = React.useCallback(
    (prefix: string) => {
      const keys = Object.keys(fieldErrors);
      return keys.some((k) => k === prefix || k.startsWith(`${prefix}.`));
    },
    [fieldErrors],
  );

  const accordionValidationSx = React.useCallback(
    (section: CityTariffAccordionSection) =>
      sectionErrorCount[section] > 0
        ? {
            border: '1px solid',
            borderColor: 'error.main',
            borderRadius: 1,
            bgcolor: alpha(theme.palette.error.main, 0.06),
          }
        : undefined,
    [sectionErrorCount, theme.palette.error.main],
  );

  const listItemErrorSx = React.useCallback(
    (active: boolean) =>
      active
        ? {
            borderInlineStart: '3px solid',
            borderInlineStartColor: 'error.main',
            bgcolor: alpha(theme.palette.error.main, 0.08),
          }
        : undefined,
    [theme.palette.error.main],
  );

  const prepareOrdinanceImport = React.useCallback(
    (imported: ICityTariffData): ICityTariffData => {
      const withDefaults: ICityTariffData = {
        ...emptyCityData,
        ...imported,
        types: imported.types ?? [],
        exemptions: imported.exemptions ?? [],
        availableZones: imported.availableZones ?? [],
        areaTypeDiscounts: imported.areaTypeDiscounts ?? [],
        cityFees: imported.cityFees ?? [],
      };
      const normalized = normalizeCityTariffPayload(withDefaults);
      return city?._id ? { ...normalized, _id: city._id } : normalized;
    },
    [city?._id],
  );

  const handleOrdinanceImported = React.useCallback(
    (imported: ICityTariffData) => {
      setData(prepareOrdinanceImport(imported));
      setImportedFromOrdinance(true);
      setSnackbar({
        open: true,
        message: 'נתונים יובאו מצו ארנונה — בדוק ושמור',
        severity: 'success',
      });
    },
    [prepareOrdinanceImport],
  );

  // ── Load imported ordinance data from sessionStorage (create-from-list flow) ──
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('fromOrdinance') !== 'true') return;
    if (!sessionStorage?.getItem('ordinanceImportData')) return;

    try {
      const stored = sessionStorage.getItem('ordinanceImportData');
      if (!stored) return;
      const imported: ICityTariffData = JSON.parse(stored);
      sessionStorage.removeItem('ordinanceImportData');
      setData(prepareOrdinanceImport(imported));
      setImportedFromOrdinance(true);
    } catch {
      // Ignore parse errors
    }
  }, [prepareOrdinanceImport]);

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
    const issues = validateCityTariffPayload(normalized);
    if (issues.length > 0) {
      setFieldErrors(validationIssuesToFieldMap(issues));
      setValidationIssuesList(issues);
      setExpandedAccordion((prev) => {
        const next = { ...prev };
        for (const issue of issues) {
          next[accordionSectionForValidationPath(issue.path)] = true;
        }
        return next;
      });
      const sample = issues
        .slice(0, 2)
        .map(
          (i) =>
            `${formatValidationIssueLocation(i.path, data)}: ${i.message}`,
        )
        .join(' · ');
      setSnackbar({
        open: true,
        message:
          issues.length <= 2
            ? sample
            : `נמצאו ${issues.length} בעיות · ${sample} …`,
        severity: 'error',
      });
      return;
    }

    setValidationIssuesList(null);
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

  return (
    <Box>
      {/* Ordinance import banner */}
      {importedFromOrdinance && (
        <Alert severity="info" sx={{ mb: 3 }} onClose={() => setImportedFromOrdinance(false)}>
          נתונים יובאו מצו ארנונה באמצעות AI — נא לסקור ולתקן לפני שמירה
        </Alert>
      )}

      {validationIssuesList && validationIssuesList.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setValidationIssuesList(null)}>
          <Typography variant="subtitle2" component="div" sx={{ mb: 1, fontWeight: 700 }}>
            יש לתקן את השגיאות הבאות (הסקשנים והשורות המסומנים באדום):
          </Typography>
          <Box
            component="ul"
            sx={{ m: 0, pl: 2.5, maxHeight: 360, overflow: 'auto', listStyleType: 'disc' }}
          >
            {validationIssuesList.map((issue, idx) => (
              <Typography
                key={`${issue.path}-${idx}`}
                component="li"
                variant="body2"
                sx={{ mb: 0.75 }}
              >
                <Box component="span" sx={{ fontWeight: 600 }}>
                  {formatValidationIssueLocation(issue.path, data)}
                </Box>
                {' — '}
                {issue.message}
              </Typography>
            ))}
          </Box>
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
            <OrdinanceImportButton
              mode="update"
              existingCityId={city._id}
              onOrdinanceImported={handleOrdinanceImported}
            />
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
        sx={accordionValidationSx('basic')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>פרטי עיר</Typography>
            {sectionErrorCount.basic > 0 && (
              <Chip size="small" color="error" label={`${sectionErrorCount.basic} שגיאות`} />
            )}
          </Stack>
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
        sx={accordionValidationSx('zones')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              אזורים <Chip label={data.availableZones.length} size="small" sx={{ ml: 1 }} />
            </Typography>
            {sectionErrorCount.zones > 0 && (
              <Chip size="small" color="error" label={`${sectionErrorCount.zones} שגיאות`} />
            )}
            <SectionExtractTrigger sectionKey="zones" sectionLabel="אזורים" onOpen={openSectionExtract} />
          </Stack>  
        </AccordionSummary>
        <AccordionDetails>
          {data.availableZones.map((zone, zi) => (
            <Box
              key={zi}
              sx={{
                display: 'flex',
                gap: 1,
                mb: 1,
                alignItems: 'flex-start',
                p: 0.5,
                borderRadius: 1,
                ...listItemErrorSx(hasPathPrefix(`availableZones.${zi}`)),
              }}
            >
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

      {/* Section 3: Property Types & Tariffs */}
      <PropertyTypesSection
        data={data}
        setData={setData}
        expanded={expandedAccordion.types}
        onExpandedChange={(exp) => setExpandedAccordion((prev) => ({ ...prev, types: exp }))}
        errorCount={sectionErrorCount.types}
        accordionSx={accordionValidationSx('types')}
        fieldErr={fieldErr}
        clearFieldErr={clearFieldErr}
        hasPathPrefix={hasPathPrefix}
        listItemErrorSx={listItemErrorSx}
        openSectionExtract={openSectionExtract}
      />

      {/* Section 4: Exemptions / Discounts */}
      <ExemptionsSection
        data={data}
        setData={setData}
        expanded={expandedAccordion.exemptions}
        onExpandedChange={(exp) => setExpandedAccordion((prev) => ({ ...prev, exemptions: exp }))}
        errorCount={sectionErrorCount.exemptions}
        accordionSx={accordionValidationSx("exemptions")}
        fieldErr={fieldErr}
        clearFieldErr={clearFieldErr}
        hasPathPrefix={hasPathPrefix}
        listItemErrorSx={listItemErrorSx}
        openSectionExtract={openSectionExtract}
      />

      {/* Section 5: Area Type Discounts */}
      <Accordion
        expanded={expandedAccordion.areaTypeDiscounts}
        onChange={(_, exp) => setExpandedAccordion((prev) => ({ ...prev, areaTypeDiscounts: exp }))}
        sx={accordionValidationSx('areaTypeDiscounts')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              הנחות שטח <Chip label={(data.areaTypeDiscounts ?? []).length} size="small" sx={{ ml: 1 }} />
            </Typography>
            {sectionErrorCount.areaTypeDiscounts > 0 && (
              <Chip
                size="small"
                color="error"
                label={`${sectionErrorCount.areaTypeDiscounts} שגיאות`}
              />
            )}
            <SectionExtractTrigger
              sectionKey="extras"
              sectionLabel="הנחות שטח ואגרות"
              onOpen={openSectionExtract}
            />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {(data.areaTypeDiscounts ?? []).map((d, di) => (
            <Paper
              key={di}
              variant="outlined"
              sx={{
                p: 2,
                mb: 2,
                ...listItemErrorSx(hasPathPrefix(`areaTypeDiscounts.${di}`)),
              }}
            >
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
                <TextField
                  select
                  size="small"
                  label="חל על סוג נכס"
                  value={d.applicableTo ?? 'private'}
                  onChange={(e) => {
                    setData((prev) => {
                      const arr = [...(prev.areaTypeDiscounts ?? [])];
                      arr[di] = {
                        ...arr[di],
                        applicableTo: e.target.value as 'private' | 'business' | 'both',
                      };
                      return { ...prev, areaTypeDiscounts: arr };
                    });
                  }}
                  sx={{ flex: '0 1 160px' }}
                >
                  <MenuItem value="private">מגורים</MenuItem>
                  <MenuItem value="business">עסקי</MenuItem>
                  <MenuItem value="both">שניהם</MenuItem>
                </TextField>
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
                  {
                    areaType: '',
                    label: '',
                    discountPercent: 0,
                    minimumRatePerSqm: 0,
                    applicableTo: 'private',
                  },
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
        sx={accordionValidationSx('cityFees')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              אגרות נוספות <Chip label={(data.cityFees ?? []).length} size="small" sx={{ ml: 1 }} />
            </Typography>
            {sectionErrorCount.cityFees > 0 && (
              <Chip size="small" color="error" label={`${sectionErrorCount.cityFees} שגיאות`} />
            )}
            <SectionExtractTrigger
              sectionKey="extras"
              sectionLabel="הנחות שטח ואגרות"
              onOpen={openSectionExtract}
            />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {(data.cityFees ?? []).map((f, fi) => (
            <Paper
              key={fi}
              variant="outlined"
              sx={{
                p: 2,
                mb: 2,
                ...listItemErrorSx(hasPathPrefix(`cityFees.${fi}`)),
              }}
            >
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

    </Box>
  );
}
