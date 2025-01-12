// initial-preferences.js
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  FormControlLabel,
  Switch,
  FormGroup,
  FormControl,
  FormLabel,
} from '@mui/material';

function InitialPreferences({ onSessionStart }) {
  const [name, setName] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoplayEnabled, setAutoplayEnabled] = useState(false);

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

// Add the form wrapper and onSubmit handler
  return (
    <Card sx={{ flexShrink: 0, mb: 1,  borderBottomLeftRadius: 0, borderBottomRightRadius: 0, boxShadow: '0 1px 1px rgba(0, 0, 0, 0.1)' }}>
      <CardContent>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) {
            handleInitSession();
          }
        }}>
          <Typography variant="h6" gutterBottom>
            What's your name?
          </Typography>
          
          <Stack spacing={2} mt={2}>
            <TextField
              label="Name"
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
            />

            <FormControl component="fieldset" variant="standard">
              <FormLabel component="legend">Communication Preferences</FormLabel>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={voiceEnabled}
                      onChange={(e) => setVoiceEnabled(e.target.checked)}
                    />
                  }
                  label="Voice Response"
                />
                {voiceEnabled && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoplayEnabled}
                        onChange={(e) => setAutoplayEnabled(e.target.checked)}
                      />
                    }
                    label="Auto-Play Voice Responses"
                  />
                )}
              </FormGroup>
            </FormControl>

            <Button 
              type="submit"
              variant="contained" 
              disabled={!name.trim()}
              fontColor="#1c6ca1"
            >
              Start Interviewing
            </Button>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
}

export default InitialPreferences;