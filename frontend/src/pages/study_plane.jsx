import React, { useEffect, useState } from "react";
 import axios from "axios";
import StudyPlanText from "./studyText";
import { toast } from "react-toastify";
import "../styles/study_plane.css";
import { FaSearch } from "react-icons/fa";

const StudyPlan = () => {
  const [studyPlansByLanguage, setStudyPlansByLanguage] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatingLang, setGeneratingLang] = useState(null);
  const [savingLang, setSavingLang] = useState(null);
  const [savedPlans, setSavedPlans] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 1;
  const pageWindow = 3;

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await  axios. get("/api/v1/user/study-plan", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          const plans = res.data.studyPlansByLanguage || {};
          setStudyPlansByLanguage(plans);
          setSavedPlans(new Set(Object.keys(plans)));
        } else {
          setError("Failed to fetch study plans");
        }
      } catch (e) {
        setError(e.response?.data?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    const completedForStudy =
      JSON.parse(localStorage.getItem("completedQuizzesForStudy")) || [];
    if (completedForStudy.length > 0) {
      completedForStudy.forEach((lang) => handleGenerate(lang));
      localStorage.setItem("completedQuizzesForStudy", JSON.stringify([]));
    }
  }, []);

  const handleGenerate = async (language) => {
    setGeneratingLang(language);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await  axios. get(
        `/api/v1/user/study-plan?language=${encodeURIComponent(language)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setStudyPlansByLanguage((prev) => ({
          ...prev,
          [language]: res.data.studyPlan,
        }));
        setSavedPlans((prev) => {
          const updated = new Set(prev);
          updated.delete(language);
          return updated;
        });
        toast.success(`Generated new study plan for ${language}`);
      } else {
        toast.error(`Failed to generate study plan for ${language}`);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Error generating study plan");
    } finally {
      setGeneratingLang(null);
    }
  };

  const handleSave = async (language) => {
    setSavingLang(language);
    try {
      const token = localStorage.getItem("token");
      const res = await  axios. post(
        "/api/v1/user/study-plan/save",
        { language, studyPlan: studyPlansByLanguage[language] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success(`Study plan saved for ${language}`);
        setSavedPlans((prev) => new Set(prev).add(language));
      } else {
        toast.error(`Failed to save study plan for ${language}`);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Error saving study plan");
    } finally {
      setSavingLang(null);
    }
  };

  const filteredLanguages = Object.keys(studyPlansByLanguage).filter((lang) =>
    lang.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLanguages.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentLanguages = filteredLanguages.slice(indexOfFirst, indexOfLast);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const startPage = Math.max(1, currentPage - Math.floor(pageWindow / 2));
  const endPage = Math.min(totalPages, startPage + pageWindow - 1);
  const visiblePages = [];
  for (let i = startPage; i <= endPage; i++) visiblePages.push(i);

  if (loading)
    return <div className="loading">Loading your study plans...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <main className="study-plan-container">
      <h1>Your Personalized Study Plans</h1>

      <div className="search-bar">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search by language..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredLanguages.length === 0 && (
        <p>No study plans found for "{searchQuery}".</p>
      )}

      {currentLanguages.map((language) => {
        const plan = studyPlansByLanguage[language];
        return (
          <section key={language} className="language-section">
            <h2>{language} Study Plan</h2>
            {plan ? (
              <>
                <StudyPlanText studyPlan={plan} />
                <div className="button-group">
                  <button
                    onClick={() => handleGenerate(language)}
                    disabled={generatingLang === language}
                  >
                    {generatingLang === language
                      ? "Generating..."
                      : "Regenerate Plan"}
                  </button>
                  <button
                    onClick={() => handleSave(language)}
                    disabled={savingLang === language || savedPlans.has(language)}
                  >
                    {savingLang === language
                      ? "Saving..."
                      : savedPlans.has(language)
                        ? "Saved"
                        : "Save Plan"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>No study plan generated yet.</p>
                <button
                  onClick={() => handleGenerate(language)}
                  disabled={generatingLang === language}
                >
                  {generatingLang === language
                    ? "Generating..."
                    : "Generate Plan"}
                </button>
              </>
            )}
          </section>
        );
      })}

      {totalPages > 1 && (
        <div className="pagination-modern">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="page-btn"
          >
            Prev
          </button>

          {startPage > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className={`page-btn ${currentPage === 1 ? "active" : ""}`}
              >
                1
              </button>
              {startPage > 2 && <span className="ellipsis">...</span>}
            </>
          )}

          {visiblePages.map((page) => (
            <button
              key={page}
              className={`page-btn ${page === currentPage ? "active" : ""}`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="ellipsis">...</span>}
              <button
                onClick={() => handlePageChange(totalPages)}
                className={`page-btn ${currentPage === totalPages ? "active" : ""}`}
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="page-btn"
          >
            Next
          </button>
        </div>
      )}




    </main>
  );
};

export default StudyPlan;
