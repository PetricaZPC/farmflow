"use client";

import { useState } from "react";

export default function TestAI() {
  const [conversation, setConversation] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    const response = await fetch("/api/ai/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: input }),
    });

    const data = await response.json();

    setConversation([
      ...conversation,
      { role: "user", content: input },
      { role: "assistant", content: data.reply },
    ]);
    setInput("");
  };

  return (
    <div>
      <div>
        {conversation.map((message, index) => (
          <div key={index}>
            {message.role}: {message.content}
          </div>
        ))}
      </div>

      <div>
        <input
          type="text"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
          }}
        />
        <button onClick={sendMessage}>Send Message</button>
      </div>
    </div>
  );
}
