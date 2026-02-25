import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Play, Clock, Flame, Shield } from 'lucide-react';
import { sessionApi } from '@/api/endpoints';
import { useSessionHistoryStore } from '@/stores/bookStore';
import { Button, Card, CardTitle, Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { SessionTone } from '@/api/types';

const durations = [15, 30, 45, 60];

export default function NewSessionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const addSession = useSessionHistoryStore((s) => s.addSession);

  const state = location.state as {
    topicId?: string;
    topicTitle?: string;
    bookTitle?: string;
  } | null;

  const [topicId, setTopicId] = useState(state?.topicId || '');
  const [duration, setDuration] = useState(30);
  const [tone, setTone] = useState<SessionTone>('neutral');
  const [questionCount, setQuestionCount] = useState(5);

  const createAndStartMutation = useMutation({
    mutationFn: async () => {
      // Step 1: Create session
      const { session_id } = await sessionApi.create({
        topic_id: topicId,
        requested_minutes: duration,
        tone,
      });

      // Step 2: Start timer
      await sessionApi.start(session_id, duration);

      // Step 3: Generate questions
      await sessionApi.generateQuestions(session_id, questionCount);

      return session_id;
    },
    onSuccess: (sessionId) => {
      addSession({
        session_id: sessionId,
        topic_id: topicId,
        topic_title: state?.topicTitle || 'Unknown Topic',
        book_title: state?.bookTitle || 'Unknown Book',
        tone,
        duration_minutes: duration,
        started_at: new Date().toISOString(),
      });
      navigate(`/sessions/${sessionId}`);
    },
    onError: () => {
      toast.error('Failed to start session. Please try again.');
    },
  });

  const canStart = topicId.trim() && !createAndStartMutation.isPending;

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Start Session</h1>
        <p className="text-sm text-gray-500">
          Configure your study session and jump in
        </p>
      </div>

      {/* Topic info */}
      {state?.topicTitle ? (
        <Card className="border-brand-200 bg-brand-50/50">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
            Topic
          </p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {state.topicTitle}
          </p>
          <p className="text-sm text-gray-500">{state.bookTitle}</p>
        </Card>
      ) : (
        <Input
          label="Topic ID"
          value={topicId}
          onChange={(e) => setTopicId(e.target.value)}
          placeholder="Paste topic ID"
          hint="Navigate to a book's topics page to select one"
        />
      )}

      {/* Duration */}
      <Card>
        <CardTitle>
          <Clock className="mr-2 inline h-4 w-4" aria-hidden="true" />
          Duration
        </CardTitle>
        <div
          className="mt-3 flex gap-2"
          role="radiogroup"
          aria-label="Session duration"
        >
          {durations.map((d) => (
            <button
              key={d}
              role="radio"
              aria-checked={duration === d}
              onClick={() => setDuration(d)}
              className={cn(
                'flex-1 rounded-lg border-2 py-3 text-center text-sm font-semibold transition-all',
                duration === d
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300',
              )}
            >
              {d} min
            </button>
          ))}
        </div>
      </Card>

      {/* Question count */}
      <Card>
        <CardTitle>Number of Questions</CardTitle>
        <div className="mt-3 flex items-center gap-4">
          <input
            type="range"
            min={1}
            max={20}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="flex-1 accent-brand-500"
            aria-label="Number of questions"
            aria-valuemin={1}
            aria-valuemax={20}
            aria-valuenow={questionCount}
          />
          <span className="w-8 text-center text-lg font-bold text-brand-600">
            {questionCount}
          </span>
        </div>
      </Card>

      {/* Tone */}
      <Card>
        <CardTitle>Accountability Mode</CardTitle>
        <p className="mt-1 text-sm text-gray-500">
          Choose how the platform holds you accountable.
        </p>
        <div
          className="mt-3 flex gap-3"
          role="radiogroup"
          aria-label="Session tone"
        >
          <button
            role="radio"
            aria-checked={tone === 'neutral'}
            onClick={() => setTone('neutral')}
            className={cn(
              'flex flex-1 items-center gap-3 rounded-lg border-2 p-4 text-left transition-all',
              tone === 'neutral'
                ? 'border-brand-500 bg-brand-50'
                : 'border-gray-200 hover:border-gray-300',
            )}
          >
            <Shield
              className={cn(
                'h-6 w-6',
                tone === 'neutral' ? 'text-brand-600' : 'text-gray-400',
              )}
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold">Neutral</p>
              <p className="text-xs text-gray-500">Calm, encouraging</p>
            </div>
          </button>

          <button
            role="radio"
            aria-checked={tone === 'mean'}
            onClick={() => setTone('mean')}
            className={cn(
              'flex flex-1 items-center gap-3 rounded-lg border-2 p-4 text-left transition-all',
              tone === 'mean'
                ? 'border-danger-500 bg-danger-50'
                : 'border-gray-200 hover:border-gray-300',
            )}
          >
            <Flame
              className={cn(
                'h-6 w-6',
                tone === 'mean' ? 'text-danger-600' : 'text-gray-400',
              )}
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold">Mean Mode 🔥</p>
              <p className="text-xs text-gray-500">
                Spicy comments after 3+ failures
              </p>
            </div>
          </button>
        </div>
      </Card>

      {/* Start */}
      <Button
        className="w-full"
        size="lg"
        onClick={() => createAndStartMutation.mutate()}
        loading={createAndStartMutation.isPending}
        disabled={!canStart}
      >
        <Play className="h-5 w-5" aria-hidden="true" />
        {createAndStartMutation.isPending
          ? 'Preparing session…'
          : 'Start Session'}
      </Button>
    </div>
  );
}
