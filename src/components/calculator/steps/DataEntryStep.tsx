"use client";

import { useEffect, useMemo, useRef } from "react";
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
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Alert from "@mui/material/Alert";
import type { StepProps } from "../CalculatorWizard";
import { IPropertyType, ISubType, IZoneRate } from "@/lib/models/CityTariff";
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
}

const baseSchema = z.object({
  fullName: z.string().min(1, "שדה חובה"),
  idNumber: z.string().regex(/^\d+$/, "יש להזין ספרות בלבד"),
  email: z.string().email("כתובת מייל לא תקינה").or(z.literal("")),
  phone: z.string(),
  propertyPurpose: z.string(),
  propertyNumber: z.string(),
  propertyId: z.string(),
  propertyArea: z.coerce.number().positive("שטח חייב להיות גדול מ-0"),
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
  designations: z
    .array(
      z.object({
        type: z.string(),
        subtype: z.string(),
        zone: z.string(),
        area: z.coerce.number().min(0),
      }),
    )
    .default([]),
});

// ── Helper: resolve property code from tariff tree ────────────────
function resolvePropertyCode(
  types: IPropertyType[],
  typeCode: string,
  subtypeCode: string,
  zoneCode: string,
  area?: number,
): string {
  const type = types.find((t) => t.code === typeCode);
  const subtype = type?.subtypes.find((s) => s.code === subtypeCode);
  const zone = subtype?.zones.find((z) => z.zone === zoneCode);
  if (!zone) return "";

  if (zone.propertyCode) return zone.propertyCode;

  if (zone.sizeRanges && area && area > 0) {
    const match = zone.sizeRanges.find(
      (sr) => area >= sr.min && (sr.max === -1 || area <= sr.max),
    );
    if (match?.propertyCode) return match.propertyCode;
  }
  return "";
}

// ── DesignationRow: per-row cascading for business designations ───
function DesignationRow({
  idx,
  control,
  setValue,
  types,
  removable,
  onRemove,
}: {
  idx: number;
  control: Control<FormData>;
  setValue: UseFormSetValue<FormData>;
  types: IPropertyType[];
  removable: boolean;
  onRemove: () => void;
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

  // Clear zone when subtype changes
  useEffect(() => {
    if (prevRowSubtype.current === rowSubtype) return;
    prevRowSubtype.current = rowSubtype;
    setValue(`designations.${idx}.zone` as const, "");
  }, [rowSubtype, idx, setValue]);

  return (
    <Grid container spacing={2} sx={{ mb: 1 }}>
      <Grid size={{ xs: 12, sm: 3 }}>
        <Controller
          name={`designations.${idx}.type`}
          control={control}
          render={({ field: f }) => (
            <TextField {...f} label="סוג" select fullWidth size="small">
              <MenuItem value="">בחר</MenuItem>
              {types.map((t: IPropertyType) => (
                <MenuItem key={t.code} value={t.code}>
                  {t.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 3 }}>
        <Controller
          name={`designations.${idx}.subtype`}
          control={control}
          render={({ field: f }) => (
            <TextField {...f} label="תת-סוג" select fullWidth size="small">
              <MenuItem value="">בחר</MenuItem>
              {rowFilteredSubtypes.map((s: ISubType) => (
                <MenuItem key={s.code} value={s.code}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 3 }}>
        <Controller
          name={`designations.${idx}.zone`}
          control={control}
          render={({ field: f }) => (
            <TextField {...f} label="אזור" select fullWidth size="small">
              <MenuItem value="">בחר</MenuItem>
              {rowFilteredZones.map((z: IZoneRate) => (
                <MenuItem key={z.zone} value={z.zone}>
                  {z.zoneLabel}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </Grid>
      <Grid size={{ xs: 10, sm: 2 }}>
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
            />
          )}
        />
      </Grid>
      <Grid
        size={{ xs: 2, sm: 1 }}
        sx={{ display: "flex", alignItems: "center" }}
      >
        {removable && (
          <IconButton onClick={onRemove} size="small" color="error">
            <DeleteIcon />
          </IconButton>
        )}
      </Grid>
    </Grid>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function DataEntryStep({ state, dispatch }: StepProps) {
  const cityData = state.cityData;
  const isBusiness = state.propertyType === "business";

  // Extract types from city data
  const types: IPropertyType[] =
    cityData?.types.filter(
      (t: IPropertyType) => t.category === state.propertyType,
    ) ?? [];

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(baseSchema) as any,
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
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "designations",
  });

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
    const selectedType = types.find((t) => t.code === watchedType);
    const selectedSubtype = selectedType?.subtypes.find(
      (s) => s.code === watchedSubType,
    );
    return selectedSubtype?.zones ?? [];
  }, [types, watchedType, watchedSubType]);

  // ── Live rate computation ────────────────────────────────────────
  const liveRate = useMemo(() => {
    if (!cityData || !watchedType || !watchedSubType || !watchedZone)
      return null;
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

  // ── Forward cascade: subType changes → clear zone & code ───────
  useEffect(() => {
    if (prevSubTypeRef.current === watchedSubType) return;
    prevSubTypeRef.current = watchedSubType;
    prevZoneRef.current = "";
    // prevClassCodeRef.current = '';
    setValue("zone", "");
    setValue("classificationCode", "");
  }, [watchedSubType, setValue]);

  const onSubmit = (data: FormData) => {
    const fieldKeys = Object.keys(data) as (keyof FormData)[];
    for (const key of fieldKeys) {
      if (key === "designations") {
        dispatch({
          type: "SET_DESIGNATIONS",
          payload: data.designations as any,
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
    dispatch({ type: "NEXT_STEP" });
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Typography variant="h5" textAlign="center" mb={3}>
        מילוי פרטים
      </Typography>

      <Grid container spacing={2}>
        {/* 1. פרטי המשתמש */}
        <Grid size={12}>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ mt: 0, mb: 0.5 }}
          >
            פרטי המשתמש
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="fullName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="שם מלא *"
                fullWidth
                error={!!errors.fullName}
                helperText={errors.fullName?.message}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="idNumber"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="ת.ז./ח.פ *"
                fullWidth
                error={!!errors.idNumber}
                helperText={errors.idNumber?.message}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="אימייל"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="טלפון" fullWidth />
            )}
          />
        </Grid>

        {/* Business designations */}
        {isBusiness && (
          <Grid size={12}>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ mt: 2, mb: 0.5 }}
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
              />
            ))}
            {fields.length < 4 && (
              <Button
                startIcon={<AddIcon />}
                onClick={() =>
                  append({ type: "", subtype: "", zone: "", area: 0 })
                }
                size="small"
                sx={{ mt: 1 }}
              >
                הוסף ייעוד
              </Button>
            )}
          </Grid>
        )}

        {/* 2. סיווג הנכס — ייעוד → תת-סוג → אזור → קוד סיווג → שטחים */}
        <Grid size={12}>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ mt: 2, mb: 0.5 }}
          >
            סיווג הנכס
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        {!isBusiness && (
          <Grid size={{ xs: 12, sm: 3 }}>
            <Controller
              name="propertyPurpose"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="ייעוד הנכס" select fullWidth>
                  <MenuItem value="">בחר</MenuItem>
                  {types.map((t: IPropertyType) => (
                    <MenuItem key={t.code} value={t.code}>
                      {t.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
        )}
        <Grid size={{ xs: 12, sm: 3 }}>
          <Controller
            name="subType"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="סוג/סיווג"
                select
                fullWidth
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
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Controller
            name="zone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="אזור"
                select
                fullWidth
                disabled={!watchedSubType}
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
        </Grid>
        {/* <Grid size={{ xs: 12, sm: 3 }}>
          <Controller
            name="classificationCode"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="קוד סיווג" fullWidth />
            )}
          />
        </Grid> */}
        <Grid size={{ xs: 12, sm: 3 }}>
          <Controller
            name="propertyArea"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label='שטח הנכס (מ"ר) *'
                type="number"
                fullWidth
                error={!!errors.propertyArea}
                helperText={errors.propertyArea?.message}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Controller
            name="coveredBalconyArea"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label='מרפסת מקורה (מ"ר)'
                type="number"
                fullWidth
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Controller
            name="storageArea"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label='מחסן (מ"ר)'
                type="number"
                fullWidth
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Controller
            name="parkingArea"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label='חניה (מ"ר)'
                type="number"
                fullWidth
              />
            )}
          />
        </Grid>

        {/* תעריף חי (סיווג + שטחים) */}
        {liveRate && (
          <Grid size={12}>
            <Alert severity="info" sx={{ fontSize: "1.05rem" }}>
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
          </Grid>
        )}

        {/* 3. פרטי הנכס */}
        <Grid size={12}>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ mt: 2, mb: 0.5 }}
          >
            פרטי הנכס
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Controller
            name="propertyNumber"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="מספר נכס" fullWidth />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Controller
            name="propertyId"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="זיהוי נכס" fullWidth />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="כתובת" fullWidth />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Controller
            name="block"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="גוש" fullWidth />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Controller
            name="parcel"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="חלקה" fullWidth />
            )}
          />
        </Grid>

        {/* 4. תשלום */}
        <Grid size={12}>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ mt: 2, mb: 0.5 }}
          >
            תשלום
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 8 }}>
          <Controller
            name="reportedPayment"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="סכום תשלום (₪) *"
                type="number"
                fullWidth
                error={!!errors.reportedPayment}
                helperText={errors.reportedPayment?.message}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="paymentPeriod"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="תקופת תשלום" select fullWidth>
                {PAYMENT_PERIODS.map((p) => (
                  <MenuItem key={p.value} value={p.value}>
                    {p.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>
      </Grid>

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
