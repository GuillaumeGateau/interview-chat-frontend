import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Container, Card, CardContent, Box } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import InitialPreferences from './initial-preferences';
import ChatHeader from './components/ChatHeader';
import ChatControls from './components/ChatControls';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { theme } from './theme';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

function App() {
  // eslint-disable-next-line no-unused-vars
  const [name, setName] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const audioRef = useRef(null);
  const [currentlyPlayingUrl, setCurrentlyPlayingUrl] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hi, I'm William's virtual AI interviewer. Ask me any question about my experience or approach to product. I'll do my best to answer!",
    },
  ]);
  const [userMessage, setUserMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef(null);
  const audioUrlsRef = useRef(new Set());

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Auto-scroll chat to bottom with smooth animation
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  // Handle voice disabled
  useEffect(() => {
    if (!voiceEnabled && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
      setCurrentlyPlayingUrl(null);
    }
  }, [voiceEnabled]);

  // Track audio playback state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setIsAudioPlaying(true);
      setCurrentlyPlayingUrl(audio.src);
    };

    const handlePause = () => {
      setIsAudioPlaying(false);
    };

    const handleEnded = () => {
      setIsAudioPlaying(false);
      setCurrentlyPlayingUrl(null);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Cleanup audio URLs
  useEffect(() => {
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

    setMessages([{
      sender: 'bot',
      text: `Hi ${name}, I'm William's virtual AI interviewer. Ask me any question about my experience or approach to product. I'll do my best to answer!`,
    }]);

    // Request sound permissions
    const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
    silentAudio.play().catch(() => {
      console.log('Sound permissions may be restricted');
    });
  }, []);

  const handleSendMessage = useCallback(async (e) => {
    e?.preventDefault();
    if (!userMessage.trim() || isLoading) return;

    const userMessageCopy = userMessage;
    setUserMessage("");
    setIsLoading(true);

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
        // Check if response is OK
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        
        // Check content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('audio')) {
          // Clone response to read as text for error message
          const clonedResponse = response.clone();
          const text = await clonedResponse.text();
          throw new Error(`Expected audio, got: ${contentType}. Response: ${text.substring(0, 100)}`);
        }
        
        const blob = await response.blob();
        
        // Validate blob
        if (!blob || blob.size === 0) {
          throw new Error('Invalid audio blob received');
        }
        
        const audioUrl = URL.createObjectURL(blob);
        audioUrlsRef.current.add(audioUrl);
        
        setMessages(prev => [
          ...prev.slice(0, -1),
          { sender: 'bot', text: null, audio: audioUrl },
        ]);

        // Auto-play if enabled
        if (autoplayEnabled) {
          setTimeout(async () => {
            try {
              if (!audioRef.current) return;
              
              // Stop any currently playing audio
              if (!audioRef.current.paused) {
                audioRef.current.pause();
              }
              
              // Wait for audio to be ready
              audioRef.current.src = audioUrl;
              audioRef.current.load();
              
              // Wait for the audio to be ready to play
              await new Promise((resolve, reject) => {
                const audio = audioRef.current;
                if (!audio) {
                  reject(new Error('Audio element not available'));
                  return;
                }
                
                const handleCanPlay = () => {
                  audio.removeEventListener('canplay', handleCanPlay);
                  audio.removeEventListener('error', handleError);
                  resolve();
                };
                
                const handleError = (e) => {
                  audio.removeEventListener('canplay', handleCanPlay);
                  audio.removeEventListener('error', handleError);
                  reject(new Error(`Audio load error: ${audio.error?.message || 'Unknown error'}`));
                };
                
                audio.addEventListener('canplay', handleCanPlay);
                audio.addEventListener('error', handleError);
                
                // Fallback timeout
                setTimeout(() => {
                  audio.removeEventListener('canplay', handleCanPlay);
                  audio.removeEventListener('error', handleError);
                  if (audio.readyState >= 2) { // HAVE_CURRENT_DATA
                    resolve();
                  } else {
                    reject(new Error('Audio load timeout'));
                  }
                }, 5000);
              });
              
              // Try to play
              const playPromise = audioRef.current.play();
              if (playPromise !== undefined) {
                await playPromise;
              }
            } catch (error) {
              console.log('Autoplay prevented, manual play required:', error);
              // Don't show error to user, they can click to play manually
            }
          }, 100);
        }
      } else {
        const data = await response.json();
        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
        }
        
        setMessages(prev => [
          ...prev.slice(0, -1),
          { sender: 'bot', text: data.response, audio: null },
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = error.message?.includes('Failed to fetch') 
        ? "Unable to connect to the server. Please check your connection and try again."
        : error.message?.includes('Server error')
        ? "The server encountered an error. Please try again in a moment."
        : "Sorry, something went wrong. Please try again.";
      
      setMessages(prev => [
        ...prev.slice(0, -1),
        {
          sender: 'bot',
          text: errorMessage,
          audio: null,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, voiceEnabled, autoplayEnabled, userMessage, isLoading]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage(e);
    }
  }, [handleSendMessage]);

  const handleAudioToggle = useCallback((audioUrl) => {
    if (!audioRef.current) return;

    if (audioRef.current.src === audioUrl && !audioRef.current.paused) {
      audioRef.current.pause();
      return;
    }

    if (audioRef.current.src && !audioRef.current.paused) {
      audioRef.current.pause();
    }

    audioRef.current.src = audioUrl;
    audioRef.current.load();
    audioRef.current.play().catch(error => {
      console.error('Error playing audio:', error);
    });
  }, []);

  // Render messages
  const renderedMessages = useMemo(() => {
    return messages.map((msg, idx) => {
      const isUser = msg.sender === 'user';
      const isCurrentlyPlaying = msg.audio && currentlyPlayingUrl === msg.audio && isAudioPlaying;
      
      return (
        <ChatMessage
          key={idx}
          message={msg}
          isUser={isUser}
          voiceEnabled={voiceEnabled}
          isCurrentlyPlaying={isCurrentlyPlaying}
          onAudioToggle={handleAudioToggle}
          audioElementRef={audioRef}
        />
      );
    });
  }, [messages, voiceEnabled, handleAudioToggle, currentlyPlayingUrl, isAudioPlaying]);

  return (
    <Container
      disableGutters
      sx={{
        width: { xs: '100%', md: '50%' },
        height: '100vh',
        maxHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        mx: 'auto',
        mt: { xs: 0, md: 0 },
        mb: { xs: 0, md: 0 },
        border: { xs: 'none', md: `1px solid ${theme.colors.border}` },
        borderRadius: { xs: 0, md: 0 },
        backgroundColor: theme.colors.surface,
        overflow: 'hidden',
        boxShadow: theme.shadows.lg,
      }}
    >
      {showChat && <ChatHeader />}

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
              boxShadow: 'none',
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
              <ChatControls
                voiceEnabled={voiceEnabled}
                autoplayEnabled={autoplayEnabled}
                onVoiceToggle={() => setVoiceEnabled(!voiceEnabled)}
                onAutoplayToggle={() => setAutoplayEnabled(!autoplayEnabled)}
              />

              <Box
                ref={chatContainerRef}
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  p: { xs: 2, sm: 3 },
                  backgroundColor: theme.colors.background,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  minWidth: 0, // Allow shrinking
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: theme.colors.border,
                    borderRadius: '10px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: theme.colors.primaryLight,
                    borderRadius: '10px',
                    '&:hover': {
                      background: theme.colors.primary,
                    },
                  },
                }}
              >
                {renderedMessages}
              </Box>

              <ChatInput
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onSubmit={handleSendMessage}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
            </CardContent>
          </Card>
        )}
      </Box>
      <audio ref={audioRef} style={{ display: 'none' }} />
    </Container>
  );
}

export default App;
