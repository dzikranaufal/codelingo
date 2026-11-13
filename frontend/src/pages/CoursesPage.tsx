// frontend/src/pages/CoursesPage.tsx
import { useNavigate } from "react-router-dom";
import { languages } from "../components/LanguageIcons";
import "./CoursesPage.css";

const CURRENT_COURSE = "c"; // SEMENTARA: kursus aktif nanti dari backend

export default function CoursesPage() {
  const navigate = useNavigate();

  return (
    <div className="courses">
      <h1>Pilih bahasa pemrograman</h1>

      <div className="courses__grid">
        {languages.map(({ id, name, Icon }) => (
          <button
            key={id}
            type="button"
            className="course-card"
            // SEMENTARA: pilihan kursus belum disimpan, hanya kembali ke jalur belajar
            onClick={() => navigate("/belajar")}
          >
            {id === CURRENT_COURSE && (
              <span className="course-card__check" aria-label="Kursus aktif">
                ✓
              </span>
            )}
            <span className="course-card__icon">
              <Icon />
            </span>
            <span className="course-card__name">{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}