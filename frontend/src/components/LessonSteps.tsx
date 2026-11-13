import { useEffect, useState } from "react";
import type { DragEvent } from "react";
import type {
  AnswerValue,
  ChoiceStep,
  DragFillStep,
  InfoStep,
  LessonStep,
  PlaygroundStep,
  TakeawayStep,
} from "../types/lesson";

// onReady: null = belum bisa diperiksa; selain itu = jawaban yang siap dikirim
type OnReady = (answer: AnswerValue | null) => void;
interface Props<T> {
  step: T;
  locked: boolean;
  onReady: OnReady;
}

/* ---------- Info ---------- */
function InfoView({ step }: { step: InfoStep }) {
  return (
    <div>
      <h1 className="ls-title">{step.title}</h1>
      {step.paragraphs?.map((p, i) => (
        <p key={i} className="ls-text">{p}</p>
      ))}
      {step.bullets && (
        <ul className="ls-list">
          {step.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
      {step.footer && <p className="ls-text">{step.footer}</p>}
      {step.code && <div className="ls-code">{step.code}</div>}
    </div>
  );
}

/* ---------- Takeaway ---------- */
function TakeawayView({ step }: { step: TakeawayStep }) {
  return (
    <div>
      <h1 className="ls-title">{step.title}</h1>
      <p className="ls-text">Awesome! You completed your lesson 🚀. Remember:</p>
      {step.points.map((p, i) => (
        <p key={i} className="ls-text">💡 {p}</p>
      ))}
      <h2 className="ls-subtitle">What's next?</h2>
      <p className="ls-text">{step.next}</p>
    </div>
  );
}

/* ---------- Drag & drop melengkapi kode ---------- */
function DragFillView({ step, locked, onReady }: Props<DragFillStep>) {
  const slotCount = step.template.split("{{}}").length - 1;
  const [placed, setPlaced] = useState<(number | null)[]>(() =>
    Array.from({ length: slotCount }, () => null)
  );

  useEffect(() => {
    if (placed.some((p) => p === null)) onReady(null);
    else onReady(placed.map((p) => step.bank[p as number]));
  }, [placed, step, onReady]);

  const place = (chip: number, blank?: number) => {
    if (locked) return;
    setPlaced((prev) => {
      if (prev.includes(chip)) return prev;
      const target = blank ?? prev.indexOf(null);
      if (target < 0) return prev;
      const next = [...prev];
      next[target] = chip;
      return next;
    });
  };

  const remove = (blank: number) => {
    if (locked) return;
    setPlaced((prev) => prev.map((p, i) => (i === blank ? null : p)));
  };

  const handleDrop = (e: DragEvent, blank: number) => {
    e.preventDefault();
    const chip = Number(e.dataTransfer.getData("text/plain"));
    if (!Number.isNaN(chip)) place(chip, blank);
  };

  const parts = step.template.split("{{}}");

  return (
    <div>
      <h1 className="ls-title">{step.prompt}</h1>

      <div className="ls-code">
        {parts.map((text, i) => (
          <span key={i}>
            {text}
            {i < parts.length - 1 && (
              <span
                className={`ls-blank ${placed[i] !== null ? "ls-blank--filled" : ""}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, i)}
              >
                {placed[i] !== null && (
                  <button
                    type="button"
                    className="ls-chip ls-chip--in"
                    disabled={locked}
                    onClick={() => remove(i)}
                  >
                    {step.bank[placed[i] as number]}
                  </button>
                )}
              </span>
            )}
          </span>
        ))}
      </div>

      <div className="ls-bank">
        {step.bank.map((label, idx) =>
          placed.includes(idx) ? (
            <span key={idx} className="ls-chip ls-chip--ghost">{label}</span>
          ) : (
            <span
              key={idx}
              role="button"
              tabIndex={0}
              className="ls-chip"
              draggable={!locked}
              onDragStart={(e) => e.dataTransfer.setData("text/plain", String(idx))}
              onClick={() => place(idx)}
              onKeyDown={(e) => e.key === "Enter" && place(idx)}
            >
              {label}
            </span>
          )
        )}
      </div>
    </div>
  );
}

/* ---------- Playground (SIMULASI di browser, bukan compiler asli) ---------- */
interface RunResult {
  output: string;
  error?: string;
}

function runSimulated(code: string): RunResult {
  if (!/#include\s*<stdio\.h>/.test(code)) {
    return { output: "", error: "error: tambahkan #include <stdio.h> di baris pertama." };
  }
  if (!/int\s+main\s*\(\s*\)\s*\{/.test(code)) {
    return { output: "", error: "error: fungsi int main() { ... } tidak ditemukan." };
  }
  const calls = code.match(/printf\s*\(/g) ?? [];
  const valid = [...code.matchAll(/printf\s*\(\s*"((?:[^"\\]|\\.)*)"\s*\)\s*;/g)];
  if (valid.length !== calls.length) {
    return {
      output: "",
      error: 'error: periksa penulisan printf("teks"); (tanda kutip, kurung, dan titik koma).',
    };
  }
  const output = valid
    .map((m) =>
      m[1].replace(/\\(n|t|"|\\)/g, (_, c: string) =>
        c === "n" ? "\n" : c === "t" ? "\t" : c
      )
    )
    .join("");
  return { output };
}

function PlaygroundView({ step, locked, onReady }: Props<PlaygroundStep>) {
  const [code, setCode] = useState(step.initialCode);
  const [result, setResult] = useState<RunResult | null>(null);
  const [runs, setRuns] = useState(0);

  // Playground tidak dinilai backend: cukup sudah dijalankan tanpa error.
  useEffect(() => {
    onReady(result !== null && !result.error ? 1 : null);
  }, [result, onReady]);

  const lineCount = code.split("\n").length;

  const handleRun = () => {
    setResult(runSimulated(code));
    setRuns((n) => n + 1);
  };

  return (
    <div>
      {step.title && <h1 className="ls-title">{step.title}</h1>}
      <p className="ls-text">{step.prompt}</p>

      <div className="ls-editor">
        <div className="ls-editor__body">
          <div className="ls-editor__lines" aria-hidden="true">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <textarea
            className="ls-editor__input"
            value={code}
            spellCheck={false}
            wrap="off"
            readOnly={!step.editable || locked}
            style={{ height: lineCount * 24 + 24 }}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        <div className="ls-editor__bar">
          <button
            type="button"
            className="ls-editor__reset"
            disabled={!step.editable}
            onClick={() => {
              setCode(step.initialCode);
              setResult(null);
            }}
          >
            ↺ Reset code
          </button>
          <button type="button" className="ls-editor__run" onClick={handleRun}>
            RUN ▶
          </button>
        </div>
      </div>

      {result && (
        <div key={runs} className={`ls-output ${result.error ? "ls-output--error" : ""}`}>
          <div className="ls-output__label">OUTPUT</div>
          <pre className="ls-output__text">{result.error ?? result.output}</pre>
        </div>
      )}
      <p className="ls-note">Simulasi sederhana, bukan compiler C asli.</p>
    </div>
  );
}

/* ---------- Pilihan ganda ---------- */
function ChoiceView({
  step,
  locked,
  onReady,
  correctIndex,
  wrongIndex,
}: Props<ChoiceStep> & { correctIndex: number | null; wrongIndex: number | null }) {
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    onReady(selected);
  }, [selected, onReady]);

  return (
    <div>
      <h1 className="ls-title">{step.prompt}</h1>
      {step.options.map((opt, i) => {
        let cls = "ls-option";
        if (selected === i) cls += " ls-option--selected";
        if (correctIndex === i) cls += " ls-option--correct";
        if (wrongIndex === i) cls += " ls-option--wrong";
        return (
          <button
            key={i}
            type="button"
            className={cls}
            disabled={locked}
            onClick={() => setSelected(i)}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Dispatcher ---------- */
export function StepView({
  step,
  locked,
  onReady,
  correctIndex = null,
  wrongIndex = null,
}: Props<LessonStep> & { correctIndex?: number | null; wrongIndex?: number | null }) {
  switch (step.type) {
    case "info":
      return <InfoView step={step} />;
    case "takeaway":
      return <TakeawayView step={step} />;
    case "dragfill":
      return <DragFillView step={step} locked={locked} onReady={onReady} />;
    case "playground":
      return <PlaygroundView step={step} locked={locked} onReady={onReady} />;
    case "choice":
      return (
        <ChoiceView
          step={step}
          locked={locked}
          onReady={onReady}
          correctIndex={correctIndex}
          wrongIndex={wrongIndex}
        />
      );
  }
}

export function isInteractive(step: LessonStep): boolean {
  return step.type === "dragfill" || step.type === "playground" || step.type === "choice";
}