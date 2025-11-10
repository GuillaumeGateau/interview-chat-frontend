import React from 'react';
import { Box, Typography } from '@mui/material';
import { theme } from '../theme';

function ChatHeader() {
  return (
    <Box
      sx={{
        p: 3,
        textAlign: 'center',
        borderBottom: `1px solid ${theme.colors.border}`,
        flexShrink: 0,
        background: theme.gradients.header,
        color: 'white',
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontFamily: '"museo-sans", sans-serif',
          fontWeight: 700,
          letterSpacing: '0.5px',
          mb: 0.5,
        }}
      >
        William AI
      </Typography>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          opacity: 0.95,
          fontSize: '0.85rem',
          fontWeight: 400,
        }}
      >
        Virtual Interviewer
      </Typography>
    </Box>
  );
}

export default ChatHeader;

