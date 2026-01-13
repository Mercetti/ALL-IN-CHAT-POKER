import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

interface MemoryProposal {
  id: string;
  scope: string;
  summary: string;
  confidence: number;
  timestamp: number;
}

export function MemoryQueue({ proposals }: { proposals: MemoryProposal[] }) {
  return (
    <div>
      <h3>Memory Queue</h3>
      {proposals.map(p => (
        <div key={p.id}>
          <p>{p.summary}</p>
          <button>Approve</button>
          <button>Reject</button>
        </div>
      ))}
    </div>
  );
}

export function AIDashboard() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [proposals, setProposals] = useState<MemoryProposal[]>([]);

  useEffect(() => {
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to Control Center");
    });

    return () => newSocket.close();
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>🧠 Acey AI Control Center</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <MemoryQueue proposals={proposals} />
        <div>
          <h3>Live Monitor</h3>
          <p>Speech preview: Ready</p>
          <p>Active persona: neutral</p>
          <p>Trust score: 0.5</p>
        </div>
      </div>
    </div>
  );
}
