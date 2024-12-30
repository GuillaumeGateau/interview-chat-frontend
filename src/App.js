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
  Stack
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { v4 as uuidv4 } from 'uuid';

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

function App() {
  // Only collecting "name" for now
  const [name, setName] = useState("");

  const [conversationId, setConversationId] = useState("");
  const [showChat, setShowChat] = useState(false);

  // Chat messages start with an initial bot message:
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hi, I'm William's virtual AI interviewer. Ask me any question about my experience or approach to product. I'll do my best to answer!"
    }
  ]);
  const [userMessage, setUserMessage] = useState("");

  const chatContainerRef = useRef(null);

  // Safari Height Fix
  useEffect(() => {
    const updateHeight = () => {
      const appHeight = window.innerHeight;
      document.documentElement.style.setProperty('--app-height', `${appHeight}px`);
    };
    window.addEventListener('resize', updateHeight);
    updateHeight();

    return () => {
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  /**
   * "Start Interviewing" button handler.
   * Here we just generate a new conversationId on the front end
   * and reveal the chat panel. We only store "name" for display/logs if needed.
   */
  const handleInitSession = () => {
    // Generate a new conversationId:
    const newId = uuidv4();
    setConversationId(newId);
    setShowChat(true);
  };

  /**
   * Send a user message to the backend.
   * We pass the conversationId in the request body
   * so the server can keep track of this user's conversation.
   */
  const handleSendMessage = async () => {
    if (!userMessage.trim()) return;

    // Show the user's message immediately in the chat UI
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    const userMessageCopy = userMessage;
    setUserMessage("");

    // If, for some reason, we don't have a conversationId,
    // we can generate one on the fly:
    let tempConversationId = conversationId;
    if (!tempConversationId) {
      tempConversationId = uuidv4();
      setConversationId(tempConversationId);
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: tempConversationId,
          message: userMessageCopy
        })
      });
      const data = await response.json();

      // If the backend returns a conversationId, store it
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      // Add the bot's response
      setMessages(prev => [...prev, { sender: 'bot', text: data.response }]);
    } catch (error) {
      console.error("Error sending chat message:", error);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: "Sorry, something went wrong. Please try again."
      }]);
    }
  };

  /**
   * Allows user to press Enter to send message
   */
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
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
        overflow: 'hidden'
      }}
    >
      {/* Title */}
      <Typography
        variant="h4"
        sx={{
          p: 2,
          textAlign: 'center',
          borderBottom: '1px solid #eee',
          flexShrink: 0
        }}
      >
        AI WILLIAM
      </Typography>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* User Info Form (Hidden once chat is shown) */}
        {!showChat && (
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
        )}

        {showChat && (
          <Card
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <CardContent
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                p: 0
              }}
            >
              {/* Chat Area */}
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
                  flexDirection: 'column'
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
                        wordWrap: 'break-word'
                      }}
                    >
                      {msg.text}
                    </Box>
                  );
                })}
              </Box>

              {/* Input Row */}
              <Box
                sx={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 2,
                  borderTop: '1px solid #ccc'
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
                <IconButton color="primary" onClick={handleSendMessage}>
                  <SendIcon />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Container>
  );
}

export default App;