import { useQuery } from '@tanstack/react-query';
import { Trophy, TrendingUp, Target, Mail, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useSessionHistoryStore } from '@/stores/bookStore';
import { leaderboardApi } from '@/api/endpoints';
import { Card, Skeleton, Badge } from '@/components/ui';
import { jwtMinutesRemaining } from '@/lib/utils';

export default function ProfilePage() {
  const { displayName, email, userId, token } = useAuthStore();
  const sessions = useSessionHistoryStore((s) => s.sessions);

  const { data: aggregate, isLoading } = useQuery({
    queryKey: ['aggregate', userId],
    queryFn: () => leaderboardApi.getUserAggregate(userId!),
    enabled: !!userId,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const minutesLeft = token ? jwtMinutesRemaining(token) : 0;
  const hoursLeft = Math.floor(minutesLeft / 60);

  // Rank badge based on sessions
  const totalSessions = aggregate?.sessions ?? sessions.length;
  const rank =
    totalSessions >= 50
      ? { label: 'Legend', color: 'xp' as const }
      : totalSessions >= 20
        ? { label: 'Expert', color: 'success' as const }
        : totalSessions >= 5
          ? { label: 'Learner', color: 'warning' as const }
          : { label: 'Beginner', color: 'default' as const };

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

      {/* User info */}
      <Card className="flex items-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-lg">
          <User className="h-8 w-8" aria-hidden="true" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">
              {displayName || email?.split('@')[0] || 'Student'}
            </h2>
            <Badge variant={rank.color}>{rank.label}</Badge>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            {email}
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Session expires in {hoursLeft}h {minutesLeft % 60}m
          </p>
        </div>
      </Card>

      {/* Stats */}
      <section aria-label="Your statistics">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Statistics</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={<Trophy className="h-5 w-5 text-accent-500" />}
            label="Best Score"
            value={isLoading ? null : (aggregate?.best_score ?? 0)}
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-success-500" />}
            label="Total XP"
            value={isLoading ? null : (aggregate?.total_score ?? 0)}
          />
          <StatCard
            icon={<Target className="h-5 w-5 text-xp" />}
            label="Sessions Played"
            value={isLoading ? null : totalSessions}
          />
        </div>
      </section>

      {/* Rank progress */}
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Rank Progress
        </h2>
        <div className="space-y-3">
          {[
            { label: 'Beginner', min: 0, color: 'bg-gray-300' },
            { label: 'Learner', min: 5, color: 'bg-accent-400' },
            { label: 'Expert', min: 20, color: 'bg-success-500' },
            { label: 'Legend', min: 50, color: 'bg-xp' },
          ].map((tier) => (
            <div key={tier.label} className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${tier.color} ${
                  totalSessions >= tier.min ? 'opacity-100' : 'opacity-30'
                }`}
                aria-hidden="true"
              />
              <span
                className={`text-sm ${
                  totalSessions >= tier.min
                    ? 'font-semibold text-gray-900'
                    : 'text-gray-400'
                }`}
              >
                {tier.label}{' '}
                <span className="text-xs text-gray-400">
                  ({tier.min}+ sessions)
                </span>
              </span>
              {totalSessions >= tier.min && (
                <span className="ml-auto text-xs text-success-600">✓</span>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

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
