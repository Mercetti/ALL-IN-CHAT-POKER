const fs = require('fs');

// Fix OutputBubble.tsx - remove extra comma
let outputBubble = fs.readFileSync('src/components/OutputBubble.tsx', 'utf8');
outputBubble = outputBubble.replace("}, 'Discard'),,", "}, 'Discard'),");
fs.writeFileSync('src/components/OutputBubble.tsx', outputBubble);

console.log('Removed extra comma in OutputBubble');
