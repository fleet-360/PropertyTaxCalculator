"use client";
import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Link from "next/link";

const navItems = [
  { label: "בית", href: "#hero" },
  { label: "מחשבון", href: "#calculator-section" },
  { label: "המלצות", href: "#testimonials" },
  { label: "מאמרים", href: "/blog" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: "rgba(255,255,255,0.98)",
          boxShadow: "0px 2px 16px rgba(26,51,128,0.08)",
          height: 84,
          justifyContent: "center",
        }}
      >
        <Container maxWidth="xl" sx={{px:"44px"}}>
          <Toolbar disableGutters sx={{gap:"43px"}}>
            {/* Right side — Logo */}
            <Box
              component={Link}
              href="/"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                textDecoration: "none",
              }}
            >

              {/* TODO: Replace with actual logo image */}
              <Box
                sx={{
                  width: 75,
                  height: 68,
                  bgcolor: "#e8eef6",
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "28px",
                }}
              >
                🏠
              </Box>
            </Box>
            {/* Center — Nav items (desktop) */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                gap: 5,
              }}
            >
              {navItems.map((item) => (
                <Typography
                  key={item.label}
                  component={item.href.startsWith("/") ? Link : "a"}
                  href={item.href}
                  sx={{
                    color: "#4a4a6a",
                    fontSize: "16px",
                    fontWeight: 500,
                    textDecoration: "none",
                    cursor: "pointer",
                    transition: "color 0.2s",
                    "&:hover": { color: "#1a4fdb" },
                  }}
                >
                  {item.label}
                </Typography>
              ))}
            </Box>
            {/* Left side — CTA button (in RTL this appears on visual left) */}
            <Box
              sx={{ display: { xs: "none", md: "flex" }, alignItems: "center",ml:"auto" }}
            >
              <Button
                component={Link}
                href="/calculator"
                variant="contained"
                sx={{
                  bgcolor: "#1a4fdb",
                  color: "#fff",
                  borderRadius: "21px",
                  px: 3.5,
                  py: 1.2,
                  fontSize: "15px",
                  fontWeight: 700,
                  minWidth: 130,
                  height: 42,
                  "&:hover": { bgcolor: "#1640b5" },
                }}
              >
                חשב עכשיו
              </Button>
            </Box>

            {/* Mobile menu button */}
            <IconButton
              sx={{ display: { md: "none" }, color: "#4a4a6a" }}
              onClick={() => setMobileOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Spacer for fixed navbar */}
      <Box sx={{ height: 84 }} />

      {/* Mobile drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      >
        <Box sx={{ width: 280, pt: 2 }}>
          {/* Logo in drawer */}
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, mb: 2 }}
          >
            <Box
              sx={{
                width: 50,
                height: 45,
                bgcolor: "#e8eef6",
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              🏠
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: "18px" }}>
              ארנונה חכמה
            </Typography>
          </Box>
          <List>
            {navItems.map((item) => (
              <ListItem key={item.label} disablePadding>
                <ListItemButton
                  component={item.href.startsWith("/") ? Link : "a"}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                >
                  <ListItemText
                    primary={item.label}
                    sx={{ textAlign: "right" }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
            <ListItem disablePadding sx={{ px: 2, mt: 2 }}>
              <Button
                component={Link}
                href="/calculator"
                variant="contained"
                fullWidth
                onClick={() => setMobileOpen(false)}
                sx={{
                  bgcolor: "#1a4fdb",
                  borderRadius: "21px",
                  py: 1.2,
                  fontWeight: 700,
                  "&:hover": { bgcolor: "#1640b5" },
                }}
              >
                חשב עכשיו
              </Button>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
}
