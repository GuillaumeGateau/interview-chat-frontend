import React from 'react';
import { Box, Chip, FormControlLabel, Switch, Typography } from '@mui/material';
import { theme } from '../theme';
import { getTranslation } from '../i18n';

function ChatControls({
  voiceEnabled,
  autoplayEnabled,
  language,
  onVoiceToggle,
  onAutoplayToggle,
  onLanguageToggle,
}) {
  return (
    <Box
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: { xs: 'flex-start', sm: 'center' },
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: { xs: 1.5, sm: 2 },
        flexWrap: 'wrap',
        borderBottom: `1px solid ${theme.colors.border}`,
        backgroundColor: theme.colors.background,
        '& > *': {
          flexShrink: 0,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
          alignSelf: { xs: 'center', sm: 'auto' },
        }}
      >
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
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'row', sm: 'row' },
          alignItems: 'center',
          gap: { xs: 2, sm: 3 },
          width: { xs: '100%', sm: 'auto' },
          flexWrap: 'wrap',
          justifyContent: { xs: 'space-between', sm: 'center' },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            minWidth: { xs: '45%', sm: 'auto' },
            gap: 1,
            minWidth: { xs: '45%', sm: 'auto' },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: voiceEnabled ? theme.colors.text : theme.colors.textLight,
              fontWeight: 600,
              fontFamily: '"museo-sans", sans-serif',
            }}
          >
            {voiceEnabled
              ? (autoplayEnabled ? getTranslation('autoplayOn', language) : getTranslation('autoplayOff', language))
              : getTranslation('autoplayOff', language)}
          </Typography>
          <Switch
            checked={autoplayEnabled}
            onChange={onAutoplayToggle}
            disabled={!voiceEnabled}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: '#ffffff',
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: theme.colors.primary,
              },
              '& .MuiSwitch-track': {
                backgroundColor: theme.colors.border,
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default ChatControls;

