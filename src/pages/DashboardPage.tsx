import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Upload,
  Zap,
  Trophy,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useBookStore, useSessionHistoryStore } from '@/stores/bookStore';
import { leaderboardApi } from '@/api/endpoints';
import { Card, CardContent, Skeleton, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const displayName = useAuthStore((s) => s.displayName);
  const email = useAuthStore((s) => s.email);
  const userId = useAuthStore((s) => s.userId);
  const books = useBookStore((s) => s.books);
  const sessions = useSessionHistoryStore((s) => s.sessions);

  const { data: aggregate, isLoading: aggLoading } = useQuery({
    queryKey: ['aggregate', userId],
    queryFn: () => leaderboardApi.getUserAggregate(userId!),
    enabled: !!userId,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const recentSessions = sessions.slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome banner */}
      <section aria-labelledby="welcome-heading">
        <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-8 text-white shadow-lg">
          <h1 id="welcome-heading" className="text-2xl font-bold">
            Welcome back, {displayName || email?.split('@')[0]} 👋
          </h1>
          <p className="mt-2 text-brand-100">
            Ready for your next study session? Let&apos;s keep that streak going.
          </p>
        </div>
      </section>

      {/* Stats grid */}
      <section aria-label="Your stats">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Trophy className="h-5 w-5 text-accent-500" />}
            label="Best Score"
            value={aggLoading ? null : (aggregate?.best_score ?? 0)}
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-success-500" />}
            label="Total Score"
            value={aggLoading ? null : (aggregate?.total_score ?? 0)}
          />
          <StatCard
            icon={<Target className="h-5 w-5 text-xp" />}
            label="Sessions"
            value={aggLoading ? null : (aggregate?.sessions ?? sessions.length)}
          />
          <StatCard
            icon={<BookOpen className="h-5 w-5 text-brand-500" />}
            label="Books"
            value={books.length}
          />
        </div>
      </section>

      {/* Quick actions */}
      <section aria-label="Quick actions">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            to="/books/upload"
            icon={<Upload className="h-6 w-6" />}
            title="Upload a Book"
            description="Upload PDF, EPUB, or TXT files to study from"
            color="brand"
          />
          <QuickAction
            to="/books"
            icon={<Zap className="h-6 w-6" />}
            title="Start Studying"
            description="Pick a topic and jump into a timed MCQ session"
            color="accent"
          />
          <QuickAction
            to="/leaderboard"
            icon={<Trophy className="h-6 w-6" />}
            title="Leaderboard"
            description="See how you rank against other learners"
            color="xp"
          />
        </div>
      </section>

      {/* Recent activity */}
      <section aria-label="Recent sessions">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Recent Sessions
        </h2>
        {recentSessions.length === 0 ? (
          <Card>
            <CardContent>
              <p className="py-8 text-center text-sm text-gray-500">
                No sessions yet. Upload a book and start studying!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentSessions.map((s) => (
              <Card key={s.session_id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-gray-900">{s.topic_title}</p>
                  <p className="text-xs text-gray-500">
                    {s.book_title} &middot;{' '}
                    {s.ended_at ? formatDate(s.ended_at) : 'In progress'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={s.tone === 'mean' ? 'danger' : 'default'}>
                    {s.tone}
                  </Badge>
                  {s.score != null && (
                    <span className="text-lg font-bold text-brand-600">
                      {s.score}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ─── Sub-components ─── */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </p>
        {value === null ? (
          <Skeleton className="mt-1 h-6 w-12" />
        ) : (
          <p className="text-xl font-bold text-gray-900">{value}</p>
        )}
      </div>
    </Card>
  );
}

function QuickAction({
  to,
  icon,
  title,
  description,
  color,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'brand' | 'accent' | 'xp';
}) {
  const colorClasses = {
    brand: 'bg-brand-50 text-brand-600 group-hover:bg-brand-100',
    accent: 'bg-accent-50 text-accent-600 group-hover:bg-accent-100',
    xp: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100',
  };

  return (
    <Link to={to} className="group">
      <Card className="flex items-start gap-4 transition-shadow hover:shadow-md">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors ${colorClasses[color]}`}
          aria-hidden="true"
        >
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="mt-0.5 text-sm text-gray-500">{description}</p>
        </div>
      </Card>
    </Link>
  );
}
