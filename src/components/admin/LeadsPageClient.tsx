'use client';

import { usePathname, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PeopleIcon from '@mui/icons-material/People';
import CircularProgress from '@mui/material/CircularProgress';
import type { LeadListItem } from '@/lib/types/admin';
import type { ICalculationEntry } from '@/lib/types/lead';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { formatDateTimeHe, formatPostDateHe, formatPostDateISO } from '@/lib/dates';

// ── Consent record shape (from GET /api/consents) ───────────────────
interface ConsentListItem {
  _id: string;
  consentType: 'data_retention' | 'legal_disclaimer';
  consentVersion: string;
  accepted: boolean;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

const consentTypeLabelMap: Record<string, string> = {
  data_retention: 'שמירת נתונים',
  legal_disclaimer: 'הצהרה משפטית',
};

// ── Label & color maps ──────────────────────────────────────────────

const leadStatusColorMap: Record<string, 'error' | 'warning' | 'success'> = {
  new: 'error',
  contacted: 'warning',
  closed: 'success',
};

const leadStatusLabelMap: Record<string, string> = {
  new: 'חדש',
  contacted: 'נוצר קשר',
  closed: 'סגור',
};

const sourceLabelMap: Record<string, string> = {
  calculator: 'מחשבון',
  contact_form: 'צור קשר',
  articles: 'מאמרים',
};

const sourceColorMap: Record<string, 'primary' | 'secondary' | 'warning'> = {
  calculator: 'primary',
  contact_form: 'secondary',
  articles: 'warning',
};

const calcStatusLabelMap: Record<string, string> = {
  in_progress: 'בתהליך',
  match: 'תואם',
  overpaying: 'משלם ביתר',
  underpaying: 'משלם בחסר',
  appeal_filed: 'השגה הוגשה',
};

const calcStatusColorMap: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  in_progress: 'info',
  match: 'success',
  overpaying: 'error',
  underpaying: 'warning',
  appeal_filed: 'default',
};

const abandonmentLabelMap: Record<string, string> = {
  initial_info: 'מידע ראשוני',
  initial_waiver: 'הצהרה',
  data_entry: 'מילוי פרטים',
  exemptions: 'הנחות',
  disclaimer: 'הסכמה',
  results_gate: 'תשלום',
  results_display: 'תוצאות',
  appeal: 'ערעור',
  contact_redirect: 'הפניה לצור קשר',
  completed: 'הושלם',
};

const paymentLabelMap: Record<string, string> = {
  none: 'ללא',
  calculator_paid: 'מחשבון שולם',
  appeal_paid: 'השגה שולמה',
};

// ── Helpers ──────────────────────────────────────────────────────────

function buildLeadsHref(
  pathname: string,
  state: {
    page: number;
    limit: number;
    search: string;
    status: string;
    source: string;
    abandonmentStage: string;
    city: string;
  }
) {
  const q = new URLSearchParams();
  q.set('page', String(state.page));
  q.set('limit', String(state.limit));
  if (state.search) q.set('search', state.search);
  if (state.status) q.set('status', state.status);
  if (state.source) q.set('source', state.source);
  if (state.abandonmentStage) q.set('abandonmentStage', state.abandonmentStage);
  if (state.city) q.set('city', state.city);
  return `${pathname}?${q}`;
}

function getLatestCalculation(lead: LeadListItem): ICalculationEntry | undefined {
  if (!lead.calculations || lead.calculations.length === 0) return undefined;
  return lead.calculations[lead.calculations.length - 1];
}

type CalcPaymentStatus = 'none' | 'calculator_paid' | 'appeal_paid';

function getCalculationPaymentStatus(calc: ICalculationEntry): CalcPaymentStatus {
  const raw = (calc as any)?.paymentStatus as unknown;
  return raw === 'calculator_paid' || raw === 'appeal_paid' ? raw : 'none';
}

function getLeadPaymentSummary(lead: LeadListItem): {
  latestStatus: CalcPaymentStatus;
  paidCalculationsCount: number;
  appealPaidCount: number;
} {
  const statuses = (lead.calculations || []).map(getCalculationPaymentStatus);
  const paidCalculationsCount = statuses.filter((s) => s !== 'none').length;
  const appealPaidCount = statuses.filter((s) => s === 'appeal_paid').length;
  const latest = getLatestCalculation(lead);
  const latestStatus = latest ? getCalculationPaymentStatus(latest) : 'none';
  return { latestStatus, paidCalculationsCount, appealPaidCount };
}



// ── Calculation card (shown in expanded row) ─────────────────────────

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline', flexWrap: 'wrap' }}>
      <Typography
        variant="caption"
        color="text.secondary"
        component="span"
        sx={{ minWidth: 100, flexShrink: 0 }}
      >
        {label}
      </Typography>
      <Typography variant="body2" component="span">
        {children}
      </Typography>
    </Box>
  );
}

function CalculationCard({ calc, index }: { calc: ICalculationEntry; index: number }) {
  const hasResults = Boolean(calc.calculationResult);
  const paymentStatus = getCalculationPaymentStatus(calc);
  const showPrivateExemptions =
    calc.propertyType === 'private' &&
    (calc.selectedExemptions?.length ||
      calc.householdSize != null ||
      calc.childrenCount != null);
  const showBusinessDesignations =
    calc.propertyType === 'business' && Boolean(calc.designations?.length);

  return (
    <Card variant="outlined" elevation={0} sx={{ mb: 1 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          חישוב #{index + 1}
        </Typography>
        {paymentStatus !== 'none' && (
          <Chip
            label={paymentLabelMap[paymentStatus]}
            size="small"
            color="info"
            variant="outlined"
          />
        )}
        {calc.calculationStatus && (
          <Chip
            label={calcStatusLabelMap[calc.calculationStatus] || calc.calculationStatus}
            color={calcStatusColorMap[calc.calculationStatus] || 'default'}
            size="small"
          />
        )}
        <Chip
          label={abandonmentLabelMap[calc.abandonmentStage] || calc.abandonmentStage}
          size="small"
          variant="outlined"
        />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ marginInlineStart: 'auto' }}
        >
          {formatPostDateHe(String(calc.createdAt))}
        </Typography>
      </Box>

      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: hasResults ? 4 : 12 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
              פרטי נכס
            </Typography>
            <Stack spacing={1}>
              {calc.citySlug && <DetailRow label="עיר">{calc.citySlug}</DetailRow>}
              {calc.propertyType && (
                <DetailRow label="סוג">
                  {calc.propertyType === 'private' ? 'פרטי' : 'עסקי'}
                </DetailRow>
              )}
              {calc.propertyArea != null && (
                <DetailRow label="שטח">{calc.propertyArea} מ״ר</DetailRow>
              )}
              {calc.bimonthlyPayment != null && (
                <DetailRow label="תשלום דו-חודשי">₪{calc.bimonthlyPayment}</DetailRow>
              )}
              {calc.address && <DetailRow label="כתובת">{calc.address}</DetailRow>}
              {calc.zone && <DetailRow label="אזור">{calc.zone}</DetailRow>}
            </Stack>


          </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
            {showPrivateExemptions && (
              <>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                  הנחות ומשק בית
                </Typography>
                <Stack spacing={1}>
                  {calc.householdSize != null && (
                    <DetailRow label="גודל משפחה">{calc.householdSize}</DetailRow>
                  )}
                  {calc.childrenCount != null && (
                    <DetailRow label="מספר ילדים">{calc.childrenCount}</DetailRow>
                  )}
                  {calc.selectedExemptions?.map((ex, exIdx) => (
                    <DetailRow key={`${ex.sectionCode}-${ex.subSectionCode}-${exIdx}`} label="הנחה">
                      סעיף {ex.sectionCode} · תת-סעיף {ex.subSectionCode}
                    </DetailRow>
                  ))}
                </Stack>
              </>
            )}

            {showBusinessDesignations && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                  ייעודים עסקיים
                </Typography>
                <Stack spacing={1}>
                  {(calc.designations ?? []).map((d, dIdx) => (
                    <DetailRow key={`${d.type}-${dIdx}`} label={`ייעוד ${dIdx + 1}`}>
                      {d.type} — {d.area} מ״ר
                    </DetailRow>
                  ))}
                </Stack>
              </>
            )}
            </Grid>
          {calc.calculationResult && (
            <Grid size={12} sx={{ display: { xs: 'block', md: 'none' } }}>
              <Divider />
            </Grid>
          )}
          {calc.calculationResult && (
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                תוצאות
              </Typography>
              <Stack spacing={1}>
                <DetailRow label="חישוב דו-חודשי">
                  ₪{calc.calculationResult.calculatedBimonthly}
                </DetailRow>
                <DetailRow label="חיסכון שנתי">₪{calc.calculationResult.savingsAnnual}</DetailRow>
                <DetailRow label="חיסכון 10 שנים">₪{calc.calculationResult.savings10Year}</DetailRow>
              </Stack>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}

// ── Expandable row ───────────────────────────────────────────────────

function ExpandableRow({
  lead,
  onStatusChange,
}: {
  lead: LeadListItem;
  onStatusChange: (id: string, newStatus: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [consents, setConsents] = useState<ConsentListItem[]>([]);
  const [consentsLoading, setConsentsLoading] = useState(false);
  const consentsFetchedRef = useRef(false);
  const latestCalc = getLatestCalculation(lead);
  const paymentSummary = useMemo(() => getLeadPaymentSummary(lead), [lead]);

  const fetchConsents = useCallback(async () => {
    if (consentsFetchedRef.current) return;
    consentsFetchedRef.current = true;
    setConsentsLoading(true);
    try {
      const res = await fetch(`/api/consents?leadId=${lead._id}`);
      if (res.ok) {
        const data = await res.json();
        setConsents(data);
      }
    } catch {
      // Silently fail
    } finally {
      setConsentsLoading(false);
    }
  }, [lead._id]);

  useEffect(() => {
    if (open) fetchConsents();
  }, [open, fetchConsents]);

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: open ? 'none' : undefined } }}>
        <TableCell padding="checkbox">
          {lead.calculations.length > 0 && (
            <IconButton
              size="small"
              onClick={() => setOpen(!open)}
              aria-label={open ? 'סגור פרטים' : 'הרחב פרטים'}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          )}
        </TableCell>
        <TableCell>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {lead.fullName}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" dir="ltr">
            {lead.phone}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip
            label={sourceLabelMap[lead.source] || lead.source}
            color={sourceColorMap[lead.source] || 'default'}
            size="small"
            variant="outlined"
          />
        </TableCell>
        <TableCell>
          <Select
            value={lead.status}
            size="small"
            onChange={(e) => onStatusChange(lead._id, e.target.value)}
            sx={{ minWidth: 120 }}
            aria-label={`סטטוס ליד ${lead.fullName}`}
            renderValue={(value) => (
              <Chip
                label={leadStatusLabelMap[value]}
                color={leadStatusColorMap[value]}
                size="small"
              />
            )}
          >
            <MenuItem value="new">חדש</MenuItem>
            <MenuItem value="contacted">נוצר קשר</MenuItem>
            <MenuItem value="closed">סגור</MenuItem>
          </Select>
        </TableCell>
        <TableCell>
          {latestCalc?.abandonmentStage ? (
            <Chip
              label={abandonmentLabelMap[latestCalc.abandonmentStage] || latestCalc.abandonmentStage}
              size="small"
              variant="outlined"
              color={latestCalc.abandonmentStage === 'completed' ? 'success' : 'default'}
            />
          ) : (
            <Typography variant="body2" color="text.disabled">
              —
            </Typography>
          )}
        </TableCell>
        <TableCell align="center">
          {lead.calculations.length > 0 ? (
            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
              <Chip label={String(lead.calculations.length)} size="small" variant="outlined" />
              {paymentSummary.paidCalculationsCount > 0 && (
                <Chip
                  label={`שולם: ${paymentSummary.paidCalculationsCount}/${lead.calculations.length}`}
                  size="small"
                  color="info"
                  variant="outlined"
                />
              )}
              {paymentSummary.appealPaidCount > 0 && (
                <Chip
                  label={`השגות: ${paymentSummary.appealPaidCount}`}
                  size="small"
                  color="info"
                  variant="outlined"
                />
              )}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.disabled">
              —
            </Typography>
          )}
        </TableCell>
        <TableCell>
          {lead.message ? (
            <Tooltip title={lead.message} arrow>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 150,
                  cursor: 'pointer',
                }}
              >
                {lead.message}
              </Typography>
            </Tooltip>
          ) : (
            <Typography variant="body2" color="text.disabled">
              —
            </Typography>
          )}
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {formatPostDateHe(new Date(lead.createdAt))}
          </Typography>
        </TableCell>
      </TableRow>

      {/* Expanded details - calculations history */}
      {lead.calculations.length > 0 && (
        <TableRow>
          <TableCell colSpan={9} sx={{ py: 0 }}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ py: 2, px: 1 }}>
                {/* Contact info */}
                <Box sx={{ mb: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  {lead.email && (
                    <Typography variant="body2">
                      מייל: {lead.email}
                    </Typography>
                  )}
                  {lead.idNumber && (
                    <Typography variant="body2" dir="ltr">
                      ת.ז: {lead.idNumber}
                    </Typography>
                  )}
                  {paymentSummary.latestStatus !== 'none' && (
                    <Chip
                      label={`חישוב אחרון: ${paymentLabelMap[paymentSummary.latestStatus]}`}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  )}
                </Box>

                {/* Calculations */}
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  היסטוריית חישובים ({lead.calculations.length})
                </Typography>
                <Box
                  sx={{
                    maxHeight: { xs: 280, sm: 420 },
                    overflowY: 'auto',
                    pr: 0.5,
                  }}
                >
                  {lead.calculations.map((calc, idx) => (
                    <CalculationCard key={idx} calc={calc} index={idx} />
                  ))}
                </Box>

                {/* Consent history */}
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, mt: 2 }}>
                  היסטוריית הסכמות
                </Typography>
                {consentsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={20} />
                  </Box>
                ) : consents.length === 0 ? (
                  <Typography variant="body2" color="text.disabled">
                    אין הסכמות
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {consents.map((c) => (
                      <Card key={c._id} variant="outlined" sx={{ px: 2, py: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                          <Chip
                            label={consentTypeLabelMap[c.consentType] || c.consentType}
                            size="small"
                            color="default"
                            variant="outlined"
                          />
                          <Chip
                            label={c.accepted ? '✓ אושר' : '✗ לא אושר'}
                            size="small"
                            color={c.accepted ? 'success' : 'error'}
                          />
                          <Typography variant="caption" color="text.secondary">
                            גרסה {c.consentVersion}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTimeHe(new Date(c.timestamp))}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" dir="ltr">
                            IP: {c.ipAddress}
                          </Typography>
                          <Tooltip title={c.userAgent} arrow>
                            <Typography
                              variant="caption"
                              color="text.disabled"
                              dir="ltr"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: 200,
                                cursor: 'pointer',
                              }}
                            >
                              {c.userAgent}
                            </Typography>
                          </Tooltip>
                        </Box>
                      </Card>
                    ))}
                  </Box>
                )}
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ── Main component ───────────────────────────────────────────────────

export interface LeadsPageClientProps {
  leads: LeadListItem[];
  total: number;
  page: number;
  limit: number;
  search: string;
  status: string;
  source: string;
  abandonmentStage: string;
  city: string;
}

export default function LeadsPageClient({
  leads,
  total,
  page,
  limit,
  search,
  status,
  source,
  abandonmentStage,
  city,
}: LeadsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchInput, setSearchInput] = useState(search);
  const [cityInput, setCityInput] = useState(city);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    setCityInput(city);
  }, [city]);

  const urlState = useMemo(
    () => ({ page, limit, search, status, source, abandonmentStage, city }),
    [page, limit, search, status, source, abandonmentStage, city]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput === search) return;
      router.replace(
        buildLeadsHref(pathname, { ...urlState, search: searchInput, page: 0 })
      );
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput, search, router, pathname, urlState]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (cityInput === city) return;
      router.replace(
        buildLeadsHref(pathname, { ...urlState, city: cityInput, page: 0 })
      );
    }, 400);
    return () => clearTimeout(t);
  }, [cityInput, city, router, pathname, urlState]);

  const navigate = (patch: Partial<typeof urlState>) => {
    router.push(buildLeadsHref(pathname, { ...urlState, ...patch }));
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('עדכון נכשל');

      setSnackbar({ open: true, message: 'סטטוס עודכן בהצלחה', severity: 'success' });
      router.refresh();
    } catch {
      setSnackbar({ open: true, message: 'שגיאה בעדכון סטטוס', severity: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
          לידים
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          ניהול לידים ופניות
        </Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="חיפוש לפי שם, ת.ז, מייל או טלפון..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ minWidth: 280 }}
          aria-label="חיפוש לידים"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>סטטוס</InputLabel>
          <Select
            value={status}
            label="סטטוס"
            onChange={(e) => navigate({ status: e.target.value, page: 0 })}
          >
            <MenuItem value="">הכל</MenuItem>
            <MenuItem value="new">חדש</MenuItem>
            <MenuItem value="contacted">נוצר קשר</MenuItem>
            <MenuItem value="closed">סגור</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>מקור</InputLabel>
          <Select
            value={source}
            label="מקור"
            onChange={(e) => navigate({ source: e.target.value, page: 0 })}
          >
            <MenuItem value="">הכל</MenuItem>
            <MenuItem value="calculator">מחשבון</MenuItem>
            <MenuItem value="contact_form">צור קשר</MenuItem>
            <MenuItem value="articles">מאמרים</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>שלב נטישה</InputLabel>
          <Select
            value={abandonmentStage}
            label="שלב נטישה"
            onChange={(e) => navigate({ abandonmentStage: e.target.value, page: 0 })}
          >
            <MenuItem value="">הכל</MenuItem>
            <MenuItem value="initial_info">מידע ראשוני</MenuItem>
            <MenuItem value="data_entry">מילוי פרטים</MenuItem>
            <MenuItem value="exemptions">הנחות</MenuItem>
            <MenuItem value="disclaimer">הסכמה</MenuItem>
            <MenuItem value="results_gate">תשלום</MenuItem>
            <MenuItem value="results_display">תוצאות</MenuItem>
            <MenuItem value="appeal">ערעור</MenuItem>
            <MenuItem value="contact_redirect">הפניה</MenuItem>
            <MenuItem value="completed">הושלם</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          placeholder="סינון לפי עיר"
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          sx={{ minWidth: 130 }}
          aria-label="סינון לפי עיר"
        />
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell sx={{ fontWeight: 600 }}>שם</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>טלפון</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>מקור</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>סטטוס</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>שלב</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">חישובים</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>הודעה</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>תאריך</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      אין לידים
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <ExpandableRow
                    key={lead._id}
                    lead={lead}
                    onStatusChange={handleStatusChange}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => navigate({ page: newPage })}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => {
            navigate({ limit: parseInt(e.target.value, 10), page: 0 });
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="שורות בעמוד:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} מתוך ${count}`}
        />
      </Paper>

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
