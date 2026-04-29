const fs = require('fs');
const content = fs.readFileSync('e:/BookStore/server/seed.js', 'utf8');
const booksMatch = content.match(/const books = \[([\s\S]*?)\];/);
if (!booksMatch) {
  console.log('Could not find books array');
  process.exit(1);
}

const titles = [...booksMatch[1].matchAll(/title:\s*["'](.*?)["']/g)].map(m => m[1]);
const counts = {};
titles.forEach(t => counts[t] = (counts[t] || 0) + 1);

let found = false;
for (const [title, count] of Object.entries(counts)) {
  if (count > 1) {
    console.log(`Duplicate Title: "${title}" (${count} times)`);
    found = true;
  }
}

if (!found) console.log('No duplicate titles found in seed.js');
