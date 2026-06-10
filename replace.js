const fs = require('fs');

const files = ['./app/page.tsx', './components/ActiveSession.tsx', './components/HistoryView.tsx', './components/PreSession.tsx'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/#FF4E00/g, '#C95A2B');
  fs.writeFileSync(file, content);
});
console.log('Done!');
