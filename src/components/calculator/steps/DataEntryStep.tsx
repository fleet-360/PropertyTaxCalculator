'use client';

import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { StepProps } from '../CalculatorWizard';

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
  bimonthlyPayment: number;
  designations: { type: string; subtype: string; zone: string; area: number }[];
}

const baseSchema = z.object({
  fullName: z.string().min(1, 'שדה חובה'),
  idNumber: z.string().regex(/^\d{9}$/, 'יש להזין 9 ספרות'),
  email: z.string().email('כתובת מייל לא תקינה').or(z.literal('')),
  phone: z.string(),
  propertyPurpose: z.string(),
  propertyNumber: z.string(),
  propertyId: z.string(),
  propertyArea: z.coerce.number().positive('שטח חייב להיות גדול מ-0'),
  coveredBalconyArea: z.coerce.number().min(0).default(0),
  storageArea: z.coerce.number().min(0).default(0),
  parkingArea: z.coerce.number().min(0).default(0),
  address: z.string(),
  block: z.string(),
  parcel: z.string(),
  classificationCode: z.string(),
  zone: z.string(),
  subType: z.string(),
  bimonthlyPayment: z.coerce.number().positive('סכום חייב להיות גדול מ-0'),
  designations: z
    .array(
      z.object({
        type: z.string(),
        subtype: z.string(),
        zone: z.string(),
        area: z.coerce.number().min(0),
      })
    )
    .default([]),
});

export default function DataEntryStep({ state, dispatch }: StepProps) {
  const cityData = state.cityData;
  const isBusiness = state.propertyType === 'business';

  // Extract options from city data
  const types: string[] = cityData?.types ?? [];
  const subtypes: string[] = cityData?.subtypes ?? [];
  const zones: string[] = cityData?.zones ?? [];

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(baseSchema) as any,
    defaultValues: {
      fullName: state.fullName,
      idNumber: state.idNumber,
      email: state.email,
      phone: state.phone,
      propertyPurpose: state.propertyPurpose,
      propertyNumber: state.propertyNumber,
      propertyId: state.propertyId,
      propertyArea: state.propertyArea || ('' as any),
      coveredBalconyArea: state.coveredBalconyArea || ('' as any),
      storageArea: state.storageArea || ('' as any),
      parkingArea: state.parkingArea || ('' as any),
      address: state.address,
      block: state.block,
      parcel: state.parcel,
      classificationCode: state.classificationCode,
      zone: state.zone,
      subType: state.subType,
      bimonthlyPayment: state.bimonthlyPayment || ('' as any),
      designations: state.designations,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'designations' });

  const onSubmit = (data: FormData) => {
    // Persist every field into wizard state
    const fieldKeys = Object.keys(data) as (keyof FormData)[];
    for (const key of fieldKeys) {
      if (key === 'designations') {
        dispatch({ type: 'SET_DESIGNATIONS', payload: data.designations as any });
      } else {
        dispatch({ type: 'UPDATE_FIELD', field: key as any, value: data[key] });
      }
    }
    dispatch({ type: 'NEXT_STEP' });
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Typography variant="h5" textAlign="center" mb={3}>
        פרטי הנכס
      </Typography>

      <Grid container spacing={2}>
        {/* Personal info */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="fullName"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="שם מלא *" fullWidth error={!!errors.fullName} helperText={errors.fullName?.message} />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="idNumber"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="ת.ז./ח.פ *" fullWidth error={!!errors.idNumber} helperText={errors.idNumber?.message} />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="אימייל" fullWidth error={!!errors.email} helperText={errors.email?.message} />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => <TextField {...field} label="טלפון" fullWidth />}
          />
        </Grid>

        <Grid size={12}>
          <Divider sx={{ my: 1 }} />
        </Grid>

        {/* Property info */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="propertyPurpose"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="ייעוד הנכס" select fullWidth>
                <MenuItem value="">בחר</MenuItem>
                {types.map((t: string) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Controller
            name="propertyNumber"
            control={control}
            render={({ field }) => <TextField {...field} label="מספר נכס" fullWidth />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Controller
            name="propertyId"
            control={control}
            render={({ field }) => <TextField {...field} label="זיהוי נכס" fullWidth />}
          />
        </Grid>

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
            render={({ field }) => <TextField {...field} label='מרפסת מקורה (מ"ר)' type="number" fullWidth />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Controller
            name="storageArea"
            control={control}
            render={({ field }) => <TextField {...field} label='מחסן (מ"ר)' type="number" fullWidth />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Controller
            name="parkingArea"
            control={control}
            render={({ field }) => <TextField {...field} label='חניה (מ"ר)' type="number" fullWidth />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="address"
            control={control}
            render={({ field }) => <TextField {...field} label="כתובת" fullWidth />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Controller
            name="block"
            control={control}
            render={({ field }) => <TextField {...field} label="גוש" fullWidth />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Controller
            name="parcel"
            control={control}
            render={({ field }) => <TextField {...field} label="חלקה" fullWidth />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="classificationCode"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="קוד סיווג" select fullWidth>
                <MenuItem value="">בחר</MenuItem>
                {subtypes.map((s: string) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="subType"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="סוג/סיווג" select fullWidth>
                <MenuItem value="">בחר</MenuItem>
                {subtypes.map((s: string) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="zone"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="אזור" select fullWidth>
                <MenuItem value="">בחר</MenuItem>
                {zones.map((z: string) => (
                  <MenuItem key={z} value={z}>{z}</MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>

        <Grid size={12}>
          <Controller
            name="bimonthlyPayment"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="תשלום דו-חודשי (₪) *"
                type="number"
                fullWidth
                error={!!errors.bimonthlyPayment}
                helperText={errors.bimonthlyPayment?.message}
              />
            )}
          />
        </Grid>
      </Grid>

      {/* Business designations */}
      {isBusiness && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" mb={2}>
            ייעודים עסקיים
          </Typography>
          {fields.map((field, idx) => (
            <Grid container spacing={2} key={field.id} sx={{ mb: 1 }}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Controller
                  name={`designations.${idx}.type`}
                  control={control}
                  render={({ field: f }) => (
                    <TextField {...f} label="סוג" select fullWidth size="small">
                      <MenuItem value="">בחר</MenuItem>
                      {types.map((t: string) => (
                        <MenuItem key={t} value={t}>{t}</MenuItem>
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
                      {subtypes.map((s: string) => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
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
                      {zones.map((z: string) => (
                        <MenuItem key={z} value={z}>{z}</MenuItem>
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
                    <TextField {...f} label='שטח (מ"ר)' type="number" fullWidth size="small" />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 2, sm: 1 }} sx={{ display: 'flex', alignItems: 'center' }}>
                {fields.length > 1 && (
                  <IconButton onClick={() => remove(idx)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                )}
              </Grid>
            </Grid>
          ))}
          {fields.length < 4 && (
            <Button
              startIcon={<AddIcon />}
              onClick={() => append({ type: '', subtype: '', zone: '', area: 0 })}
              size="small"
              sx={{ mt: 1 }}
            >
              הוסף ייעוד
            </Button>
          )}
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button variant="outlined" onClick={() => dispatch({ type: 'PREV_STEP' })}>
          חזרה
        </Button>
        <Button variant="contained" type="submit">
          הבא
        </Button>
      </Box>
    </Box>
  );
}
