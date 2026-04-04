import fs from 'fs';
const lines = fs.readFileSync('c:/Users/vinayak bansal/OneDrive/Desktop/ai-inventory-intelligence/src/components/network/NetworkPage.tsx', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('\\') || l.includes('\\$')) {
    console.log((i + 1) + ': ' + l.trim());
  }
});
