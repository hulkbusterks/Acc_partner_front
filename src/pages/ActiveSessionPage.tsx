import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  XCircle,
  SkipForward,
  AlertTriangle,
} from 'lucide-react';
import { sessionApi } from '@/api/endpoints';
import { useSessionHistoryStore } from '@/stores/bookStore';
import { Button, Card, ProgressBar, Badge } from '@/components/ui';
import { cn, formatTime } from '@/lib/utils';
import type { Prompt, SubmitOut } from '@/api/types';

export default function ActiveSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const updateSession = useSessionHistoryStore((s) => s.updateSession);
  const session = useSessionHistoryStore((s) => s.getSession(sessionId!));

  // Session state
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [failures, setFailures] = useState(0);
  const [rejects, setRejects] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [lastResult, setLastResult] = useState<SubmitOut | null>(null);
  const [meanComment, setMeanComment] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  // Timer
  const durationMinutes = session?.duration_minutes ?? 30;
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const endingRef = useRef(false);

  // Refs for latest state in callbacks — avoids stale closures
  const stateRef = useRef({ questionsAnswered, failures, rejects, score });
  stateRef.current = { questionsAnswered, failures, rejects, score };

  // Keep latest values in refs so callbacks never go stale
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const updateSessionRef = useRef(updateSession);
  updateSessionRef.current = updateSession;
  const sessionRef = useRef(session);
  sessionRef.current = session;

  // ─── End session (stable — no deps that change) ───
  const doEndSession = useCallback(async () => {
    if (endingRef.current || !sessionId) return;
    endingRef.current = true;
    clearInterval(timerRef.current);
    try {
      const data = await sessionApi.end(sessionId);
      updateSessionRef.current(sessionId, {
        ended_at: data.ended_at,
        score: data.score,
      });
      navigateRef.current(`/sessions/${sessionId}/results`, {
        state: {
          score: data.score,
          questionsAnswered: stateRef.current.questionsAnswered,
          failures: stateRef.current.failures,
          rejects: stateRef.current.rejects,
          aggregate: data.aggregate,
          topicTitle: sessionRef.current?.topic_title,
          bookTitle: sessionRef.current?.book_title,
        },
      });
    } catch {
      // Session likely already ended on the backend — navigate with local data
      navigateRef.current(`/sessions/${sessionId}/results`, {
        state: {
          score: stateRef.current.score,
          questionsAnswered: stateRef.current.questionsAnswered,
          failures: stateRef.current.failures,
          rejects: stateRef.current.rejects,
          aggregate: null,
          topicTitle: sessionRef.current?.topic_title,
          bookTitle: sessionRef.current?.book_title,
        },
      });
    }
  }, [sessionId]);

  // ─── Fetch next question (stable — only depends on sessionId) ───
  const fetchingRef = useRef(false);
  const fetchPrompt = useCallback(async () => {
    if (!sessionId || fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    try {
      const data = await sessionApi.nextQuestion(sessionId);
      if (data.next) {
        setPrompt(data.next);
        if (data.next.remaining != null) setRemaining(data.next.remaining);
      } else {
        // No more questions — show "finish" state instead of auto-ending
        setSessionComplete(true);
      }
    } catch {
      toast.error('Failed to load question');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [sessionId]);

  // Start timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // End when timer hits 0
  useEffect(() => {
    if (timeLeft === 0) {
      doEndSession();
    }
  }, [timeLeft, doEndSession]);

  // Fetch first prompt — only once on mount (guarded against StrictMode double-fire)
  const mountedRef = useRef(false);
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    fetchPrompt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // ─── Submit answer ───
  const handleSubmitAnswer = useCallback(
    async (answer: string, reject: boolean) => {
      if (submitting || lastResult || !prompt) return;
      setSubmitting(true);
      if (!reject) setSelectedAnswer(Number(answer));

      try {
        const result = await sessionApi.submit(sessionId!, {
          prompt_id: prompt.prompt_id,
          answer,
          reject,
        });

        setLastResult(result);
        setQuestionsAnswered((q) => q + 1);
        if (result.remaining != null) setRemaining(result.remaining);

        if (result.rejected) {
          setRejects(result.session_rejects ?? stateRef.current.rejects + 1);
        } else {
          setScore(result.session_score ?? stateRef.current.score);
          setFailures(result.failures ?? stateRef.current.failures);
          if (result.mean_comment) {
            setMeanComment(result.mean_comment);
            setTimeout(() => setMeanComment(null), 5000);
          }
        }

        // Mark complete if the server says so
        if (result.session_complete) {
          setSessionComplete(true);
        }

        // Show result — user clicks "Next" to proceed
      } catch {
        toast.error('Failed to submit. Try again.');
        setSubmitting(false);
      }
    },
    [submitting, lastResult, prompt, sessionId],
  );

  const handleAnswer = (index: number) => {
    handleSubmitAnswer(String(index), false);
  };

  const handleSkip = () => {
    handleSubmitAnswer('', true);
  };

  const handleNext = () => {
    if (sessionComplete) {
      // All questions answered — no need to fetch, just show finish UI
      setSelectedAnswer(null);
      setLastResult(null);
      setSubmitting(false);
      setPrompt(null);
      return;
    }
    setSelectedAnswer(null);
    setLastResult(null);
    setSubmitting(false);
    fetchPrompt();
  };

  const timePct = (timeLeft / (durationMinutes * 60)) * 100;
  const isLowTime = timePct < 15;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Timer bar */}
      <div
        className={cn(
          'sticky top-16 z-30 rounded-xl border bg-white p-4 shadow-sm',
          isLowTime ? 'border-danger-300' : 'border-gray-200',
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock
              className={cn(
                'h-5 w-5',
                isLowTime ? 'text-danger-500 animate-pulse' : 'text-gray-500',
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                'text-2xl font-mono font-bold',
                isLowTime ? 'text-danger-600' : 'text-gray-900',
              )}
              role="timer"
              aria-label={`Time remaining: ${formatTime(timeLeft)}`}
              aria-live="polite"
            >
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500">Score</p>
              <p className="text-lg font-bold text-brand-600">{score}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Mistakes</p>
              <p className="text-lg font-bold text-danger-500">{failures}</p>
            </div>
            <Button variant="danger" size="sm" onClick={doEndSession}>
              End
            </Button>
          </div>
        </div>
        <ProgressBar
          value={timePct}
          variant={isLowTime ? 'danger' : 'brand'}
          showLabel={false}
          className="mt-3"
        />
      </div>

      {/* Mean comment */}
      <AnimatePresence>
        {meanComment && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-lg border border-danger-300 bg-danger-50 p-4"
            role="alert"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-danger-500" aria-hidden="true" />
              <p className="text-sm font-medium text-danger-700">{meanComment}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question card */}
      {loading ? (
        <Card className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="mx-auto h-4 w-3/4 rounded bg-gray-200" />
            <div className="mx-auto h-4 w-1/2 rounded bg-gray-200" />
            <div className="mt-6 space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-gray-100" />
              ))}
            </div>
          </div>
          <p className="sr-only">Loading question…</p>
        </Card>
      ) : prompt ? (
        <motion.div
          key={prompt.prompt_id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            {(() => {
              const question = prompt.question || prompt.prompt_text;
              const choices = prompt.choices ?? [];
              return (
                <>
                  <div className="mb-2 flex items-center justify-between">
                    <Badge>Question {questionsAnswered + 1}</Badge>
                    <div className="flex items-center gap-2">
                      {remaining != null && (
                        <Badge variant="default">{remaining} left</Badge>
                      )}
                      <Badge variant="xp">{rejects} skipped</Badge>
                    </div>
                  </div>
                  <h2 className="mb-6 text-lg font-semibold text-gray-900">{question}</h2>

                  <div className="space-y-3" role="group" aria-label="Answer choices">
                    {choices.map((choice, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      const isSelected = selectedAnswer === idx;
                      const isCorrectOption = lastResult?.correct_index === idx;
                      const optionReason = lastResult?.options?.find((o) => o.index === idx);

                      let stateClass =
                        'border-gray-200 hover:border-brand-300 hover:bg-gray-50';
                      if (lastResult && !lastResult.rejected) {
                        if (isCorrectOption) {
                          stateClass = 'border-success-500 bg-success-50';
                        } else if (isSelected) {
                          stateClass = 'border-danger-500 bg-danger-50';
                        } else {
                          stateClass = 'border-gray-200 opacity-60';
                        }
                      } else if (isSelected) {
                        stateClass = 'border-brand-500 bg-brand-50';
                      }

                      return (
                        <div key={idx}>
                          <button
                            onClick={() => handleAnswer(idx)}
                            disabled={submitting || !!lastResult}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all',
                              stateClass,
                            )}
                            aria-label={`Option ${letter}: ${choice}`}
                            aria-pressed={isSelected}
                          >
                            <span
                              className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                                isCorrectOption && lastResult
                                  ? 'bg-success-500 text-white'
                                  : isSelected && lastResult
                                    ? 'bg-danger-500 text-white'
                                    : isSelected
                                      ? 'bg-brand-500 text-white'
                                      : 'bg-gray-100 text-gray-600',
                              )}
                              aria-hidden="true"
                            >
                              {letter}
                            </span>
                            <span className="flex-1 text-sm text-gray-700">{choice}</span>
                            {lastResult && !lastResult.rejected && (
                              <span className="ml-auto shrink-0" aria-hidden="true">
                                {isCorrectOption ? (
                                  <CheckCircle2 className="h-5 w-5 text-success-500" />
                                ) : isSelected ? (
                                  <XCircle className="h-5 w-5 text-danger-500" />
                                ) : null}
                              </span>
                            )}
                          </button>
                          {/* Per-option reasoning — only for selected or correct */}
                          {lastResult && !lastResult.rejected && optionReason?.reason && (isSelected || isCorrectOption) && (
                            <p className={cn(
                              'ml-11 mt-1 text-xs',
                              isCorrectOption ? 'text-success-600' : 'text-gray-500',
                            )}>
                              {optionReason.reason}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Result banner after submit */}
                  <AnimatePresence>
                    {lastResult && !lastResult.rejected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4"
                        role="alert"
                        aria-live="assertive"
                      >
                        <div
                          className={cn(
                            'rounded-lg p-3 text-sm font-medium',
                            lastResult.correct
                              ? 'bg-success-50 text-success-700'
                              : 'bg-danger-50 text-danger-700',
                          )}
                        >
                          {lastResult.correct
                            ? '✅ Correct!'
                            : `❌ Incorrect — the answer is ${lastResult.correct_answer}.`}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Skip / Next buttons */}
                  <div className="mt-4 flex justify-between">
                    {!lastResult ? (
                      <>
                        <span />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSkip}
                          disabled={submitting}
                        >
                          <SkipForward className="h-4 w-4" aria-hidden="true" />
                          Skip
                        </Button>
                      </>
                    ) : (
                      <>
                        <span />
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleNext}
                        >
                          {sessionComplete ? 'See Results →' : 'Next Question →'}
                        </Button>
                      </>
                    )}
                  </div>
                </>
              );
            })()}
          </Card>
        </motion.div>
      ) : sessionComplete ? (
        <Card className="p-8 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-success-500" aria-hidden="true" />
          <h2 className="text-lg font-bold text-gray-900">All questions answered!</h2>
          <p className="mt-1 text-sm text-gray-500">
            You answered {questionsAnswered} question{questionsAnswered !== 1 ? 's' : ''}. Ready to see your results?
          </p>
          <Button className="mt-6" onClick={doEndSession}>
            Finish Session
          </Button>
        </Card>
      ) : null}
    </div>
  );
}
