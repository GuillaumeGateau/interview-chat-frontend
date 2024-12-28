import React, { useState } from 'react';

// If you prefer, you can hardcode the Heroku URL:
// const BACKEND_URL = "https://interview-chat-backend-7c56a0b748e1.herokuapp.com";

// Otherwise, dynamically decide based on environment or environment variables:
const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

function App() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [botResponse, setBotResponse] = useState("");

  const handleInitSession = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/session/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company, email })
      });
      const data = await response.json();
      setSessionToken(data.sessionToken);
      console.log("Session token:", data.sessionToken);
    } catch (error) {
      console.error("Error initializing session:", error);
    }
  };

  const handleChat = async () => {
    if (!sessionToken) {
      alert("No session token. Please init session first.");
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          message: userMessage
        })
      });
      const data = await response.json();
      setBotResponse(data.response);
    } catch (error) {
      console.error("Error during chat request:", error);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto" }}>
      <h1>Interview Chat Bot - Stub</h1>
      <p>
        Backend URL: <strong>{BACKEND_URL}</strong>
      </p>

      {/* Session Init Form */}
      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button onClick={handleInitSession}>Init Session</button>
      </div>

      {/* Chat Message Form */}
      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
        <input
          placeholder="Your question"
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          style={{ flex: 1 }}
        />
        <button onClick={handleChat}>Send</button>
      </div>

      {/* Display Bot Response */}
      <div>
        <p>
          <strong>Bot Response:</strong> {botResponse}
        </p>
      </div>
    </div>
  );
}

export default App;