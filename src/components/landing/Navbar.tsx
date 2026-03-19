'use client';
import { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Container, Box, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CalculateIcon from '@mui/icons-material/Calculate';
import Link from 'next/link';

const navItems = [
  { label: 'ראשי', href: '#hero' },
  { label: 'איך זה עובד', href: '#calculator-cta' },
  { label: 'המלצות', href: '#testimonials' },
  { label: 'מאמרים', href: '/blog' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <AppBar
        position="fixed"
        elevation={scrolled ? 2 : 0}
        sx={{
          bgcolor: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(10px)' : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            <Typography
              variant="h6"
              component={Link}
              href="/"
              sx={{
                textDecoration: 'none',
                color: scrolled ? 'primary.main' : '#fff',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <CalculateIcon />
              מחשבון ארנונה
            </Typography>

            {/* Desktop nav */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center' }}>
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  component={item.href.startsWith('/') ? Link : 'a'}
                  href={item.href}
                  sx={{ color: scrolled ? 'text.primary' : '#fff' }}
                >
                  {item.label}
                </Button>
              ))}
              <Button
                component={Link}
                href="/calculator"
                variant="contained"
                color="primary"
                sx={{ mr: 1 }}
              >
                למחשבון
              </Button>
            </Box>

            {/* Mobile menu button */}
            <IconButton
              sx={{ display: { md: 'none' }, color: scrolled ? 'text.primary' : '#fff' }}
              onClick={() => setMobileOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      >
        <Box sx={{ width: 250, pt: 2 }}>
          <List>
            {navItems.map((item) => (
              <ListItem key={item.label} disablePadding>
                <ListItemButton
                  component={item.href.startsWith('/') ? Link : 'a'}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
            <ListItem disablePadding>
              <ListItemButton component={Link} href="/calculator" onClick={() => setMobileOpen(false)}>
                <ListItemText primary="למחשבון" sx={{ color: 'primary.main', fontWeight: 700 }} />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
}
