import { useState } from "react";
import type { FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { changePassword, errorMessage, updateProfileName } from "./adminApi";
import type { AdminContext } from "./adminApi";

export default function AdminProfilePage() {
  const { admin, reload } = useOutletContext<AdminContext>();

  const [name, setName] = useState(admin.name);
  const [nameNotice, setNameNotice] = useState("");
  const [nameError, setNameError] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwNotice, setPwNotice] = useState("");
  const [pwError, setPwError] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  async function onSaveName(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (savingName) return;
    setSavingName(true);
    setNameNotice("");
    setNameError("");
    try {
      await updateProfileName(name.trim());
      setNameNotice("Nama berhasil disimpan.");
      reload();
    } catch (err) {
      setNameError(errorMessage(err));
    } finally {
      setSavingName(false);
    }
  }

  async function onChangePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (savingPw) return;
    setPwNotice("");
    setPwError("");

    if (next.length < 8) {
      setPwError("Password baru minimal 8 karakter.");
      return;
    }
    if (next !== confirm) {
      setPwError("Konfirmasi password tidak sama.");
      return;
    }

    setSavingPw(true);
    try {
      await changePassword(current, next);
      setPwNotice("Password berhasil diubah.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      setPwError(errorMessage(err));
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <>
      <h1 className="adm-title">Profil admin</h1>
      <p className="adm-muted">
        {admin.username}, {admin.email}
      </p>

      <form className="adm-section" onSubmit={onSaveName}>
        <h2 className="adm-subtitle">Nama tampilan</h2>
        <label className="adm-field">
          <span className="adm-label">Nama</span>
          <input
            className="adm-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            maxLength={100}
            required
          />
        </label>
        {nameNotice && (
          <p className="adm-banner adm-banner-ok" role="status">
            {nameNotice}
          </p>
        )}
        {nameError && (
          <p className="adm-banner adm-banner-error" role="alert">
            {nameError}
          </p>
        )}
        <button className="adm-btn adm-btn-primary" type="submit" disabled={savingName}>
          {savingName ? "Menyimpan…" : "Simpan nama"}
        </button>
      </form>

      <form className="adm-section" onSubmit={onChangePassword}>
        <h2 className="adm-subtitle">Ganti password</h2>
        <label className="adm-field">
          <span className="adm-label">Password saat ini</span>
          <input
            className="adm-input"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <label className="adm-field">
          <span className="adm-label">Password baru</span>
          <input
            className="adm-input"
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label className="adm-field">
          <span className="adm-label">Ulangi password baru</span>
          <input
            className="adm-input"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        {pwNotice && (
          <p className="adm-banner adm-banner-ok" role="status">
            {pwNotice}
          </p>
        )}
        {pwError && (
          <p className="adm-banner adm-banner-error" role="alert">
            {pwError}
          </p>
        )}
        <button className="adm-btn adm-btn-primary" type="submit" disabled={savingPw}>
          {savingPw ? "Menyimpan…" : "Ganti password"}
        </button>
      </form>
    </>
  );
}