"use client";
import { useState, useEffect, useRef } from "react";
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
import logo from "@/assets/icon-with-text-no-background.png";

const NAV_HEIGHT = 84;
/** Padding-top for `main` under the fixed floating navbar (px). Matches former spacer in this file. */
export const NAVBAR_MAIN_PADDING_TOP = { xs: `${NAV_HEIGHT + 12}px`, sm: `${NAV_HEIGHT + 16}px` } as const;
const FLOAT_TOP = { xs: 12, sm: 16 };
const FLOAT_INSET = { xs: 1.5, sm: 2, md: 3 };
/** Ignore tiny scroll jitter (px). */
const SCROLL_DIRECTION_DELTA = 6;
/** Always show the bar when near the top of the page. */
const SCROLL_TOP_THRESHOLD = 32;

const navItemsLanding = [
  { label: "בית", href: "#hero" },
  { label: "מחשבון", href: "#calculator-section" },
  { label: "המלצות", href: "#testimonials" },
  { label: "מאמרים", href: "/blog" },
];

const navItemsRoutes = [
  { label: "בית", href: "/" },
  { label: "מחשבון", href: "/#calculator-section" },
  { label: "המלצות", href: "/#testimonials" },
  { label: "מאמרים", href: "/blog" },
];

export type NavbarVariant = "landing" | "routes";

export default function Navbar({ variant = "landing" }: { variant?: NavbarVariant }) {
  const navItems = variant === "routes" ? navItemsRoutes : navItemsLanding;
  const ctaHref =  "/#calculator-section";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTicking = useRef(false);

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

  const logoComponent = () => (
    <Box
      aria-hidden="true"
      sx={{
        width: 100,
        height: 100,
        backgroundImage: `url(${logo.src})`,
        backgroundSize: "contain",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    />
  );
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
            borderRadius: 3,
            overflow: "hidden",
            boxShadow:
              "0px 8px 32px rgba(26,51,128,0.12), 0px 2px 8px rgba(26,51,128,0.06)",
            transition: (theme) =>
              theme.transitions.create(
                ["border-radius", "box-shadow", "transform"],
                {
                  duration: theme.transitions.duration.short,
                  easing: theme.transitions.easing.easeInOut,
                },
              ),
            animation: "navbarEnter 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
            "@keyframes navbarEnter": {
              "0%": {
                opacity: 0,
                transform: "scaleX(0.55) scaleY(0.9)",
                transformOrigin: "50% 0%",
              },
              "100%": {
                opacity: 1,
                transform: "scaleX(1) scaleY(1)",
                transformOrigin: "50% 0%",
              },
            },
          }}
        >
          <Container maxWidth="xl" sx={{ px: "44px" }}>
            <Toolbar disableGutters sx={{ gap: "43px" }}>
              {/* Right side — Logo */}
              <Box
                component={Link}
                href="/"
                sx={{
                  display: {xs:"none","md":"flex"},
                  alignItems: "center",
                  gap: 1.5,
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                {/* TODO: Replace with actual logo image */}
                {logoComponent()}
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
                sx={{
                  display: { xs: "none", md: "flex" },
                  alignItems: "center",
                  ml: "auto",
                }}
              >
                <Button
                  component={variant === "routes" ? Link : "a"}
                  href={ctaHref}
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
                aria-label="פתח תפריט ניווט"
                sx={{ display: { md: "none" }, color: "#4a4a6a",m:"auto" }}
                onClick={() => setMobileOpen(true)}
              >
                <MenuIcon />
              </IconButton>
            </Toolbar>
          </Container>
        </AppBar>
      </Box>

      {/* Spacer: account for floating offset + bar height */}
      {/* <Box
        sx={{
          height: { xs: NAV_HEIGHT + 12, sm: NAV_HEIGHT + 16 },
          transition: (theme) =>
            theme.transitions.create("height", {
              duration: theme.transitions.duration.shorter,
              easing: theme.transitions.easing.easeInOut,
            }),
        }}
      /> */}

      {/* Mobile drawer */}
      <Drawer
        open={mobileOpen}
        anchor="top"
        onClose={() => setMobileOpen(false)}
        aria-label="תפריט ניווט"
      >
        <Box sx={{ width: 280, pt: 2, m: "auto" }}>
          {/* Logo in drawer */}
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, mb: 2 }}
          >
           {logoComponent()}
            <Typography sx={{ fontWeight: 700, fontSize: "18px" }}>
              ארנונה חכמה
            </Typography>
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
                  onClick={() => setMobileOpen(false)}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
            <ListItem disablePadding sx={{ px: 2, mt: 2 }}>
              <Button
                component={variant === "routes" ? Link : "a"}
                href={ctaHref}
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
