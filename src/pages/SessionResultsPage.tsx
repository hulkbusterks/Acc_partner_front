import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Target, XCircle, SkipForward, ArrowRight, RotateCcw } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import type { LeaderboardAggregate } from '@/api/types';

interface ResultsState {
  score: number;
  questionsAnswered: number;
  failures: number;
  rejects: number;
  aggregate?: LeaderboardAggregate;
  topicTitle?: string;
  bookTitle?: string;
}

export default function SessionResultsPage() {
  const location = useLocation();
  const state = location.state as ResultsState | null;

  if (!state) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500">No session data found.</p>
        <Link to="/" className="mt-4 inline-block text-brand-600 hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const { score, questionsAnswered, failures, rejects, aggregate, topicTitle, bookTitle } = state;
  const correct = questionsAnswered - failures - rejects;
  const accuracy = questionsAnswered > 0 ? Math.round((correct / questionsAnswered) * 100) : 0;

  return (
    <div className="mx-auto max-w-lg space-y-6 animate-fade-in">
      {/* Hero result */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="text-center"
      >
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 shadow-lg">
          <Trophy className="h-10 w-10 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Session Complete!</h1>
        {topicTitle && (
          <p className="mt-1 text-sm text-gray-500">
            {topicTitle} — {bookTitle}
          </p>
        )}
      </motion.div>

      {/* Score */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Your Score
          </p>
          <p
            className="mt-2 text-6xl font-extrabold text-brand-600"
            role="status"
            aria-label={`Final score: ${score}`}
          >
            {score}
          </p>
          <p className="mt-2 text-sm text-gray-500">{accuracy}% accuracy</p>
        </Card>
      </motion.div>

      {/* Breakdown */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Breakdown</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1.5">
                <Target className="h-4 w-4 text-success-500" aria-hidden="true" />
                <span className="text-2xl font-bold text-success-600">{correct}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">Correct</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5">
                <XCircle className="h-4 w-4 text-danger-500" aria-hidden="true" />
                <span className="text-2xl font-bold text-danger-600">{failures}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">Wrong</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5">
                <SkipForward className="h-4 w-4 text-gray-400" aria-hidden="true" />
                <span className="text-2xl font-bold text-gray-600">{rejects}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">Skipped</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Leaderboard aggregate */}
      {aggregate && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-xp/30 bg-purple-50/50">
            <h2 className="mb-3 text-sm font-semibold text-purple-700">
              Your Overall Stats
            </h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-purple-600">
                  {aggregate.best_score}
                </p>
                <p className="text-xs text-purple-500">Best Score</p>
              </div>
              <div>
                <p className="text-xl font-bold text-purple-600">
                  {aggregate.total_score}
                </p>
                <p className="text-xs text-purple-500">Total XP</p>
              </div>
              <div>
                <p className="text-xl font-bold text-purple-600">
                  {aggregate.sessions}
                </p>
                <p className="text-xs text-purple-500">Sessions</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.65 }}
        className="flex gap-3"
      >
        <Link to="/books" className="flex-1">
          <Button variant="secondary" className="w-full">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Study Again
          </Button>
        </Link>
        <Link to="/" className="flex-1">
          <Button className="w-full">
            Dashboard
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
