import { useSessionHistoryStore } from '@/stores/bookStore';
import { Badge, EmptyState } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { Clock, Target, XCircle, SkipForward } from 'lucide-react';

export default function HistoryPage() {
  const sessions = useSessionHistoryStore((s) => s.sessions);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Session History</h1>
        <p className="text-sm text-gray-500">
          Track your past study sessions and scores
        </p>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="No sessions yet"
          description="Complete a study session to see your history here."
        />
      ) : (
        <div className="overflow-x-auto">
          <table
            className="w-full text-sm"
            aria-label="Session history"
          >
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600">
                  Topic
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600">
                  Book
                </th>
                <th scope="col" className="px-4 py-3 text-center font-semibold text-gray-600">
                  Tone
                </th>
                <th scope="col" className="px-4 py-3 text-center font-semibold text-gray-600">
                  <Clock className="mx-auto h-4 w-4" aria-label="Duration" />
                </th>
                <th scope="col" className="px-4 py-3 text-center font-semibold text-gray-600">
                  <Target className="mx-auto h-4 w-4" aria-label="Score" />
                </th>
                <th scope="col" className="px-4 py-3 text-center font-semibold text-gray-600">
                  <XCircle className="mx-auto h-4 w-4" aria-label="Failures" />
                </th>
                <th scope="col" className="px-4 py-3 text-center font-semibold text-gray-600">
                  <SkipForward className="mx-auto h-4 w-4" aria-label="Skips" />
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr
                  key={s.session_id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                    {s.topic_title}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate">
                    {s.book_title}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={s.tone === 'mean' ? 'danger' : 'default'}>
                      {s.tone}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-gray-600">
                    {s.duration_minutes}m
                  </td>
                  <td className="px-4 py-3 text-center">
                    {s.score != null ? (
                      <span className="font-bold text-brand-600">{s.score}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-danger-500">
                    {s.failures ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-gray-500">
                    {s.rejects ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {s.ended_at
                      ? formatDate(s.ended_at)
                      : s.started_at
                        ? 'In progress'
                        : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
