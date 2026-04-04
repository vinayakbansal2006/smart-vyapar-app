// Import the built-in Node.js file system module for file operations
const fs = require('fs');

// Read the contents of the NetworkPage.tsx file synchronously and split it line by line
const lines = fs.readFileSync('c:/Users/vinayak bansal/OneDrive/Desktop/ai-inventory-intelligence/src/components/network/NetworkPage.tsx', 'utf8').split('\n');

// Loop through each line to find instances of escaped characters (e.g., "\" or "\$")
lines.forEach((l, i) => {
  // If the line contains a backslash or explicitly an escaped dollar sign
  if (l.includes('\\') || l.includes('\\$')) {
    // Log the line number (1-indexed) and the trimmed content of the line
    console.log((i + 1) + ': ' + l.trim());
  }
});
