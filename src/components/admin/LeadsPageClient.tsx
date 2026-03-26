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
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PeopleIcon from '@mui/icons-material/People';
import type { LeadListItem } from '@/lib/types/admin';
import type { ICalculationEntry } from '@/lib/types/lead';
import { useEffect, useMemo, useState } from 'react';

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ── Calculation card (shown in expanded row) ─────────────────────────

function CalculationCard({ calc, index }: { calc: ICalculationEntry; index: number }) {
  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            חישוב #{index + 1}
          </Typography>
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
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
            {formatDate(String(calc.createdAt))}
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {/* Property details */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
              פרטי נכס
            </Typography>
            {calc.citySlug && <Typography variant="body2">עיר: {calc.citySlug}</Typography>}
            {calc.propertyType && (
              <Typography variant="body2">
                סוג: {calc.propertyType === 'private' ? 'פרטי' : 'עסקי'}
              </Typography>
            )}
            {calc.propertyArea != null && (
              <Typography variant="body2">שטח: {calc.propertyArea} מ״ר</Typography>
            )}
            {calc.bimonthlyPayment != null && (
              <Typography variant="body2">תשלום דו-חודשי: ₪{calc.bimonthlyPayment}</Typography>
            )}
            {calc.address && <Typography variant="body2">כתובת: {calc.address}</Typography>}
            {calc.zone && <Typography variant="body2">אזור: {calc.zone}</Typography>}
          </Grid>

          {/* Calculation results */}
          {calc.calculationResult && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                תוצאות
              </Typography>
              <Typography variant="body2">
                חישוב דו-חודשי: ₪{calc.calculationResult.calculatedBimonthly}
              </Typography>
              <Typography variant="body2">
                חיסכון שנתי: ₪{calc.calculationResult.savingsAnnual}
              </Typography>
              <Typography variant="body2">
                חיסכון 10 שנים: ₪{calc.calculationResult.savings10Year}
              </Typography>
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
  const latestCalc = getLatestCalculation(lead);

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
            <Chip label={String(lead.calculations.length)} size="small" variant="outlined" />
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
            {formatDate(lead.createdAt)}
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
                  {lead.paymentStatus !== 'none' && (
                    <Chip
                      label={paymentLabelMap[lead.paymentStatus]}
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
                {lead.calculations.map((calc, idx) => (
                  <CalculationCard key={idx} calc={calc} index={idx} />
                ))}
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
