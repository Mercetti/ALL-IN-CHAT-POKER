import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { processAceyOutput } from "./intentProcessor";
import { AceyOutputSchema } from "./validators";

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());

// WebSocket endpoint for Acey output
io.on("connection", (socket) => {
  console.log("Acey connected to Control Center");
  
  socket.on("acey_output", async (data: any) => {
    try {
      // Test data for development
      const testData = {
        speech: "All-in! This is an amazing play!",
        intents: [
          {
            type: "memory_proposal" as const,
            scope: "event" as const,
            summary: "Player went all-in with excitement",
            confidence: 0.9,
            ttl: "1h"
          },
          {
            type: "trust_signal" as const,
            delta: 0.1,
            reason: "Positive engagement",
            reversible: true
          }
        ]
      };

      // Validate output
      const validated = AceyOutputSchema.parse(testData);
      console.log("Received valid Acey output:", validated);
      
      // Process intents
      processAceyOutput(validated);
      
      // Emit confirmation
      socket.emit("output_processed", { 
        success: true, 
        intentCount: validated.intents.length 
      });
      
    } catch (error) {
      console.error("Invalid Acey output:", error);
      socket.emit("output_processed", { 
        success: false, 
        error: "Invalid output format" 
      });
    }
  });
});

// HTTP endpoint for health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: Date.now() });
});

// HTTP endpoint for manual testing
app.post("/process", (req, res) => {
  try {
    const validated = AceyOutputSchema.parse(req.body);
    processAceyOutput(validated);
    res.json({ success: true, processed: validated.intents.length });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🧠 AI Control Center running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
});
