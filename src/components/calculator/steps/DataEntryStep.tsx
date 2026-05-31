"use client";

import { useEffect, useMemo, useRef, useCallback } from "react";
import {
  useForm,
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type UseFormSetValue,
} from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import type { StepProps } from "../CalculatorWizard";
import {
  wizardFieldSx,
  wizardNavRowSx,
  wizardPrimaryButtonSx,
  wizardSecondaryButtonSx,
  wizardSectionHeaderSx,
  wizardSectionTitleSx,
} from "../wizardStyles";
import { useConsentSubmit } from "@/hooks/useConsentSubmit";
import { IPropertyType, ISubType, IZoneRate } from "@/lib/models/CityTariff";
import {
  ALL_ZONES_TARIFF_CODE,
  ALL_ZONES_LABEL_HE,
} from "@/lib/tariff-constants";
import { findRate } from "@/lib/calculator";

// ── Payment period conversion ────────────────────────────────────────
const PAYMENT_PERIODS = [
  { value: "monthly", label: "חודשי", toBimonthlyFactor: 2 },
  { value: "bimonthly", label: "דו-חודשי", toBimonthlyFactor: 1 },
  { value: "quarterly", label: "רבעוני", toBimonthlyFactor: 2 / 3 },
  { value: "semi_annual", label: "חצי שנתי", toBimonthlyFactor: 1 / 3 },
  { value: "annual", label: "שנתי", toBimonthlyFactor: 1 / 6 },
] as const;

function convertToBimonthly(amount: number, period: string): number {
  const entry = PAYMENT_PERIODS.find((p) => p.value === period);
  const factor = entry?.toBimonthlyFactor ?? 1;
  return Math.round(amount * factor * 100) / 100;
}

interface FormData {
  fullName: string;
  idNumber: string;
  email: string;
  phone: string;
  propertyPurpose: string;
  propertyNumber: string;
  propertyId: string;
  propertyArea: number;
  address: string;
  block: string;
  parcel: string;
  classificationCode: string;
  zone: string;
  subType: string;
  reportedPayment: number;
  paymentPeriod: string;
  designations: { type: string; subtype: string; zone: string; area: number }[];
  selectedFees: string[];
}

const designationRowSchema = z.object({
  type: z.string(),
  subtype: z.string(),
  zone: z.string(),
  area: z.coerce.number().min(0),
});

const requiredString = z.string().min(1, "שדה חובה");

function createDataEntrySchema(isBusiness: boolean) {
  return z
    .object({
      fullName: requiredString,
      idNumber: z
        .string()
        .regex(/^\d+$/, "יש להזין ספרות בלבד")
        .or(z.literal(""))
        .optional(),
      email: z.string().optional(),
      phone: requiredString.regex(
        /^05\d{1}-?\d{7}$/,
        "מספר טלפון לא תקין (לדוגמה: 050-1234567)",
      ),
      propertyPurpose: isBusiness ? z.string() : requiredString,
      propertyNumber: z.string(),
      propertyId: z.string(),
      propertyArea: isBusiness
        ? z.coerce.number().min(0)
        : z.coerce.number().positive("שטח חייב להיות גדול מ-0"),
      address: z.string(),
      block: z.string(),
      parcel: z.string(),
      classificationCode: z.string(),
      zone: isBusiness ? z.string() : requiredString,
      subType: isBusiness ? z.string() : requiredString,
      reportedPayment: z.coerce.number().positive("סכום חייב להיות גדול מ-0"),
      paymentPeriod: z.string().default("bimonthly"),
      designations: z.array(designationRowSchema).default([]),
      selectedFees: z.array(z.string()).default([]),
    })
    .superRefine((data, ctx) => {
      if (!isBusiness) return;
      const rows = data.designations;
      if (rows.length !== 1) return;
      const r = rows[0];
      if (!r.type?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "שדה חובה",
          path: ["designations", 0, "type"],
        });
      }
      if (!r.subtype?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "שדה חובה",
          path: ["designations", 0, "subtype"],
        });
      }
      if (!r.zone?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "שדה חובה",
          path: ["designations", 0, "zone"],
        });
      }
      if (!(r.area > 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "שטח חייב להיות גדול מ-0",
          path: ["designations", 0, "area"],
        });
      }
    });
}

// ── DesignationRow: per-row cascading for business designations ───
type DesignationRowErrors = Partial<
  Record<"type" | "subtype" | "zone" | "area", { message?: string } | undefined>
>;

function DesignationRow({
  idx,
  control,
  setValue,
  types,
  removable,
  onRemove,
  rowErrors,
}: {
  idx: number;
  control: Control<FormData>;
  setValue: UseFormSetValue<FormData>;
  types: IPropertyType[];
  removable: boolean;
  onRemove: () => void;
  rowErrors?: DesignationRowErrors;
}) {
  const rowType = useWatch({
    control,
    name: `designations.${idx}.type` as const,
  });
  const rowSubtype = useWatch({
    control,
    name: `designations.${idx}.subtype` as const,
  });

  const prevRowType = useRef(rowType);
  const prevRowSubtype = useRef(rowSubtype);

  const rowFilteredSubtypes = useMemo(() => {
    if (!rowType) return [];
    return types.find((t) => t.code === rowType)?.subtypes ?? [];
  }, [types, rowType]);

  const rowFilteredZones = useMemo(() => {
    if (!rowSubtype || !rowType) return [];
    const type = types.find((t) => t.code === rowType);
    return type?.subtypes.find((s) => s.code === rowSubtype)?.zones ?? [];
  }, [types, rowType, rowSubtype]);

  const validateOpts = { shouldValidate: true } as const;

  // Clear downstream when type changes
  useEffect(() => {
    if (prevRowType.current === rowType) return;
    prevRowType.current = rowType;
    setValue(`designations.${idx}.subtype` as const, "", validateOpts);
    setValue(`designations.${idx}.zone` as const, "", validateOpts);
  }, [rowType, idx, setValue]);

  // Clear or default zone when subtype changes
  useEffect(() => {
    if (prevRowSubtype.current === rowSubtype) return;
    prevRowSubtype.current = rowSubtype;
    const typeObj = types.find((t) => t.code === rowType);
    const zones =
      typeObj?.subtypes.find((s) => s.code === rowSubtype)?.zones ?? [];
    if (rowSubtype && rowType && zones.length === 0) {
      setValue(
        `designations.${idx}.zone` as const,
        ALL_ZONES_TARIFF_CODE,
        validateOpts,
      );
    } else {
      setValue(`designations.${idx}.zone` as const, "", validateOpts);
    }
  }, [rowSubtype, rowType, idx, setValue, types]);

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-start",
        gap: 1.5,
        mb: 1.5,
        minWidth: 0,
      }}
    >
      <Box sx={{ flex: "1 1 130px", minWidth: 0 }}>
        <Controller
          name={`designations.${idx}.type`}
          control={control}
          render={({ field: f }) => (
            <TextField
              {...f}
              label="סוג"
              select
              fullWidth
              size="small"
              error={!!rowErrors?.type}
              helperText={rowErrors?.type?.message}
            >
              <MenuItem value="">בחר</MenuItem>
              {types.map((t: IPropertyType) => (
                <MenuItem key={t.code} value={t.code}>
                  {t.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </Box>
      <Box sx={{ flex: "1 1 130px", minWidth: 0 }}>
        <Controller
          name={`designations.${idx}.subtype`}
          control={control}
          render={({ field: f }) => (
            <TextField
              {...f}
              label="תת-סוג"
              select
              fullWidth
              size="small"
              error={!!rowErrors?.subtype}
              helperText={rowErrors?.subtype?.message}
            >
              <MenuItem value="">בחר</MenuItem>
              {rowFilteredSubtypes.map((s: ISubType) => (
                <MenuItem key={s.code} value={s.code}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </Box>
      <Box sx={{ flex: "1 1 130px", minWidth: 0 }}>
        <Controller
          name={`designations.${idx}.zone`}
          control={control}
          render={({ field: f }) => (
            <TextField
              {...f}
              label="אזור"
              select
              fullWidth
              size="small"
              error={!!rowErrors?.zone}
              helperText={rowErrors?.zone?.message}
            >
              <MenuItem value="">בחר</MenuItem>
              <MenuItem value={ALL_ZONES_TARIFF_CODE}>
                {ALL_ZONES_LABEL_HE} ({ALL_ZONES_TARIFF_CODE})
              </MenuItem>
              {rowFilteredZones.map((z: IZoneRate) => (
                <MenuItem key={z.zone} value={z.zone}>
                  {z.zoneLabel}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </Box>
      <Box sx={{ flex: "0 1 118px", minWidth: 0 }}>
        <Controller
          name={`designations.${idx}.area`}
          control={control}
          render={({ field: f }) => (
            <TextField
              {...f}
              label='שטח (מ"ר)'
              type="number"
              fullWidth
              size="small"
              error={!!rowErrors?.area}
              helperText={rowErrors?.area?.message}
            />
          )}
        />
      </Box>
      <Box
        sx={{
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          alignSelf: "stretch",
          pt: 0.5,
        }}
      >
        {removable && (
          <IconButton
            onClick={onRemove}
            size="small"
            color="error"
            aria-label="מחק ייעוד"
          >
            <DeleteIcon />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function DataEntryStep({ state, dispatch, sx }: StepProps) {
  const { submitConsent, linkConsents } = useConsentSubmit();
  const cityData = state.cityData;
  const isBusiness = state.propertyType === "business";
  const hasCityFees = !!(cityData?.cityFees?.length > 0);

  // ── Mia message on mount ──
  useEffect(() => {
    dispatch({ type: "SET_MIA_MESSAGE", payload: "step-2-default" });
  }, [dispatch]);

  // Extract types from city data
  const types: IPropertyType[] =
    cityData?.types.filter(
      (t: IPropertyType) => t.category === state.propertyType,
    ) ?? [];

  const schema = useMemo(() => createDataEntrySchema(isBusiness), [isBusiness]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitted, isSubmitSuccessful },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      fullName: state.fullName,
      idNumber: state.idNumber,
      email: state.email,
      phone: state.phone,
      propertyPurpose: state.propertyPurpose || "",
      propertyNumber: state.propertyNumber,
      propertyId: state.propertyId,
      propertyArea: state.propertyArea || ("" as any),
      address: state.address,
      block: state.block,
      parcel: state.parcel,
      classificationCode: state.classificationCode,
      zone: state.zone,
      subType: state.subType,
      reportedPayment: state.reportedPayment || ("" as any),
      paymentPeriod: state.paymentPeriod || "bimonthly",
      designations: state.designations,
      selectedFees: state.selectedFees ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "designations",
  });

  const watchedDesignations = useWatch({ control, name: "designations" });

  // Watch cascading fields
  const watchedType = watch("propertyPurpose");
  const watchedSubType = watch("subType");
  const watchedZone = watch("zone");
  const watchedArea = watch("propertyArea");

  const canMoveToNextStep = useMemo(() => {
    if (isBusiness) return true;
    return watchedType && watchedSubType && watchedZone && watchedArea;
  }, [watchedType, watchedSubType, watchedZone, watchedArea]);
  // const watchedClassCode = watch('classificationCode');

  // Refs to track previous values and prevent cascade loops
  const prevTypeRef = useRef(watchedType);
  const prevSubTypeRef = useRef(watchedSubType);
  const prevZoneRef = useRef(watchedZone);
  // const prevClassCodeRef = useRef(watchedClassCode);

  // Filtered subtypes: only those belonging to selected type
  const filteredSubtypes = useMemo(() => {
    if (isBusiness) return types.flatMap((t) => t.subtypes);
    if (!watchedType) return [];
    const selectedType = types.find((t) => t.code === watchedType);
    return selectedType?.subtypes ?? [];
  }, [types, watchedType]);

  // Filtered zones: only those belonging to selected subtype
  const filteredZones = useMemo(() => {
    if (!watchedSubType || !watchedType) return [];
    // const selectedType = types.find((t) => t.code === watchedType);
    const selectedSubtype = filteredSubtypes?.find(
      (s) => s.code === watchedSubType,
    );
    return selectedSubtype?.zones ?? [];
  }, [types, watchedType, watchedSubType]);

  // ── Live rate computation ────────────────────────────────────────
  const liveRate = useMemo(() => {
    if (!cityData) return null;

    if (
      isBusiness &&
      watchedDesignations?.length === 1 &&
      watchedDesignations[0]
    ) {
      const r = watchedDesignations[0];
      if (!r.type || !r.subtype || !r.zone) return null;
      const totalArea = Number(r.area) || 0;
      if (totalArea <= 0) return null;
      try {
        const { rate, propertyCode } = findRate(
          cityData,
          r.type,
          r.subtype,
          r.zone,
          totalArea,
        );
        return { rate, propertyCode, totalArea };
      } catch {
        return null;
      }
    }

    if (!watchedType || !watchedSubType || !watchedZone) return null;
    const totalArea = Number(watchedArea) || 0;
    if (totalArea <= 0) return null;
    try {
      const { rate, propertyCode } = findRate(
        cityData,
        watchedType,
        watchedSubType,
        watchedZone,
        totalArea,
      );
      return { rate, propertyCode, totalArea };
    } catch {
      return null;
    }
  }, [
    cityData,
    isBusiness,
    watchedDesignations,
    watchedType,
    watchedSubType,
    watchedZone,
    watchedArea,
  ]);

  const validateOpts = { shouldValidate: true } as const;

  // ── Forward cascade: type changes → clear downstream ───────────
  useEffect(() => {
    if (prevTypeRef.current === watchedType) return;
    prevTypeRef.current = watchedType;
    prevSubTypeRef.current = "";
    prevZoneRef.current = "";
    // prevClassCodeRef.current = '';
    setValue("subType", "", validateOpts);
    setValue("zone", "", validateOpts);
    setValue("classificationCode", "", validateOpts);
  }, [watchedType, setValue]);

  // ── Forward cascade: subType changes → clear zone & code (default zone all if no rows) ───────
  useEffect(() => {
    if (prevSubTypeRef.current === watchedSubType) return;
    prevSubTypeRef.current = watchedSubType;
    prevZoneRef.current = "";
    const selectedSubtype = types
      .find((t) => t.code === watchedType)
      ?.subtypes.find((s) => s.code === watchedSubType);
    const zones = selectedSubtype?.zones ?? [];
    if (watchedSubType && watchedType && zones.length === 0) {
      setValue("zone", ALL_ZONES_TARIFF_CODE, validateOpts);
    } else {
      setValue("zone", "", validateOpts);
    }
    setValue("classificationCode", "", validateOpts);
  }, [watchedSubType, watchedType, setValue, types]);

  // ── Auto-save lead when name + phone are filled ──
  const watchedFullName = useWatch({ control, name: "fullName" });
  const watchedPhone = useWatch({ control, name: "phone" });
  const watchedEmail = useWatch({ control, name: "email" });
  const watchedIdNumber = useWatch({ control, name: "idNumber" });
  const leadSavedRef = useRef(false);

  const saveLeadEarly = useCallback(
    async (
      fullName: string,
      phone: string,
      email: string,
      idNumber: string,
    ) => {
      if (state.leadId) return; // Already saved
      if (leadSavedRef.current) return;
      leadSavedRef.current = true;

      try {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName,
            phone,
            email: email || undefined,
            idNumber: idNumber || undefined,
            source: "calculator",
            calculation: {
              abandonmentStage: "data_entry",
              propertyType: state.propertyType,
              citySlug: state.citySlug,
            },
          }),
        });

        if (res.ok) {
          const result = await res.json();
          const newLeadId = String(result.lead._id);
          dispatch({ type: "SET_LEAD_ID", payload: newLeadId });
          dispatch({
            type: "SET_CALCULATION_INDEX",
            payload: result.calculationIndex,
          });
          // Link any consent records created before the lead existed
          submitConsent(newLeadId, phone, "data_retention", true);

          // linkConsents(phone, newLeadId);
        } else {
          leadSavedRef.current = false; // Allow retry on failure
        }
      } catch {
        leadSavedRef.current = false; // Allow retry on failure
      }
    },
    [state.leadId, state.propertyType, state.citySlug, dispatch, submitConsent],
  );

  useEffect(() => {
    const name = watchedFullName?.trim();
    const phone = watchedPhone?.trim();
    if (!name || !phone || name.length < 2 || phone.length < 9) return;

    const timeout = setTimeout(() => {
      saveLeadEarly(name, phone, watchedEmail || "", watchedIdNumber || "");
    }, 800);

    return () => clearTimeout(timeout);
  }, [
    watchedFullName,
    watchedPhone,
    watchedEmail,
    watchedIdNumber,
    saveLeadEarly,
  ]);

  const onSubmit = async (data: FormData) => {
    const fieldKeys = Object.keys(data) as (keyof FormData)[];
    for (const key of fieldKeys) {
      if (key === "designations") {
        dispatch({
          type: "SET_DESIGNATIONS",
          payload: data.designations as any,
        });
      } else if (key === "selectedFees") {
        dispatch({
          type: "UPDATE_FIELD",
          field: "selectedFees",
          value: data.selectedFees ?? [],
        });
      } else {
        dispatch({ type: "UPDATE_FIELD", field: key as any, value: data[key] });
      }
    }
    // Convert reported payment to bimonthly for the calculator
    const bimonthly = convertToBimonthly(
      data.reportedPayment,
      data.paymentPeriod,
    );
    dispatch({
      type: "UPDATE_FIELD",
      field: "bimonthlyPayment",
      value: bimonthly,
    });

    // Update lead with full property details
    if (data.phone && data.fullName) {
      try {
        if (state.leadId) {
          // Lead already exists (created by auto-save) — update with property details
          await fetch(`/api/leads/${state.leadId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fullName: data.fullName,
              email: data.email || undefined,
              idNumber: data.idNumber || undefined,
              calculationIndex: state.calculationIndex,
              calculationUpdate: {
                propertyType: state.propertyType,
                citySlug: state.citySlug,
                propertyNumber: data.propertyNumber || undefined,
                propertyId: data.propertyId || undefined,
                address: data.address || undefined,
                blockParcel:
                  data.block && data.parcel
                    ? { block: data.block, parcel: data.parcel }
                    : undefined,
                propertyArea: data.propertyArea || undefined,
                classificationCode: data.classificationCode || undefined,
                zone: isBusiness ? undefined : data.zone || undefined,
                bimonthlyPayment: bimonthly || undefined,
                designations: isBusiness ? data.designations : undefined,
              },
            }),
          });
        } else {
          // Lead not yet created (auto-save didn't fire) — create now with full data
          const res = await fetch("/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fullName: data.fullName,
              phone: data.phone,
              email: data.email || undefined,
              idNumber: data.idNumber || undefined,
              source: "calculator",
              calculation: {
                abandonmentStage: "data_entry",
                propertyType: state.propertyType,
                citySlug: state.citySlug,
                propertyNumber: data.propertyNumber || undefined,
                propertyId: data.propertyId || undefined,
                address: data.address || undefined,
                blockParcel:
                  data.block && data.parcel
                    ? { block: data.block, parcel: data.parcel }
                    : undefined,
                propertyArea: data.propertyArea || undefined,
                classificationCode: data.classificationCode || undefined,
                zone: isBusiness ? undefined : data.zone || undefined,
                bimonthlyPayment: bimonthly || undefined,
                designations: isBusiness ? data.designations : undefined,
              },
            }),
          });

          if (res.ok) {
            const result = await res.json();
            const newLeadId = String(result.lead._id);
            dispatch({ type: "SET_LEAD_ID", payload: newLeadId });
            dispatch({
              type: "SET_CALCULATION_INDEX",
              payload: result.calculationIndex,
            });
            // Link any consent records created before the lead existed
            linkConsents(data.phone, newLeadId);
          }
        }
      } catch {
        // Non-blocking: continue even if save fails
      }
    }

    dispatch({ type: "NEXT_STEP" });
  };

  const onInvalid = useCallback(() => {
    requestAnimationFrame(() => {
      const invalid = document.querySelector<HTMLElement>(
        '[aria-invalid="true"]',
      );
      invalid?.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusTarget = invalid?.matches("input, select, textarea, button")
        ? invalid
        : invalid?.querySelector<HTMLElement>(
            "input, select, textarea, [tabindex]:not([tabindex='-1'])",
          );
      focusTarget?.focus({ preventScroll: true });
    });
  }, []);

  const showValidationAlert =
    isSubmitted && !isSubmitSuccessful && Object.keys(errors).length > 0;

  const fieldsGridSx = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 150px), 1fr))",
    gap: 2,
    width: "100%",
    minWidth: 0,
  } as const;

  const fullRowSx = { gridColumn: "1 / -1" } as const;

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      noValidate
      sx={{ ...sx, minWidth: 0 }}
    >
      {showValidationAlert ? (
        <Alert severity="error" sx={{ mb: 2 }} role="alert" aria-live="polite">
          יש שגיאות בטופס. נא לתקן את השדות המסומנים באדום.
        </Alert>
      ) : null}

      <Box sx={fieldsGridSx}>
        {/* 1. פרטי המשתמש */}
        <Box sx={fullRowSx}>
          <Box sx={wizardSectionHeaderSx}>
            <Typography sx={wizardSectionTitleSx}>פרטים אישיים</Typography>
          </Box>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Controller
            name="fullName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="שם מלא *"
                fullWidth
                size="small"
                error={!!errors.fullName}
                helperText={errors.fullName?.message}
              />
            )}
          />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="טלפון *"
                fullWidth
                size="small"
                error={!!errors.phone}
                helperText={errors.phone?.message}
              />
            )}
          />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Controller
            name="idNumber"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="ת.ז./ח.פ"
                fullWidth
                size="small"
                error={!!errors.idNumber}
                helperText={errors.idNumber?.message}
              />
            )}
          />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="אימייל"
                fullWidth
                size="small"
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          />
        </Box>

        {/* Business designations */}
        {isBusiness && (
          <Box sx={fullRowSx}>
            <Box
              sx={(theme) => ({
                ...wizardSectionHeaderSx(theme),
                mt: 1.5,
              })}
            >
              <Typography sx={wizardSectionTitleSx}>ייעודים עסקיים</Typography>
            </Box>

            {fields.map((field, idx) => (
              <DesignationRow
                key={field.id}
                idx={idx}
                control={control}
                setValue={setValue}
                types={types}
                removable={fields.length > 1}
                onRemove={() => remove(idx)}
                rowErrors={
                  errors.designations?.[idx] as DesignationRowErrors | undefined
                }
              />
            ))}
            {fields.length < 4 && (
              <Button
                startIcon={<AddIcon />}
                onClick={() =>
                  append({ type: "", subtype: "", zone: "", area: 0 })
                }
                size="small"
                sx={{ mt: 0.5 }}
              >
                הוסף ייעוד
              </Button>
            )}
          </Box>
        )}

        {/* 2. סיווג הנכס */}
        {!isBusiness && (
          <>
            {" "}
            <Box sx={fullRowSx}>
              <Box
                sx={(theme) => ({
                  ...wizardSectionHeaderSx(theme),
                  mt: 1.5,
                })}
              >
                <Typography sx={wizardSectionTitleSx}>סיווג הנכס</Typography>
              </Box>
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Controller
                name="propertyPurpose"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="ייעוד הנכס"
                    select
                    fullWidth
                    size="small"
                    required
                    error={!!errors.propertyPurpose}
                    helperText={errors.propertyPurpose?.message}
                  >
                    <MenuItem value="">בחר</MenuItem>
                    {types.map((t: IPropertyType) => (
                      <MenuItem key={t.code} value={t.code}>
                        {t.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Controller
                name="subType"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="סוג/סיווג"
                    select
                    fullWidth
                    size="small"
                    disabled={!watchedType && !isBusiness}
                    required
                    error={!!errors?.subType}
                    helperText={errors?.subType?.message}
                  >
                    <MenuItem value="">בחר</MenuItem>
                    {filteredSubtypes.map((s: ISubType) => (
                      <MenuItem key={s.code} value={s.code}>
                        {s.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Controller
                name="zone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="אזור"
                    select
                    fullWidth
                    size="small"
                    disabled={!watchedSubType}
                    required
                    error={!!errors?.zone}
                    helperText={errors?.zone?.message}
                  >
                    <MenuItem value="">בחר</MenuItem>

                    {filteredZones.map((z: IZoneRate) => (
                      <MenuItem key={z.zone} value={z.zone}>
                        {z.zoneLabel}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Controller
                name="propertyArea"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label='סה"כ שטח הנכס (מ"ר) *'
                    type="number"
                    fullWidth
                    size="small"
                    error={!!errors.propertyArea}
                    helperText={errors.propertyArea?.message}
                  />
                )}
              />
            </Box>
            {/* City fees selection */}
            {hasCityFees &&
              (cityData.cityFees as any[]).some((f: any) => !f.isMandatory) && (
                <Box sx={fullRowSx}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mt: 1, mb: 0.5 }}
                  >
                    אגרות נוספות (אופציונלי)
                  </Typography>
                  {(cityData.cityFees as any[])
                    .filter((f: any) => !f.isMandatory)
                    .map((f: any) => (
                      <Controller
                        key={f.name}
                        name="selectedFees"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={(field.value ?? []).includes(f.name)}
                                onChange={(e) => {
                                  const current = field.value ?? [];
                                  if (e.target.checked) {
                                    field.onChange([...current, f.name]);
                                  } else {
                                    field.onChange(
                                      current.filter(
                                        (n: string) => n !== f.name,
                                      ),
                                    );
                                  }
                                }}
                              />
                            }
                            label={`${f.name} (₪${f.amount} לדו-חודש)`}
                          />
                        )}
                      />
                    ))}
                </Box>
              )}
          </>
        )}

        {liveRate && state.citySlug !== "other" && (
          <Box sx={fullRowSx}>
            <Alert severity="info" variant="outlined" sx={{ py: 0.75 }}>
              {"תעריף ארנונה: "}
              <strong>{liveRate.rate} ₪ למ&quot;ר לשנה</strong>
              {liveRate.propertyCode && (
                <Typography component="span" variant="body2" sx={{ mr: 2 }}>
                  {" "}
                  | קוד סיווג: {liveRate.propertyCode}
                </Typography>
              )}
              <Typography component="span" variant="body2">
                {" "}
                | שטח כולל: {liveRate.totalArea} מ&quot;ר
              </Typography>
            </Alert>
          </Box>
        )}

        {/* 3. פרטי הנכס */}
        <Box sx={fullRowSx}>
          <Box
            sx={(theme) => ({
              ...wizardSectionHeaderSx(theme),
              mt: 1.5,
            })}
          >
            <Typography sx={wizardSectionTitleSx}>פרטי הנכס</Typography>
          </Box>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Controller
            name="propertyNumber"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="מספר נכס" fullWidth size="small" />
            )}
          />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Controller
            name="propertyId"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="זיהוי נכס" fullWidth size="small" />
            )}
          />
        </Box>
        <Box sx={{ minWidth: 0 }}></Box>
        <Box sx={{ minWidth: 0 }}></Box>
        <Controller
          name="address"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="כתובת" size="small" />
          )}
        />
        <Box sx={{ display: "flex", gap: 1 }}>
          <Box sx={{ minWidth: 0 }}>
            <Controller
              name="block"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="גוש" size="small" />
              )}
            />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Controller
              name="parcel"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="חלקה" size="small" />
              )}
            />
          </Box>
        </Box>

        {/* 4. תשלום */}
        <Box sx={fullRowSx}>
          <Box
            sx={(theme) => ({
              ...wizardSectionHeaderSx(theme),
              mt: 1.5,
            })}
          >
            <Typography sx={wizardSectionTitleSx}>תשלום</Typography>
          </Box>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Controller
            name="reportedPayment"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="סכום תשלום (₪) *"
                type="number"
                fullWidth
                size="small"
                error={!!errors.reportedPayment}
                helperText={errors.reportedPayment?.message}
              />
            )}
          />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Controller
            name="paymentPeriod"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="תקופת תשלום"
                select
                fullWidth
                size="small"
              >
                {PAYMENT_PERIODS.map((p) => (
                  <MenuItem key={p.value} value={p.value}>
                    {p.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Box>
      </Box>

      <Box sx={wizardNavRowSx}>
        <Button
          variant="outlined"
          onClick={() => dispatch({ type: "SET_STEP", step: 1 })}
          startIcon={<ChevronRightIcon />}
          sx={wizardSecondaryButtonSx}
        >
          לשלב הקודם
        </Button>
        <Button
          variant="contained"
          type="submit"
          endIcon={<ChevronLeftIcon />}
          disabled={!canMoveToNextStep}
          sx={wizardPrimaryButtonSx}
        >
          לשלב הבא
        </Button>
      </Box>
    </Box>
  );
}
