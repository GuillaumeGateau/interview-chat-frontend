import React from 'react';
import { Box, Chip, FormControlLabel, Switch, Typography } from '@mui/material';
import { theme } from '../theme';
import { getTranslation } from '../i18n';

function ChatControls({ voiceEnabled, autoplayEnabled, language, onVoiceToggle, onAutoplayToggle, onLanguageToggle }) {
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
        '& > *': {
          flexShrink: 0,
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
        <Typography 
          variant="body2" 
          sx={{ 
            color: language === 'en' ? theme.colors.text : theme.colors.textLight, 
            fontWeight: language === 'en' ? 600 : 400,
            fontSize: '0.875rem',
            fontFamily: '"museo-sans", sans-serif',
          }}
        >
          {getTranslation('english', language)}
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={language === 'fr'}
              onChange={onLanguageToggle}
              sx={{
                '& .MuiSwitch-switchBase': {
                  color: '#ffffff',
                },
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#ffffff',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: language === 'fr' ? theme.colors.primary : '#9B9B9B',
                },
                '& .MuiSwitch-track': {
                  backgroundColor: language === 'fr' ? theme.colors.primary : '#9B9B9B',
                },
                '& .MuiSwitch-thumb': {
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                },
              }}
            />
          }
          label=""
          sx={{ m: 0 }}
        />
        <Typography 
          variant="body2" 
          sx={{ 
            color: language === 'fr' ? theme.colors.primary : theme.colors.textLight, 
            fontWeight: language === 'fr' ? 600 : 400,
            fontSize: '0.875rem',
            fontFamily: '"museo-sans", sans-serif',
          }}
        >
          {getTranslation('french', language)}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'nowrap', alignItems: 'center' }}>
        <Chip
          label={getTranslation('voiceResponse', language)}
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
            flexShrink: 0,
          }}
        />
        {voiceEnabled && (
          <Chip
            label={autoplayEnabled ? getTranslation('autoplayOn', language) : getTranslation('autoplayOff', language)}
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
              flexShrink: 0,
            }}
          />
        )}
      </Box>
    </Box>
  );
}

export default ChatControls;

