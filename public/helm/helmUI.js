/**
 * Enhanced Helm UI JavaScript
 * Frontend interface for Helm WebSocket communication with modern circuit AI feel
 */

// Connect to Helm WebSocket server
const socket = io();

// Current selected persona
let currentPersona = 'acey';

// System metrics simulation
let metrics = {
    cpu: 12,
    memory: 256,
    skills: 8,
    responseTime: 42
};

// Initialize UI
document.addEventListener('DOMContentLoaded', function() {
    log('HELM CONTROL SYSTEM INITIALIZED');
    log('WebSocket connection established');
    log('All personas loaded and ready');
    log('System monitoring active');
    log('Awaiting user input...');
    
    // Start metrics simulation
    setInterval(updateMetrics, 2000);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            sendChat();
        } else if (e.ctrlKey && e.key === 'l') {
            clearLogs();
        }
    });
});

function log(message) {
    const output = document.getElementById('output');
    if (output) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.innerHTML = `<span class="text-cyan-400">[${timestamp}]</span> ${message}`;
        output.appendChild(logEntry);
        output.scrollTop = output.scrollHeight;
        
        // Add circuit effect to new log entries
        logEntry.style.opacity = '0';
        logEntry.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            logEntry.style.transition = 'all 0.3s ease';
            logEntry.style.opacity = '1';
            logEntry.style.transform = 'translateX(0)';
        }, 100);
    }
}

function selectPersona(persona) {
    currentPersona = persona;
    log(`Persona switched to: ${persona.toUpperCase()}`);
    
    // Update UI to show selected persona
    document.querySelectorAll('.persona-card').forEach(card => {
        card.classList.remove('border-cyan-400');
        card.classList.add('border-gray-700');
    });
    
    event.currentTarget.classList.remove('border-gray-700');
    event.currentTarget.classList.add('border-cyan-400');
    
    // Visual feedback
    const personaMessages = {
        acey: "Hello! I'm Acey, your AI control assistant. What can I help you with?",
        professional: "I'm here to help with professional assistance and guidance.",
        casual: "Hey! How can I help you today?"
    };
    
    log(`Persona ${persona.toUpperCase()} activated: "${personaMessages[persona]}"`);
}

function sendChat() {
    const messages = {
        professional: "I'm here to help with professional assistance and guidance.",
        casual: "Hey! How can I help you today?",
        acey: "Hello! I'm Acey, your AI control assistant. What can I help you with?"
    };
    
    const message = messages[currentPersona] || messages['acey'];
    
    socket.emit('chat', {
        type: 'chat',
        content: message,
        persona: currentPersona,
        timestamp: Date.now()
    });
    
    log(`Sent ${currentPersona} chat: ${message}`);
    
    // Simulate response
    setTimeout(() => {
        const responses = {
            acey: "Processing your request through the Helm orchestration engine...",
            professional: "Analyzing your requirements with professional precision...",
            casual: "Got it! Let me help you out with that..."
        };
        
        log(`AI Response: ${responses[currentPersona]}`);
    }, 1000);
}

function simulateWin() {
    socket.emit('game_event', {
        type: 'game_event',
        event: { action: 'win', player: 'tester', amount: 100 },
        channel: 'test-channel',
        timestamp: Date.now()
    });
    
    log('🎉 Simulated WIN event: +100 credits');
    log('Game state updated successfully');
    
    // Update metrics
    metrics.responseTime = Math.floor(Math.random() * 20) + 30;
    updateMetricsDisplay();
}

function simulateLoss() {
    socket.emit('game_event', {
        type: 'game_event',
        event: { action: 'lose', player: 'tester', amount: 50 },
        channel: 'test-channel',
        timestamp: Date.now()
    });
    
    log('💸 Simulated LOSS event: -50 credits');
    log('Game state updated successfully');
    
    // Update metrics
    metrics.responseTime = Math.floor(Math.random() * 20) + 30;
    updateMetricsDisplay();
}

function clearLogs() {
    const output = document.getElementById('output');
    if (output) {
        output.innerHTML = '<div class="text-cyan-400">[LOGS CLEARED]</div>';
        log('Terminal logs cleared');
        log('System ready for new operations');
    }
}

function updateMetrics() {
    // Simulate realistic metric changes
    metrics.cpu = Math.max(5, Math.min(95, metrics.cpu + (Math.random() - 0.5) * 10));
    metrics.memory = Math.max(128, Math.min(512, metrics.memory + (Math.random() - 0.5) * 50));
    metrics.skills = Math.max(3, Math.min(12, Math.floor(metrics.skills + (Math.random() - 0.5) * 2)));
    metrics.responseTime = Math.max(15, Math.min(200, Math.floor(metrics.responseTime + (Math.random() - 0.5) * 20)));
    
    updateMetricsDisplay();
}

function updateMetricsDisplay() {
    const cpuEl = document.getElementById('cpu-usage');
    const memoryEl = document.getElementById('memory-usage');
    const skillsEl = document.getElementById('active-skills');
    const responseEl = document.getElementById('response-time');
    
    if (cpuEl) cpuEl.textContent = `${Math.floor(metrics.cpu)}%`;
    if (memoryEl) memoryEl.textContent = `${Math.floor(metrics.memory)}MB`;
    if (skillsEl) skillsEl.textContent = metrics.skills;
    if (responseEl) responseEl.textContent = `${metrics.responseTime}ms`;
    
    // Update node status
    const nodeStatus = document.getElementById('node-status');
    if (nodeStatus) {
        nodeStatus.textContent = metrics.cpu > 80 ? 'STRESSED' : 'ACTIVE';
        nodeStatus.className = metrics.cpu > 80 ? 'text-red-400' : 'text-green-400';
    }
}

// WebSocket event handlers
socket.on('connect', function() {
    log('✅ WebSocket connected successfully');
    log('Real-time communication established');
});

socket.on('disconnect', function() {
    log('❌ WebSocket disconnected');
    log('Attempting to reconnect...');
});

socket.on('chat_response', function(data) {
    log(`🤖 AI Response: ${data.content}`);
});

socket.on('system_status', function(data) {
    log(`📊 System Update: ${JSON.stringify(data)}`);
});

socket.on('error', function(error) {
    log(`❌ Error: ${error.message}`);
});

// Add visual effects for circuit board feel
document.addEventListener('mousemove', function(e) {
    const cards = document.querySelectorAll('.persona-card, .metric-card');
    cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
            card.style.boxShadow = '0 10px 30px rgba(0, 212, 255, 0.3)';
        } else {
            card.style.boxShadow = '';
        }
    });
});

// Add loading animation
window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 1s ease';
        document.body.style.opacity = '1';
    }, 100);
});
