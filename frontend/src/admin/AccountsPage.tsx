import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { deleteUser, errorMessage, formatDate, listUsers, updateUserRole } from "./adminApi";
import type { AdminContext, UserList, UserRow } from "./adminApi";

const PAGE_SIZE = 20;

export default function AccountsPage() {
  const { admin } = useOutletContext<AdminContext>();

  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<UserList | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await listUsers({ search: query, limit: PAGE_SIZE, offset }));
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [query, offset]);

  useEffect(() => {
    void load();
  }, [load]);

  function onSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOffset(0);
    setQuery(input.trim());
  }

  async function toggleRole(user: UserRow) {
    const next = user.role === "admin" ? "user" : "admin";
    const action = next === "admin" ? "menjadikan admin" : "menjadikan pelajar";
    if (!window.confirm(`Yakin ingin ${action}: ${user.username}?`)) return;

    try {
      await updateUserRole(user.id, next);
      setNotice(`Role ${user.username} diubah menjadi ${next === "admin" ? "admin" : "pelajar"}.`);
      await load();
    } catch (err) {
      setNotice("");
      setError(errorMessage(err));
    }
  }

  async function remove(user: UserRow) {
    if (!window.confirm(`Hapus akun ${user.username}? Tindakan ini tidak bisa dibatalkan.`)) return;

    try {
      await deleteUser(user.id);
      setNotice(`Akun ${user.username} berhasil dihapus.`);
      if (data && data.users.length === 1 && offset > 0) {
        setOffset(Math.max(0, offset - PAGE_SIZE));
      } else {
        await load();
      }
    } catch (err) {
      setNotice("");
      setError(errorMessage(err));
    }
  }

  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + PAGE_SIZE, total);

  return (
    <>
      <h1 className="adm-title">Akun</h1>
      <p className="adm-muted">Kelola akun pengguna dan peran admin.</p>

      <form className="adm-search" onSubmit={onSearch} role="search">
        <input
          className="adm-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Cari username, nama, atau email"
          aria-label="Cari akun"
          maxLength={100}
        />
        <button className="adm-btn adm-btn-primary" type="submit">
          Cari
        </button>
      </form>

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

      {!data ? (
        !error && <p className="adm-muted">Memuat akun…</p>
      ) : data.users.length === 0 ? (
        <p className="adm-muted">{query ? "Tidak ada akun yang cocok." : "Belum ada akun."}</p>
      ) : (
        <>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Pengguna</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>XP</th>
                  <th>Level</th>
                  <th>Bergabung</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.username}</strong>
                      {u.name !== u.username && <div className="adm-muted adm-row-meta">{u.name}</div>}
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={u.role === "admin" ? "adm-badge adm-badge-ok" : "adm-badge"}>
                        {u.role === "admin" ? "Admin" : "Pelajar"}
                      </span>
                    </td>
                    <td>{u.xp}</td>
                    <td>{u.level}</td>
                    <td>{formatDate(u.created_at)}</td>
                    <td>
                      {u.id === admin.id ? (
                        <span className="adm-muted">Akun Anda</span>
                      ) : (
                        <div className="adm-actions">
                          <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => void toggleRole(u)}>
                            {u.role === "admin" ? "Jadikan pelajar" : "Jadikan admin"}
                          </button>
                          <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => void remove(u)}>
                            Hapus
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="adm-pager">
            <span className="adm-muted">
              Menampilkan {from} sampai {to} dari {total} akun
            </span>
            <div className="adm-actions">
              <button
                className="adm-btn adm-btn-ghost adm-btn-sm"
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                disabled={offset === 0}
              >
                Sebelumnya
              </button>
              <button
                className="adm-btn adm-btn-ghost adm-btn-sm"
                onClick={() => setOffset(offset + PAGE_SIZE)}
                disabled={offset + PAGE_SIZE >= total}
              >
                Berikutnya
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}