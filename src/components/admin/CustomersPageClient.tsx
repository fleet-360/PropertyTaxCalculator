'use client';

import * as React from 'react';
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
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PeopleIcon from '@mui/icons-material/People';
import type { CustomerListItem } from '@/lib/types/admin';

const statusColorMap: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  in_progress: 'info',
  match: 'success',
  overpaying: 'error',
  underpaying: 'warning',
  appeal_filed: 'default',
};

const statusLabelMap: Record<string, string> = {
  in_progress: 'בתהליך',
  match: 'תואם',
  overpaying: 'משלם ביתר',
  underpaying: 'משלם בחסר',
  appeal_filed: 'השגה הוגשה',
};

const paymentLabelMap: Record<string, string> = {
  none: 'ללא',
  calculator_paid: 'מחשבון שולם',
  appeal_paid: 'השגה שולמה',
};

const paymentColorMap: Record<string, 'default' | 'success' | 'info'> = {
  none: 'default',
  calculator_paid: 'info',
  appeal_paid: 'success',
};

function buildCustomersHref(
  pathname: string,
  state: { page: number; limit: number; search: string; status: string; city: string }
) {
  const q = new URLSearchParams();
  q.set('page', String(state.page));
  q.set('limit', String(state.limit));
  if (state.search) q.set('search', state.search);
  if (state.status) q.set('status', state.status);
  if (state.city) q.set('city', state.city);
  return `${pathname}?${q}`;
}

function ExpandableRow({ customer }: { customer: CustomerListItem }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: open ? 'none' : undefined } }}>
        <TableCell padding="checkbox">
          <IconButton
            size="small"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'סגור פרטים' : 'הרחב פרטים'}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {customer.fullName}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" dir="ltr">
            {customer.idNumber}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{customer.citySlug}</Typography>
        </TableCell>
        <TableCell>
          <Chip
            label={customer.propertyType === 'private' ? 'פרטי' : 'עסקי'}
            size="small"
            variant="outlined"
          />
        </TableCell>
        <TableCell>
          <Chip label={statusLabelMap[customer.status]} color={statusColorMap[customer.status]} size="small" />
        </TableCell>
        <TableCell>
          <Chip
            label={paymentLabelMap[customer.paymentStatus]}
            color={paymentColorMap[customer.paymentStatus]}
            size="small"
            variant="outlined"
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {new Date(customer.createdAt).toLocaleDateString('he-IL', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={8} sx={{ py: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 1 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        פרטי נכס
                      </Typography>
                      <Typography variant="body2">שטח: {customer.propertyArea} מ״ר</Typography>
                      {customer.coveredBalconyArea ? (
                        <Typography variant="body2">מרפסת: {customer.coveredBalconyArea} מ״ר</Typography>
                      ) : null}
                      {customer.storageArea ? (
                        <Typography variant="body2">מחסן: {customer.storageArea} מ״ר</Typography>
                      ) : null}
                      {customer.parkingArea ? (
                        <Typography variant="body2">חניה: {customer.parkingArea} מ״ר</Typography>
                      ) : null}
                      {customer.zone && <Typography variant="body2">אזור: {customer.zone}</Typography>}
                      {customer.address && <Typography variant="body2">כתובת: {customer.address}</Typography>}
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        תשלום ותוצאות
                      </Typography>
                      <Typography variant="body2">תשלום דו-חודשי: ₪{customer.bimonthlyPayment}</Typography>
                      {customer.calculationResult && (
                        <>
                          <Typography variant="body2">
                            חישוב דו-חודשי: ₪{customer.calculationResult.calculatedBimonthly}
                          </Typography>
                          <Typography variant="body2">
                            חיסכון שנתי: ₪{customer.calculationResult.savingsAnnual}
                          </Typography>
                          <Typography variant="body2">
                            חיסכון 10 שנים: ₪{customer.calculationResult.savings10Year}
                          </Typography>
                          <Chip
                            label={
                              statusLabelMap[customer.calculationResult.outcome] ||
                              customer.calculationResult.outcome
                            }
                            color={statusColorMap[customer.calculationResult.outcome] || 'default'}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        פרטי קשר
                      </Typography>
                      {customer.email && <Typography variant="body2">מייל: {customer.email}</Typography>}
                      {customer.phone && (
                        <Typography variant="body2" dir="ltr">
                          טלפון: {customer.phone}
                        </Typography>
                      )}
                      {customer.householdSize && (
                        <Typography variant="body2">גודל משק בית: {customer.householdSize}</Typography>
                      )}
                      {customer.childrenCount != null && (
                        <Typography variant="body2">ילדים: {customer.childrenCount}</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export interface CustomersPageClientProps {
  customers: CustomerListItem[];
  total: number;
  page: number;
  limit: number;
  search: string;
  status: string;
  city: string;
}

export default function CustomersPageClient({
  customers,
  total,
  page,
  limit,
  search,
  status,
  city,
}: CustomersPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchInput, setSearchInput] = React.useState(search);
  const [cityInput, setCityInput] = React.useState(city);

  React.useEffect(() => {
    setSearchInput(search);
  }, [search]);

  React.useEffect(() => {
    setCityInput(city);
  }, [city]);

  const urlState = React.useMemo(
    () => ({ page, limit, search, status, city }),
    [page, limit, search, status, city]
  );

  React.useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput === search) return;
      router.replace(
        buildCustomersHref(pathname, { ...urlState, search: searchInput, page: 0 })
      );
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput, search, router, pathname, urlState]);

  React.useEffect(() => {
    const t = setTimeout(() => {
      if (cityInput === city) return;
      router.replace(
        buildCustomersHref(pathname, { ...urlState, city: cityInput, page: 0 })
      );
    }, 400);
    return () => clearTimeout(t);
  }, [cityInput, city, router, pathname, urlState]);

  const navigate = (patch: Partial<typeof urlState>) => {
    router.push(buildCustomersHref(pathname, { ...urlState, ...patch }));
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
          לקוחות
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          צפייה בלקוחות שהשתמשו במחשבון
        </Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="חיפוש לפי שם, ת.ז, מייל או טלפון..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ minWidth: 280 }}
          aria-label="חיפוש לקוחות"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>סטטוס</InputLabel>
          <Select
            value={status}
            label="סטטוס"
            onChange={(e) => navigate({ status: e.target.value, page: 0 })}
          >
            <MenuItem value="">הכל</MenuItem>
            <MenuItem value="in_progress">בתהליך</MenuItem>
            <MenuItem value="match">תואם</MenuItem>
            <MenuItem value="overpaying">משלם ביתר</MenuItem>
            <MenuItem value="underpaying">משלם בחסר</MenuItem>
            <MenuItem value="appeal_filed">השגה הוגשה</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          placeholder="סינון לפי עיר (slug)"
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          sx={{ minWidth: 150 }}
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
                <TableCell sx={{ fontWeight: 600 }}>ת.ז</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>עיר</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>סוג נכס</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>סטטוס</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>תשלום</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>תאריך</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      אין לקוחות
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => <ExpandableRow key={customer._id} customer={customer} />)
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
    </Box>
  );
}
