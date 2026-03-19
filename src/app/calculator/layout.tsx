'use client';
import { ReactNode } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Link from 'next/link';
import CalculateIcon from '@mui/icons-material/Calculate';

export default function CalculatorLayout({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      <AppBar position="static" color="default" elevation={1} sx={{ bgcolor: '#fff' }}>
        <Toolbar>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexGrow: 1 }}>
            <CalculateIcon color="primary" />
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700 }}>
              מחשבון ארנונה
            </Typography>
          </Link>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Button variant="outlined" size="small">
              חזרה לדף הבית
            </Button>
          </Link>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ py: 4 }}>
        {children}
      </Box>
    </Box>
  );
}
