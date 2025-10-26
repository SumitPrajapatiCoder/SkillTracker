import React from "react";
import "../styles/roadText.css";

function RoadMapText({ raodMap }) {

  return (
    <div className="road-map-content" >
      <iframe
        title="Road Map HTML"
        srcDoc={raodMap}
      />
    </div>
  );
}

export default RoadMapText;
