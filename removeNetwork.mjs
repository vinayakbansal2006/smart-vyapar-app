import fs from 'fs';
const file = 'src/App.tsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');
const startMatch = lines.findIndex(l => l.startsWith('const NetworkModule: React.FC<{'));
let endMatch = -1;
if (startMatch !== -1) {
    for (let i = startMatch; i < lines.length; i++) {
        if (lines[i].startsWith('const PaymentsModule: React.FC<{')) {
            endMatch = i;
            break;
        }
    }
}
if (startMatch !== -1 && endMatch !== -1) {
    lines.splice(startMatch, endMatch - startMatch);
    fs.writeFileSync(file, lines.join('\n'));
    console.log('Removed NetworkModule lines from ' + startMatch + ' to ' + endMatch);
} else {
    console.log('Could not find boundaries.', startMatch, endMatch);
}
