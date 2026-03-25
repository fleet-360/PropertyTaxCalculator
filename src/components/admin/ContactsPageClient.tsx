'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
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
import Snackbar from '@mui/material/Snackbar';
import Tooltip from '@mui/material/Tooltip';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import Alert from '@mui/material/Alert';
import type { IContactRequestData } from '@/lib/types/contact-request';

const statusColorMap: Record<string, 'error' | 'warning' | 'success'> = {
  new: 'error',
  contacted: 'warning',
  closed: 'success',
};

const statusLabelMap: Record<string, string> = {
  new: 'חדש',
  contacted: 'נוצר קשר',
  closed: 'סגור',
};

const sourceLabelMap: Record<string, string> = {
  calculator_business: 'מחשבון עסקי',
  landing_page: 'דף נחיתה',
  appeal: 'השגה',
};

function buildContactsHref(
  pathname: string,
  state: { page: number; limit: number; status: string }
) {
  const q = new URLSearchParams();
  q.set('page', String(state.page));
  q.set('limit', String(state.limit));
  if (state.status) q.set('status', state.status);
  return `${pathname}?${q}`;
}

export interface ContactsPageClientProps {
  contacts: IContactRequestData[];
  total: number;
  page: number;
  limit: number;
  status: string;
}

export default function ContactsPageClient({
  contacts,
  total,
  page,
  limit,
  status,
}: ContactsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const urlState = React.useMemo(() => ({ page, limit, status }), [page, limit, status]);

  const navigate = (patch: Partial<typeof urlState>) => {
    router.push(buildContactsHref(pathname, { ...urlState, ...patch }));
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/contact/${id}`, {
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
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            פניות
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            ניהול פניות יצירת קשר
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>סינון לפי סטטוס</InputLabel>
          <Select
            value={status}
            label="סינון לפי סטטוס"
            onChange={(e) => navigate({ status: e.target.value, page: 0 })}
          >
            <MenuItem value="">הכל</MenuItem>
            <MenuItem value="new">חדש</MenuItem>
            <MenuItem value="contacted">נוצר קשר</MenuItem>
            <MenuItem value="closed">סגור</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>שם</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>טלפון</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>מייל</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>הודעה</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>מקור</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>סטטוס</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>תאריך</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <ContactMailIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      אין פניות
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                contacts.map((contact) => (
                  <TableRow key={contact._id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {contact.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" dir="ltr">
                        {contact.phone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {contact.email || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      {contact.message ? (
                        <Tooltip title={contact.message} arrow>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 200,
                              cursor: 'pointer',
                            }}
                          >
                            {contact.message}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="text.disabled">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={sourceLabelMap[contact.source] || contact.source}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={contact.status}
                        size="small"
                        onChange={(e) => handleStatusChange(contact._id, e.target.value)}
                        sx={{ minWidth: 120 }}
                        aria-label={`סטטוס פנייה ${contact.name}`}
                        renderValue={(value) => (
                          <Chip
                            label={statusLabelMap[value]}
                            color={statusColorMap[value]}
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
                      <Typography variant="body2" color="text.secondary">
                        {new Date(contact.createdAt).toLocaleDateString('he-IL', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Typography>
                    </TableCell>
                  </TableRow>
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
          rowsPerPageOptions={[5, 10, 25]}
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
