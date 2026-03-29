"use client";
import * as React from "react";
import Link from "next/link";
import BlockEditor from "@/components/editor/BlockEditor";
import { blogPostPath } from "@/lib/blog/routes";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Chip from "@mui/material/Chip";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import Tooltip from "@mui/material/Tooltip";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useTheme, type Theme } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import SaveIcon from "@mui/icons-material/Save";
import PublishIcon from "@mui/icons-material/Publish";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import ImageIcon from "@mui/icons-material/Image";
import type { BlockData } from "@/components/editor/types";
import type {
  SeoData,
  PostData,
  PostEditorProps,
  SeoCheck,
} from "@/lib/types/post";

// ── Slug generation helper ─────────────────────────────────────────────

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 75);
}

// ── Character counter helper ───────────────────────────────────────────

function getCharCountColor(
  length: number,
  warningMin: number,
  warningMax: number,
  theme: Theme,
): string {
  if (length === 0) return theme.palette.text.disabled;
  if (length >= warningMin && length <= warningMax)
    return theme.palette.success.main;
  if (length < warningMin) return theme.palette.warning.main;
  return theme.palette.error.main;
}

/** Label + info icon with Hebrew SEO/context tooltip (admin sidebar). */
function FieldInfoTooltip({
  title,
  ariaLabel,
}: {
  title: string;
  ariaLabel: string;
}) {
  return (
    <Tooltip title={title} arrow placement="top">
      <IconButton
        component="span"
        size="small"
        aria-label={ariaLabel}
        tabIndex={0}
        sx={{
          p: 0.25,
          marginInlineStart: 0.5,
          verticalAlign: "middle",
          color: "text.secondary",
        }}
      >
        <InfoOutlinedIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Tooltip>
  );
}

function LabeledWithInfo({
  label,
  tooltip,
  ariaLabel,
}: {
  label: string;
  tooltip: string;
  ariaLabel: string;
}) {
  return (
    <Box
      component="span"
      sx={{ display: "inline-flex", alignItems: "center", gap: 0.25 }}
    >
      {label}
      <FieldInfoTooltip title={tooltip} ariaLabel={ariaLabel} />
    </Box>
  );
}

// ── SEO Score calculator ───────────────────────────────────────────────

function calculateSeoChecks(post: PostData): SeoCheck[] {
  const checks: SeoCheck[] = [];
  const title = post.seo.metaTitle || post.title || "";
  const description = post.seo.metaDescription || post.excerpt || "";

  // Title length
  if (!title) {
    checks.push({
      type: "error",
      message: "חסרה כותרת (או Meta Title) לסניפט בחיפוש",
    });
  } else if (title.length < 30) {
    checks.push({
      type: "warning",
      message: `הכותרת קצרה מדי ל-SEO (${title.length}/60 תווים)`,
    });
  } else if (title.length > 60) {
    checks.push({
      type: "warning",
      message: `הכותרת ארוכה מדי ועשויה להיחתך (${title.length}/60 תווים)`,
    });
  } else {
    checks.push({
      type: "success",
      message: `אורך הכותרת מתאים (${title.length}/60 תווים)`,
    });
  }

  // Description length
  if (!description) {
    checks.push({
      type: "error",
      message: "חסר תיאור מטא — Google יבחר טקסט בעצמו",
    });
  } else if (description.length < 120) {
    checks.push({
      type: "warning",
      message: `התיאור קצר מדי (${description.length}/160 תווים)`,
    });
  } else if (description.length > 160) {
    checks.push({
      type: "warning",
      message: `התיאור ארוך מדי ועשוי להיחתך (${description.length}/160 תווים)`,
    });
  } else {
    checks.push({
      type: "success",
      message: `אורך התיאור מתאים (${description.length}/160 תווים)`,
    });
  }

  // Featured image
  if (post.featuredImage) {
    checks.push({
      type: "success",
      message: "הוגדרה תמונה ראשית (טוב לשיתוף ולריכוזים)",
    });
  } else {
    checks.push({ type: "warning", message: "לא הוגדרה תמונה ראשית" });
  }

  // Excerpt
  if (post.excerpt) {
    checks.push({
      type: "success",
      message: "קיים תקציר (עוזר לתיאור מטא ולרשימות)",
    });
  } else {
    checks.push({ type: "warning", message: "אין תקציר" });
  }

  // Slug
  if (!post.slug) {
    checks.push({ type: "error", message: "חסר Slug בכתובת הדף" });
  } else if (/[^a-z0-9-]/.test(post.slug)) {
    checks.push({ type: "warning", message: "ב-Slug יש תווים שאינם מומלצים" });
  } else if (/--/.test(post.slug)) {
    checks.push({ type: "warning", message: "ב-Slug יש מקפים כפולים" });
  } else {
    checks.push({ type: "success", message: "מבנה ה-Slug תקין" });
  }

  // H1 in content
  const blocks = post.content?.blocks || [];
  const headingBlocks = blocks.filter((b) => b.type === "heading");
  const h1Blocks = headingBlocks.filter(
    (b) => (b.data as Record<string, unknown>)?.level === "h1",
  );
  if (h1Blocks.length === 1) {
    checks.push({
      type: "success",
      message: "יש כותרת H1 אחת בתוכן (מומלץ ל-SEO)",
    });
  } else if (h1Blocks.length === 0) {
    checks.push({ type: "warning", message: "לא נמצאה כותרת H1 בתוכן" });
  } else {
    checks.push({
      type: "warning",
      message: `נמצאו ${h1Blocks.length} כותרות H1 (מומלץ אחת)`,
    });
  }

  // Heading hierarchy
  const headingLevels = headingBlocks
    .map((b) => {
      const level = (b.data as Record<string, unknown>)?.level as string;
      return level ? parseInt(level.replace("h", ""), 10) : 0;
    })
    .filter((l) => l > 0);

  let hierarchyValid = true;
  for (let i = 1; i < headingLevels.length; i++) {
    if (headingLevels[i] > headingLevels[i - 1] + 1) {
      hierarchyValid = false;
      break;
    }
  }
  if (headingLevels.length > 1) {
    if (hierarchyValid) {
      checks.push({ type: "success", message: "היררכיית הכותרות עקבית" });
    } else {
      checks.push({ type: "warning", message: "בהיררכיית הכותרות דולגו רמות" });
    }
  }

  // Image alt text
  const imageBlocks = blocks.filter((b) => b.type === "image");
  if (imageBlocks.length > 0) {
    const missingAlt = imageBlocks.filter(
      (b) => !(b.data as Record<string, unknown>)?.alt,
    );
    if (missingAlt.length > 0) {
      checks.push({
        type: "warning",
        message: `ל-${missingAlt.length} תמונות חסר טקסט alt (חשוב לנגישות ול-SEO)`,
      });
    } else {
      checks.push({ type: "success", message: "לכל התמונות יש טקסט alt" });
    }
  }

  return checks;
}

function calculateSeoScore(checks: SeoCheck[]): number {
  if (checks.length === 0) return 0;
  const weights: Record<string, number> = {
    success: 1,
    warning: 0.5,
    error: 0,
  };
  const total = checks.reduce((sum, c) => sum + (weights[c.type] || 0), 0);
  return Math.round((total / checks.length) * 100);
}

// ── Default data ───────────────────────────────────────────────────────

const defaultPostData: PostData = {
  title: "",
  slug: "",
  excerpt: "",
  content: { blocks: [], rawHtml: "" },
  featuredImage: "",
  author: "Admin",
  category: "Uncategorized",
  tags: [],
  status: "draft",
  publishedAt: "",
  seo: {
    metaTitle: "",
    metaDescription: "",
    metaKeywords: [],
    canonicalUrl: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    twitterCard: "summary_large_image",
    noIndex: false,
    noFollow: false,
  },
};

// ── Component ──────────────────────────────────────────────────────────

export default function PostEditor({
  initialData,
  onSave,
  isNew,
}: PostEditorProps) {
  // Merge initial data with defaults
  const [post, setPost] = React.useState<PostData>(() => {
    const merged = { ...defaultPostData };
    if (initialData) {
      Object.keys(initialData).forEach((key) => {
        const k = key as keyof PostData;
        const val = initialData[k];
        if (val !== undefined && val !== null) {
          if (k === "seo" && typeof val === "object") {
            merged.seo = { ...merged.seo, ...(val as Partial<SeoData>) };
          } else if (k === "content" && typeof val === "object") {
            merged.content = {
              ...merged.content,
              ...(val as Partial<PostData["content"]>),
            };
          } else {
            (merged as Record<string, unknown>)[k] = val;
          }
        }
      });
      // Convert publishedAt date to string
      if (initialData.publishedAt) {
        const d = new Date(initialData.publishedAt);
        if (!isNaN(d.getTime())) {
          merged.publishedAt = d.toISOString().slice(0, 16);
        }
      }
    }
    return merged;
  });

  // Tracking changes for auto-save
  const [hasChanges, setHasChanges] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<
    "idle" | "saving" | "saved" | "unsaved"
  >("idle");
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);

  // Validation errors
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Tag / keyword inputs
  const [tagInput, setTagInput] = React.useState("");
  const [keywordInput, setKeywordInput] = React.useState("");

  // Snackbar
  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  // SEO checks
  const seoChecks = React.useMemo(() => calculateSeoChecks(post), [post]);
  const seoScore = React.useMemo(
    () => calculateSeoScore(seoChecks),
    [seoChecks],
  );

  const theme = useTheme();

  // ── Field updaters ───────────────────────────────────────────────────

  const updateField = <K extends keyof PostData>(
    field: K,
    value: PostData[K],
  ) => {
    setPost((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setSaveStatus("unsaved");
    // Clear error for this field on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const updateSeo = <K extends keyof SeoData>(field: K, value: SeoData[K]) => {
    setPost((prev) => ({
      ...prev,
      seo: { ...prev.seo, [field]: value },
    }));
    setHasChanges(true);
    setSaveStatus("unsaved");
  };

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    updateField("title", value);
    if (!slugManuallyEdited) {
      setPost((prev) => ({ ...prev, title: value, slug: generateSlug(value) }));
      // Also clear slug error when auto-generating
      if (errors.slug && generateSlug(value)) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.slug;
          return next;
        });
      }
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    updateField("slug", value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  };

  // Tags
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!post.tags.includes(newTag)) {
        updateField("tags", [...post.tags, newTag]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    updateField(
      "tags",
      post.tags.filter((t) => t !== tag),
    );
  };

  // SEO Keywords
  const handleAddKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && keywordInput.trim()) {
      e.preventDefault();
      const newKw = keywordInput.trim();
      if (!post.seo.metaKeywords.includes(newKw)) {
        updateSeo("metaKeywords", [...post.seo.metaKeywords, newKw]);
      }
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    updateSeo(
      "metaKeywords",
      post.seo.metaKeywords.filter((k) => k !== kw),
    );
  };

  // ── Save handlers ────────────────────────────────────────────────────

  const validate = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    if (!post.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!post.slug.trim()) {
      newErrors.slug = "Slug is required";
    }
    if (post.content.blocks.length === 0) {
      newErrors.content = "Post must have at least one content block";
    }
    return newErrors;
  };

  const handleSave = async (
    overrideStatus?: "draft" | "published" | "archived",
  ) => {
    // Run validation
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const errorMessages = Object.values(validationErrors).join(", ");
      setSnackbar({
        open: true,
        message: `Please fix the following: ${errorMessages}`,
        severity: "error",
      });
      return;
    }
    setErrors({});

    try {
      setSaveStatus("saving");
      const dataToSave = { ...post };
      if (overrideStatus) {
        dataToSave.status = overrideStatus;
      }
      // If publishing and no publishedAt, set now
      if (dataToSave.status === "published" && !dataToSave.publishedAt) {
        dataToSave.publishedAt = new Date().toISOString();
      }
      await onSave(dataToSave);
      setHasChanges(false);
      setSaveStatus("saved");
      setSnackbar({
        open: true,
        message: "Post saved successfully",
        severity: "success",
      });
    } catch (err) {
      setSaveStatus("unsaved");
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : "Failed to save post",
        severity: "error",
      });
    }
  };

  // ── Auto-save every 30 seconds if draft ──────────────────────────────

  React.useEffect(() => {
    if (post.status !== "draft" || !hasChanges) return;
    const timer = setInterval(() => {
      if (hasChanges && post.status === "draft") {
        handleSave();
      }
    }, 30000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasChanges, post.status]);

  // ── Render helpers ───────────────────────────────────────────────────

  const seoCheckIcon = (type: SeoCheck["type"]) => {
    switch (type) {
      case "success":
        return (
          <CheckCircleIcon
            sx={{ color: theme.palette.success.main, fontSize: 18 }}
          />
        );
      case "warning":
        return (
          <WarningIcon
            sx={{ color: theme.palette.warning.main, fontSize: 18 }}
          />
        );
      case "error":
        return (
          <ErrorIcon sx={{ color: theme.palette.error.main, fontSize: 18 }} />
        );
    }
  };

  const seoScoreColor =
    seoScore >= 80
      ? theme.palette.success.main
      : seoScore >= 50
        ? theme.palette.warning.main
        : theme.palette.error.main;

  const googleSnippetTitle = post.seo.metaTitle || post.title || "כותרת הדף";
  const siteBase = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const googleSnippetUrl = `${siteBase}${blogPostPath(post.slug || "post-slug")}`;
  const googleSnippetDescription =
    post.seo.metaDescription ||
    post.excerpt ||
    "אין תיאור. הוסיפו Meta Description כדי לשפר את הנראות בתוצאות החיפוש.";

  return (
    <Box>
      {/* Top Bar */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
          position: "sticky",
          top: 64,
          zIndex: 10,
        }}
        elevation={1}
      >
        <IconButton component={Link} href="/admin/posts" size="small">
          <ArrowBackIcon />
        </IconButton>

        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {post.title || (isNew ? "כתבה חדשה" : "עריכת כתבה")}
        </Typography>

        {/* Save status indicator */}
        <Typography
          variant="caption"
          sx={{
            color:
              saveStatus === "saving"
                ? "primary.main"
                : saveStatus === "saved"
                  ? "#2e7d32"
                  : saveStatus === "unsaved"
                    ? "#ed6c02"
                    : "text.secondary",
            fontWeight: 500,
          }}
        >
          {saveStatus === "saving" && "שומר כתבה..."}
          {saveStatus === "saved" && "שמור בהצלחה"}
          {saveStatus === "unsaved" && "שינויים לא נשמרו"}
        </Typography>

        {post.slug && !isNew && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<OpenInNewIcon />}
            href={blogPostPath(post.slug)}
            target="_blank"
            sx={{ borderColor: "#e0e0e0", color: "#555" }}
          >
            תצוגה מקדימה
          </Button>
        )}

        <Button
          size="small"
          variant="outlined"
          startIcon={<SaveIcon />}
          onClick={() => handleSave("draft")}
        >
          שמור טיוטה
        </Button>

        <Button
          size="small"
          variant="contained"
          startIcon={<PublishIcon />}
          onClick={() => handleSave("published")}
        >
          פרסם כתבה
        </Button>
      </Paper>

      {/* Main Content Area */}
      <Grid container spacing={3}>
        {/* Left Column - Content */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {/* Title */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <TextField
              label="כותרת הכתבה"
              value={post.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              fullWidth
              required
              variant="outlined"
              placeholder="הזן כותרת ..."
              error={!!errors.title}
              helperText={errors.title}
              slotProps={{
                input: {
                  sx: { fontSize: "1.4rem", fontWeight: 600 },
                },
                inputLabel: {
                  sx: { fontSize: "1.4rem", fontWeight: 600 },
                },
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Slug"
              value={post.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              fullWidth
              required
              size="small"
              variant="outlined"
              error={!!errors.slug}
              helperText={errors.slug || `URL: ${googleSnippetUrl}`}
              slotProps={{
                input: {
                  sx: { fontFamily: "monospace", fontSize: "0.9rem" },
                },
              }}
            />
          </Paper>

          {/* Block Editor */}
          <Paper
            sx={{
              p: 3,
              mb: 3,
              ...(errors.content ? { border: "1px solid #d32f2f" } : {}),
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                mb: 2,
                fontWeight: 600,
                color: errors.content ? "#d32f2f" : "text.secondary",
              }}
            >
              Content Editor
            </Typography>
            {errors.content && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.content}
              </Alert>
            )}
            <BlockEditor
              blocks={post.content.blocks}
              onChange={(blocks) => {
                setPost((prev) => ({
                  ...prev,
                  content: { ...prev.content, blocks },
                }));
                setHasChanges(true);
                setSaveStatus("unsaved");
                if (errors.content && blocks.length > 0) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.content;
                    return next;
                  });
                }
              }}
            />
          </Paper>
        </Grid>

        {/* Right Column - Sidebar Panels */}
        <Grid size={{ xs: 12, lg: 4 }}>
          {/* Panel 1: Publish */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600 }}>פרסום</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormControl fullWidth size="small" sx={{ mb: 2 }} >
                <InputLabel
                  id="post-editor-status-label"
                >
                  <LabeledWithInfo
                    label="סטטוס"
                    tooltip="קובע אם הכתבה נגישה בציבור. טיוטה לא מוצגת כרגיל באתר; פורסם — מוצג לפי ההגדרות; בארכיון — בדרך כלל מוסתר מרשימות."
                    ariaLabel="הסבר על שדה סטטוס פרסום"
                  />
                </InputLabel>
                <Select
                  labelId="post-editor-status-label"
                  label="סטטוס"
                  value={post.status}
                  onChange={(e) =>
                    updateField("status", e.target.value as PostData["status"])
                  }
                >
                  <MenuItem value="draft">טיוטה</MenuItem>
                  <MenuItem value="published">פורסם</MenuItem>
                  <MenuItem value="archived">בארכיון</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label={
                  <LabeledWithInfo
                    label="תאריך פרסום"
                    tooltip="תאריך ושעת פרסום לרישום במערכת ובמטא-דאטה; משפיע על מיון לפי זמן ועל תצוגת 'מתי פורסם'."
                    ariaLabel="הסבר על תאריך פרסום"
                  />
                }
                type="datetime-local"
                fullWidth
                size="small"
                value={post.publishedAt}
                onChange={(e) => updateField("publishedAt", e.target.value)}
                slotProps={{
                  inputLabel: { shrink: true },
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                label={
                  <LabeledWithInfo
                    label="מחבר"
                    tooltip="שם הכותב; עשוי להופיע בפריט הכתבה או במטא-דאטה, ולתרום לזיהוי מקור התוכן."
                    ariaLabel="הסבר על שדה מחבר"
                  />
                }
                fullWidth
                size="small"
                value={post.author}
                onChange={(e) => updateField("author", e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                fullWidth
                variant="contained"
                onClick={() => handleSave()}
              >
                {isNew ? "צור כתבה" : "עדכן כתבה"}
              </Button>
            </AccordionDetails>
          </Accordion>

          {/* Panel 2: Category & Tags */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600 }}>קטגוריה ותגיות</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField
                label={
                  <LabeledWithInfo
                    label="קטגוריה"
                    tooltip="מסווגת את הכתבה לנושא; עוזרת למבנה האתר, לניווט פנימי ולקישור תכנים קשורים."
                    ariaLabel="הסבר על קטגוריה"
                  />
                }
                fullWidth
                size="small"
                value={post.category}
                onChange={(e) => updateField("category", e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label={
                  <LabeledWithInfo
                    label="הוספת תגית"
                    tooltip="תגיות מקשרות נושאים ביניהן; שימושיות לארגון ובחיפוש פנימי; השפעה ישירה על דירוג בגוגל מוגבלת."
                    ariaLabel="הסבר על תגיות"
                  />
                }
                fullWidth
                size="small"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="הקלד ולחץ Enter"
                sx={{ mb: 1 }}
              />
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {post.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    onDelete={() => handleRemoveTag(tag)}
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Panel 3: Featured Image */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600 }}>תמונה ראשית</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField
                label={
                  <LabeledWithInfo
                    label="כתובת תמונה"
                    tooltip="כתובת התמונה הראשית של הכתבה; משמשת ברשימות, בריכוזי Open Graph ולשיתוף ברשתות."
                    ariaLabel="הסבר על כתובת תמונה ראשית"
                  />
                }
                fullWidth
                size="small"
                value={post.featuredImage}
                onChange={(e) => updateField("featuredImage", e.target.value)}
                placeholder="https://example.com/image.jpg"
                sx={{ mb: 2 }}
              />
              {post.featuredImage ? (
                <Box
                  sx={(t) => ({
                    position: "relative",
                    borderRadius: 1,
                    overflow: "hidden",
                    border: `1px solid ${t.palette.divider}`,
                    mb: 1,
                  })}
                >
                  <Box
                    component="img"
                    src={post.featuredImage}
                    alt="תמונה ראשית"
                    sx={{
                      width: "100%",
                      height: 160,
                      objectFit: "cover",
                      display: "block",
                    }}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </Box>
              ) : (
                <Box
                  sx={(t) => ({
                    height: 100,
                    borderRadius: 1,
                    border: `2px dashed ${t.palette.divider}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: t.palette.action.hover,
                  })}
                >
                  <ImageIcon sx={{ color: "text.disabled", fontSize: 40 }} />
                </Box>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Panel 4: Excerpt */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600 }}>תקציר</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField
                label={
                  <LabeledWithInfo
                    label="תקציר"
                    tooltip="תמצית קצרה של הכתבה; משמשת לרשימות ולרוב כבסיס ל-Meta Description אם לא הוגדר תיאור נפרד."
                    ariaLabel="הסבר על תקציר"
                  />
                }
                fullWidth
                size="small"
                multiline
                rows={3}
                value={post.excerpt}
                onChange={(e) => updateField("excerpt", e.target.value)}
                placeholder="תקציר קצר של הכתבה..."
              />
              <Typography
                variant="caption"
                sx={{
                  mt: 0.5,
                  display: "block",
                  textAlign: "right",
                  color: "text.secondary",
                }}
              >
                {post.excerpt.length} תווים
              </Typography>
            </AccordionDetails>
          </Accordion>

          {/* Panel 5: SEO Settings */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600 }}>הגדרות SEO</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {/* Meta Title */}
              <TextField
                label={
                  <LabeledWithInfo
                    label="Meta Title"
                    tooltip="כותרת תגית title בדף והקישור הכחול בתוצאות חיפוש; אחד השדות החשובים ביותר לשיעור הקליקים (CTR)."
                    ariaLabel="הסבר על Meta Title"
                  />
                }
                fullWidth
                size="small"
                value={post.seo.metaTitle}
                onChange={(e) => updateSeo("metaTitle", e.target.value)}
                placeholder={post.title || "הזינו Meta Title"}
                sx={{ mb: 0.5 }}
              />
              <Typography
                variant="caption"
                sx={{
                  mb: 2,
                  display: "block",
                  textAlign: "right",
                  color: getCharCountColor(
                    (post.seo.metaTitle || post.title).length,
                    30,
                    60,
                    theme,
                  ),
                  fontWeight: 500,
                }}
              >
                {(post.seo.metaTitle || post.title).length}/60 תווים
              </Typography>

              {/* Meta Description */}
              <TextField
                label={
                  <LabeledWithInfo
                    label="Meta Description"
                    tooltip="הטקסט האפור מתחת לכותרת בתוצאות חיפוש; משפיע על החלטת הגולש להיכנס לדף. מומלץ בערך 120–160 תווים."
                    ariaLabel="הסבר על Meta Description"
                  />
                }
                fullWidth
                size="small"
                multiline
                rows={3}
                value={post.seo.metaDescription}
                onChange={(e) => updateSeo("metaDescription", e.target.value)}
                placeholder={post.excerpt || "הזינו Meta Description"}
                sx={{ mb: 0.5 }}
              />
              <Typography
                variant="caption"
                sx={{
                  mb: 2,
                  display: "block",
                  textAlign: "right",
                  color: getCharCountColor(
                    (post.seo.metaDescription || post.excerpt).length,
                    120,
                    160,
                    theme,
                  ),
                  fontWeight: 500,
                }}
              >
                {(post.seo.metaDescription || post.excerpt).length}/160 תווים
              </Typography>

              {/* Meta Keywords */}
              <TextField
                label={
                  <LabeledWithInfo
                    label="Meta Keywords"
                    tooltip="מילות מפתח ב-meta keywords; גוגל כמעט לא משתמש בהן לדירוג, אך שימושי לארגון ולמערכות ישנות יותר."
                    ariaLabel="הסבר על Meta Keywords"
                  />
                }
                fullWidth
                size="small"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleAddKeyword}
                placeholder="הקלד ולחץ Enter"
                sx={{ mb: 1 }}
              />
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}>
                {post.seo.metaKeywords.map((kw) => (
                  <Chip
                    key={kw}
                    label={kw}
                    size="small"
                    onDelete={() => handleRemoveKeyword(kw)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>

              {/* Canonical URL */}
              <TextField
                label={
                  <LabeledWithInfo
                    label="Canonical URL"
                    tooltip="מציין לגוגל איזו כתובת היא הגרסה הרשמית של הדף; מפחית בעיית תוכן כפול (duplicate content)."
                    ariaLabel="הסבר על Canonical URL"
                  />
                }
                fullWidth
                size="small"
                value={post.seo.canonicalUrl}
                onChange={(e) => updateSeo("canonicalUrl", e.target.value)}
                placeholder="https://..."
                sx={{ mb: 2 }}
              />

              <Divider sx={{ my: 2 }} />

              {/* Open Graph */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mb: 1.5,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, color: "text.secondary" }}
                >
                  Open Graph
                </Typography>
                <FieldInfoTooltip
                  title="מטא-תגיות לשיתוף בפייסבוק, וואטסאפ ורשתות שמציגות כרטיס קישור (כותרת, תיאור, תמונה)."
                  ariaLabel="הסבר על Open Graph"
                />
              </Box>
              <TextField
                label={
                  <LabeledWithInfo
                    label="OG Title"
                    tooltip="כותרת כרטיס השיתוף; אם ריק, נפל בדרך כלל ל-Meta Title או לכותרת הכתבה."
                    ariaLabel="הסבר על OG Title"
                  />
                }
                fullWidth
                size="small"
                value={post.seo.ogTitle}
                onChange={(e) => updateSeo("ogTitle", e.target.value)}
                placeholder={post.seo.metaTitle || post.title || "OG Title"}
                sx={{ mb: 2 }}
              />
              <TextField
                label={
                  <LabeledWithInfo
                    label="OG Description"
                    tooltip="תיאור שמופיע מתחת לכותרת בכרטיסי שיתוף; משלים את התמונה למשתמש לפני הקליק."
                    ariaLabel="הסבר על OG Description"
                  />
                }
                fullWidth
                size="small"
                multiline
                rows={2}
                value={post.seo.ogDescription}
                onChange={(e) => updateSeo("ogDescription", e.target.value)}
                placeholder={
                  post.seo.metaDescription || post.excerpt || "OG Description"
                }
                sx={{ mb: 2 }}
              />
              <TextField
                label={
                  <LabeledWithInfo
                    label="OG Image URL"
                    tooltip="תמונת הרקע בכרטיס השיתוף; מומלץ רזולוציה מתאימה (למשל 1200×630) לתצוגה נקייה."
                    ariaLabel="הסבר על OG Image URL"
                  />
                }
                fullWidth
                size="small"
                value={post.seo.ogImage}
                onChange={(e) => updateSeo("ogImage", e.target.value)}
                placeholder="https://example.com/og-image.jpg"
                sx={{ mb: 2 }}
              />

              <Divider sx={{ my: 2 }} />

              {/* Twitter Card */}
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel id="post-editor-twitter-label">
                  <LabeledWithInfo
                    label="Twitter Card"
                    tooltip="סוג כרטיס הקישור בטוויטר/X: תקציר קטן או תקציר עם תמונה גדולה — משפיע על איך הקישור נראה בשיתוף."
                    ariaLabel="הסבר על Twitter Card"
                  />
                </InputLabel>
                <Select
                  labelId="post-editor-twitter-label"
                  label="Twitter Card"
                  value={post.seo.twitterCard}
                  onChange={(e) =>
                    updateSeo(
                      "twitterCard",
                      e.target.value as "summary" | "summary_large_image",
                    )
                  }
                >
                  <MenuItem value="summary">תקציר</MenuItem>
                  <MenuItem value="summary_large_image">
                    תקציר עם תמונה גדולה
                  </MenuItem>
                </Select>
              </FormControl>

              {/* Robots */}
              <FormControlLabel
                control={
                  <Switch
                    checked={post.seo.noIndex}
                    onChange={(e) => updateSeo("noIndex", e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: "inline-flex", alignItems: "center" }}>
                    <Typography variant="body2" component="span">
                      noIndex
                    </Typography>
                    <FieldInfoTooltip
                      title="כאשר פעיל — מבקש ממנועי חיפוש לא לאנדקס את הדף (לא יופיע בתוצאות חיפוש)."
                      ariaLabel="הסבר על noIndex"
                    />
                  </Box>
                }
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={post.seo.noFollow}
                    onChange={(e) => updateSeo("noFollow", e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: "inline-flex", alignItems: "center" }}>
                    <Typography variant="body2" component="span">
                      noFollow
                    </Typography>
                    <FieldInfoTooltip
                      title="כאשר פעיל — מבקש לא לעקוב אחר קישורים מדף זה (מעביר פחות 'סמכות' SEO ליעדי הקישורים)."
                      ariaLabel="הסבר על noFollow"
                    />
                  </Box>
                }
              />

              <Divider sx={{ my: 2 }} />

              {/* Google Snippet Preview */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mb: 1.5,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, color: "text.secondary" }}
                >
                  תצוגת Google
                </Typography>
                <FieldInfoTooltip
                  title="הדמיה משוערת של הסניפט בתוצאות החיפוש — כותרת, כתובת ותיאור; Google עשוי לשנות את התצוגה בפועל."
                  ariaLabel="הסבר על תצוגת Google"
                />
              </Box>
              <Box
                sx={(t) => ({
                  p: 2,
                  border: `1px solid ${t.palette.divider}`,
                  borderRadius: 1,
                  backgroundColor: t.palette.background.paper,
                })}
              >
                <Typography
                  variant="body1"
                  sx={{
                    color: "#1a0dab",
                    fontSize: "1.1rem",
                    fontWeight: 400,
                    lineHeight: 1.3,
                    mb: 0.5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {googleSnippetTitle}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "#006621",
                    fontSize: "0.85rem",
                    mb: 0.5,
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {googleSnippetUrl}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "#545454",
                    fontSize: "0.85rem",
                    lineHeight: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {googleSnippetDescription}
                </Typography>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Panel 6: SEO Score */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  width: "100%",
                }}
              >
                <Typography sx={{ fontWeight: 600, flex: 1 }}>
                  ציון SEO
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, color: seoScoreColor }}
                >
                  {seoScore}%
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={seoScore}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.palette.action.hover,
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 4,
                      backgroundColor: seoScoreColor,
                    },
                  }}
                />
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {seoChecks.map((check, idx) => (
                  <Box
                    key={idx}
                    sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}
                  >
                    {seoCheckIcon(check.type)}
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", lineHeight: 1.4 }}
                    >
                      {check.message}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
