/* ──────────────────────────────────────────
   API Types — derived from API_REFERENCE.md
   ────────────────────────────────────────── */

// ─── Auth ───
export interface RegisterIn {
  email: string;
  password: string;
  display_name?: string;
}

export interface RegisterOut {
  user_id: string;
}

export interface UserOut {
  id: string;
  email: string;
  display_name?: string;
  created_at: string;
}

export interface LoginIn {
  email: string;
  password: string;
}

export interface LoginOut {
  token: string;
  user_id: string;
}

// ─── Books / Ingestion ───
export interface BookIn {
  title: string;
  authors?: string;
  raw_text?: string;
}

export interface BookOut {
  book_id: string;
}

export interface FileUploadOut {
  book_id: string;
  chars: number;
}

export interface Topic {
  id: string;
  title: string;
}

export interface GenerateTopicsOut {
  created: number;
  topics: Topic[];
}

// ─── Sessions ───
export type SessionTone = 'neutral' | 'mean';

export interface CreateSessionIn {
  topic_id: string;
  requested_minutes?: number;
  tone?: SessionTone;
}

export interface CreateSessionOut {
  session_id: string;
}

export interface StartSessionOut {
  session_id: string;
  started_at: string;
}

export interface QuestionChoice {
  question: string;
  choices: string[];
  correct_index: number;
  explanation: string;
}

export interface GeneratedQuestion {
  question_json: QuestionChoice;
  prompt_id: string;
  source_chunks?: string[];
  verified?: boolean;
  deterministic_supported?: boolean;
  graph_meta?: Record<string, unknown>;
}

export interface GenerateQuestionsOut {
  generated: number;
  questions: GeneratedQuestion[];
}

export interface Prompt {
  prompt_id: string;
  prompt_text: string;
  question: string;
  choices: string[];
  remaining: number;
}

export interface NextQuestionOut {
  next: Prompt | null;
}

export interface SubmitIn {
  prompt_id: string;
  answer: string;
  reject?: boolean;
}

export interface OptionReasoning {
  index: number;
  text: string;
  correct: boolean;
  reason: string;
}

export interface SubmitOut {
  correct?: boolean;
  session_score?: number;
  failures?: number;
  correct_index?: number;
  correct_answer?: string;
  explanation?: string;
  options?: OptionReasoning[];
  mean_comment?: string;
  rejected?: boolean;
  session_rejects?: number;
  remaining?: number;
  session_complete?: boolean;
}

export interface EndSessionOut {
  session_id: string;
  ended_at: string;
  score: number;
  aggregate?: LeaderboardAggregate;
}

// ─── Leaderboard ───
export interface LeaderboardEntry {
  id?: string;
  user_id: string;
  score: number;
  session_count: number;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardAggregate {
  user_id: string;
  best_score: number;
  total_score: number;
  sessions: number;
  updated_at: string;
}

// ─── Health ───
export interface HealthOut {
  status: string;
  faiss_vectors?: number;
}

// ─── Local-only models (for client-side tracking) ───
export interface LocalBook {
  book_id: string;
  title: string;
  authors?: string;
  uploadedAt: string;
  topics: Topic[];
}

export interface LocalSession {
  session_id: string;
  topic_id: string;
  topic_title: string;
  book_title: string;
  tone: SessionTone;
  duration_minutes: number;
  started_at?: string;
  ended_at?: string;
  score?: number;
  failures?: number;
  rejects?: number;
}
