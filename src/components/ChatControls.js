import React from 'react';
import { Box, Chip } from '@mui/material';
import { theme } from '../theme';

function ChatControls({ voiceEnabled, autoplayEnabled, onVoiceToggle, onAutoplayToggle }) {
  return (
    <Box
      sx={{
        p: 2,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap',
        borderBottom: `1px solid ${theme.colors.border}`,
        backgroundColor: theme.colors.background,
      }}
    >
      <Chip
        label="Voice Response"
        color={voiceEnabled ? 'primary' : 'default'}
        onClick={onVoiceToggle}
        sx={{
          cursor: 'pointer',
          fontWeight: 600,
          backgroundColor: voiceEnabled ? theme.colors.primary : theme.colors.border,
          color: voiceEnabled ? 'white' : theme.colors.textLight,
          '&:hover': {
            backgroundColor: voiceEnabled ? theme.colors.primaryDark : theme.colors.textMuted,
          },
        }}
      />
      {voiceEnabled && (
        <Chip
          label={autoplayEnabled ? 'Auto-Play ON' : 'Auto-Play OFF'}
          color={autoplayEnabled ? 'primary' : 'default'}
          variant={autoplayEnabled ? 'filled' : 'outlined'}
          onClick={onAutoplayToggle}
          sx={{
            cursor: 'pointer',
            fontWeight: 600,
            backgroundColor: autoplayEnabled ? theme.colors.primary : 'transparent',
            color: autoplayEnabled ? 'white' : theme.colors.primary,
            borderColor: theme.colors.primary,
            '&:hover': {
              backgroundColor: autoplayEnabled ? theme.colors.primaryDark : 'rgba(99, 102, 241, 0.1)',
            },
          }}
        />
      )}
    </Box>
  );
}

export default ChatControls;

