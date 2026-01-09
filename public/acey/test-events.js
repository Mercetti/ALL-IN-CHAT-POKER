/**
 * Test Event Sender for Acey
 * Use this to simulate poker game events
 */

const ws = new WebSocket('ws://localhost:8081/acey');

ws.addEventListener('open', () => {
    console.log('Connected to Acey WebSocket');
    
    // Send test events every few seconds
    setTimeout(() => sendTestEvent('win'), 2000);
    setTimeout(() => sendTestEvent('lose'), 5000);
    setTimeout(() => sendTestEvent('specialCard'), 8000);
    setTimeout(() => sendTestEvent('win'), 11000);
    setTimeout(() => sendTestEvent('win'), 14000); // Trigger streak
});

ws.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    console.log('Acey response:', data);
});

function sendTestEvent(type, player = 'TestPlayer', card = 'Ace of Spades') {
    const event = {
        type,
        player,
        card: type === 'specialCard' ? card : undefined,
        timestamp: Date.now()
    };
    
    ws.send(JSON.stringify({
        type: 'gameEvent',
        sessionId: 'default',
        data: event
    }));
    
    console.log('Sent event:', event);
}

// Export for use in console
window.sendTestEvent = sendTestEvent;
window.aceyTest = {
    win: () => sendTestEvent('win'),
    lose: () => sendTestEvent('lose'),
    specialCard: (card) => sendTestEvent('specialCard', 'TestPlayer', card)
};

console.log('Acey test functions loaded. Use: aceyTest.win(), aceyTest.lose(), aceyTest.specialCard("King of Hearts")');
