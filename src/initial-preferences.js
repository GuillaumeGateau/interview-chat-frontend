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
    <Card sx={{ flexShrink: 0, mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Interview Preferences
        </Typography>
        
        <Stack spacing={2} mt={2}>
          <TextField
            label="Name"
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            variant="contained" 
            onClick={handleInitSession}
            disabled={!name.trim()}
          >
            Start Interviewing
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default InitialPreferences;