"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
import Divider from "@mui/material/Divider";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { StepProps } from "../CalculatorWizard";
import { IPropertyType, ISubType, IZoneRate } from "@/lib/models/CityTariff";
import { ALL_ZONES_TARIFF_CODE, ALL_ZONES_LABEL_HE } from "@/lib/tariff-constants";
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
  coveredBalconyArea: number;
  storageArea: number;
  parkingArea: number;
  address: string;
  block: string;
  parcel: string;
  classificationCode: string;
  zone: string;
  subType: string;
  reportedPayment: number;
  paymentPeriod: string;
  designations: { type: string; subtype: string; zone: string; area: number }[];
  additionalAreas: { areaType: string; areaSqm: number }[];
  selectedFees: string[];
}

const designationRowSchema = z.object({
  type: z.string(),
  subtype: z.string(),
  zone: z.string(),
  area: z.coerce.number().min(0),
});

function createDataEntrySchema(isBusiness: boolean) {
  return z
    .object({
      fullName: z.string().min(1, "שדה חובה"),
      idNumber: z.string().regex(/^\d+$/, "יש להזין ספרות בלבד").or(z.literal("")).optional(),
      email: z.string().min(1, "שדה חובה").email("כתובת מייל לא תקינה"),
      phone: z.string(),
      propertyPurpose: z.string(),
      propertyNumber: z.string(),
      propertyId: z.string(),
      propertyArea: isBusiness
        ? z.coerce.number().min(0)
        : z.coerce.number().positive("שטח חייב להיות גדול מ-0"),
      coveredBalconyArea: z.coerce.number().min(0).default(0),
      storageArea: z.coerce.number().min(0).default(0),
      parkingArea: z.coerce.number().min(0).default(0),
      address: z.string(),
      block: z.string(),
      parcel: z.string(),
      classificationCode: z.string(),
      zone: z.string(),
      subType: z.string(),
      reportedPayment: z.coerce.number().positive("סכום חייב להיות גדול מ-0"),
      paymentPeriod: z.string().default("bimonthly"),
      designations: z.array(designationRowSchema).default([]),
      additionalAreas: z.array(z.object({
        areaType: z.string(),
        areaSqm: z.coerce.number().min(0).default(0),
      })).default([]),
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

  // Clear downstream when type changes
  useEffect(() => {
    if (prevRowType.current === rowType) return;
    prevRowType.current = rowType;
    setValue(`designations.${idx}.subtype` as const, "");
    setValue(`designations.${idx}.zone` as const, "");
  }, [rowType, idx, setValue]);

  // Clear or default zone when subtype changes
  useEffect(() => {
    if (prevRowSubtype.current === rowSubtype) return;
    prevRowSubtype.current = rowSubtype;
    const typeObj = types.find((t) => t.code === rowType);
    const zones = typeObj?.subtypes.find((s) => s.code === rowSubtype)?.zones ?? [];
    if (rowSubtype && rowType && zones.length === 0) {
      setValue(`designations.${idx}.zone` as const, ALL_ZONES_TARIFF_CODE);
    } else {
      setValue(`designations.${idx}.zone` as const, "");
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
          <IconButton onClick={onRemove} size="small" color="error" aria-label="מחק ייעוד">
            <DeleteIcon />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function DataEntryStep({ state, dispatch }: StepProps) {
  const cityData = state.cityData;
  const isBusiness = state.propertyType === "business";
  const hasAreaTypeDiscounts = !!(cityData?.areaTypeDiscounts?.length > 0);
  const hasCityFees = !!(cityData?.cityFees?.length > 0);

  // ── Mia message on mount ──
  useEffect(() => {
    dispatch({ type: 'SET_MIA_MESSAGE', payload: 'step-2-default' });
  }, [dispatch]);

  // Extract types from city data
  const types: IPropertyType[] =
    cityData?.types.filter(
      (t: IPropertyType) => t.category === state.propertyType,
    ) ?? [];

  const schema = useMemo(
    () => createDataEntrySchema(isBusiness),
    [isBusiness],
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      fullName: state.fullName,
      idNumber: state.idNumber,
      email: state.email,
      phone: state.phone,
      propertyPurpose: isBusiness ? state.propertyPurpose : types[0]?.code,
      propertyNumber: state.propertyNumber,
      propertyId: state.propertyId,
      propertyArea: state.propertyArea || ("" as any),
      coveredBalconyArea: state.coveredBalconyArea || ("" as any),
      storageArea: state.storageArea || ("" as any),
      parkingArea: state.parkingArea || ("" as any),
      address: state.address,
      block: state.block,
      parcel: state.parcel,
      classificationCode: state.classificationCode,
      zone: state.zone,
      subType: state.subType,
      reportedPayment: state.reportedPayment || ("" as any),
      paymentPeriod: state.paymentPeriod || "bimonthly",
      designations: state.designations,
      additionalAreas: state.additionalAreas?.length > 0
        ? state.additionalAreas
        : (cityData?.areaTypeDiscounts ?? []).map((d: any) => ({ areaType: d.areaType, areaSqm: '' as any })),
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
  // const watchedClassCode = watch('classificationCode');
  const watchedBalcony = watch("coveredBalconyArea");
  const watchedStorage = watch("storageArea");
  const watchedParking = watch("parkingArea");

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
    const totalArea =
      (Number(watchedArea) || 0) +
      (Number(watchedBalcony) || 0) +
      (Number(watchedStorage) || 0) +
      (Number(watchedParking) || 0);
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
    watchedBalcony,
    watchedStorage,
    watchedParking,
  ]);

  // ── Forward cascade: type changes → clear downstream ───────────
  useEffect(() => {
    if (prevTypeRef.current === watchedType) return;
    prevTypeRef.current = watchedType;
    prevSubTypeRef.current = "";
    prevZoneRef.current = "";
    // prevClassCodeRef.current = '';
    setValue("subType", "");
    setValue("zone", "");
    setValue("classificationCode", "");
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
      setValue("zone", ALL_ZONES_TARIFF_CODE);
    } else {
      setValue("zone", "");
    }
    setValue("classificationCode", "");
  }, [watchedSubType, watchedType, setValue, types]);

  // ── Error report state ──
  const [claimedArea, setClaimedArea] = useState<number>(state.measurementError?.claimed ?? 0);
  const [suggestedClass, setSuggestedClass] = useState(state.classificationError?.suggested ?? '');
  const allSubtypes: ISubType[] = cityData?.types.flatMap((t: IPropertyType) => t.subtypes) ?? [];

  // ── Auto-save lead when name + phone are filled ──
  const watchedFullName = useWatch({ control, name: "fullName" });
  const watchedPhone = useWatch({ control, name: "phone" });
  const watchedEmail = useWatch({ control, name: "email" });
  const watchedIdNumber = useWatch({ control, name: "idNumber" });
  const leadSavedRef = useRef(false);

  const saveLeadEarly = useCallback(async (fullName: string, phone: string, email: string, idNumber: string) => {
    if (state.leadId) return; // Already saved
    if (leadSavedRef.current) return;
    leadSavedRef.current = true;

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          email: email || undefined,
          idNumber: idNumber || undefined,
          source: 'calculator',
          calculation: {
            abandonmentStage: 'data_entry',
            propertyType: state.propertyType,
            citySlug: state.citySlug,
          },
        }),
      });

      if (res.ok) {
        const result = await res.json();
        dispatch({ type: 'SET_LEAD_ID', payload: String(result.lead._id) });
        dispatch({ type: 'SET_CALCULATION_INDEX', payload: result.calculationIndex });
      } else {
        leadSavedRef.current = false; // Allow retry on failure
      }
    } catch {
      leadSavedRef.current = false; // Allow retry on failure
    }
  }, [state.leadId, state.propertyType, state.citySlug, dispatch]);

  useEffect(() => {
    const name = watchedFullName?.trim();
    const phone = watchedPhone?.trim();
    if (!name || !phone || name.length < 2 || phone.length < 9) return;

    const timeout = setTimeout(() => {
      saveLeadEarly(name, phone, watchedEmail || '', watchedIdNumber || '');
    }, 800);

    return () => clearTimeout(timeout);
  }, [watchedFullName, watchedPhone, watchedEmail, watchedIdNumber, saveLeadEarly]);

  const onSubmit = async (data: FormData) => {
    const fieldKeys = Object.keys(data) as (keyof FormData)[];
    for (const key of fieldKeys) {
      if (key === "designations") {
        dispatch({
          type: "SET_DESIGNATIONS",
          payload: data.designations as any,
        });
      } else if (key === "additionalAreas") {
        // Filter out zero-area entries and dispatch
        const filtered = (data.additionalAreas ?? []).filter((a) => a.areaSqm > 0);
        dispatch({ type: "UPDATE_FIELD", field: "additionalAreas", value: filtered });
      } else if (key === "selectedFees") {
        dispatch({ type: "UPDATE_FIELD", field: "selectedFees", value: data.selectedFees ?? [] });
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
    // Dispatch error report data
    if (claimedArea > 0) {
      dispatch({
        type: 'SET_MEASUREMENT_ERROR',
        payload: { claimed: claimedArea, attachment: '' },
      });
    } else {
      dispatch({ type: 'SET_MEASUREMENT_ERROR', payload: null });
    }
    if (suggestedClass) {
      dispatch({
        type: 'SET_CLASSIFICATION_ERROR',
        payload: { suggested: suggestedClass },
      });
    } else {
      dispatch({ type: 'SET_CLASSIFICATION_ERROR', payload: null });
    }

    // Update lead with full property details
    if (data.phone && data.fullName) {
      try {
        if (state.leadId) {
          // Lead already exists (created by auto-save) — update with property details
          await fetch(`/api/leads/${state.leadId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
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
                blockParcel: data.block && data.parcel ? { block: data.block, parcel: data.parcel } : undefined,
                propertyArea: data.propertyArea || undefined,
                coveredBalconyArea: data.coveredBalconyArea || undefined,
                storageArea: data.storageArea || undefined,
                parkingArea: data.parkingArea || undefined,
                classificationCode: data.classificationCode || undefined,
                zone: isBusiness ? undefined : data.zone || undefined,
                bimonthlyPayment: bimonthly || undefined,
                designations: isBusiness ? data.designations : undefined,
              },
            }),
          });
        } else {
          // Lead not yet created (auto-save didn't fire) — create now with full data
          const res = await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fullName: data.fullName,
              phone: data.phone,
              email: data.email || undefined,
              idNumber: data.idNumber || undefined,
              source: 'calculator',
              calculation: {
                abandonmentStage: 'data_entry',
                propertyType: state.propertyType,
                citySlug: state.citySlug,
                propertyNumber: data.propertyNumber || undefined,
                propertyId: data.propertyId || undefined,
                address: data.address || undefined,
                blockParcel: data.block && data.parcel ? { block: data.block, parcel: data.parcel } : undefined,
                propertyArea: data.propertyArea || undefined,
                coveredBalconyArea: data.coveredBalconyArea || undefined,
                storageArea: data.storageArea || undefined,
                parkingArea: data.parkingArea || undefined,
                classificationCode: data.classificationCode || undefined,
                zone: isBusiness ? undefined : data.zone || undefined,
                bimonthlyPayment: bimonthly || undefined,
                designations: isBusiness ? data.designations : undefined,
              },
            }),
          });

          if (res.ok) {
            const result = await res.json();
            dispatch({ type: 'SET_LEAD_ID', payload: String(result.lead._id) });
            dispatch({ type: 'SET_CALCULATION_INDEX', payload: result.calculationIndex });
          }
        }
      } catch {
        // Non-blocking: continue even if save fails
      }
    }

    dispatch({ type: "NEXT_STEP" });
  };

  const fieldsGridSx = {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(min(100%, 150px), 1fr))",
    gap: 2,
    width: "100%",
    minWidth: 0,
  } as const;

  const fullRowSx = { gridColumn: "1 / -1" } as const;

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      sx={{ minWidth: 0 }}
    >
      <Typography variant="h6" component="h2" textAlign="center" sx={{ mb: 2 }}>
        מילוי פרטים
      </Typography>

      <Box sx={fieldsGridSx}>
        {/* 1. פרטי המשתמש */}
        <Box sx={fullRowSx}>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            fontWeight={600}
            sx={{ mt: 0, mb: 0.5 }}
          >
            פרטי המשתמש
          </Typography>
          <Divider sx={{ mb: 0 }} />
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
              <TextField {...field} label="טלפון *" fullWidth size="small" />
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
            <Typography
              variant="subtitle1"
              color="text.secondary"
              fontWeight={600}
              sx={{ mt: 1.5, mb: 0.5 }}
            >
              ייעודים עסקיים
            </Typography>
            <Divider sx={{ mb: 2 }} />

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
{!isBusiness &&     <>   <Box sx={fullRowSx}>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            fontWeight={600}
            sx={{ mt: 1.5, mb: 0.5 }}
          >
            סיווג הנכס
          </Typography>
          <Divider sx={{ mb: 0 }} />
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
              >
                <MenuItem value="">בחר</MenuItem>
                <MenuItem value={ALL_ZONES_TARIFF_CODE}>
                  {ALL_ZONES_LABEL_HE} ({ALL_ZONES_TARIFF_CODE})
                </MenuItem>
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
                label='שטח הנכס (מ"ר) *'
                type="number"
                fullWidth
                size="small"
                error={!!errors.propertyArea}
                helperText={errors.propertyArea?.message}
              />
            )}
          />
        </Box>
        {/* Dynamic area type fields OR legacy hardcoded fields */}
        {hasAreaTypeDiscounts ? (
          <>
            {(cityData.areaTypeDiscounts as any[]).map((d: any, idx: number) => (
              <Box key={d.areaType} sx={{ minWidth: 0 }}>
                <Controller
                  name={`additionalAreas.${idx}.areaSqm` as const}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={`${d.label} (מ"ר)`}
                      type="number"
                      fullWidth
                      size="small"
                      helperText={`הנחה ${d.discountPercent}%`}
                    />
                  )}
                />
              </Box>
            ))}
          </>
        ) : (
          <>
            <Box sx={{ minWidth: 0 }}>
              <Controller
                name="coveredBalconyArea"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label='מרפסת מקורה (מ"ר)'
                    type="number"
                    fullWidth
                    size="small"
                  />
                )}
              />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Controller
                name="storageArea"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label='מחסן (מ"ר)'
                    type="number"
                    fullWidth
                    size="small"
                  />
                )}
              />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Controller
                name="parkingArea"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label='חניה (מ"ר)'
                    type="number"
                    fullWidth
                    size="small"
                  />
                )}
              />
            </Box>
          </>
        )}

        {/* City fees selection */}
        {hasCityFees && (cityData.cityFees as any[]).some((f: any) => !f.isMandatory) && (
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
                              field.onChange(current.filter((n: string) => n !== f.name));
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
        )}</>}

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
          <Typography
            variant="subtitle1"
            color="text.secondary"
            fontWeight={600}
            sx={{ mt: 1.5, mb: 0.5 }}
          >
            פרטי הנכס
          </Typography>
          <Divider sx={{ mb: 0 }} />
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
        <Box sx={{ ...fullRowSx, minWidth: 0 }}>
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="כתובת" fullWidth size="small" />
            )}
          />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Controller
            name="block"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="גוש" fullWidth size="small" />
            )}
          />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Controller
            name="parcel"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="חלקה" fullWidth size="small" />
            )}
          />
        </Box>

        {/* 4. תשלום */}
        <Box sx={fullRowSx}>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            fontWeight={600}
            sx={{ mt: 1.5, mb: 0.5 }}
          >
            תשלום
          </Typography>
          <Divider sx={{ mb: 0 }} />
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

      {/* 5. דיווח על שגיאות (אופציונלי) */}
      <Typography
        variant="subtitle1"
        color="text.secondary"
        fontWeight={600}
        sx={{ mt: 3, mb: 0.5 }}
      >
        דיווח על שגיאות (אופציונלי)
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="body2" color="text.secondary" mb={2}>
        אם אתה סבור שיש שגיאה בנתוני הנכס שלך, תוכל לדווח כאן
      </Typography>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>טעות במדידה</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            label='שטח מתוקן (מ"ר)'
            type="number"
            value={claimedArea || ''}
            onChange={(e) => setClaimedArea(Number(e.target.value))}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
          />
          <Button variant="outlined" size="small" disabled>
            צרף קובץ מדידה (בקרוב)
          </Button>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>טעות בסיווג</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            label="סיווג מוצע"
            select
            value={suggestedClass}
            onChange={(e) => setSuggestedClass(e.target.value)}
            fullWidth
            size="small"
          >
            <MenuItem value="">בחר</MenuItem>
            {allSubtypes.map((s: ISubType) => (
              <MenuItem key={s.code} value={s.code}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>
        </AccordionDetails>
      </Accordion>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
        <Button
          variant="outlined"
          onClick={() => dispatch({ type: "PREV_STEP" })}
        >
          חזרה
        </Button>
        <Button variant="contained" type="submit">
          הבא
        </Button>
      </Box>
    </Box>
  );
}
