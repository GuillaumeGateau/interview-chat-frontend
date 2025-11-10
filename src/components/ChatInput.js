import React from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { theme } from '../theme';
import { getTranslation } from '../i18n';

function ChatInput({ value, onChange, onSubmit, onKeyDown, disabled, language = 'en' }) {
  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 2.5,
        borderTop: `1px solid ${theme.colors.border}`,
        backgroundColor: theme.colors.surface,
      }}
    >
      <TextField
        placeholder={getTranslation('typeQuestion', language)}
        sx={{
          fontFamily: '"museo-sans", sans-serif',
          '& .MuiOutlinedInput-root': {
            borderRadius: '24px',
            backgroundColor: theme.colors.background,
            '&:hover': {
              backgroundColor: '#f1f5f9',
            },
            '&.Mui-focused': {
              backgroundColor: theme.colors.surface,
              '& fieldset': {
                borderColor: theme.colors.primary,
              },
            },
          },
        }}
        variant="outlined"
        fullWidth
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        disabled={disabled}
      />
      <IconButton
        color="primary"
        type="submit"
        disabled={disabled || !value.trim()}
        sx={{
          backgroundColor: theme.colors.primary,
          color: 'white',
          width: '48px',
          height: '48px',
          '&:hover': {
            backgroundColor: theme.colors.primaryDark,
          },
          '&.Mui-disabled': {
            backgroundColor: theme.colors.border,
            color: theme.colors.textMuted,
          },
        }}
      >
        <SendIcon />
      </IconButton>
    </Box>
  );
}

export default ChatInput;

