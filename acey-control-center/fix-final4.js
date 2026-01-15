const fs = require('fs');

// Fix OutputBubble.tsx - check structure around line 169
let outputBubble = fs.readFileSync('src/components/OutputBubble.tsx', 'utf8');
// Look for the pattern and fix it
outputBubble = outputBubble.replace(/React\.createElement\('button',\s*\{[^}]+\},\s*'Discard'\)\s*\)/, 
  "React.createElement('button', {\n        style: { ...buttonStyle, backgroundColor: '#FF3B30' },\n        onClick: handleDiscard\n      }, 'Discard')\n    )\n  );");

fs.writeFileSync('src/components/OutputBubble.tsx', outputBubble);

// Fix OwnerDashboard.tsx - fix the closing brace issue
let ownerDashboard = fs.readFileSync('src/components/OwnerDashboard.tsx', 'utf8');
ownerDashboard = ownerDashboard.replace('      )}\\n    </ScrollView>\\n  );', '      )}\\n    </ScrollView>\\n  );');
fs.writeFileSync('src/components/OwnerDashboard.tsx', ownerDashboard);

console.log('Applied comprehensive syntax fixes');
