import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/mock_test.css";

const MockTest = () => {
  const navigate = useNavigate();
  const [mockData, setMockData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const pageWindow = 3;

  const fetchMockData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await api.get("/api/v1/user/get-mock-cards", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.data || [];
      setMockData(data);
      setFilteredData(data);
    } catch (err) {
      console.error("Error fetching mock data:", err.response || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMockData();
  }, []);

  useEffect(() => {
    const filtered = mockData.filter((test) =>
      test.language.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, mockData]);

  const handleNavigate = (card) => {
    navigate(`/mock_test/${card.language}`, {
      state: { cardQuestions: card.questions, cardTime: card.time },
    });
  };

  if (loading) return <p className="loading-text">Loading mock tests...</p>;

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const startPage = Math.max(1, currentPage - Math.floor(pageWindow / 2));
  const endPage = Math.min(totalPages, startPage + pageWindow - 1);
  const visiblePages = [];
  for (let i = startPage; i <= endPage; i++) {
    visiblePages.push(i);
  }

  return (
    <div className="mocktest-page">
      <h2 className="mocktest-title">Choose A Mock Test</h2>

      <div className="mocktest-search-container">
        <input
          type="text"
          className="mocktest-search-input"
          placeholder="Search by language..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="mocktest-cards">
        {currentItems.length > 0 ? (
          currentItems.map((test) => (
            <div key={test.language} className="mocktest-card">
              <div className="mocktest-card-header">{test.language}</div>
              <div className="mocktest-card-content">
                <p>Questions: {test.questions}</p>
                <p>Time: {test.time} mins</p>
              </div>
              <button
                className="mocktest-button"
                onClick={() => handleNavigate(test)}
              >
                Start Mock
              </button>
            </div>
          ))
        ) : (
          <p className="no-results-text">No mock tests found for “{searchTerm}”.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mocktest-pagination-modern">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="mocktest-page-btn"
          >
            Prev
          </button>

          {startPage > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className={`mocktest-page-btn ${currentPage === 1 ? "active" : ""
                  }`}
              >
                1
              </button>
              {startPage > 2 && <span className="mocktest-ellipsis">...</span>}
            </>
          )}

          {visiblePages.map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`mocktest-page-btn ${page === currentPage ? "active" : ""
                }`}
            >
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span className="mocktest-ellipsis">...</span>
              )}
              <button
                onClick={() => handlePageChange(totalPages)}
                className={`mocktest-page-btn ${currentPage === totalPages ? "active" : ""
                  }`}
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="mocktest-page-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default MockTest;
