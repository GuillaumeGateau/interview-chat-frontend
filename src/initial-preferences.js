// initial-preferences.js
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Chip,
  Box,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { theme } from './theme';
import { getTranslation } from './i18n';

function InitialPreferences({ onSessionStart }) {
  const [name, setName] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const [language, setLanguage] = useState('en'); // 'en' or 'fr'

  // Load initial preferences from localStorage
  useEffect(() => {
    const savedVoicePreference = localStorage.getItem('initialVoicePreference');
    const savedAutoplayPreference = localStorage.getItem('initialAutoplayPreference');
    const savedLanguage = localStorage.getItem('languagePreference');

    if (savedVoicePreference !== null) {
      setVoiceEnabled(savedVoicePreference === 'true');
    }

    if (savedAutoplayPreference !== null) {
      setAutoplayEnabled(savedAutoplayPreference === 'true');
    }

    // Always default to 'en' on initial load - ignore saved preference for now
    // This ensures the app always starts in English
    setLanguage('en');
    // Don't save to localStorage here - let user explicitly choose
  }, []);

  const handleInitSession = () => {
    // Save preferences to localStorage
    localStorage.setItem('initialVoicePreference', voiceEnabled.toString());
    localStorage.setItem('initialAutoplayPreference', autoplayEnabled.toString());
    localStorage.setItem('languagePreference', language);

    onSessionStart({
      name,
      voiceEnabled,
      autoplayEnabled,
      language
    });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        p: 4,
        background: theme.gradients.primary,
        minHeight: '100%',
      }}
    >
      <Card
        sx={{
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          borderRadius: '16px',
          backgroundColor: 'white',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) {
                handleInitSession();
              }
            }}
          >
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                textAlign: 'center',
                mb: 2,
                fontWeight: 600,
                color: theme.colors.primary,
                fontFamily: '"museo-sans", sans-serif',
                fontSize: {
                  xs: '1.25rem', // Smaller on mobile
                  sm: '1.5rem',  // Medium on small tablets
                  md: '1.75rem', // Full size on larger screens
                },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {getTranslation('welcome', language)}
            </Typography>

            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
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
                    onChange={() => setLanguage(language === 'en' ? 'fr' : 'en')}
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

            <Stack spacing={3} mt={2}>
              <TextField
                label={getTranslation('nameLabel', language)}
                variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && name.trim()) {
                    e.preventDefault();
                    handleInitSession();
                  }
                }}
                fullWidth
                autoComplete="off"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '& fieldset': {
                      borderColor: theme.colors.border,
                    },
                    '&:hover fieldset': {
                      borderColor: theme.colors.primaryLight,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.colors.primary,
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: theme.colors.primary,
                  },
                }}
              />

              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    mb: 2,
                    color: '#666',
                    fontWeight: 500,
                  }}
                >
                  {getTranslation('communicationPreferences', language)}
                </Typography>
                <Stack direction="column" spacing={1.5}>
                  <Chip
                    label={getTranslation('voiceResponse', language)}
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    sx={{
                      cursor: 'pointer',
                      fontWeight: 600,
                      backgroundColor: voiceEnabled ? theme.colors.primary : theme.colors.border,
                      color: voiceEnabled ? 'white' : theme.colors.textLight,
                      width: 'fit-content',
                      '&:hover': {
                        backgroundColor: voiceEnabled ? theme.colors.primaryDark : theme.colors.textMuted,
                      },
                    }}
                  />
                  {voiceEnabled && (
                    <Chip
                      label={autoplayEnabled ? getTranslation('autoplayOn', language) : getTranslation('autoplayOff', language)}
                      variant={autoplayEnabled ? 'filled' : 'outlined'}
                      onClick={() => setAutoplayEnabled(!autoplayEnabled)}
                      sx={{
                        cursor: 'pointer',
                        fontWeight: 600,
                        backgroundColor: autoplayEnabled ? theme.colors.primary : 'transparent',
                        color: autoplayEnabled ? 'white' : theme.colors.primary,
                        borderColor: theme.colors.primary,
                        width: 'fit-content',
                        '&:hover': {
                          backgroundColor: autoplayEnabled ? theme.colors.primaryDark : 'rgba(99, 102, 241, 0.1)',
                        },
                      }}
                    />
                  )}
                </Stack>
              </Box>

              <Button
                type="submit"
                variant="contained"
                disabled={!name.trim()}
                fullWidth
                sx={{
                  mt: 2,
                  py: 1.5,
                  borderRadius: '12px',
                  background: theme.gradients.primary,
                  color: '#ffffff !important',
                  fontWeight: 600,
                  fontSize: '1rem',
                  textTransform: 'none',
                  '&:hover': {
                    background: theme.gradients.header,
                    color: '#ffffff !important',
                  },
                  '&.Mui-disabled': {
                    backgroundColor: theme.colors.border,
                    color: theme.colors.textMuted,
                    background: theme.colors.border,
                  },
                  '& .MuiButton-label': {
                    color: '#ffffff',
                  },
                }}
              >
                {getTranslation('startInterviewing', language)}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

export default InitialPreferences;