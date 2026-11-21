import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { completeLesson, getLesson, submitAnswer } from "../services/lessonService";
import type { AnswerValue, CompleteResult, Lesson, LessonStep } from "../types/lesson";
import { StepView, isInteractive } from "../components/LessonSteps";
import "./LessonSessionPage.css";

const START_HEARTS = 5; // nilai awal; setelah jawaban pertama diganti nilai dari backend
const PRAISE = ["Benar!", "Mantap!", "Keren!"];

interface QueueItem {
  step: LessonStep;
  key: string;
}

function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "Tidak dapat terhubung ke server. Coba lagi nanti.";
    return err.response.data?.error ?? err.response.data?.message ?? "Terjadi kesalahan. Coba lagi.";
  }
  return err instanceof Error ? err.message : "Terjadi kesalahan yang tidak diketahui.";
}

function LessonSession({ lesson, onRetry }: { lesson: Lesson; onRetry: () => void }) {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<QueueItem[]>(() =>
    lesson.steps.map((s) => ({ step: s, key: s.id }))
  );
  const [index, setIndex] = useState(0);
  const [hearts, setHearts] = useState(START_HEARTS);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [answer, setAnswer] = useState<AnswerValue | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");
  const [correctText, setCorrectText] = useState("");
  const [choiceMark, setChoiceMark] = useState<{ right: number | null; wrong: number | null }>({
    right: null,
    wrong: null,
  });
  const [completed, setCompleted] = useState(0);
  const [finished, setFinished] = useState(false);
  const [outOfHearts, setOutOfHearts] = useState(false);
  const [result, setResult] = useState<CompleteResult | null>(null);
  const [resultError, setResultError] = useState("");

  const handleReady = useCallback((a: AnswerValue | null) => setAnswer(a), []);

  const current = queue[index];
  const progress = Math.round((completed / lesson.steps.length) * 100);

  const saveResult = useCallback(() => {
    setResultError("");
    completeLesson(lesson.id)
      .then(setResult)
      .catch((err) => setResultError(errorMessage(err)));
  }, [lesson.id]);

  useEffect(() => {
    if (finished) saveResult();
  }, [finished, saveResult]);

  const handleClose = () => {
    if (window.confirm("Keluar dari pelajaran? Progres sesi ini akan hilang.")) {
      navigate("/belajar");
    }
  };

  const check = async () => {
    if (answer === null || checking) return;
    setCheckError("");

    // Playground tidak dinilai backend
    if (current.step.type === "playground") {
      setStatus("correct");
      return;
    }

    setChecking(true);
    try {
      const res = await submitAnswer(lesson.id, current.step.id, answer);
      setHearts(res.hearts);
      setCorrectText(res.correctAnswer);
      if (current.step.type === "choice" && typeof answer === "number") {
        setChoiceMark({ right: res.correct ? answer : null, wrong: res.correct ? null : answer });
      }
      if (res.correct) {
        setStatus("correct");
      } else {
        setStatus("wrong");
        // soal yang salah diulang di akhir sesi, seperti Duolingo
        setQueue((q) => [...q, { step: current.step, key: `${current.step.id}-r${q.length}` }]);
      }
    } catch (err) {
      setCheckError(errorMessage(err));
    } finally {
      setChecking(false);
    }
  };

  const next = () => {
    if (status === "wrong" && hearts <= 0) {
      setOutOfHearts(true);
      return;
    }
    if (status !== "wrong") setCompleted((c) => c + 1);
    if (index + 1 >= queue.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setStatus("idle");
    setAnswer(null);
    setCorrectText("");
    setCheckError("");
    setChoiceMark({ right: null, wrong: null });
  };

  if (outOfHearts) {
    return (
      <div className="ls-page ls-done">
        <div className="ls-done__icon ls-done__icon--bad">💔</div>
        <h1 className="ls-title">Nyawa habis</h1>
        <p className="ls-text">Coba ulangi pelajaran ini dari awal.</p>
        <button className="ls-btn" onClick={onRetry}>COBA LAGI</button>
        <button className="ls-btn ls-btn--ghost" onClick={() => navigate("/belajar")}>
          KEMBALI
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="ls-page ls-done">
        <div className="ls-done__icon">✓</div>
        <h1 className="ls-title">Pelajaran selesai!</h1>
        <p className="ls-text">{lesson.title}</p>
        {result && (
          <div className="ls-reward">
            <span>Hadiah kamu</span>
            <strong>+{result.xpGained} XP</strong>
          </div>
        )}
        {!result && !resultError && <p className="ls-text">Menyimpan hasil...</p>}
        {resultError && (
          <>
            <p className="ls-text" style={{ color: "#ea2b2b" }}>{resultError}</p>
            <button className="ls-btn ls-btn--ghost" onClick={saveResult}>COBA SIMPAN LAGI</button>
          </>
        )}
        <button className="ls-btn" disabled={!result && !resultError} onClick={() => navigate("/belajar")}>
          LANJUT
        </button>
      </div>
    );
  }

  if (!current) return null;
  const interactive = isInteractive(current.step);

  return (
    <div className="ls-page">
      <header className="ls-top">
        <button className="ls-close" aria-label="Keluar" onClick={handleClose}>✕</button>
        <div className="ls-progress">
          <div className="ls-progress__bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="ls-hearts">❤️ {hearts}</div>
      </header>

      <main className="ls-main">
        <div
          key={current.key}
          className={`ls-step ${status === "wrong" ? "ls-step--shake" : ""}`}
        >
          <StepView
            step={current.step}
            locked={status !== "idle" || checking}
            onReady={handleReady}
            correctIndex={choiceMark.right}
            wrongIndex={choiceMark.wrong}
          />
        </div>
      </main>

      <footer className={`ls-bottom ls-bottom--${status}`}>
        <div className="ls-bottom__inner">
          <div className="ls-feedback">
            {checkError && <span style={{ color: "#ea2b2b" }}>{checkError}</span>}
            {status === "correct" && <strong>{PRAISE[completed % PRAISE.length]}</strong>}
            {status === "wrong" && (
              <>
                <strong>Jawaban benar:</strong>
                <span className="ls-feedback__answer">{correctText}</span>
              </>
            )}
          </div>
          {interactive && status === "idle" ? (
            <button className="ls-btn" disabled={answer === null || checking} onClick={check}>
              {checking ? "MEMERIKSA..." : "PERIKSA"}
            </button>
          ) : (
            <button
              className={`ls-btn ${status === "wrong" ? "ls-btn--red" : ""}`}
              onClick={next}
            >
              LANJUT
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

export default function LessonSessionPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(0);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login", { replace: true });
      return;
    }
    if (!lessonId) return;

    let cancelled = false;
    setLoading(true);
    setError("");
    getLesson(lessonId)
      .then((l) => !cancelled && setLesson(l))
      .catch((err) => {
        if (cancelled) return;
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }
        setError(errorMessage(err));
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [lessonId, attempt, navigate]);

  if (loading) {
    return <div className="ls-page ls-done"><p className="ls-text">Memuat pelajaran...</p></div>;
  }

  if (error || !lesson) {
    return (
      <div className="ls-page ls-done">
        <h1 className="ls-title">Pelajaran tidak dapat dimuat</h1>
        <p className="ls-text" style={{ color: "#ea2b2b" }}>{error}</p>
        <button className="ls-btn" onClick={() => setAttempt((a) => a + 1)}>COBA LAGI</button>
        <button className="ls-btn ls-btn--ghost" onClick={() => navigate("/belajar")}>KEMBALI</button>
      </div>
    );
  }

  return (
    <LessonSession
      key={`${lesson.id}-${attempt}`}
      lesson={lesson}
      onRetry={() => setAttempt((a) => a + 1)}
    />
  );
}