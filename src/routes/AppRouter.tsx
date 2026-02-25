import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import { AppLayout, AuthGuard } from '@/components/layout';
import Skeleton from '@/components/ui/Skeleton';

/* ── Lazy-loaded page imports for code-splitting ── */
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const BooksPage = lazy(() => import('@/pages/BooksPage'));
const UploadBookPage = lazy(() => import('@/pages/UploadBookPage'));
const TopicsPage = lazy(() => import('@/pages/TopicsPage'));
const NewSessionPage = lazy(() => import('@/pages/NewSessionPage'));
const ActiveSessionPage = lazy(() => import('@/pages/ActiveSessionPage'));
const SessionResultsPage = lazy(() => import('@/pages/SessionResultsPage'));
const LeaderboardPage = lazy(() => import('@/pages/LeaderboardPage'));
const HistoryPage = lazy(() => import('@/pages/HistoryPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));

function PageLoader() {
  return (
    <div className="flex flex-col items-center gap-4 py-24" role="status" aria-label="Loading page">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-64 w-full max-w-xl" />
      <span className="sr-only">Loading page…</span>
    </div>
  );
}

function withSuspense(Component: React.LazyExoticComponent<() => React.JSX.Element>) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

function withAuth(Component: React.LazyExoticComponent<() => React.JSX.Element>) {
  return (
    <AuthGuard>
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    </AuthGuard>
  );
}

const router = createBrowserRouter([
  /* ── Public routes ── */
  {
    path: '/login',
    element: withSuspense(LoginPage),
  },
  {
    path: '/register',
    element: withSuspense(RegisterPage),
  },

  /* ── Protected routes with AppLayout ── */
  {
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: withAuth(DashboardPage) },
      { path: 'books', element: withAuth(BooksPage) },
      { path: 'books/upload', element: withAuth(UploadBookPage) },
      { path: 'books/:bookId/topics', element: withAuth(TopicsPage) },
      { path: 'sessions/new', element: withAuth(NewSessionPage) },
      { path: 'sessions/:sessionId', element: withAuth(ActiveSessionPage) },
      {
        path: 'sessions/:sessionId/results',
        element: withAuth(SessionResultsPage),
      },
      { path: 'leaderboard', element: withAuth(LeaderboardPage) },
      { path: 'history', element: withAuth(HistoryPage) },
      { path: 'profile', element: withAuth(ProfilePage) },
    ],
  },

  /* ── Catch-all → redirect to dashboard ── */
  {
    path: '*',
    element: withSuspense(
      lazy(async () => ({
        default: () => {
          window.location.href = '/';
          return <></>;
        },
      })),
    ),
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
