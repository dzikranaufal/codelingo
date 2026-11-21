import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { createQuestion, deleteQuestion, errorMessage, getLesson, updateQuestion } from "./adminApi";
import type { AdminQuestion, LessonDetail, QuestionInput } from "./adminApi";
import "./question-form.css";

const typeLabels: Record<string, string> = {
  multiple_choice: "Pilihan ganda",
};

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

interface OptionForm {
  text: string;
  is_correct: boolean;
}

interface QuestionForm {
  text: string;
  xp: string;
  explanation: string;
  options: OptionForm[];
}

function newForm(): QuestionForm {
  return {
    text: "",
    xp: "10",
    explanation: "",
    options: [
      { text: "", is_correct: false },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
    ],
  };
}

function formFrom(q: AdminQuestion): QuestionForm {
  return {
    text: q.text,
    xp: String(q.xp_reward),
    explanation: q.explanation,
    options: q.options.map((o) => ({ text: o.text, is_correct: o.is_correct })),
  };
}

function sameOptions(a: OptionForm[], b: OptionForm[]): boolean {
  return (
    a.length === b.length &&
    a.every((o, i) => o.text.trim() === b[i].text.trim() && o.is_correct === b[i].is_correct)
  );
}

const letter = (i: number) => String.fromCharCode(65 + i);

export default function LessonDetailPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const id = Number(lessonId);

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<AdminQuestion | "new" | null>(null);
  const [form, setForm] = useState<QuestionForm>(newForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLesson(await getLesson(id));
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (editing === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditing(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing]);

  function openNew() {
    setForm(newForm());
    setFormError("");
    setEditing("new");
  }

  function openEdit(q: AdminQuestion) {
    setForm(formFrom(q));
    setFormError("");
    setEditing(q);
  }

  function setOptionText(index: number, text: string) {
    setForm({ ...form, options: form.options.map((o, i) => (i === index ? { ...o, text } : o)) });
  }

  function setCorrect(index: number) {
    setForm({ ...form, options: form.options.map((o, i) => ({ ...o, is_correct: i === index })) });
  }

  function addOption() {
    if (form.options.length >= MAX_OPTIONS) return;
    setForm({ ...form, options: [...form.options, { text: "", is_correct: false }] });
  }

  function removeOption(index: number) {
    if (form.options.length <= MIN_OPTIONS) return;
    setForm({ ...form, options: form.options.filter((_, i) => i !== index) });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (editing === null || saving) return;

    const xp = Number(form.xp);
    if (!Number.isInteger(xp) || xp < 1 || xp > 1000) {
      setFormError("XP harus berupa angka bulat 1 sampai 1000.");
      return;
    }
    const options = form.options.map((o) => ({ text: o.text.trim(), is_correct: o.is_correct }));
    if (options.some((o) => o.text === "")) {
      setFormError("Semua opsi harus diisi. Hapus opsi yang tidak dipakai.");
      return;
    }
    if (options.filter((o) => o.is_correct).length !== 1) {
      setFormError("Pilih tepat satu jawaban yang benar.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      if (editing === "new") {
        const input: QuestionInput = {
          text: form.text,
          xp_reward: xp,
          explanation: form.explanation,
          options,
        };
        await createQuestion(id, input);
        setNotice("Soal berhasil ditambahkan.");
      } else {
        const input: QuestionInput = { text: form.text, xp_reward: xp, explanation: form.explanation };
        // Opsi hanya dikirim jika berubah, supaya soal yang sudah dijawab tetap bisa diedit teksnya.
        if (!sameOptions(options, formFrom(editing).options)) {
          input.options = options;
        }
        await updateQuestion(editing.id, input);
        setNotice("Perubahan soal berhasil disimpan.");
      }
      setEditing(null);
      await load();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(q: AdminQuestion) {
    if (!window.confirm("Hapus soal ini beserta pilihan jawabannya? Tindakan ini tidak bisa dibatalkan.")) {
      return;
    }
    try {
      await deleteQuestion(q.id);
      setNotice("Soal berhasil dihapus.");
      await load();
    } catch (err) {
      setNotice("");
      setError(errorMessage(err));
    }
  }

  if (!lesson) {
    return error ? (
      <>
        <Link className="adm-back" to="/admin/materi">
          Kembali ke daftar materi
        </Link>
        <p className="adm-banner adm-banner-error" role="alert">
          {error}
        </p>
      </>
    ) : (
      <p className="adm-muted">Memuat lesson…</p>
    );
  }

  return (
    <>
      <Link className="adm-back" to={`/admin/paths/${lesson.learning_path_id}`}>
        Kembali ke daftar lesson
      </Link>

      <h1 className="adm-title">{lesson.title}</h1>
      {lesson.description && <p className="adm-muted">{lesson.description}</p>}
      <p className="adm-muted">
        Urutan {lesson.order_index}, level {lesson.level}, {lesson.questions.length} soal
      </p>

      <div className="adm-page-head adm-section-gap">
        <div>
          <h2 className="adm-subtitle">Soal dan kunci jawaban</h2>
          <p className="adm-muted">Hanya admin yang melihat kunci jawaban.</p>
        </div>
        <button className="adm-btn adm-btn-primary" onClick={openNew}>
          Tambah soal
        </button>
      </div>

      {notice && (
        <p className="adm-banner adm-banner-ok" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="adm-banner adm-banner-error" role="alert">
          {error}
        </p>
      )}

      {lesson.questions.length === 0 ? (
        <p className="adm-muted">Lesson ini belum punya soal. Tambahkan soal pertama.</p>
      ) : (
        <ol className="adm-questions">
          {lesson.questions.map((q) => (
            <li className="adm-question" key={q.id}>
              <p className="adm-question-text">{q.text}</p>
              <p className="adm-muted adm-row-meta">
                {typeLabels[q.type] ?? q.type}, {q.xp_reward} XP
              </p>

              <ul className="adm-options">
                {q.options.map((o, i) => (
                  <li className={o.is_correct ? "adm-option adm-option-correct" : "adm-option"} key={o.id}>
                    <span className="adm-option-letter">{letter(i)}</span>
                    <span>{o.text}</span>
                    {o.is_correct && <span className="adm-option-tag">Jawaban benar</span>}
                  </li>
                ))}
              </ul>

              {q.explanation && <p className="adm-explain">{q.explanation}</p>}

              <div className="adm-actions adm-question-actions">
                <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => openEdit(q)}>
                  Edit
                </button>
                <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => void remove(q)}>
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {editing !== null && (
        <div className="adm-overlay" onMouseDown={() => setEditing(null)}>
          <form
            className="adm-modal adm-modal-wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="question-form-title"
            onMouseDown={(e) => e.stopPropagation()}
            onSubmit={onSubmit}
          >
            <h2 className="adm-subtitle" id="question-form-title">
              {editing === "new" ? "Tambah soal" : "Edit soal"}
            </h2>

            <label className="adm-field">
              <span className="adm-label">Pertanyaan</span>
              <textarea
                className="adm-input adm-textarea adm-mono"
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                rows={4}
                maxLength={2000}
                required
                autoFocus
              />
            </label>

            <fieldset className="adm-fieldset">
              <legend className="adm-label">Pilihan jawaban</legend>
              <p className="adm-hint">Pilih satu lingkaran untuk menandai jawaban yang benar.</p>
              {form.options.map((o, i) => (
                <div className="adm-opt-row" key={i}>
                  <input
                    type="radio"
                    name="correct-option"
                    checked={o.is_correct}
                    onChange={() => setCorrect(i)}
                    aria-label={`Tandai opsi ${letter(i)} sebagai jawaban benar`}
                  />
                  <span className="adm-option-letter">{letter(i)}</span>
                  <input
                    className="adm-input"
                    value={o.text}
                    onChange={(e) => setOptionText(i, e.target.value)}
                    maxLength={300}
                    placeholder={`Teks opsi ${letter(i)}`}
                    aria-label={`Teks opsi ${letter(i)}`}
                  />
                  <button
                    type="button"
                    className="adm-btn adm-btn-ghost adm-btn-sm"
                    onClick={() => removeOption(i)}
                    disabled={form.options.length <= MIN_OPTIONS}
                  >
                    Hapus
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="adm-btn adm-btn-ghost adm-btn-sm"
                onClick={addOption}
                disabled={form.options.length >= MAX_OPTIONS}
              >
                Tambah opsi
              </button>
            </fieldset>

            <div className="adm-field-row">
              <label className="adm-field">
                <span className="adm-label">XP jika benar</span>
                <input
                  className="adm-input"
                  type="number"
                  min={1}
                  max={1000}
                  value={form.xp}
                  onChange={(e) => setForm({ ...form, xp: e.target.value })}
                  required
                />
              </label>
            </div>

            <label className="adm-field">
              <span className="adm-label">Penjelasan jawaban</span>
              <textarea
                className="adm-input adm-textarea"
                value={form.explanation}
                onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                rows={3}
                maxLength={2000}
              />
            </label>

            {formError && (
              <p className="adm-banner adm-banner-error" role="alert">
                {formError}
              </p>
            )}

            <div className="adm-modal-actions">
              <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setEditing(null)}>
                Batal
              </button>
              <button type="submit" className="adm-btn adm-btn-primary" disabled={saving}>
                {saving ? "Menyimpan…" : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}