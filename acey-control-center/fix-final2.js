const fs = require('fs');

// Fix OutputBubble.tsx - add missing comma before Discard button
let outputBubble = fs.readFileSync('src/components/OutputBubble.tsx', 'utf8');
outputBubble = outputBubble.replace("}, 'Discard')", "}, 'Discard'),");
fs.writeFileSync('src/components/OutputBubble.tsx', outputBubble);

console.log('Added missing comma in OutputBubble');
