// frontend/src/data/cSyntax.ts
// Daftar kode pendek bahasa C untuk halaman Karakter.
//
// CARA MENGUBAH:
// - Tambah kartu: salin satu blok { ... } di C_ENTRIES, ganti isinya, id harus unik.
// - Hapus kartu: hapus blok { ... } miliknya.
// - Entri dengan `added: true` dan komentar [TAMBAHAN] adalah tambahan dari asisten
//   (bukan permintaan awal tim). Aman diubah atau dihapus.
// - `answer` pada quiz = nomor pilihan yang benar, mulai dari 0.
//
// DATA SEMENTARA: nanti materi bisa diambil dari backend (Tahap 5: Learning Content).

export type CCategory = "dasar" | "io" | "tipe" | "operator" | "alur";

export type CQuiz = {
  question: string;
  options: string[];
  answer: number;
};

export type CEntry = {
  id: string;
  symbol: string; // tulisan di kartu (tampil dengan font kode)
  name: string;
  category: CCategory;
  meaning: string;
  code: string;
  output: string;
  outputNote?: string;
  tip?: string;
  added?: boolean; // true = tambahan dari asisten
  quiz: CQuiz;
};

export const C_CATEGORIES: { id: CCategory | "semua"; label: string }[] = [
  { id: "semua", label: "Semua" },
  { id: "dasar", label: "Dasar" },
  { id: "io", label: "Input & Output" },
  { id: "tipe", label: "Tipe Data" },
  { id: "operator", label: "Operator" },
  { id: "alur", label: "Kontrol Alur" },
];

export const C_ENTRIES: CEntry[] = [
  /* ===================== DASAR ===================== */
  {
    id: "include",
    symbol: "#include <stdio.h>",
    name: "Memanggil pustaka",
    category: "dasar",
    meaning: "Memanggil pustaka standar input-output supaya printf dan scanf bisa dipakai.",
    code: `#include <stdio.h>

int main() {
    printf("Halo");
    return 0;
}`,
    output: "Halo",
    tip: "Taruh selalu di baris paling atas file.",
    added: true, // [TAMBAHAN]
    quiz: {
      question: "Apa yang terjadi kalau #include <stdio.h> dihapus lalu program memakai printf?",
      options: [
        "Program tetap berjalan seperti biasa",
        "Compiler memberi peringatan atau error karena printf tidak dikenal",
        "Teks tampil terbalik",
      ],
      answer: 1,
    },
  },
  {
    id: "main",
    symbol: "int main()",
    name: "Fungsi utama",
    category: "dasar",
    meaning: "Titik awal program. Eksekusi selalu dimulai dari fungsi ini.",
    code: `int main() {
    printf("Mulai dari sini");
    return 0;
}`,
    output: "Mulai dari sini",
    tip: "Setiap program C harus punya tepat satu main().",
    added: true, // [TAMBAHAN]
    quiz: {
      question: "Program C mulai dijalankan dari mana?",
      options: ["Dari fungsi main()", "Dari baris pertama file", "Dari fungsi printf()"],
      answer: 0,
    },
  },
  {
    id: "return",
    symbol: "return 0;",
    name: "Mengakhiri program",
    category: "dasar",
    meaning: "Mengakhiri fungsi. Di main, return 0 berarti program selesai tanpa masalah.",
    code: `int main() {
    printf("Selesai");
    return 0;
}`,
    output: "Selesai",
    added: true, // [TAMBAHAN]
    quiz: {
      question: "return 0; di akhir main() artinya?",
      options: ["Program error", "Mencetak angka 0", "Program selesai dengan normal"],
      answer: 2,
    },
  },
  {
    id: "comment",
    symbol: "//",
    name: "Komentar",
    category: "dasar",
    meaning: "Catatan untuk manusia. Compiler mengabaikannya sehingga tidak ikut dijalankan.",
    code: `// ini komentar, tidak ikut dijalankan
printf("Halo");`,
    output: "Halo",
    tip: "Untuk komentar beberapa baris, pakai /* ... */.",
    added: true, // [TAMBAHAN]
    quiz: {
      question: "Apakah isi komentar ikut tampil di layar?",
      options: ["Ya, selalu tampil", "Tidak, compiler mengabaikannya", "Hanya jika memakai printf"],
      answer: 1,
    },
  },

  /* ===================== INPUT & OUTPUT ===================== */
  {
    id: "printf",
    symbol: "printf()",
    name: "Menampilkan ke layar",
    category: "io",
    meaning: "Menampilkan teks atau nilai ke layar.",
    code: `printf("Halo, Dunia!\\n");
printf("Umur saya %d tahun", 17);`,
    output: "Halo, Dunia!\nUmur saya 17 tahun",
    tip: "Teks ditulis di antara tanda kutip ganda.",
    // Permintaan awal tim (bukan tambahan)
    quiz: {
      question: "Fungsi untuk menampilkan tulisan ke layar adalah?",
      options: ["scanf", "return", "printf"],
      answer: 2,
    },
  },
  {
    id: "scanf",
    symbol: "scanf()",
    name: "Membaca input",
    category: "io",
    meaning: "Membaca input dari keyboard lalu menyimpannya ke variabel.",
    code: `int umur;
scanf("%d", &umur);
printf("Umur: %d", umur);`,
    output: "Umur: 17",
    outputNote: "Misalnya kamu mengetik 17 lalu menekan Enter.",
    tip: "Jangan lupa tanda & di depan nama variabel.",
    // Permintaan awal tim (bukan tambahan)
    quiz: {
      question: "Fungsi untuk membaca angka dari keyboard adalah?",
      options: ["printf", "scanf", "main"],
      answer: 1,
    },
  },
  {
    id: "newline",
    symbol: "\\n",
    name: "Baris baru",
    category: "io",
    meaning: "Karakter khusus untuk pindah ke baris berikutnya.",
    code: `printf("Baris 1\\nBaris 2");`,
    output: "Baris 1\nBaris 2",
    added: true, // [TAMBAHAN]
    quiz: {
      question: "Apa fungsi \\n di dalam printf?",
      options: ["Pindah ke baris baru", "Menghapus layar", "Menutup program"],
      answer: 0,
    },
  },
  {
    id: "fmt-d",
    symbol: "%d",
    name: "Penanda bilangan bulat",
    category: "io",
    meaning: "Penanda untuk menampilkan atau membaca bilangan bulat (int).",
    code: `int skor = 25;
printf("Skor: %d", skor);`,
    output: "Skor: 25",
    added: true, // [TAMBAHAN]
    quiz: {
      question: "Penanda untuk bilangan bulat (int) adalah?",
      options: ["%f", "%c", "%d"],
      answer: 2,
    },
  },
  {
    id: "fmt-f",
    symbol: "%f",
    name: "Penanda bilangan desimal",
    category: "io",
    meaning: "Penanda untuk bilangan desimal (float).",
    code: `float tinggi = 1.65;
printf("%f", tinggi);`,
    output: "1.650000",
    tip: "Pakai %.2f untuk menampilkan hanya dua angka di belakang koma.",
    added: true, // [TAMBAHAN]
    quiz: {
      question: "Cara menampilkan desimal dengan 2 angka di belakang koma?",
      options: ["%d.2", "%.2f", "%f2"],
      answer: 1,
    },
  },
  {
    id: "fmt-c",
    symbol: "%c",
    name: "Penanda satu karakter",
    category: "io",
    meaning: "Penanda untuk menampilkan satu karakter (char).",
    code: `char huruf = 'A';
printf("%c", huruf);`,
    output: "A",
    added: true, // [TAMBAHAN]
    quiz: {
      question: "Penanda untuk menampilkan satu huruf adalah?",
      options: ["%c", "%s", "%d"],
      answer: 0,
    },
  },
  {
    id: "fmt-s",
    symbol: "%s",
    name: "Penanda teks",
    category: "io",
    meaning: "Penanda untuk menampilkan teks (string).",
    code: `char nama[] = "Budi";
printf("Halo, %s", nama);`,
    output: "Halo, Budi",
    added: true, // [TAMBAHAN]
    quiz: {
      question: "Penanda untuk menampilkan teks (string) adalah?",
      options: ["%c", "%d", "%s"],
      answer: 2,
    },
  },
  {
    id: "ampersand",
    symbol: "&",
    name: "Alamat variabel",
    category: "io",
    meaning: "Memberi tahu scanf di mana variabel disimpan di memori.",
    code: `int a, b;
scanf("%d %d", &a, &b);
printf("%d", a + b);`,
    output: "9",
    outputNote: "Misalnya kamu mengetik 4 lalu 5.",
    tip: "Untuk string (char[]) biasanya tidak perlu &.",
    added: true, // [TAMBAHAN]
    quiz: {
      question: "Kenapa scanf(\"%d\", &x) memakai tanda & ?",
      options: [
        "Supaya angkanya dikalikan dua",
        "Supaya scanf tahu alamat memori tempat menyimpan input",
        "Supaya hasilnya tampil di layar",
      ],
      answer: 1,
    },
  },

  /* ===================== TIPE DATA ===================== */
  {
    id: "int",
    symbol: "int",
    name: "Bilangan bulat",
    category: "tipe",
    meaning: "Menyimpan bilangan bulat, tanpa koma.",
    code: `int umur = 17;
printf("%d", umur);`,
    output: "17",
    // Permintaan awal tim (bukan tambahan)
    quiz: {
      question: "Tipe data paling cocok untuk jumlah siswa (misalnya 30)?",
      options: ["int", "float", "char"],
      answer: 0,
    },
  },
  {
    id: "float",
    symbol: "float",
    name: "Bilangan desimal",
    category: "tipe",
    meaning: "Menyimpan bilangan desimal (punya koma).",
    code: `float nilai = 85.5;
printf("%.1f", nilai);`,
    output: "85.5",
    added: true, // [TAMBAHAN]
    quiz: {
      question: "Tipe data yang cocok untuk menyimpan 3.14?",
      options: ["int", "char", "float"],
      answer: 2,
    },
  },
  {
    id: "double",
    symbol: "double",
    name: "Desimal lebih teliti",
    category: "tipe",
    meaning: "Seperti float, tetapi lebih teliti karena menyimpan lebih banyak angka desimal.",
    code: `double pi = 3.14159265359;
printf("%.5f", pi);`,
    output: "3.14159",
    added: true, // [TAMBAHAN]
    quiz: {
      question: "Manakah tipe desimal yang lebih teliti daripada float?",
      options: ["float", "double", "int"],
      answer: 1,
    },
  },
  {
    id: "char",
    symbol: "char",
    name: "Satu karakter",
    category: "tipe",
    meaning: "Menyimpan satu karakter (huruf, angka, atau simbol), ditulis dengan tanda kutip tunggal.",
    code: `char nilai = 'A';
printf("%c", nilai);`,
    output: "A",
    tip: "Kutip tunggal 'A' untuk satu karakter, kutip ganda \"A\" untuk teks.",
    // Permintaan awal tim (bukan tambahan)
    quiz: {
      question: "Cara menulis satu karakter huruf A ke variabel char?",
      options: ["'A'", "\"A\"", "A"],
      answer: 0,
    },
  },
  {
    id: "string",
    symbol: "char[]",
    name: "Teks (string)",
    category: "tipe",
    meaning: "Menyimpan teks berupa kumpulan karakter. C tidak punya tipe string khusus.",
    code: `char nama[] = "Budi";
printf("%s", nama);`,
    output: "Budi",
    tip: "Di akhir teks, C otomatis menambah karakter penutup yang tidak terlihat.",
    added: true, // [TAMBAHAN]
    quiz: {
      question: "Di bahasa C, teks disimpan sebagai?",
      options: ["Tipe string khusus", "int", "Array of char (kumpulan karakter)"],
      answer: 2,
    },
  },

  /* ===================== OPERATOR ===================== */
  {
    id: "assign",
    symbol: "=",
    name: "Penugasan",
    category: "operator",
    meaning: "Mengisi nilai ke variabel. Bukan untuk membandingkan.",
    code: `int x = 5;
x = x + 2;
printf("%d", x);`,
    output: "7",
    added: true, // [TAMBAHAN]
    quiz: {
      question: "Apa arti tanda = di bahasa C?",
      options: ["Membandingkan dua nilai", "Mengisi nilai ke variabel", "Menambah satu"],
      answer: 1,
    },
  },
  {
    id: "arith",
    symbol: "+ - * / %",
    name: "Operator hitung",
    category: "operator",
    meaning: "Tambah, kurang, kali, bagi, dan % untuk sisa bagi.",
    code: `printf("%d\\n", 7 + 3);
printf("%d\\n", 7 / 2);
printf("%d", 7 % 2);`,
    output: "10\n3\n1",
    tip: "Pada int, 7 / 2 hasilnya 3 karena bagian desimal dibuang.",
    added: true, // [TAMBAHAN]
    quiz: {
      question: "Berapa hasil 10 % 3?",
      options: ["1", "3", "0"],
      answer: 0,
    },
  },
  {
    id: "equal",
    symbol: "==",
    name: "Sama dengan",
    category: "operator",
    meaning: "Membandingkan apakah dua nilai sama. Hasilnya benar atau salah.",
    code: `int a = 5;
if (a == 5) {
    printf("Sama");
}`,
    output: "Sama",
    tip: "Satu tanda = untuk mengisi nilai, dua tanda == untuk membandingkan.",
    added: true, // [TAMBAHAN]
    quiz: {
      question: "Operator untuk membandingkan apakah dua nilai sama?",
      options: ["=", "=>", "=="],
      answer: 2,
    },
  },
  {
    id: "logic",
    symbol: "&& ||",
    name: "DAN dan ATAU",
    category: "operator",
    meaning: "&& berarti DAN (kedua kondisi harus benar). || berarti ATAU (salah satu benar sudah cukup).",
    code: `int umur = 20;
if (umur >= 17 && umur <= 25) {
    printf("Lolos");
}`,
    output: "Lolos",
    added: true, // [TAMBAHAN]
    quiz: {
      question: "Operator && bernilai benar kalau?",
      options: ["Salah satu kondisi benar", "Kedua kondisi benar", "Semua kondisi salah"],
      answer: 1,
    },
  },
  {
    id: "increment",
    symbol: "++",
    name: "Tambah satu",
    category: "operator",
    meaning: "Menambah nilai variabel sebanyak satu.",
    code: `int i = 1;
i++;
printf("%d", i);`,
    output: "2",
    added: true, // [TAMBAHAN]
    quiz: {
      question: "Berapa nilai x setelah: int x = 4; x++; ?",
      options: ["5", "4", "3"],
      answer: 0,
    },
  },

  /* ===================== KONTROL ALUR ===================== */
  {
    id: "if",
    symbol: "if / else",
    name: "Percabangan",
    category: "alur",
    meaning: "Memilih jalan program berdasarkan kondisi. else dijalankan kalau kondisi if salah.",
    code: `int nilai = 80;
if (nilai >= 75) {
    printf("Lulus");
} else {
    printf("Tidak lulus");
}`,
    output: "Lulus",
    added: true, // [TAMBAHAN]
    quiz: {
      question: "Bagian else dijalankan kalau?",
      options: ["Kondisi if benar", "Selalu dijalankan", "Kondisi if salah"],
      answer: 2,
    },
  },
  {
    id: "for",
    symbol: "for",
    name: "Perulangan for",
    category: "alur",
    meaning: "Mengulang perintah sejumlah kali yang sudah diketahui.",
    code: `for (int i = 1; i <= 3; i++) {
    printf("%d ", i);
}`,
    output: "1 2 3",
    added: true, // [TAMBAHAN]
    quiz: {
      question: "Berapa kali isi perulangan for (int i = 0; i < 5; i++) dijalankan?",
      options: ["4", "5", "6"],
      answer: 1,
    },
  },
  {
    id: "while",
    symbol: "while",
    name: "Perulangan while",
    category: "alur",
    meaning: "Mengulang perintah selama kondisinya masih benar.",
    code: `int n = 3;
while (n > 0) {
    printf("%d ", n);
    n--;
}`,
    output: "3 2 1",
    tip: "Pastikan ada perintah yang membuat kondisi akhirnya salah, kalau tidak perulangan tak berhenti.",
    added: true, // [TAMBAHAN]
    quiz: {
      question: "Perulangan while berhenti kalau?",
      options: ["Kondisinya menjadi salah", "Kondisinya menjadi benar", "Setelah 10 kali"],
      answer: 0,
    },
  },
];