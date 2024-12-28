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

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

function App() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");

  const [sessionToken, setSessionToken] = useState("");
  const [showChat, setShowChat] = useState(false);

  // Chat messages: an array of {sender: 'user'|'bot', text: string}
  const [messages, setMessages] = useState([]);
  const [userMessage, setUserMessage] = useState("");

  // Ref to the chat container for auto-scrolling
  const chatContainerRef = useRef(null);

  // Whenever messages change, scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // 1. Init Session
  const handleInitSession = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/session/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company, email })
      });
      const data = await response.json();
      setSessionToken(data.sessionToken);
      setShowChat(true);
    } catch (error) {
      console.error("Error initializing session:", error);
    }
  };

  // 2. Send a message
  const handleSendMessage = async () => {
    if (!sessionToken) {
      alert("Please fill out the form and start interviewing first.");
      return;
    }
    if (!userMessage.trim()) return;

    // Immediately add the user's message to the chat
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);

    // Clear the input right away
    setUserMessage("");

    try {
      // Send to backend
      const response = await fetch(`${BACKEND_URL}/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          message: userMessage
        })
      });
      const data = await response.json();

      // Add bot response
      setMessages(prev => [...prev, { sender: 'bot', text: data.response }]);
    } catch (error) {
      console.error("Error sending chat message:", error);
    }
  };

  // 3. Press Enter to send
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        mt: 5,
        mb: 5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <Typography variant="h4" sx={{ mb: 3 }}>
        AI WILLIAM
      </Typography>

      {/* Form card - only if chat not started */}
      {!showChat && (
        <Card sx={{ width: '100%', mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Please fill out your info:
            </Typography>
            <Stack spacing={2} mt={2}>
              <TextField
                label="Name"
                variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
              />
              <TextField
                label="Company"
                variant="outlined"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                fullWidth
              />
              <TextField
                label="Email"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
              />
              <Button variant="contained" onClick={handleInitSession}>
                Start Interviewing
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Chat card - visible after "Start Interviewing" */}
      {showChat && (
        <Card sx={{ width: '100%' }}>
          <CardContent>
            <Box
              ref={chatContainerRef}
              sx={{
                height: 400,
                overflowY: 'auto',
                p: 2,
                border: '1px solid #ccc',
                borderRadius: 2,
                mb: 2,
                backgroundColor: '#fdfdfd',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {messages.map((msg, idx) => {
                const isUser = (msg.sender === 'user');
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

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
    </Container>
  );
}

export default App;