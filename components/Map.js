import React, { useEffect, useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
// import styles from "../../src/styles/Home.module.css";
import styles from "../src/styles/Home.module.css";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("./LeafletMap"), { ssr: false });

function Map({ userEmail, userCrops }) {
  return (
    <div className={styles.cont}>
      <div className={styles.map}>
        <MapComponent userEmail={userEmail} userCrops={userCrops} />
      </div>
    </div>
  );
}

export default Map;
