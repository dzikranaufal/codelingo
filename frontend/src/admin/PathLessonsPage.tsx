import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { createLesson, deleteLesson, errorMessage, listLessons, updateLesson } from "./adminApi";
import type { LessonInput, LessonList, LessonRow } from "./adminApi";

interface FormState {
  title: string;
  description: string;
  level: string;
  order: string;
}

const emptyForm: FormState = { title: "", description: "", level: "1", order: "" };

export default function PathLessonsPage() {
  const { pathId } = useParams<{ pathId: string }>();
  const id = Number(pathId);

  const [data, setData] = useState<LessonList | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<LessonRow | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await listLessons(id));
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
    setForm(emptyForm);
    setFormError("");
    setEditing("new");
  }

  function openEdit(lesson: LessonRow) {
    setForm({
      title: lesson.title,
      description: lesson.description,
      level: String(lesson.level),
      order: String(lesson.order_index),
    });
    setFormError("");
    setEditing(lesson);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (editing === null || saving) return;

    const level = Number(form.level);
    if (!Number.isInteger(level)) {
      setFormError("Level harus berupa angka bulat.");
      return;
    }
    const input: LessonInput = { title: form.title, description: form.description, level };
    if (form.order.trim() !== "") {
      const order = Number(form.order);
      if (!Number.isInteger(order)) {
        setFormError("Urutan harus berupa angka bulat.");
        return;
      }
      input.order_index = order;
    }

    setSaving(true);
    setFormError("");
    try {
      if (editing === "new") {
        await createLesson(id, input);
        setNotice("Lesson berhasil ditambahkan.");
      } else {
        await updateLesson(editing.id, input);
        setNotice("Perubahan lesson berhasil disimpan.");
      }
      setEditing(null);
      await load();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(lesson: LessonRow) {
    if (!window.confirm(`Hapus lesson “${lesson.title}”? Tindakan ini tidak bisa dibatalkan.`)) {
      return;
    }
    try {
      await deleteLesson(lesson.id);
      setNotice("Lesson berhasil dihapus.");
      await load();
    } catch (err) {
      setNotice("");
      setError(errorMessage(err));
    }
  }

  if (!data) {
    return error ? (
      <p className="adm-banner adm-banner-error" role="alert">
        {error}
      </p>
    ) : (
      <p className="adm-muted">Memuat lesson…</p>
    );
  }

  return (
    <>
      <Link className="adm-back" to="/admin/materi">
        Kembali ke daftar materi
      </Link>

      <div className="adm-page-head">
        <div>
          <h1 className="adm-title">{data.learning_path.name}</h1>
          <p className="adm-muted">{data.lessons.length} lesson</p>
        </div>
        <button className="adm-btn adm-btn-primary" onClick={openNew}>
          Tambah lesson
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

      {data.lessons.length === 0 ? (
        <p className="adm-muted">Path ini belum punya lesson. Tambahkan lesson pertama.</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Urutan</th>
                <th>Judul</th>
                <th>Level</th>
                <th>Soal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.lessons.map((lesson) => (
                <tr key={lesson.id}>
                  <td>{lesson.order_index}</td>
                  <td>
                    <Link className="adm-link" to={`/admin/lessons/${lesson.id}`}>
                      {lesson.title}
                    </Link>
                  </td>
                  <td>{lesson.level}</td>
                  <td>{lesson.question_count}</td>
                  <td>
                    <div className="adm-actions">
                      <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => openEdit(lesson)}>
                        Edit
                      </button>
                      <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => void remove(lesson)}>
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing !== null && (
        <div className="adm-overlay" onMouseDown={() => setEditing(null)}>
          <form
            className="adm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lesson-form-title"
            onMouseDown={(e) => e.stopPropagation()}
            onSubmit={onSubmit}
          >
            <h2 className="adm-subtitle" id="lesson-form-title">
              {editing === "new" ? "Tambah lesson" : "Edit lesson"}
            </h2>

            <label className="adm-field">
              <span className="adm-label">Judul</span>
              <input
                className="adm-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={150}
                required
                autoFocus
              />
            </label>

            <label className="adm-field">
              <span className="adm-label">Deskripsi</span>
              <textarea
                className="adm-input adm-textarea"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </label>

            <div className="adm-field-row">
              <label className="adm-field">
                <span className="adm-label">Level</span>
                <input
                  className="adm-input"
                  type="number"
                  min={1}
                  max={100}
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  required
                />
              </label>
              <label className="adm-field">
                <span className="adm-label">Urutan</span>
                <input
                  className="adm-input"
                  type="number"
                  min={1}
                  placeholder="Otomatis di akhir"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                />
              </label>
            </div>

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