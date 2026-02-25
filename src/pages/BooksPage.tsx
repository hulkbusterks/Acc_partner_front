import { Link } from 'react-router-dom';
import { useBookStore } from '@/stores/bookStore';
import { Card, Button, Badge, EmptyState } from '@/components/ui';
import { Upload, ChevronRight, BookOpen } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function BooksPage() {
  const books = useBookStore((s) => s.books);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Books</h1>
          <p className="text-sm text-gray-500">
            Upload study materials and generate topics
          </p>
        </div>
        <Link to="/books/upload">
          <Button>
            <Upload className="h-4 w-4" aria-hidden="true" />
            Upload Book
          </Button>
        </Link>
      </div>

      {books.length === 0 ? (
        <EmptyState
          icon="book"
          title="No books yet"
          description="Upload a PDF, EPUB, or TXT file to get started with your study sessions."
          action={
            <Link to="/books/upload">
              <Button>
                <Upload className="h-4 w-4" aria-hidden="true" />
                Upload your first book
              </Button>
            </Link>
          }
        />
      ) : (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
          aria-label="Uploaded books"
        >
          {books.map((book) => (
            <Link
              key={book.book_id}
              to={`/books/${book.book_id}/topics`}
              role="listitem"
            >
              <Card className="group flex h-full flex-col justify-between transition-shadow hover:shadow-md">
                <div>
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                      <BookOpen
                        className="h-5 w-5 text-brand-600"
                        aria-hidden="true"
                      />
                    </div>
                    <ChevronRight
                      className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="font-semibold text-gray-900 line-clamp-2">
                    {book.title}
                  </h3>
                  {book.authors && (
                    <p className="mt-1 text-sm text-gray-500">{book.authors}</p>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Badge variant={book.topics.length > 0 ? 'success' : 'warning'}>
                    {book.topics.length} topic{book.topics.length !== 1 && 's'}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {formatDate(book.uploadedAt)}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
