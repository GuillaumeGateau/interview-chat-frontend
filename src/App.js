import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Box,
  Stack,
  Switch,
  FormControlLabel,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

function App() {
  const [name, setName] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const audioRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hi, I'm William's virtual AI interviewer. Ask me any question about my experience or approach to product. I'll do my best to answer!",
    },
  ]);
  const [userMessage, setUserMessage] = useState("");
  const chatContainerRef = useRef(null);

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

  const handleInitSession = () => {
    const newId = uuidv4();
    setConversationId(newId);
    setShowChat(true);
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!userMessage.trim()) return;

    // Add user's message to chat
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
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        
        setMessages(prev => [
          ...prev.slice(0, -1), // Remove thinking message
          { sender: 'bot', text: null, audio: audioUrl },
        ]);
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
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleAudioToggle = (audioUrl) => {
    if (!audioRef.current.src || audioRef.current.src !== audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    } else if (audioRef.current.paused) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };

  return (
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
        }}
      >
        AI WILLIAM
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
          <Card sx={{ flexShrink: 0, mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Please enter your name:
              </Typography>
              <Stack spacing={2} mt={2}>
                <TextField
                  label="Name"
                  variant="outlined"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                />
                <Button variant="contained" onClick={handleInitSession}>
                  Start Interviewing
                </Button>
              </Stack>
            </CardContent>
          </Card>
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
              <Box sx={{ p: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={voiceEnabled}
                      onChange={(e) => setVoiceEnabled(e.target.checked)}
                    />
                  }
                  label="Voice Response"
                />
              </Box>

              <Box
                ref={chatContainerRef}
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  height: '70%',
                  p: 2,
                  border: '1px solid #ccc',
                  borderRadius: 2,
                  backgroundColor: '#fdfdfd',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {messages.map((msg, idx) => {
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
                })}
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
  );
}

export default App;