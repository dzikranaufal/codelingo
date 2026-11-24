# CodeLingo

CodeLingo adalah aplikasi pembelajaran pemrograman dengan frontend
React + TypeScript dan backend Go. Repository ini berisi source code
frontend dan backend.

## Teknologi

-   **Frontend:** React, TypeScript, Vite
-   **Backend:** Go
-   **Database:** MySQL (lokal)
-   **ORM:** GORM

> Catatan: Sesuaikan bagian ini jika stack atau konfigurasi proyek
> berubah.

## Persiapan

Pastikan perangkat sudah memiliki:

-   [Git](https://git-scm.com/downloads)
-   [Node.js](https://nodejs.org/) (disarankan versi LTS)
-   [Go](https://go.dev/dl/)
-   [MySQL](https://dev.mysql.com/downloads/installer/)
-   VS Code (opsional)

Verifikasi instalasi melalui PowerShell:

``` powershell
git --version
node -v
npm -v
go version
mysql --version
```

## Mengambil project

### Clone pertama kali

``` powershell
git clone URL_REPOSITORY
cd codelingo
```

Ganti `URL_REPOSITORY` dengan URL repository GitHub CodeLingo.

### Jika project sudah pernah di-clone

``` powershell
cd codelingo
git switch main
git pull origin main
```

Jika memiliki perubahan lokal yang belum di-commit, simpan atau commit
terlebih dahulu sebelum melakukan pull. Jangan menghapus perubahan lokal
tanpa memastikan bahwa perubahan tersebut memang tidak diperlukan.

## Konfigurasi database

Pastikan MySQL sedang berjalan, lalu buat database lokal:

``` sql
CREATE DATABASE codelingo;
```

Buat file `.env` di lokasi yang dibaca oleh konfigurasi backend. Gunakan
`.env.example` jika tersedia.

Contoh berikut hanya ilustrasi. **Nama variabel harus disesuaikan dengan
konfigurasi yang benar-benar digunakan oleh backend**:

``` env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password_mysql
DB_NAME=codelingo
PORT=8080
```

Jangan commit atau mengunggah file `.env` yang berisi password, token,
atau secret. Pastikan file tersebut tercantum di `.gitignore`. Jika
belum ada, tambahkan aturan yang sesuai.

## Menjalankan backend

Buka terminal PowerShell:

``` powershell
cd backend
go mod download
go run ./cmd/migrate
go run ./cmd/server
```

Backend berjalan pada port yang ditentukan konfigurasi, misalnya
`http://localhost:8080`.

Biarkan terminal backend tetap berjalan.

## Menjalankan frontend

Buka terminal PowerShell baru dari root project:

``` powershell
cd frontend
npm install
npm run dev
```

Buka alamat yang ditampilkan Vite di terminal. Alamat default biasanya:

``` text
http://localhost:5173
```

## Urutan menjalankan aplikasi

1.  Jalankan MySQL dan pastikan database `codelingo` tersedia.
2.  Jalankan migration dan server backend.
3.  Jalankan frontend dengan `npm run dev`.
4.  Buka alamat frontend dari terminal Vite.

Frontend dan backend perlu berjalan bersamaan selama pengembangan lokal.

## Mengambil update terbaru

Untuk memperbarui project dari branch `main`:

``` powershell
git switch main
git pull origin main
```

Jika dependency frontend berubah, jalankan kembali:

``` powershell
cd frontend
npm install
```

Jika terdapat perubahan migration database, ikuti instruksi migration
pada update tersebut sebelum menjalankan aplikasi.

## Workflow kontribusi

Kerjakan fitur pada branch masing-masing agar perubahan anggota kelompok
tidak saling menimpa.

``` powershell
git switch main
git pull origin main
git switch -c feature/nama-fitur
```

Setelah perubahan selesai:

``` powershell
git add .
git commit -m "feat: add nama fitur"
git push -u origin feature/nama-fitur
```

Selanjutnya, buat **Pull Request** di GitHub dari branch fitur menuju
`main`. Tunggu proses review dan persetujuan sebelum perubahan
digabungkan.

Contoh nama branch:

-   `feature/quest-improvement`
-   `fix/login-validation`
-   `docs/update-readme`

## Pemeriksaan sebelum mengirim perubahan

Backend:

``` powershell
cd backend
go test ./...
```

Frontend:

``` powershell
cd frontend
npm run build
```

Pastikan pengujian berhasil sebelum membuat Pull Request.

## Troubleshooting singkat

### Perintah `go` atau `npm` tidak dikenali

Pastikan Go atau Node.js sudah terinstal dan masuk ke PATH. Tutup lalu
buka kembali PowerShell setelah instalasi.

### Koneksi database gagal

Periksa apakah MySQL berjalan, database `codelingo` sudah dibuat, dan
nilai pada `.env` sesuai dengan konfigurasi backend.

### Frontend tidak dapat terhubung ke backend

Pastikan backend aktif dan konfigurasi base URL/API pada frontend
mengarah ke alamat backend lokal yang benar.

### Ada perubahan lokal saat ingin pull

Periksa terlebih dahulu:

``` powershell
git status
```

Commit perubahan yang ingin disimpan atau gunakan stash jika memang
diperlukan. Jangan menjalankan perintah reset atau clean tanpa memahami
dampaknya.

## Fitur proyek

CodeLingo memiliki area fitur seperti:

-   Learning
-   Quest
-   Shop
-   Leaderboard
-   Admin Dashboard

Detail implementasi dan status fitur mengikuti source code terbaru pada
branch `main`.

------------------------------------------------------------------------

**Catatan untuk tim:** Panduan ini ditujukan untuk setup pengembangan
lokal di Windows menggunakan PowerShell. Periksa konfigurasi aktual
repository, khususnya file environment, port, dan migration, jika ada
perubahan pada project.
