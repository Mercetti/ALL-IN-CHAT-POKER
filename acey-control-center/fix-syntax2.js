const fs = require('fs');

// Fix OutputBubble.tsx - remove extra space before closing
let outputBubble = fs.readFileSync('src/components/OutputBubble.tsx', 'utf8');
outputBubble = outputBubble.replace('    \);', '    );');
outputBubble = outputBubble.replace('      \)\}', '      )}');
fs.writeFileSync('src/components/OutputBubble.tsx', outputBubble);

// Fix OwnerDashboard.tsx - remove extra space before closing
let ownerDashboard = fs.readFileSync('src/components/OwnerDashboard.tsx', 'utf8');
ownerDashboard = ownerDashboard.replace('      \)\}', '      )}');
fs.writeFileSync('src/components/OwnerDashboard.tsx', ownerDashboard);

console.log('Applied syntax fixes');
