import BookCard from './BookCard';

function BookList({ books, user, replaceMode = false, onReplace, shelfMode = false }) {
  if (books.length === 0) {
    return (
      <div className="book-grid">
        <div className="book-grid-empty">
          <div className="book-grid-empty-icon">📚</div>
          <p>No books match your search</p>
        </div>
      </div>
    );
  }

  if (shelfMode) {
    return (
      <div className="bookshelf-row">
        {books.map((book, index) => (
          <BookCard
            key={book._id}
            book={book}
            user={user}
            index={index}
            replaceMode={replaceMode}
            onReplace={onReplace}
            shelfMode
          />
        ))}
      </div>
    );
  }

  return (
    <div className="book-grid">
      {books.map((book, index) => (
        <BookCard
          key={book._id}
          book={book}
          user={user}
          index={index}
          replaceMode={replaceMode}
          onReplace={onReplace}
        />
      ))}
    </div>
  );
}

export default BookList;