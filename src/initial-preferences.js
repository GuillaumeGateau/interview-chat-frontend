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
} from '@mui/material';
import { theme } from './theme';

function InitialPreferences({ onSessionStart }) {
  const [name, setName] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);

  // Load initial preferences from localStorage
  useEffect(() => {
    const savedVoicePreference = localStorage.getItem('initialVoicePreference');
    const savedAutoplayPreference = localStorage.getItem('initialAutoplayPreference');

    if (savedVoicePreference !== null) {
      setVoiceEnabled(savedVoicePreference === 'true');
    }

    if (savedAutoplayPreference !== null) {
      setAutoplayEnabled(savedAutoplayPreference === 'true');
    }
  }, []);

  const handleInitSession = () => {
    // Save preferences to localStorage
    localStorage.setItem('initialVoicePreference', voiceEnabled.toString());
    localStorage.setItem('initialAutoplayPreference', autoplayEnabled.toString());

    onSessionStart({
      name,
      voiceEnabled,
      autoplayEnabled
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
      }}
    >
      <Card
        sx={{
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          borderRadius: '16px',
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
                mb: 3,
                fontWeight: 600,
                color: theme.colors.primary,
                fontFamily: '"museo-sans", sans-serif',
              }}
            >
              Welcome! Let's dive right in.
            </Typography>

            <Stack spacing={3} mt={2}>
              <TextField
                label="What's your name?"
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
                  Communication Preferences
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  <Chip
                    label="Voice Response"
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
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
                      variant={autoplayEnabled ? 'filled' : 'outlined'}
                      onClick={() => setAutoplayEnabled(!autoplayEnabled)}
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
                Start Interviewing
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

export default InitialPreferences;