import React from "react";
import "../styles/study_plane_text.css";

function StudyPlanText({ studyPlan }) {

  return (
    <div className="study-plan-content" >
      <iframe
        title="Study Plan HTML"
        srcDoc={studyPlan}
      />
    </div>
  );
}

export default StudyPlanText;
