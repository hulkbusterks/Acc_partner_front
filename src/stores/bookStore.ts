import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LocalBook, LocalSession, Topic } from '@/api/types';
import { useAuthStore } from './authStore';

/* ─── Helpers ─── */

/** Return the current authenticated user's ID, or '' if not logged in. */
function currentUserId(): string {
  return useAuthStore.getState().userId ?? '';
}

/* ─── Book store (scoped per user) ─── */

interface StoredBook extends LocalBook {
  /** Owner user ID */
  _uid: string;
}

interface BookState {
  _allBooks: StoredBook[];
  /** Books belonging to the current user */
  books: LocalBook[];
  addBook: (book: Omit<LocalBook, 'topics' | 'uploadedAt'>) => void;
  setTopics: (bookId: string, topics: Topic[]) => void;
  getBook: (bookId: string) => LocalBook | undefined;
  /** Clear all data for the current user (called on logout) */
  clearForUser: () => void;
}

function deriveBooks(allBooks: StoredBook[]): LocalBook[] {
  const uid = currentUserId();
  return allBooks.filter((b) => b._uid === uid);
}

export const useBookStore = create<BookState>()(
  persist(
    (set, get) => ({
      _allBooks: [],
      books: [],

      addBook: (book) => {
        const uid = currentUserId();
        set((s) => {
          const next = [
            { ...book, topics: [] as Topic[], uploadedAt: new Date().toISOString(), _uid: uid },
            ...s._allBooks,
          ];
          return { _allBooks: next, books: deriveBooks(next) };
        });
      },

      setTopics: (bookId, topics) => {
        set((s) => {
          const next = s._allBooks.map((b) =>
            b.book_id === bookId ? { ...b, topics } : b,
          );
          return { _allBooks: next, books: deriveBooks(next) };
        });
      },

      getBook: (bookId) => get().books.find((b) => b.book_id === bookId),

      clearForUser: () => {
        const uid = currentUserId();
        set((s) => {
          const next = s._allBooks.filter((b) => b._uid !== uid);
          return { _allBooks: next, books: [] };
        });
      },
    }),
    {
      name: 'acc-books',
      // Re-derive user-scoped books on rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.books = deriveBooks(state._allBooks);
        }
      },
    },
  ),
);

/** Call after login / auth change to refresh the user-scoped view */
export function resyncBookStore() {
  const s = useBookStore.getState();
  useBookStore.setState({ books: deriveBooks(s._allBooks) });
}

/* ─── Session history store (scoped per user) ─── */

interface StoredSession extends LocalSession {
  _uid: string;
}

interface SessionHistoryState {
  _allSessions: StoredSession[];
  /** Sessions belonging to the current user */
  sessions: LocalSession[];
  addSession: (session: LocalSession) => void;
  updateSession: (sessionId: string, patch: Partial<LocalSession>) => void;
  getSession: (sessionId: string) => LocalSession | undefined;
  clearForUser: () => void;
}

function deriveSessions(all: StoredSession[]): LocalSession[] {
  const uid = currentUserId();
  return all.filter((s) => s._uid === uid);
}

export const useSessionHistoryStore = create<SessionHistoryState>()(
  persist(
    (set, get) => ({
      _allSessions: [],
      sessions: [],

      addSession: (session) => {
        const uid = currentUserId();
        set((s) => {
          const next = [{ ...session, _uid: uid }, ...s._allSessions];
          return { _allSessions: next, sessions: deriveSessions(next) };
        });
      },

      updateSession: (sessionId, patch) => {
        set((s) => {
          const next = s._allSessions.map((sess) =>
            sess.session_id === sessionId ? { ...sess, ...patch } : sess,
          );
          return { _allSessions: next, sessions: deriveSessions(next) };
        });
      },

      getSession: (sessionId) =>
        get().sessions.find((s) => s.session_id === sessionId),

      clearForUser: () => {
        const uid = currentUserId();
        set((s) => {
          const next = s._allSessions.filter((sess) => sess._uid !== uid);
          return { _allSessions: next, sessions: [] };
        });
      },
    }),
    {
      name: 'acc-sessions',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.sessions = deriveSessions(state._allSessions);
        }
      },
    },
  ),
);

export function resyncSessionStore() {
  const s = useSessionHistoryStore.getState();
  useSessionHistoryStore.setState({ sessions: deriveSessions(s._allSessions) });
}

/* ─── Auto-resync when user changes ─── */

let _prevUserId: string | null = null;

useAuthStore.subscribe((state) => {
  const uid = state.userId;
  if (uid !== _prevUserId) {
    _prevUserId = uid;
    // Re-derive user-scoped views whenever the logged-in user changes
    resyncBookStore();
    resyncSessionStore();
  }
});
