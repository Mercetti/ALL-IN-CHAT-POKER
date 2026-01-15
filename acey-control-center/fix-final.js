const fs = require('fs');

// Fix OutputBubble.tsx - add missing comma
let outputBubble = fs.readFileSync('src/components/OutputBubble.tsx', 'utf8');
outputBubble = outputBubble.replace("      }, 'Discard')", "      }, 'Discard'),");
fs.writeFileSync('src/components/OutputBubble.tsx', outputBubble);

// Fix OwnerDashboard.tsx - remove extra space
let ownerDashboard = fs.readFileSync('src/components/OwnerDashboard.tsx', 'utf8');
ownerDashboard = ownerDashboard.replace('      )}', '      )}');
fs.writeFileSync('src/components/OwnerDashboard.tsx', ownerDashboard);

console.log('Final syntax fixes applied');
