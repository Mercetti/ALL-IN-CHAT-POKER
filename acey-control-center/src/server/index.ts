import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { processAceyOutput } from "./intentProcessor";
import { AceyOutputSchema } from "./validators";
import AceyLibraryManager from "./utils/libraryManager";
import { ConstitutionalIntelligence } from "./utils/constitutionalIntelligence";

// Initialize Constitutional Intelligence Layer
ConstitutionalIntelligence.initialize();
console.log("🏛️ Constitutional Intelligence Layer initialized");

// Initialize Acey Library Manager at server startup
AceyLibraryManager.initLibrary();
console.log("📚 Acey Library initialized on D: drive");

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

// HTTP endpoint for constitutional intelligence stats
app.get("/governance/stats", (req, res) => {
  try {
    const stats = ConstitutionalIntelligence.getStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching governance stats:", error);
    res.status(500).json({ error: "Failed to fetch governance stats" });
  }
});

// HTTP endpoint for constitutional audit
app.get("/governance/audit", (req, res) => {
  try {
    const audit = ConstitutionalIntelligence.exportForAudit();
    res.json(audit);
  } catch (error) {
    console.error("Error generating audit:", error);
    res.status(500).json({ error: "Failed to generate audit" });
  }
});

// HTTP endpoint for human feedback
app.post("/governance/feedback", (req, res) => {
  try {
    const { actionId, feedback, reason } = req.body;
    
    if (!actionId || !feedback) {
      return res.status(400).json({ error: "actionId and feedback required" });
    }
    
    ConstitutionalIntelligence.recordHumanFeedback(actionId, feedback, reason);
    res.json({ success: true, message: "Feedback recorded" });
  } catch (error) {
    console.error("Error recording feedback:", error);
    res.status(500).json({ error: "Failed to record feedback" });
  }
});

// Auto-governance endpoint (run periodically)
app.post("/governance/auto-govern", (req, res) => {
  try {
    const results = ConstitutionalIntelligence.runAutoGovernance();
    res.json(results);
  } catch (error) {
    console.error("Error running auto-governance:", error);
    res.status(500).json({ error: "Failed to run auto-governance" });
  }
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
