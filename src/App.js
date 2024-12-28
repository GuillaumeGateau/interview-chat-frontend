import React, { useState } from 'react';

function App() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [botResponse, setBotResponse] = useState("");

  const handleInitSession = async () => {
    const response = await fetch("http://localhost:5000/api/v1/session/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, company, email })
    });
    const data = await response.json();
    setSessionToken(data.sessionToken);
    console.log("Session token:", data.sessionToken);
  };

  const handleChat = async () => {
    if (!sessionToken) {
      alert("No session token. Please init session first.");
      return;
    }

    const response = await fetch("http://localhost:5000/api/v1/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        sessionToken, 
        message: userMessage 
      })
    });
    const data = await response.json();
    setBotResponse(data.response);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto" }}>
      <h1>Interview Chat Bot - Stub</h1>
      <div style={{ marginBottom: "1rem" }}>
        <input 
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)} />
        <input 
          placeholder="Company"
          value={company}
          onChange={(e) => setCompany(e.target.value)} />
        <input 
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)} />
        <button onClick={handleInitSession}>Init Session</button>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <input
          placeholder="Your question"
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)} />
        <button onClick={handleChat}>Send</button>
      </div>

      <div>
        <p><strong>Bot Response:</strong> {botResponse}</p>
      </div>
    </div>
  );
}

export default App;