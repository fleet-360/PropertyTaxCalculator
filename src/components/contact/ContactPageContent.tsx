'use client';

import Image from 'next/image';
import { Container, Typography, Box } from '@mui/material';
import ContactPageForm from '@/components/contact/ContactPageForm';

export default function ContactPageContent() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          alignItems: 'center',
          gap: { xs: 4, md: 8 },
        }}
      >
        {/* Form (right column in RTL) */}
        <Box sx={{ width: '100%', maxWidth: 480, mx: { xs: 'auto', md: 0 } }}>
          <Typography
            component="h2"
            sx={(theme) => ({
              fontSize: { xs: '20px', md: '24px' },
              fontWeight: 700,
              color: theme.palette.brand.navyDeep,
              mb: 1,
              lineHeight: 1.4,
            })}
          >
            רוצים שנעזור לכם לקבל הנחה בחשבון הארנונה?
          </Typography>
          <Typography
            sx={(theme) => ({
              fontSize: { xs: '14px', md: '15px' },
              color: theme.palette.brand.blue,
              mb: { xs: 3, md: 4 },
            })}
          >
            השאירו פרטים ונציג מטעמנו יחזור אליכם בהקדם.
          </Typography>

          <ContactPageForm />

          <Typography
            sx={(theme) => ({
              fontSize: '11px',
              color: theme.palette.brand.textMuted,
              textAlign: 'center',
              mt: 2,
            })}
          >
            מאשר/ת לקבל עדכונים, מידע ותכנים שיווקיים
          </Typography>
        </Box>

        {/* Decorative image (left column in RTL) */}
        <Box
          sx={{
            order: { xs: -1, md: 0 },
            position: 'relative',
            width: '100%',
            maxWidth: 460,
            mx: 'auto',
            aspectRatio: '1 / 1',
          }}
        >
          <Image
            src="/images/calculator/doc-bill.png"
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 80vw, 40vw"
            style={{ objectFit: 'contain' }}
          />
        </Box>
      </Box>
    </Container>
  );
}
