const mongoose = require('mongoose');
require('dotenv').config();
const Book = require('./models/Book');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const books = await Book.find({});
  const titles = books.map(b => b.title);
  const counts = {};
  titles.forEach(t => {
    counts[t] = (counts[t] || 0) + 1;
  });
  let found = false;
  for (const [title, count] of Object.entries(counts)) {
    if (count > 1) {
      console.log(`DB Duplicate: ${title} (${count})`);
      found = true;
    }
  }
  if (!found) console.log('No duplicates in DB');
  console.log(`Total books in DB: ${books.length}`);
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
