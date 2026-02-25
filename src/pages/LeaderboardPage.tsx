import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Medal, TrendingUp } from 'lucide-react';
import { authApi, leaderboardApi } from '@/api/endpoints';
import { useAuthStore } from '@/stores/authStore';
import { Card, Skeleton, Badge } from '@/components/ui';
import { cn, rankLabel } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

type OrderBy = 'best' | 'total';

export default function LeaderboardPage() {
  const [orderBy, setOrderBy] = useState<OrderBy>('best');
  const userId = useAuthStore((s) => s.userId);
  const displayName = useAuthStore((s) => s.displayName);

  const { data: aggregates, isLoading } = useQuery({
    queryKey: ['leaderboard', orderBy],
    queryFn: () => leaderboardApi.getAggregates(50, orderBy),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  /* Fetch user list to resolve user_id → display name */
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => authApi.listUsers(200),
    staleTime: 5 * 60_000, // cache 5 min — user list rarely changes
  });

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users?.forEach((u) => {
      map.set(u.id, u.display_name || u.email.split('@')[0]);
    });
    return map;
  }, [users]);

  const chartData = (aggregates ?? []).slice(0, 10).map((a, i) => ({
    name: userMap.get(a.user_id)?.split(' ')[0] || `#${i + 1}`,
    score: orderBy === 'best' ? a.best_score : a.total_score,
    isUser: a.user_id === userId,
  }));

  const barColors = ['#f97316', '#94a3b8', '#d97706', ...Array(7).fill('#3b8ffa')];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-sm text-gray-500">
            See how you stack up against other learners
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1" role="tablist" aria-label="Leaderboard sort order">
          {([
            { value: 'best' as OrderBy, label: 'Best Score' },
            { value: 'total' as OrderBy, label: 'Total XP' },
          ]).map((tab) => (
            <button
              key={tab.value}
              role="tab"
              aria-selected={orderBy === tab.value}
              onClick={() => setOrderBy(tab.value)}
              className={cn(
                'rounded-md px-4 py-2 text-sm font-medium transition-all',
                orderBy === tab.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Top 10</h2>
          <div className="h-64" aria-label="Top 10 leaderboard chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isUser ? '#a855f7' : barColors[index] || '#3b8ffa'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Leaderboard rankings">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th scope="col" className="px-6 py-3 text-left font-semibold text-gray-600">
                  Rank
                </th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-gray-600">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-right font-semibold text-gray-600">
                  Best Score
                </th>
                <th scope="col" className="px-6 py-3 text-right font-semibold text-gray-600">
                  Total XP
                </th>
                <th scope="col" className="px-6 py-3 text-right font-semibold text-gray-600">
                  Sessions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-6 py-4"><Skeleton className="h-4 w-8" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="ml-auto h-4 w-12" /></td>
                    <td className="px-6 py-4"><Skeleton className="ml-auto h-4 w-12" /></td>
                    <td className="px-6 py-4"><Skeleton className="ml-auto h-4 w-8" /></td>
                  </tr>
                ))}

              {aggregates?.map((agg, idx) => {
                const isCurrentUser = agg.user_id === userId;
                return (
                  <tr
                    key={agg.user_id}
                    className={cn(
                      'border-b border-gray-100 transition-colors',
                      isCurrentUser
                        ? 'bg-brand-50/60 font-medium'
                        : 'hover:bg-gray-50',
                    )}
                    aria-current={isCurrentUser ? 'true' : undefined}
                  >
                    <td className="px-6 py-4">
                      <span className="text-lg">{rankLabel(idx)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900">
                          {isCurrentUser && displayName
                            ? displayName
                            : userMap.get(agg.user_id) || `${agg.user_id.slice(0, 8)}…`}
                        </span>
                        {isCurrentUser && (
                          <Badge variant="xp">You</Badge>
                        )}
                        {idx < 3 && (
                          <Medal
                            className={cn(
                              'h-4 w-4',
                              idx === 0 && 'text-yellow-500',
                              idx === 1 && 'text-gray-400',
                              idx === 2 && 'text-amber-600',
                            )}
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono font-semibold text-brand-600">
                        {agg.best_score}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TrendingUp className="h-3 w-3 text-success-500" aria-hidden="true" />
                        <span className="font-mono">{agg.total_score}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                      {agg.sessions}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {aggregates?.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-500">
            No rankings yet. Complete a study session to appear!
          </div>
        )}
      </Card>
    </div>
  );
}
