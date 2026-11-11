// Seed data awal: bahasa C, satu path (C Beginner), 3 lesson, 9 soal pilihan ganda.
// Aman dijalankan berulang: jika jalur sudah ada, seed dilewati.
// Jalankan SETELAH migrasi: go run ./cmd/migrate lalu go run ./cmd/seed
package main

import (
	"errors"
	"log"

	"codelingo/backend/internal/config"
	"codelingo/backend/internal/database"
	"codelingo/backend/internal/models"

	"gorm.io/gorm"
)

const (
	pathName       = "C Beginner"
	legacyPathName = "Dasar Pemrograman C" // nama lama; dianggap sudah ada
	pathDesc       = "Belajar dasar-dasar bahasa C: variabel, tipe data, dan percabangan."
	questionType   = "multiple_choice"
	xpPerAnswer    = 10
)

type seedQuestion struct {
	Text        string
	Explanation string
	Options     []string
	Correct     int // indeks opsi yang benar, dimulai dari 0
}

type seedLesson struct {
	Title       string
	Description string
	Questions   []seedQuestion
}

var lessons = []seedLesson{
	{
		Title:       "Pengenalan Variabel",
		Description: "Apa itu variabel dan cara mendeklarasikannya di C.",
		Questions: []seedQuestion{
			{
				Text:        "Apa fungsi variabel dalam sebuah program?",
				Explanation: "Variabel adalah tempat bernama di memori untuk menyimpan nilai yang bisa berubah saat program berjalan.",
				Options: []string{
					"Menampilkan teks ke layar",
					"Menyimpan data di memori yang nilainya bisa diubah",
					"Mengulang perintah berkali-kali",
					"Menghentikan program",
				},
				Correct: 1,
			},
			{
				Text:        "Manakah deklarasi variabel bilangan bulat yang benar di C?",
				Explanation: "Di C, tipe data ditulis lebih dulu, lalu nama variabel, misalnya int umur = 17;",
				Options: []string{
					"umur int = 17;",
					"integer umur = 17;",
					"var umur = 17;",
					"int umur = 17;",
				},
				Correct: 3,
			},
			{
				Text:        "Manakah nama variabel yang TIDAK valid di C?",
				Explanation: "Nama variabel tidak boleh diawali angka. Awali dengan huruf atau underscore (_).",
				Options: []string{
					"nama2",
					"_nama",
					"2nama",
					"nama_siswa",
				},
				Correct: 2,
			},
		},
	},
	{
		Title:       "Tipe Data",
		Description: "Mengenal tipe data dasar di C: int, float, dan char.",
		Questions: []seedQuestion{
			{
				Text:        "Tipe data apa yang paling cocok untuk menyimpan bilangan bulat seperti 25?",
				Explanation: "int dipakai untuk bilangan bulat, sedangkan float dan double untuk bilangan pecahan.",
				Options: []string{
					"char",
					"float",
					"int",
					"double",
				},
				Correct: 2,
			},
			{
				Text:        "Tipe data apa yang dipakai untuk menyimpan satu karakter, misalnya 'A'?",
				Explanation: "char menyimpan satu karakter dan ditulis dengan tanda kutip tunggal, misalnya 'A'. C tidak punya tipe string bawaan.",
				Options: []string{
					"string",
					"char",
					"float",
					"bool",
				},
				Correct: 1,
			},
			{
				Text:        "Berapa hasil 7 / 2 jika kedua angka bertipe int di C?",
				Explanation: "Pembagian dua int menghasilkan int. Bagian pecahannya dibuang, sehingga 7 / 2 = 3.",
				Options: []string{
					"3.5",
					"4",
					"2",
					"3",
				},
				Correct: 3,
			},
		},
	},
	{
		Title:       "Percabangan (if-else)",
		Description: "Mengambil keputusan di dalam program dengan if dan else.",
		Questions: []seedQuestion{
			{
				Text:        "Kata kunci apa yang dipakai untuk menjalankan kode hanya jika suatu kondisi bernilai benar?",
				Explanation: "if menjalankan blok kode hanya ketika kondisinya bernilai benar.",
				Options: []string{
					"for",
					"while",
					"if",
					"return",
				},
				Correct: 2,
			},
			{
				Text: `Apa output kode berikut?

int x = 5;
if (x > 3) printf("A"); else printf("B");`,
				Explanation: "Karena 5 > 3 bernilai benar, bagian if dijalankan dan mencetak A.",
				Options: []string{
					"A",
					"B",
					"AB",
					"Tidak ada output",
				},
				Correct: 0,
			},
			{
				Text:        "Operator apa yang dipakai untuk memeriksa apakah dua nilai SAMA di C?",
				Explanation: "== membandingkan dua nilai, sedangkan = adalah penugasan (assignment).",
				Options: []string{
					"=",
					"==",
					"=>",
					"!=",
				},
				Correct: 1,
			},
		},
	},
}

func main() {
	cfg := config.Load()

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("gagal terhubung ke database: %v", err)
	}

	err = db.Transaction(func(tx *gorm.DB) error {
		var existing int64
		if err := tx.Model(&models.LearningPath{}).Where("name IN ?", []string{pathName, legacyPathName}).Count(&existing).Error; err != nil {
			return err
		}
		if existing > 0 {
			log.Printf("seed dilewati: jalur %q sudah ada", pathName)
			return nil
		}

		// Pastikan bahasa C ada, lalu hubungkan path ke bahasa itu.
		var lang models.Language
		if err := tx.Where("slug = ?", "c").First(&lang).Error; err != nil {
			if !errors.Is(err, gorm.ErrRecordNotFound) {
				return err
			}
			lang = models.Language{Name: "C", Slug: "c", Description: "Belajar pemrograman dengan bahasa C.", IsAvailable: true}
			if err := tx.Create(&lang).Error; err != nil {
				return err
			}
		}

		path := models.LearningPath{
			Name:        pathName,
			Description: pathDesc,
			LanguageID:  &lang.ID,
			OrderIndex:  1,
		}
		if err := tx.Create(&path).Error; err != nil {
			return err
		}

		totalQuestions := 0
		for i, sl := range lessons {
			lesson := models.Lesson{Title: sl.Title, Description: sl.Description, Level: 1}
			if err := tx.Create(&lesson).Error; err != nil {
				return err
			}

			// Urutan lesson disimpan di tabel penghubung, bukan di lessons.
			link := models.LearningPathLesson{
				LearningPathID: path.ID,
				LessonID:       lesson.ID,
				OrderIndex:     i + 1,
			}
			if err := tx.Create(&link).Error; err != nil {
				return err
			}

			for _, sq := range sl.Questions {
				question := models.Question{
					LessonID:     lesson.ID,
					QuestionText: sq.Text,
					QuestionType: questionType,
					XPReward:     xpPerAnswer,
					Explanation:  sq.Explanation,
				}
				if err := tx.Create(&question).Error; err != nil {
					return err
				}
				totalQuestions++

				for j, text := range sq.Options {
					option := models.AnswerOption{
						QuestionID: question.ID,
						OptionText: text,
						IsCorrect:  j == sq.Correct,
					}
					if err := tx.Create(&option).Error; err != nil {
						return err
					}
				}
			}
		}

		log.Printf("seed selesai: 1 jalur, %d lesson, %d soal", len(lessons), totalQuestions)
		return nil
	})
	if err != nil {
		log.Fatalf("seed gagal (tidak ada data yang tersimpan): %v", err)
	}
}