import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  createPath,
  deletePath,
  errorMessage,
  listLanguages,
  listPaths,
  updatePath,
} from "./adminApi";
import type { LanguageView, PathInput, PathSummary } from "./adminApi";

interface FormState {
  languageId: string;
  name: string;
  description: string;
  order: string;
}

const emptyForm: FormState = { languageId: "", name: "", description: "", order: "" };

export default function PathsPage() {
  const [paths, setPaths] = useState<PathSummary[] | null>(null);
  const [languages, setLanguages] = useState<LanguageView[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<PathSummary | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, l] = await Promise.all([listPaths(), listLanguages()]);
      setPaths(p);
      setLanguages(l);
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

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

  const availableLanguages = languages.filter((l) => l.is_available);

  function openNew() {
    setForm({ ...emptyForm, languageId: String(availableLanguages[0]?.id ?? "") });
    setFormError("");
    setEditing("new");
  }

  function openEdit(path: PathSummary) {
    setForm({
      languageId: String(path.language_id ?? ""),
      name: path.name,
      description: path.description,
      order: String(path.order_index),
    });
    setFormError("");
    setEditing(path);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (editing === null || saving) return;

    const input: PathInput = { name: form.name, description: form.description };
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
        const languageId = Number(form.languageId);
        if (!Number.isInteger(languageId) || languageId < 1) {
          setFormError("Pilih bahasa terlebih dahulu.");
          return;
        }
        await createPath({ ...input, language_id: languageId });
        setNotice("Path berhasil ditambahkan.");
      } else {
        await updatePath(editing.id, input);
        setNotice("Perubahan path berhasil disimpan.");
      }
      setEditing(null);
      await load();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(path: PathSummary) {
    if (!window.confirm(`Hapus path “${path.name}”? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await deletePath(path.id);
      setNotice("Path berhasil dihapus.");
      await load();
    } catch (err) {
      setNotice("");
      setError(errorMessage(err));
    }
  }

  if (!paths) {
    return error ? (
      <p className="adm-banner adm-banner-error" role="alert">
        {error}
      </p>
    ) : (
      <p className="adm-muted">Memuat materi…</p>
    );
  }

  const orphanPaths = paths.filter((p) => p.language_id === null);

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1 className="adm-title">Materi</h1>
          <p className="adm-muted">Kelola path dan lesson untuk tiap bahasa.</p>
        </div>
        <button className="adm-btn adm-btn-primary" onClick={openNew} disabled={availableLanguages.length === 0}>
          Tambah path
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

      {languages.map((lang) => {
        const items = paths.filter((p) => p.language_id === lang.id);
        return (
          <section className="adm-group" key={lang.id}>
            <div className="adm-group-head">
              <h2 className="adm-subtitle">{lang.name}</h2>
              <span className={lang.is_available ? "adm-badge adm-badge-ok" : "adm-badge"}>
                {lang.is_available ? "Materi dibuka" : "Segera hadir"}
              </span>
            </div>

            {items.length === 0 ? (
              <p className="adm-muted">
                {lang.is_available ? "Belum ada path untuk bahasa ini." : "Belum ada materi untuk bahasa ini."}
              </p>
            ) : (
              <ul className="adm-list">
                {items.map((p) => (
                  <li className="adm-row" key={p.id}>
                    <div>
                      <p className="adm-row-title">{p.name}</p>
                      <p className="adm-muted adm-row-meta">
                        Urutan {p.order_index}, {p.lesson_count} lesson
                        {p.description ? `, ${p.description}` : ""}
                      </p>
                    </div>
                    {lang.is_available ? (
                      <div className="adm-actions">
                        <Link className="adm-btn adm-btn-primary adm-btn-sm" to={`/admin/paths/${p.id}`}>
                          Kelola lesson
                        </Link>
                        <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => openEdit(p)}>
                          Edit
                        </button>
                        <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => void remove(p)}>
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <span className="adm-muted">Belum dibuka</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {orphanPaths.length > 0 && (
        <section className="adm-group">
          <div className="adm-group-head">
            <h2 className="adm-subtitle">Tanpa bahasa</h2>
          </div>
          <ul className="adm-list">
            {orphanPaths.map((p) => (
              <li className="adm-row" key={p.id}>
                <p className="adm-row-title">{p.name}</p>
                <span className="adm-muted">Belum terhubung ke bahasa</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {editing !== null && (
        <div className="adm-overlay" onMouseDown={() => setEditing(null)}>
          <form
            className="adm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="path-form-title"
            onMouseDown={(e) => e.stopPropagation()}
            onSubmit={onSubmit}
          >
            <h2 className="adm-subtitle" id="path-form-title">
              {editing === "new" ? "Tambah path" : "Edit path"}
            </h2>

            {editing === "new" ? (
              <label className="adm-field">
                <span className="adm-label">Bahasa</span>
                <select
                  className="adm-input adm-select"
                  value={form.languageId}
                  onChange={(e) => setForm({ ...form, languageId: e.target.value })}
                  required
                >
                  {availableLanguages.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="adm-muted">Bahasa: {editing.language_name} (tidak bisa dipindah)</p>
            )}

            <label className="adm-field">
              <span className="adm-label">Nama path</span>
              <input
                className="adm-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={100}
                placeholder="Contoh: C Intermediate"
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

            <label className="adm-field">
              <span className="adm-label">Urutan dalam bahasa</span>
              <input
                className="adm-input"
                type="number"
                min={1}
                placeholder="Otomatis di akhir"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
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