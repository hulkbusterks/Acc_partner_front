import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Sparkles, Wand2, Play, ArrowLeft, RefreshCw } from 'lucide-react';
import { ingestApi } from '@/api/endpoints';
import { useBookStore } from '@/stores/bookStore';
import {
  Button,
  Card,
  CardTitle,
  EmptyState,
  Badge,
} from '@/components/ui';
import { cn } from '@/lib/utils';

export default function TopicsPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const book = useBookStore((s) => s.getBook(bookId!));
  const setTopics = useBookStore((s) => s.setTopics);
  const [mode, setMode] = useState<'rag' | 'rule'>('rag');
  const hasTopics = book ? book.topics.length > 0 : false;

  const generateMutation = useMutation({
    mutationFn: () => ingestApi.generateTopics(bookId!, mode),
    onSuccess: (data) => {
      setTopics(bookId!, data.topics);
      toast.success(`Generated ${data.created} topics!`);
    },
    onError: () => toast.error('Failed to generate topics. Try again.'),
  });

  if (!book) {
    return (
      <EmptyState
        icon="warning"
        title="Book not found"
        description="This book may have been removed or the link is invalid."
        action={
          <Link to="/books">
            <Button variant="secondary">Back to Books</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          to="/books"
          className="mt-1 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Back to books"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{book.title}</h1>
          {book.authors && (
            <p className="text-sm text-gray-500">by {book.authors}</p>
          )}
        </div>
      </div>

      {/* Generate topics — only shown when no topics exist yet */}
      {!hasTopics && (
        <Card>
          <CardTitle>Generate Topics</CardTitle>
          <p className="mt-1 text-sm text-gray-500">
            Choose a method to extract study topics from this book.
          </p>

          <div
            className="mt-4 flex gap-3"
            role="radiogroup"
            aria-label="Topic generation mode"
          >
            {([
              {
                value: 'rag' as const,
                label: 'Smart (RAG)',
                desc: 'AI-powered topic extraction',
                icon: Sparkles,
              },
              {
                value: 'rule' as const,
                label: 'Quick (Rule-based)',
                desc: 'Section-based splitting',
                icon: Wand2,
              },
            ]).map((opt) => (
              <button
                key={opt.value}
                role="radio"
                aria-checked={mode === opt.value}
                onClick={() => setMode(opt.value)}
                className={cn(
                  'flex flex-1 items-start gap-3 rounded-lg border-2 p-4 text-left transition-all',
                  mode === opt.value
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300',
                )}
              >
                <opt.icon
                  className={cn(
                    'mt-0.5 h-5 w-5',
                    mode === opt.value ? 'text-brand-600' : 'text-gray-400',
                  )}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <Button
            className="mt-4"
            onClick={() => generateMutation.mutate()}
            loading={generateMutation.isPending}
          >
            Generate Topics
          </Button>
        </Card>
      )}

      {/* Topic list */}
      <section aria-label="Topics">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Topics{' '}
            <Badge>{book.topics.length}</Badge>
          </h2>
          {hasTopics && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => generateMutation.mutate()}
              loading={generateMutation.isPending}
              aria-label="Regenerate topics"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Regenerate
            </Button>
          )}
        </div>

        {book.topics.length === 0 ? (
          <Card>
            <p className="py-6 text-center text-sm text-gray-500">
              No topics yet. Click &ldquo;Generate Topics&rdquo; above to get
              started.
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2" role="list" aria-label="Generated topics">
            {book.topics.map((topic) => (
              <Card
                key={topic.id}
                className="group flex items-center justify-between transition-shadow hover:shadow-md"
                role="listitem"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">
                    {topic.title}
                  </p>
                </div>
                <button
                  onClick={() =>
                    navigate('/sessions/new', {
                      state: {
                        topicId: topic.id,
                        topicTitle: topic.title,
                        bookTitle: book.title,
                      },
                    })
                  }
                  className="ml-3 flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                  aria-label={`Start session on ${topic.title}`}
                >
                  <Play className="h-3 w-3" aria-hidden="true" />
                  Study
                </button>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
