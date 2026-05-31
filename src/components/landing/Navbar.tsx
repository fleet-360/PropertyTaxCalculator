"use client";
import { useState, useEffect, useRef, type MouseEvent } from "react";
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
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import Link from "next/link";
import Image from "next/image";
import navbarLogo from "@/assets/navbar-logo.png";
import { BLOG_PATHS } from "@/lib/blog/routes";

const NAV_HEIGHT = 84;
export const NAVBAR_MAIN_PADDING_TOP = {
  xs: `${NAV_HEIGHT + 12}px`,
  sm: `${NAV_HEIGHT + 16}px`,
} as const;
const FLOAT_TOP = { xs: 12, sm: 16 };
const FLOAT_INSET = { xs: 1.5, sm: 2, md: 3 };
const SCROLL_DIRECTION_DELTA = 6;
const SCROLL_TOP_THRESHOLD = 32;
const NAVBAR_FONT_FAMILY =
  'var(--font-assistant), "Assistant", sans-serif';

const navItemsLanding = [
  { label: "דף הבית", href: "#hero" },
  { label: "המחשבון", href: "/calculator" },
  { label: "ממליצים", href: "/testimonials" },
  { label: "חשוב לדעת", href: BLOG_PATHS.home },
  { label: "יצירת קשר", href: "/contact" },
];

const navItemsRoutes = [
  { label: "דף הבית", href: "/" },
  { label: "המחשבון", href: "/calculator" },
  { label: "ממליצים", href: "/testimonials" },
  { label: "חשוב לדעת", href: BLOG_PATHS.home },
  { label: "יצירת קשר", href: "/contact" },
];

export type NavbarVariant = "landing" | "routes";

function BrandLogo() {
  return (
    <Box
      component={Link}
      href="/"
      aria-label="מחשבון הארנונה - דף הבית"
      sx={{
        display: "flex",
        alignItems: "center",
        textDecoration: "none",
        cursor: "pointer",
        height: { xs: 38, md: 48 },
      }}
    >
      <Image
        src={navbarLogo}
        alt="מחשבון הארנונה"
        priority
        sizes="(max-width: 768px) 150px, 190px"
        style={{
          width: "auto",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </Box>
  );
}

export default function Navbar({
  variant = "landing",
}: {
  variant?: NavbarVariant;
}) {
  const navItems = variant === "routes" ? navItemsRoutes : navItemsLanding;
  const ctaHref = "/calculator";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTicking = useRef(false);
  const forceCalculatorReload = (event?: MouseEvent<HTMLElement>) => {
    event?.preventDefault();
    window.location.href = "/calculator";
  };

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const onScroll = () => {
      if (scrollTicking.current) return;
      scrollTicking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const prev = lastScrollY.current;

        if (y < SCROLL_TOP_THRESHOLD) {
          setNavHidden(false);
        } else if (y > prev + SCROLL_DIRECTION_DELTA) {
          setNavHidden(true);
        } else if (y < prev - SCROLL_DIRECTION_DELTA) {
          setNavHidden(false);
        }

        lastScrollY.current = y;
        scrollTicking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) setNavHidden(false);
  }, [mobileOpen]);

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          top: FLOAT_TOP,
          left: 0,
          right: 0,
          zIndex: (theme) => theme.zIndex.appBar,
          px: FLOAT_INSET,
          pointerEvents: navHidden ? "none" : "auto",
          transform: navHidden
            ? "translateY(calc(-100% - 24px))"
            : "translateY(0)",
          transition: (theme) =>
            theme.transitions.create(["transform"], {
              duration: theme.transitions.duration.standard,
              easing: theme.transitions.easing.easeInOut,
            }),
        }}
      >
        <AppBar
          component="nav"
          aria-label="ניווט ראשי"
          position="static"
          elevation={0}
          sx={{
            bgcolor: "rgba(255,255,255,0.98)",
            backdropFilter: "blur(12px)",
            height: NAV_HEIGHT,
            justifyContent: "center",
            borderRadius: "20px",
            overflow: "hidden",
            fontFamily: NAVBAR_FONT_FAMILY,
            boxShadow:
              "0px 8px 32px rgba(11,26,71,0.08), 0px 2px 8px rgba(11,26,71,0.04)",
            transition: (theme) =>
              theme.transitions.create(
                ["border-radius", "box-shadow", "transform"],
                {
                  duration: theme.transitions.duration.short,
                  easing: theme.transitions.easing.easeInOut,
                },
              ),
          }}
        >
          <Container maxWidth="xl" sx={{ px: { xs: "20px", md: "32px" } }}>
            <Toolbar disableGutters sx={{ gap: { xs: 2, md: 4 } }}>
              {/* Right side (RTL) — Logo */}
              <Box sx={{ display: { xs: "none", md: "flex" } }}>
                <BrandLogo />
              </Box>

              {/* Center — Nav items (desktop) */}
              <Box
                sx={{
                  display: { xs: "none", md: "flex" },
                  gap: { md: 4, lg: 6 },
                  flexGrow: 1,
                  justifyContent: "center",
                }}
              >
                {navItems.map((item) => (
                  <Typography
                    key={item.label}
                    component={item.href.startsWith("/") ? Link : "a"}
                    href={item.href}
                    onClick={
                      item.href === "/calculator"
                        ? forceCalculatorReload
                        : undefined
                    }
                    sx={(theme) => ({
                      color: theme.palette.brand.navyDeep,
                      fontFamily: NAVBAR_FONT_FAMILY,
                      fontSize: "16px",
                      fontWeight: 500,
                      textDecoration: "none",
                      cursor: "pointer",
                      transition: "color 0.2s",
                      whiteSpace: "nowrap",
                      "&:hover": { color: theme.palette.brand.blue },
                    })}
                  >
                    {item.label}
                  </Typography>
                ))}
              </Box>

              {/* Left side (RTL) — CTA button */}
              <Box
                sx={{
                  display: { xs: "none", md: "flex" },
                  alignItems: "center",
                }}
              >
                <Button
                  component={Link}
                  href={ctaHref}
                  onClick={forceCalculatorReload}
                  variant="contained"
                  endIcon={<ChevronLeftIcon />}
                  sx={(theme) => ({
                    bgcolor: theme.palette.brand.blue,
                    color: "#fff",
                    borderRadius: "999px",
                    px: 2.75,
                    py: 1.1,
                    fontFamily: NAVBAR_FONT_FAMILY,
                    fontSize: "15px",
                    fontWeight: 700,
                    boxShadow: "0px 8px 20px rgba(26,86,224,0.25)",
                    "& .MuiButton-endIcon": { ml: 0.5, mr: -0.5 },
                    "&:hover": {
                      bgcolor: theme.palette.brand.blueDark,
                      boxShadow: "0px 8px 24px rgba(26,86,224,0.35)",
                    },
                  })}
                >
                  חישוב הארנונה
                </Button>
              </Box>

              {/* Mobile: logo + menu button */}
              <Box
                sx={{
                  display: { xs: "flex", md: "none" },
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <BrandLogo />
                <IconButton
                  aria-label="פתח תפריט ניווט"
                  sx={(theme) => ({ color: theme.palette.brand.navyDeep })}
                  onClick={() => setMobileOpen(true)}
                >
                  <MenuIcon />
                </IconButton>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
      </Box>

      {/* Mobile drawer */}
      <Drawer
        open={mobileOpen}
        anchor="top"
        onClose={() => setMobileOpen(false)}
        aria-label="תפריט ניווט"
        PaperProps={{ sx: { fontFamily: NAVBAR_FONT_FAMILY } }}
      >
        <Box sx={{ width: 280, pt: 2, m: "auto" }}>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <BrandLogo />
          </Box>
          <List>
            {navItems.map((item) => (
              <ListItem
                key={item.label}
                disablePadding
                sx={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  textAlign: "center",
                }}
              >
                <ListItemButton
                  component={item.href.startsWith("/") ? Link : "a"}
                  href={item.href}
                  onClick={(event) => {
                    setMobileOpen(false);
                    if (item.href === "/calculator") {
                      forceCalculatorReload(event);
                    }
                  }}
                >
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ sx: { fontFamily: NAVBAR_FONT_FAMILY } }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
            <ListItem disablePadding sx={{ px: 2, mt: 2 }}>
              <Button
                component={Link}
                href={ctaHref}
                variant="contained"
                fullWidth
                onClick={(event) => {
                  setMobileOpen(false);
                  forceCalculatorReload(event);
                }}
                sx={(theme) => ({
                  bgcolor: theme.palette.brand.blue,
                  borderRadius: "999px",
                  py: 1.2,
                  fontFamily: NAVBAR_FONT_FAMILY,
                  fontWeight: 700,
                  "&:hover": { bgcolor: theme.palette.brand.blueDark },
                })}
              >
                חישוב הארנונה
              </Button>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
}
