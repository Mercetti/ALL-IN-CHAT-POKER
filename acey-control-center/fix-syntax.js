const fs = require('fs');

// Fix OutputBubble.tsx
let outputBubble = fs.readFileSync('src/components/OutputBubble.tsx', 'utf8');
outputBubble = outputBubble.replace('    \);', '    );');
fs.writeFileSync('src/components/OutputBubble.tsx', outputBubble);

// Fix OwnerDashboard.tsx
let ownerDashboard = fs.readFileSync('src/components/OwnerDashboard.tsx', 'utf8');
ownerDashboard = ownerDashboard.replace('      \)\}', '      )}');
fs.writeFileSync('src/components/OwnerDashboard.tsx', ownerDashboard);

console.log('Fixed syntax errors in both files');
