'use client';
import * as React from 'react';
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
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
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

function ExpandableRow({ customer }: { customer: CustomerListItem }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: open ? 'none' : undefined } }}>
        <TableCell padding="checkbox">
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {customer.fullName}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" dir="ltr">{customer.idNumber}</Typography>
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
          <Chip
            label={statusLabelMap[customer.status]}
            color={statusColorMap[customer.status]}
            size="small"
          />
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
                      {customer.zone && (
                        <Typography variant="body2">אזור: {customer.zone}</Typography>
                      )}
                      {customer.address && (
                        <Typography variant="body2">כתובת: {customer.address}</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        תשלום ותוצאות
                      </Typography>
                      <Typography variant="body2">
                        תשלום דו-חודשי: ₪{customer.bimonthlyPayment}
                      </Typography>
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
                            label={statusLabelMap[customer.calculationResult.outcome] || customer.calculationResult.outcome}
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
                      {customer.email && (
                        <Typography variant="body2">מייל: {customer.email}</Typography>
                      )}
                      {customer.phone && (
                        <Typography variant="body2" dir="ltr">טלפון: {customer.phone}</Typography>
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

export default function CustomersPage() {
  const [customers, setCustomers] = React.useState<CustomerListItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [cityFilter, setCityFilter] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCustomers = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter) params.set('status', statusFilter);
      if (cityFilter) params.set('city', cityFilter);

      const res = await fetch(`/api/customers?${params}`);
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data = await res.json();

      setCustomers(data.customers);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, statusFilter, cityFilter]);

  React.useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
          לקוחות
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          צפייה בלקוחות שהשתמשו במחשבון
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="חיפוש לפי שם, ת.ז, מייל או טלפון..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 280 }}
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
            value={statusFilter}
            label="סטטוס"
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
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
          value={cityFilter}
          onChange={(e) => {
            setCityFilter(e.target.value);
            setPage(0);
          }}
          sx={{ minWidth: 150 }}
        />
      </Paper>

      {/* Table */}
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
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell padding="checkbox"><Skeleton width={24} /></TableCell>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}><Skeleton width="80%" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      אין לקוחות
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <ExpandableRow key={customer._id} customer={customer} />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="שורות בעמוד:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} מתוך ${count}`}
        />
      </Paper>
    </Box>
  );
}
