// app.js
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Box,
  Switch,
  FormControlLabel,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { v4 as uuidv4 } from 'uuid';
import InitialPreferences from './initial-preferences';
import './App.css';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

function App() {
  // eslint-disable-next-line no-unused-vars
  const [name, setName] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const audioRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hi,I'm William's virtual AI interviewer. Ask me any question about my experience or approach to product. I'll do my best to answer!",
    },
  ]);
  const [userMessage, setUserMessage] = useState("");
  const chatContainerRef = useRef(null);
  const audioUrlsRef = useRef(new Set());

  useEffect(() => {
    const updateHeight = () => {
      const appHeight = window.innerHeight;
      document.documentElement.style.setProperty('--app-height', `${appHeight}px`);
    };
    window.addEventListener('resize', updateHeight);
    updateHeight();
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!voiceEnabled && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, [voiceEnabled]);

  // Cleanup audio URLs to prevent memory leaks
  useEffect(() => {
    // Capture the current value inside the effect
    const audioUrls = audioUrlsRef.current;
    
    return () => {
      audioUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const handleInitSession = useCallback((preferences) => {
    const { name, voiceEnabled, autoplayEnabled } = preferences;
    
    setName(name);
    setVoiceEnabled(voiceEnabled);
    setAutoplayEnabled(autoplayEnabled);
    
    const newId = uuidv4();
    setConversationId(newId);
    setShowChat(true);

    // Add personalized welcome message
    setMessages([{
      sender: 'bot',
      text: `Hi ${name}, I'm William's virtual AI interviewer. Ask me any question about my experience or approach to product. I'll do my best to answer!`,
    }]);

    // Create a silent audio element to request sound permissions
    const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
    silentAudio.play().catch(() => {
      console.log('Sound permissions may be restricted');
    });
  }, []);

  const handleSendMessage = useCallback(async (e) => {
    e?.preventDefault();
    if (!userMessage.trim()) return;

    const userMessageCopy = userMessage;
    setUserMessage("");

    let tempConversationId = conversationId;
    if (!tempConversationId) {
      tempConversationId = uuidv4();
      setConversationId(tempConversationId);
    }

    setMessages(prev => [
      ...prev, 
      { sender: 'user', text: userMessageCopy },
      { sender: 'bot', thinking: true, text: "Let me think about that for a moment..." }
    ]);

    try {
      const endpoint = voiceEnabled ? '/api/v1/chat-voice' : '/api/v1/chat';
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: tempConversationId,
          message: userMessageCopy,
        }),
      });

      if (voiceEnabled) {
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        audioUrlsRef.current.add(audioUrl);
        
        setMessages(prev => [
          ...prev.slice(0, -1), // Remove thinking message
          { sender: 'bot', text: null, audio: audioUrl },
        ]);

        // Only auto-play if autoplay is enabled
        if (autoplayEnabled) {
          try {
            audioRef.current.src = audioUrl;
            await audioRef.current.play();
          } catch (error) {
            console.log('Autoplay prevented, manual play required');
          }
        }
      } else {
        const data = await response.json();
        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
        }
        
        setMessages(prev => [
          ...prev.slice(0, -1), // Remove thinking message
          { sender: 'bot', text: data.response, audio: null },
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [
        ...prev.slice(0, -1), // Remove thinking message
        {
          sender: 'bot',
          text: "Sorry, something went wrong. Please try again.",
          audio: null,
        },
      ]);
    }
  }, [conversationId, voiceEnabled, autoplayEnabled, userMessage]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage(e);
    }
  }, [handleSendMessage]);

  const handleAudioToggle = useCallback((audioUrl) => {
    if (!audioRef.current.src || audioRef.current.src !== audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    } else if (audioRef.current.paused) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, []);

  // Memoize message rendering to prevent unnecessary re-renders
  const MemoizedMessageBox = useMemo(() => {
    return messages.map((msg, idx) => {
      const isUser = msg.sender === 'user';
      return (
        <Box
          key={idx}
          sx={{
            maxWidth: '75%',
            alignSelf: isUser ? 'end' : 'start',
            backgroundColor: isUser ? '#1976d2' : '#e0e0e0',
            color: isUser ? '#fff' : '#000',
            borderRadius: 2,
            padding: '8px 12px',
            marginY: '6px',
            textAlign: isUser ? 'right' : 'left',
            wordWrap: 'break-word',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
          className={msg.thinking ? 'thinking-box' : ''}
        >
          {isUser && msg.text}

          {!isUser && (
            <>
              {msg.thinking ? (
                msg.text
              ) : voiceEnabled && msg.audio ? (
                <IconButton
                  size="small"
                  onClick={() => handleAudioToggle(msg.audio)}
                  sx={{ color: isUser ? '#fff' : '#000' }}
                >
                  <VolumeUpIcon />
                </IconButton>
              ) : (
                msg.text
              )}
            </>
          )}
        </Box>
      );
    });
  }, [messages, voiceEnabled, handleAudioToggle]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
        <Container
          disableGutters
          sx={{
            width: { xs: '100%', md: '50%' },
            height: { xs: 'calc(var(--app-height))', md: '90vh' },
            display: 'flex',
            flexDirection: 'column',
            mx: 'auto',
            mt: { xs: 0, md: 5 },
            mb: { xs: 0, md: 5 },
            border: { xs: 'none', md: '1px solid #ccc' },
            borderRadius: { xs: 0, md: 2 },
            backgroundColor: 'white',
            color: 'black',
            fontSize: { xs: '0.9rem', md: '1.5rem' },
            overflow: 'hidden',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              p: 2,
              textAlign: 'center',
              borderBottom: '1px solid #eee',
              flexShrink: 0,
              fontColor: '"1c6ca1" !important',
              'font-family': '"museo-sans", sans-serif',
            }}
          >
            William AI
          </Typography>

          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {!showChat ? (
              <InitialPreferences onSessionStart={handleInitSession} />
            ) : (
              <Card
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                <CardContent
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    p: 0,
                  }}
                >
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                        label="Auto-Play"
                      />
                    )}
                  </Box>

                  <Box
                    ref={chatContainerRef}
                    sx={{
                      flex: 1,
                      overflowY: 'auto',
                      height: '70%',
                      p: 2,
                      borderTop: '1px solid #ccc',
                      backgroundColor: '#fdfdfd',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {MemoizedMessageBox}
                  </Box>

                  <Box
                    component="form"
                    onSubmit={handleSendMessage}
                    sx={{
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 2,
                      borderTop: '1px solid #ccc',
                    }}
                  >
                    <TextField
                      label="Type your question"
                      sx={{ fontFamily: "'museo-sans', sans-serif" }}
                      variant="outlined"
                      fullWidth
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <IconButton color="primary" type="submit">
                      <SendIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
          <audio ref={audioRef} style={{ display: 'none' }} />
        </Container>
    </ThemeProvider>
  );
}

export default App;