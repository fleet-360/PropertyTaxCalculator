"use client";

import { useState, useRef, useCallback, Dispatch } from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import { wizardUploadReadyZoneSx, wizardUploadZoneSx } from "./wizardStyles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { WizardState, WizardAction } from "./CalculatorWizard";
import type { ExtractionResult } from "@/lib/vision/types";
import type { TaxBillData } from "@/lib/vision/document-types/tax-bill";
import { findByPropertyCode, findBySubtypeAndZone } from "@/lib/calculator";

// ── Field labels (Hebrew) ──────────────────────────────────────────

const FIELD_LABELS: Record<keyof TaxBillData, string> = {
  fullName: "שם מלא",
  idNumber: "ת.ז.",
  propertyNumber: "מספר נכס",
  propertyId: "זיהוי נכס",
  address: "כתובת",
  block: "גוש",
  parcel: "חלקה",
  propertyPurposeDescription: "ייעוד הנכס",
  subTypeDescription: "סוג הנכס",
  classificationCode: "קוד סיווג",
  zone: "אזור",
  propertyArea: 'שטח הנכס (מ"ר)',
  coveredBalconyArea: 'מרפסת מקורה (מ"ר)',
  storageArea: 'מחסן (מ"ר)',
  parkingArea: 'חניה (מ"ר)',
  bimonthlyPayment: "תשלום (₪)",
  annualPayment: "תשלום שנתי (₪)",
  paymentPeriod: "תקופת תשלום",
  ratePerSqm: 'תעריף למ"ר (₪)',
};

// ── Confidence indicator ───────────────────────────────────────────

function ConfidenceChip({ confidence }: { confidence: string }) {
  switch (confidence) {
    case "high":
      return (
        <Chip
          icon={<CheckCircleIcon />}
          label="גבוה"
          color="success"
          size="small"
          variant="outlined"
        />
      );
    case "medium":
      return (
        <Chip
          icon={<WarningIcon />}
          label="בינוני"
          color="warning"
          size="small"
          variant="outlined"
        />
      );
    default:
      return (
        <Chip
          icon={<ErrorIcon />}
          label="נמוך"
          color="error"
          size="small"
          variant="outlined"
        />
      );
  }
}

// ── Accepted file types ────────────────────────────────────────────

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf";

// ── Component ──────────────────────────────────────────────────────

interface TaxBillUploadProps {
  dispatch: Dispatch<WizardAction>;
  /** Called after fields are dispatched to wizard state */
  onExtracted?: () => void;
  /** When true, file is stored but extraction only happens via triggerExtraction() */
  deferExtraction?: boolean;
  /** Called when a file is selected (deferred mode) — parent stores the File */
  onFileReady?: (file: File | null) => void;
  /** When set, the vision model validates the bill matches this municipality name */
  expectedCityName?: string;
  /** City tariff data — used to build tariff hints for better field matching in immediate mode */
  cityData?: Record<string, unknown> | null;
}

export default function TaxBillUpload({
  dispatch,
  onExtracted,
  deferExtraction,
  onFileReady,
  expectedCityName,
  cityData,
}: TaxBillUploadProps) {
  const [status, setStatus] = useState<
    "idle" | "uploading" | "ready" | "success" | "error"
  >("idle");
  const [extractionResult, setExtractionResult] =
    useState<ExtractionResult<TaxBillData> | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyFields = useCallback(
    (result: ExtractionResult<TaxBillData>) => {
      if (!result?.data) return;
      const fieldsToApply: Partial<WizardState> = {};
      for (const [key, field] of Object.entries(result.data)) {
        if (field && field.value !== undefined && field.value !== null) {
          // Map extraction field names to wizard state field names
          if (key === "bimonthlyPayment") {
            // Store as reportedPayment in wizard state
            (fieldsToApply as Record<string, unknown>)["reportedPayment"] =
              field.value;
          } else if (
            key === "propertyPurposeDescription" ||
            key === "subTypeDescription" ||
            key === "ratePerSqm" ||
            key === "annualPayment"
          ) {
            // These are extraction-only display fields — don't push to wizard state
          } else {
            (fieldsToApply as Record<string, unknown>)[key] = field.value;
          }
        }
      }

      // Resolve classification fields: try classificationCode first, then
      // fall back to fuzzy-matching subTypeDescription + zone.
      if (cityData) {
        let resolved = false;
        if (fieldsToApply.classificationCode) {
          const match = findByPropertyCode(
            cityData as unknown as Parameters<typeof findByPropertyCode>[0],
            fieldsToApply.classificationCode as string,
          );
          if (match) {
            (fieldsToApply as Record<string, unknown>).propertyPurpose = match.typeCode;
            (fieldsToApply as Record<string, unknown>).subType = match.subtypeCode;
            (fieldsToApply as Record<string, unknown>).zone = match.zoneCode;
            resolved = true;
          }
        }

        if (!resolved) {
          const extractedSubType = result.data.subTypeDescription?.value;
          const extractedZone = result.data.zone?.value;
          if (typeof extractedSubType === 'string' && extractedSubType) {
            const fallback = findBySubtypeAndZone(
              cityData as unknown as Parameters<typeof findBySubtypeAndZone>[0],
              extractedSubType,
              typeof extractedZone === 'string' ? extractedZone : undefined,
            );
            if (fallback) {
              (fieldsToApply as Record<string, unknown>).propertyPurpose = fallback.typeCode;
              (fieldsToApply as Record<string, unknown>).subType = fallback.subtypeCode;
              (fieldsToApply as Record<string, unknown>).zone = fallback.zoneCode;
            }
          }
        }
      }

      dispatch({ type: "UPDATE_FIELDS_BULK", payload: fieldsToApply });
      onExtracted?.();
    },
    [dispatch, onExtracted, cityData],
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      setErrorMessage("");
      setExtractionResult(null);

      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }

      setSelectedFileName(file.name);

      // In deferred mode, just store the file — don't extract yet
      if (deferExtraction) {
        setStatus("ready");
        onFileReady?.(file);
        return;
      }

      // Immediate extraction mode
      setStatus("uploading");

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("documentType", "tax_bill");

        const promptOpts: Record<string, unknown> = {};
        const trimmedCity = expectedCityName?.trim();
        if (trimmedCity) promptOpts.expectedCityName = trimmedCity;

        if (cityData) {
          const cd = cityData as {
            availableZones?: { code: string; label: string }[];
            types?: {
              category: string;
              code: string;
              label: string;
              subtypes: { code: string; label: string; zones: { zone: string }[] }[];
            }[];
          };
          promptOpts.tariffHints = {
            availableZones: cd.availableZones ?? [],
            subtypes: cd.types?.flatMap((t) =>
              t.subtypes.map((s) => ({
                code: s.code,
                label: s.label,
                category: t.category,
                typeCode: t.code,
                typeLabel: t.label,
                zones: s.zones.map((z) => z.zone),
              })),
            ) ?? [],
          };
        }

        if (Object.keys(promptOpts).length > 0) {
          formData.append("promptOptions", JSON.stringify(promptOpts));
        }

        const response = await fetch("/api/vision/extract", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Server error: ${response.status}`,
          );
        }

        const result: ExtractionResult<TaxBillData> = await response.json();
        setExtractionResult(result);
        setStatus(result.success ? "success" : "error");

        if (!result.success) {
          setErrorMessage(
            result.warnings.join(". ") || "לא ניתן היה לחלץ נתונים מהמסמך",
          );
        } else {
          applyFields(result);
        }
      } catch (error) {
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "שגיאה בעיבוד המסמך",
        );
      }
    },
    [applyFields, deferExtraction, onFileReady, expectedCityName, cityData],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleReset = useCallback(() => {
    setStatus("idle");
    setExtractionResult(null);
    setErrorMessage("");
    setPreviewUrl(null);
    setSelectedFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onFileReady?.(null);
  }, [onFileReady]);

  return (
    <Box sx={{ mb: 0 }}>
      {status === "idle" && (
        <Box
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          sx={wizardUploadZoneSx}
        >
          <Image
            src="/images/calculator/uploadIcon.png"
            alt=""
            width={65}
            height={65}
            priority
            unoptimized
          />
          <Typography
            sx={{
              fontSize: "14px",
              textAlign: "center",
              color: "text.primary",
            }}
          >
            גרירת קובץ ארנונה לכאן או העלאה מהמחשב
          </Typography>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            onChange={handleInputChange}
            hidden
          />
        </Box>
      )}

      {/* ── File ready (deferred mode) ── */}
      {status === "ready" && (
        <Box sx={wizardUploadReadyZoneSx}>
          <Box
            aria-hidden
            sx={(theme) => ({
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: theme.palette.success.main,
              boxShadow: `0 0 0 4px ${theme.palette.success.main}1A`,
              mb: 1.5,
            })}
          />
          <Typography
            sx={{
              fontSize: { xs: "14px", md: "15px" },
              fontWeight: 600,
              color: "text.primary",
              textAlign: "center",
              wordBreak: "break-word",
              direction: "rtl",
            }}
          >
            {selectedFileName}
          </Typography>
          <Box
            component="button"
            type="button"
            onClick={handleReset}
            sx={{
              mt: 1,
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              background: "transparent",
              border: "none",
              p: 0,
              cursor: "pointer",
              color: "text.secondary",
              fontSize: "13px",
              fontFamily: "inherit",
              "&:hover": { color: "text.primary" },
            }}
          >
            <Typography component="span" sx={{ fontSize: "13px" }}>
              מחיקת קובץ והעלאה חדש
            </Typography>
            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
          </Box>
        </Box>
      )}

      {/* ── Loading ── */}
      {status === "uploading" && (
        <Box sx={wizardUploadReadyZoneSx}>
          <CircularProgress size={28} sx={{ mb: 1.5 }} />
          <Typography
            sx={{
              fontSize: { xs: "14px", md: "15px" },
              fontWeight: 600,
              color: "text.primary",
              textAlign: "center",
              wordBreak: "break-word",
              direction: "rtl",
            }}
          >
            {selectedFileName ?? "מעבד את המסמך..."}
          </Typography>
          <Typography
            sx={{ fontSize: "13px", color: "text.secondary", mt: 0.5 }}
          >
            מעבד את המסמך...
          </Typography>
        </Box>
      )}

      {/* ── Error ── */}
      {status === "error" && (
        <Box>
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
          <Button variant="outlined" size="small" onClick={handleReset}>
            נסה שוב
          </Button>
        </Box>
      )}

      {/* ── Success — fields already applied, show summary ── */}
      {status === "success" && extractionResult && (
        <Box>
          <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
            חולצו ומולאו {Object.keys(extractionResult.data).length} שדות מהמסמך
            {extractionResult.processingTimeMs && (
              <Typography variant="caption" component="span" sx={{ mr: 1 }}>
                ({(extractionResult.processingTimeMs / 1000).toFixed(1)} שניות)
              </Typography>
            )}
          </Alert>

          {extractionResult.warnings.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {extractionResult.warnings.join(". ")}
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            {Object.entries(extractionResult.data).map(([key, field]) => {
              if (!field) return null;
              const label = FIELD_LABELS[key as keyof TaxBillData] || key;
              return (
                <Box
                  key={key}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    py: 0.5,
                    px: 1,
                    "&:nth-of-type(odd)": { backgroundColor: "action.hover" },
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2" fontWeight="medium">
                    {label}:
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" dir="ltr">
                      {String(field.value)}
                    </Typography>
                    <ConfidenceChip confidence={field.confidence} />
                  </Box>
                </Box>
              );
            })}
          </Box>

          <Typography variant="caption" color="text.secondary">
            הנתונים ימולאו אוטומטית בטופס בשלב הבא.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
