import api from './client';
import type {
  RegisterIn,
  RegisterOut,
  UserOut,
  LoginIn,
  LoginOut,
  BookIn,
  BookOut,
  FileUploadOut,
  GenerateTopicsOut,
  CreateSessionIn,
  CreateSessionOut,
  StartSessionOut,
  GenerateQuestionsOut,
  NextQuestionOut,
  SubmitIn,
  SubmitOut,
  EndSessionOut,
  LeaderboardEntry,
  LeaderboardAggregate,
  HealthOut,
} from './types';

/* ═══════════════════════════════════════════
   Auth
   ═══════════════════════════════════════════ */

export const authApi = {
  register: (data: RegisterIn) =>
    api.post<RegisterOut>('/auth/register', data).then((r) => r.data),

  login: (data: LoginIn) =>
    api.post<LoginOut>('/auth/login', data).then((r) => r.data),

  listUsers: (limit = 50) =>
    api.get<UserOut[]>('/auth/users', { params: { limit } }).then((r) => r.data),

  getMe: () =>
    api.get<UserOut>('/auth/users/me').then((r) => r.data),

  getUserById: (userId: string) =>
    api.get<UserOut>(`/auth/users/${userId}`).then((r) => r.data),
};

/* ═══════════════════════════════════════════
   Content Ingestion
   ═══════════════════════════════════════════ */

export const ingestApi = {
  bookFromText: (data: BookIn) =>
    api.post<BookOut>('/ingest/book', data).then((r) => r.data),

  uploadFile: (title: string, file: File, authors?: string) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post<FileUploadOut>('/ingest/file', form, {
        params: { title, ...(authors ? { authors } : {}) },
        headers: { 'Content-Type': undefined },
        timeout: 120_000, // large file upload
      })
      .then((r) => r.data);
  },

  generateTopics: (bookId: string, mode: 'rag' | 'rule' = 'rag') =>
    api
      .post<GenerateTopicsOut>(`/ingest/books/${bookId}/topics`, null, {
        params: { mode },
      })
      .then((r) => r.data),
};

/* ═══════════════════════════════════════════
   Sessions
   ═══════════════════════════════════════════ */

export const sessionApi = {
  create: (data: CreateSessionIn) =>
    api.post<CreateSessionOut>('/sessions/', data).then((r) => r.data),

  start: (sessionId: string, durationMinutes = 30) =>
    api
      .post<StartSessionOut>(`/sessions/${sessionId}/start`, null, {
        params: { duration_minutes: durationMinutes },
      })
      .then((r) => r.data),

  generateQuestions: (sessionId: string, n = 5) =>
    api
      .post<GenerateQuestionsOut>(
        `/sessions/${sessionId}/generate_questions`,
        null,
        { params: { n } },
      )
      .then((r) => r.data),

  nextQuestion: (sessionId: string) =>
    api
      .get<NextQuestionOut>(`/sessions/${sessionId}/next_question`)
      .then((r) => r.data),

  submit: (sessionId: string, data: SubmitIn) =>
    api
      .post<SubmitOut>(`/sessions/${sessionId}/submit`, data)
      .then((r) => r.data),

  end: (sessionId: string) =>
    api
      .post<EndSessionOut>(`/sessions/${sessionId}/end`)
      .then((r) => r.data),
};

/* ═══════════════════════════════════════════
   Leaderboard
   ═══════════════════════════════════════════ */

export const leaderboardApi = {
  getEntries: (limit = 50) =>
    api
      .get<LeaderboardEntry[]>('/leaderboard/entries', { params: { limit } })
      .then((r) => r.data),

  getTopEntries: (limit = 10) =>
    api
      .get<LeaderboardEntry[]>('/leaderboard/aggregate/top', {
        params: { limit },
      })
      .then((r) => r.data),

  getAggregates: (limit = 50, orderBy: 'best' | 'total' = 'best') =>
    api
      .get<LeaderboardAggregate[]>('/leaderboard/aggregates', {
        params: { limit, order_by: orderBy },
      })
      .then((r) => r.data),

  getUserAggregate: (userId: string) =>
    api
      .get<LeaderboardAggregate>(`/leaderboard/aggregate/${userId}`)
      .then((r) => r.data),
};

/* ═══════════════════════════════════════════
   Health
   ═══════════════════════════════════════════ */

export const healthApi = {
  check: () => api.get<HealthOut>('/health').then((r) => r.data),
};
