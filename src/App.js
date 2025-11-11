import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Container, Card, CardContent, Box } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import InitialPreferences from './initial-preferences';
import ChatHeader from './components/ChatHeader';
import ChatControls from './components/ChatControls';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { theme } from './theme';
import { getTranslation } from './i18n';
import './App.css';

// Backend URL configuration:
// - REACT_APP_BACKEND_URL environment variable takes priority (set in production)
// - Development fallback: http://localhost:5001 (when REACT_APP_BACKEND_URL is not set)
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (
  process.env.NODE_ENV === 'development' 
    ? "http://localhost:5001"
    : "http://localhost:5001" // Fallback (should not be used in production as REACT_APP_BACKEND_URL should be set)
);

// Log backend URL in development for debugging (removed in production build)
if (process.env.NODE_ENV === 'development') {
  console.log('Backend URL:', BACKEND_URL);
}

function App() {
  // eslint-disable-next-line no-unused-vars
  const [name, setName] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const [language, setLanguage] = useState('en'); // 'en' or 'fr'
  const audioRef = useRef(null);
  const [currentlyPlayingUrl, setCurrentlyPlayingUrl] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Load language preference from localStorage on mount (default to 'en')
  useEffect(() => {
    // Always default to English on initial load
    // User can change it via the toggle, which will save the preference
    setLanguage('en');
    // Only set localStorage if it doesn't exist or is invalid
    const savedLanguage = localStorage.getItem('languagePreference');
    if (savedLanguage !== 'en' && savedLanguage !== 'fr') {
      localStorage.setItem('languagePreference', 'en');
    }
  }, []);

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
  const requestTimestampsRef = useRef([]);
  
  // Client-side rate limiting: max 10 requests per minute
  const RATE_LIMIT_MAX_REQUESTS = 10;
  const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

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

  const processStreamingResponse = useCallback(async (response) => {
    if (typeof window === 'undefined' || !('MediaSource' in window)) {
      throw new Error(getTranslation('streamUnsupported', language));
    }

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      } catch (parseError) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
    }

    const conversationHeader =
      response.headers.get('conversation-id') ||
      response.headers.get('Conversation-Id');

    if (conversationHeader && conversationHeader !== conversationId) {
      setConversationId(conversationHeader);
    }

    if (!response.body || typeof response.body.getReader !== 'function') {
      throw new Error(getTranslation('streamUnsupported', language));
    }

    const mediaSource = new MediaSource();
    const audioUrl = URL.createObjectURL(mediaSource);
    audioUrlsRef.current.add(audioUrl);
    const streamingMessageId = uuidv4();

    setMessages(prev => {
      if (prev.length === 0) {
        return prev;
      }

      const updated = [...prev];
      updated[updated.length - 1] = {
        sender: 'bot',
        text: null,
        audio: audioUrl,
        streaming: true,
        streamStatus: getTranslation('streamConnecting', language),
        streamError: false,
        id: streamingMessageId,
      };

      return updated;
    });

    const updateStatus = (statusText, isError = false) => {
      setMessages(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(msg => msg.id === streamingMessageId);
        if (idx === -1) {
          return prev;
        }
        updated[idx] = {
          ...updated[idx],
          streamStatus: statusText,
          streamError: isError,
        };
        return updated;
      });
    };

    const audioElement = audioRef.current;
    if (audioElement && typeof audioElement.__cleanupStreamingListeners === 'function') {
      audioElement.__cleanupStreamingListeners();
    }
    const cleanupAudioListeners = (() => {
      if (!audioElement) return () => {};
      let cleaned = false;

      const handlePlay = () => {
        updateStatus(getTranslation('streamPlaying', language), false);
      };

      const handleError = () => {
        updateStatus(getTranslation('streamError', language), true);
        cleanup();
      };

      const handleEnded = () => {
        updateStatus(getTranslation('streamComplete', language), false);
        cleanup();
      };

      const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        audioElement.removeEventListener('play', handlePlay);
        audioElement.removeEventListener('error', handleError);
        audioElement.removeEventListener('ended', handleEnded);
        audioElement.__cleanupStreamingListeners = null;
      };

      audioElement.addEventListener('play', handlePlay);
      audioElement.addEventListener('error', handleError);
      audioElement.addEventListener('ended', handleEnded);

      audioElement.__cleanupStreamingListeners = cleanup;

      return cleanup;
    })();

    if (audioElement) {
      if (!audioElement.paused) {
        audioElement.pause();
      }
      if (audioElement.resumeAudioContext) {
        try {
          await audioElement.resumeAudioContext();
        } catch (err) {
          console.error('Error resuming audio context:', err);
        }
      }
      audioElement.src = audioUrl;
      audioElement.load();
    }

    await new Promise((resolve, reject) => {
      const handleSourceOpen = () => {
        let sourceBuffer;
        try {
          sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
        } catch (error) {
          cleanupAudioListeners();
          updateStatus(getTranslation('streamError', language), true);
          reject(error);
          return;
        }

        const reader = response.body.getReader();
        const queue = [];
        let firstChunkAppended = false;
        let streamEnded = false;
        let playbackStarted = false;
        let resolved = false;

        const finalizeResolve = () => {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        };

        const closeStreamWithError = (error) => {
          updateStatus(getTranslation('streamError', language), true);
          cleanupAudioListeners();
          try {
            reader.cancel();
          } catch (cancelError) {
            console.error('Error cancelling reader:', cancelError);
          }
          if (mediaSource.readyState === 'open') {
            try {
              mediaSource.endOfStream();
            } catch (endError) {
              console.error('Error closing media source:', endError);
            }
          }

          if (firstChunkAppended) {
            finalizeResolve();
            console.error('Streaming error after start:', error);
          } else {
            reject(error);
          }
        };

        const tryAutoplay = async () => {
          if (playbackStarted || !autoplayEnabled || !audioElement) {
            return;
          }
          if (audioElement.resumeAudioContext) {
            try {
              await audioElement.resumeAudioContext();
            } catch (err) {
              console.error('Error resuming audio context for autoplay:', err);
            }
          }
          try {
            const playPromise = audioElement.play();
            if (playPromise !== undefined) {
              await playPromise;
            }
            playbackStarted = true;
            updateStatus(getTranslation('streamPlaying', language), false);
          } catch (err) {
            console.warn('Autoplay prevented:', err);
            updateStatus(getTranslation('streamTapToPlay', language), false);
          }
        };

        const pump = async () => {
          try {
            while (true) {
              const { value, done } = await reader.read();

              if (done) {
                streamEnded = true;
                if (!sourceBuffer.updating && mediaSource.readyState === 'open') {
                  try {
                    mediaSource.endOfStream();
                  } catch (endErr) {
                    console.error('Error ending stream:', endErr);
                  }
                  updateStatus(getTranslation('streamComplete', language), false);
                  cleanupAudioListeners();
                }
                finalizeResolve();
                if (!firstChunkAppended) {
                  cleanupAudioListeners();
                }
                break;
              }

              if (value && value.length) {
                const chunk = value.buffer.slice(
                  value.byteOffset,
                  value.byteOffset + value.byteLength
                );
                queue.push(chunk);
                if (!sourceBuffer.updating) {
                  try {
                    sourceBuffer.appendBuffer(queue.shift());
                  } catch (appendError) {
                    closeStreamWithError(appendError);
                    return;
                  }
                }
              }
            }
          } catch (err) {
            closeStreamWithError(err);
          }
        };

        sourceBuffer.addEventListener('updateend', () => {
          if (!firstChunkAppended) {
            firstChunkAppended = true;
            const firstChunkStatus = autoplayEnabled
              ? getTranslation('streamBuffering', language)
              : getTranslation('streamTapToPlay', language);
            updateStatus(firstChunkStatus, false);
            finalizeResolve();
          }

          if (queue.length > 0 && !sourceBuffer.updating) {
            try {
              sourceBuffer.appendBuffer(queue.shift());
            } catch (appendError) {
              closeStreamWithError(appendError);
              return;
            }
          } else if (streamEnded && mediaSource.readyState === 'open') {
            try {
              mediaSource.endOfStream();
            } catch (endErr) {
              console.error('Error ending stream:', endErr);
            }
            updateStatus(getTranslation('streamComplete', language), false);
            cleanupAudioListeners();
          }

          if (
            firstChunkAppended &&
            autoplayEnabled &&
            !playbackStarted &&
            audioElement
          ) {
            if (audioElement.readyState >= 2) {
              tryAutoplay();
            } else {
              setTimeout(() => {
                if (
                  firstChunkAppended &&
                  autoplayEnabled &&
                  !playbackStarted &&
                  audioElement &&
                  audioElement.readyState >= 2
                ) {
                  tryAutoplay();
                }
              }, 150);
            }
          }
        });

        mediaSource.addEventListener('error', (err) => {
          closeStreamWithError(err);
        });

        pump();
      };

      mediaSource.addEventListener('sourceopen', handleSourceOpen, { once: true });
    });
  }, [autoplayEnabled, audioRef, conversationId, language, setConversationId, setMessages]);

  const handleInitSession = useCallback((preferences) => {
    const { name, voiceEnabled, autoplayEnabled, language: prefLanguage } = preferences;
    
    setName(name);
    setVoiceEnabled(voiceEnabled);
    setAutoplayEnabled(autoplayEnabled);
    // Ensure language defaults to 'en' if not provided or invalid
    const validLanguage = (prefLanguage === 'en' || prefLanguage === 'fr') ? prefLanguage : 'en';
    setLanguage(validLanguage);
    
    // Save language preference (always save, defaulting to 'en')
    localStorage.setItem('languagePreference', validLanguage);
    
    const newId = uuidv4();
    setConversationId(newId);
    setShowChat(true);

    const welcomeMessage = prefLanguage === 'fr' 
      ? `Bonjour ${name}, je suis l'intervieweur virtuel IA de William. Posez-moi n'importe quelle question sur mon expérience ou mon approche du produit. Je ferai de mon mieux pour répondre !`
      : `Hi ${name}, I'm William's virtual AI interviewer. Ask me any question about my experience or approach to product. I'll do my best to answer!`;

    setMessages([{
      sender: 'bot',
      text: welcomeMessage,
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

    // If audio is currently playing, stop it before sending the next request
    if (audioRef.current) {
      try {
        if (!audioRef.current.paused) {
          audioRef.current.pause();
        }
        audioRef.current.currentTime = 0;
      } catch (audioError) {
        console.warn('Error stopping currently playing audio:', audioError);
      }
    }
    setIsAudioPlaying(false);
    setCurrentlyPlayingUrl(null);

    // Client-side rate limiting check
    const now = Date.now();
    const timestamps = requestTimestampsRef.current;
    
    // Remove timestamps older than the rate limit window
    requestTimestampsRef.current = timestamps.filter(
      timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS
    );
    
    // Check if rate limit exceeded
    if (requestTimestampsRef.current.length >= RATE_LIMIT_MAX_REQUESTS) {
      const rateLimitMessage = language === 'fr' 
        ? "Vous envoyez des messages trop rapidement. Veuillez attendre un moment avant de réessayer."
        : "You're sending messages too quickly. Please wait a moment before trying again.";
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: rateLimitMessage,
          audio: null,
        },
      ]);
      return;
    }
    
    // Add current timestamp
    requestTimestampsRef.current.push(now);

    const userMessageCopy = userMessage;
    setUserMessage("");
    setIsLoading(true);

    let tempConversationId = conversationId;
    if (!tempConversationId) {
      tempConversationId = uuidv4();
      setConversationId(tempConversationId);
    }

    const thinkingMessage = language === 'fr' 
      ? "Laissez-moi réfléchir à cela un instant..."
      : "Let me think about that for a moment...";
    
    setMessages(prev => [
      ...prev, 
      { sender: 'user', text: userMessageCopy },
      { sender: 'bot', thinking: true, text: thinkingMessage }
    ]);

    try {
      let streamingSucceeded = false;
      if (voiceEnabled) {
        try {
          console.info('[Voice] Attempting streaming request', {
            endpoint: `${BACKEND_URL}/api/v1/chat-voice/stream`,
            language,
            conversationId: tempConversationId,
          });
          const streamingResponse = await fetch(`${BACKEND_URL}/api/v1/chat-voice/stream`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "X-Client-Version": "1.0.0",
            },
            body: JSON.stringify({
              conversationId: tempConversationId,
              message: userMessageCopy,
              language,
            }),
          });
          await processStreamingResponse(streamingResponse);
          console.info('[Voice] Streaming request succeeded');
          streamingSucceeded = true;
        } catch (streamError) {
          const isTypeError = streamError instanceof TypeError;
          if (isTypeError) {
            console.error('[Voice] Streaming request failed (likely network/CORS). Falling back to classic voice.', streamError);
          } else {
            console.warn('[Voice] Streaming request failed. Falling back to classic voice.', streamError);
          }
          setMessages(prev => {
            if (!prev.length) return prev;
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (updated[lastIndex]?.streaming) {
              updated[lastIndex] = {
                sender: 'bot',
                thinking: true,
                text: thinkingMessage,
              };
            }
            return updated;
          });
        }

        if (streamingSucceeded) {
          return;
        }
      }

      const endpoint = voiceEnabled ? '/api/v1/chat-voice' : '/api/v1/chat';
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Client-Version": "1.0.0", // Can be used by backend for validation
        },
        body: JSON.stringify({
          conversationId: tempConversationId,
          message: userMessageCopy,
          language: language, // Include language in API request
        }),
      });

      if (voiceEnabled) {
          // Check if response is OK
          if (!response.ok) {
            try {
              const errorData = await response.json();
              throw new Error(errorData.error || `Server error: ${response.status}`);
            } catch (parseError) {
              const errorText = await response.text();
              throw new Error(`Server error: ${response.status} - ${errorText}`);
            }
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
                
                // Ensure audio context is resumed (required for Web Audio API playback)
                if (audioRef.current.resumeAudioContext) {
                  try {
                    await audioRef.current.resumeAudioContext();
                  } catch (e) {
                    console.error('Error resuming audio context:', e);
                  }
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
        // Check if response is OK for text chat
        if (!response.ok) {
          try {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
          } catch (parseError) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
          }
        }
        
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
      const errorMessages = {
        en: {
          fetch: "Unable to connect to the server. Please check your connection and try again.",
          server: "The server encountered an error. Please try again in a moment.",
          default: "Sorry, something went wrong. Please try again.",
          inappropriate: "Your message contains inappropriate content and cannot be processed.",
          language: "The selected language is not supported.",
        },
        fr: {
          fetch: "Impossible de se connecter au serveur. Veuillez vérifier votre connexion et réessayer.",
          server: "Le serveur a rencontré une erreur. Veuillez réessayer dans un instant.",
          default: "Désolé, une erreur s'est produite. Veuillez réessayer.",
          inappropriate: "Votre message contient du contenu inapproprié et ne peut pas être traité.",
          language: "La langue sélectionnée n'est pas prise en charge.",
        }
      };
      
      const errorType = error.message?.includes('Failed to fetch') 
        ? 'fetch'
        : error.message?.includes('Server error')
        ? 'server'
        : error.message?.includes('inappropriate content')
        ? 'inappropriate'
        : error.message?.includes('Unsupported language')
        ? 'language'
        : 'default';
      
      const translatedDefault = errorMessages[language]?.[errorType] || errorMessages.en[errorType];
      const errorMessage = translatedDefault;
      
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
  }, [conversationId, voiceEnabled, autoplayEnabled, userMessage, isLoading, language, processStreamingResponse]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage(e);
    }
  }, [handleSendMessage]);

  const handleAudioToggle = useCallback(async (audioUrl) => {
    if (!audioRef.current) return;

    if (audioRef.current.src === audioUrl && !audioRef.current.paused) {
      audioRef.current.pause();
      return;
    }

    if (audioRef.current.src && !audioRef.current.paused) {
      audioRef.current.pause();
    }

    // Ensure audio context is resumed (required for Web Audio API playback)
    // This is needed because once we connect to Web Audio API, audio must go through it
    if (audioRef.current.resumeAudioContext) {
      try {
        await audioRef.current.resumeAudioContext();
      } catch (e) {
        console.error('Error resuming audio context:', e);
      }
    }

    audioRef.current.src = audioUrl;
    audioRef.current.load();
    
    // Wait for audio to be ready, then play
    const playAudio = async () => {
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    };

    if (audioRef.current.readyState >= 2) {
      // Already loaded, play immediately
      await playAudio();
    } else {
      // Wait for canplay event
      audioRef.current.addEventListener('canplay', playAudio, { once: true });
    }
  }, []);

  // Render messages
  const renderedMessages = useMemo(() => {
    return messages.map((msg, idx) => {
      const isUser = msg.sender === 'user';
      const isCurrentlyPlaying = msg.audio && currentlyPlayingUrl === msg.audio && isAudioPlaying;
      
      return (
        <ChatMessage
          key={msg.id ?? idx}
          message={msg}
          isUser={isUser}
          voiceEnabled={voiceEnabled}
          isCurrentlyPlaying={isCurrentlyPlaying}
          onAudioToggle={handleAudioToggle}
          audioElementRef={audioRef}
          language={language}
        />
      );
    });
  }, [messages, voiceEnabled, handleAudioToggle, currentlyPlayingUrl, isAudioPlaying, language]);

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
                language={language}
                onVoiceToggle={() => setVoiceEnabled(!voiceEnabled)}
                onAutoplayToggle={() => setAutoplayEnabled(!autoplayEnabled)}
                onLanguageToggle={() => {
                  const newLanguage = language === 'en' ? 'fr' : 'en';
                  if (audioRef.current) {
                    try {
                      if (!audioRef.current.paused) {
                        audioRef.current.pause();
                      }
                      audioRef.current.currentTime = 0;
                    } catch (audioError) {
                      console.warn('Error stopping audio during language toggle:', audioError);
                    }
                  }
                  setIsAudioPlaying(false);
                  setCurrentlyPlayingUrl(null);

                  setLanguage(newLanguage);
                  localStorage.setItem('languagePreference', newLanguage);
                  const newConversationId = uuidv4();
                  setConversationId(newConversationId);
                  console.info('[Language] Switched language', {
                    language: newLanguage,
                    conversationId: newConversationId,
                  });
                }}
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
                language={language}
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
