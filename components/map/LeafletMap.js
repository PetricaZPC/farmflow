import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { useEffect, useState, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet-draw";
import styles from "../../src/styles/Home.module.css";

import MapEvents from "./MapEvents";
import FieldPopup from "./FieldPopup";
import CommunityPanel from "./CommunityPanel";

import {
  calculateFieldArea,
  generateFieldReport,
} from "./utils/areaCalculations";
import {
  fetchCommunityTips,
  shareCommunityTip,
  getAIRecommendations,
} from "./utils/apiService";
import { generateFieldReport as generateReport } from "./utils/reportGenerator";

function LeafletMap({ userEmail, userCrops }) {
  const [areas, setAreas] = useState([]);
  const [popups, setPopups] = useState({});
  const drawnItemsRef = useRef(new L.FeatureGroup());
  const [temperature, setTemperature] = useState(null);
  const [city, setCity] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(true);

  const [communityTips, setCommunityTips] = useState([]);
  const [newTip, setNewTip] = useState("");
  const [activeCrop, setActiveCrop] = useState("");
  const [showCommunityPanel, setShowCommunityPanel] = useState(false);

  const [fieldTasks, setFieldTasks] = useState({});

  const isMounted = useRef(true);

  const prepareDataForSaving = (data) => {
    const cleanData = {};
    Object.keys(data).forEach((key) => {
      cleanData[key] = {
        cropName: data[key].cropName || "",
        plantingDate: data[key].plantingDate || "",
        area: data[key].area || null,
        notes: data[key].notes || "",
        aiRecommendations: data[key].aiRecommendations || "",
      };
    });
    return cleanData;
  };

  const saveCropsToServer = useCallback(async (cropsData) => {
    if (!cropsData || Object.keys(cropsData).length === 0) return false;
    try {
      const cleanData = prepareDataForSaving(cropsData);
      const response = await fetch("/api/auth/saveCrops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ crops: cleanData }),
      });
      const responseText = await response.text();
      let data;
      try { data = JSON.parse(responseText); } catch (e) { return false; }
      if (!response.ok) return false;
      return true;
    } catch (error) {
      console.error("Exception in saveCropsToServer:", error);
      return false;
    }
  }, []);

  const handleFetchCommunityTips = useCallback(async (cropName) => {
    if (!cropName) return;
    setActiveCrop(cropName);
    setShowCommunityPanel(true);
    try {
      const tips = await fetchCommunityTips(cropName);
      setCommunityTips(tips || []);
    } catch (error) {
      setCommunityTips([]);
    }
  }, []);

  const handleAreaClick = useCallback((layer, latlng) => {
    let id;
    if (layer.feature?.properties?.id) {
      id = layer.feature.properties.id;
    } else if (layer.options?.data?.properties?.id) {
      id = layer.options.data.properties.id;
    } else {
      id = layer.properties?.id ?? null;
    }
    if (!id) return;

    setPopups((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        show: true,
        position: latlng || (prev[id]?.area ? L.geoJSON(prev[id].area).getBounds().getCenter() : null),
      },
    }));

    const cropName = userCrops?.[id]?.cropName;
    if (cropName) handleFetchCommunityTips(cropName);
  }, [userCrops, handleFetchCommunityTips]);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  // FIX: Normalizarea userCrops → popups într-un effect SEPARAT
  // care nu mai apelează setPopups condiționat — îl apelează mereu,
  // dar numai când userCrops se schimbă.
  useEffect(() => {
    if (!userCrops || Object.keys(userCrops).length === 0) {
      setLoading(false);
      return;
    }

    const normalizedPopups = Object.entries(userCrops).reduce((acc, [id, popup]) => {
      acc[id] = {
        ...popup,
        show: Boolean(popup.show),
        position: popup.position || (popup.area ? L.geoJSON(popup.area).getBounds().getCenter() : null),
      };
      return acc;
    }, {});

    setPopups(normalizedPopups);
    setLoading(false);
  }, [userCrops]); // eslint-disable-line react-hooks/exhaustive-deps

  // FIX: Construirea layerelor într-un effect SEPARAT care depinde de popups
  useEffect(() => {
    if (!popups || Object.keys(popups).length === 0) return;

    const newFeatureGroup = new L.FeatureGroup();

    Object.entries(popups).forEach(([id, popup]) => {
      if (popup.area) {
        try {
          const geoJsonLayer = L.geoJSON(popup.area, {
            style: { color: "#3388ff", weight: 3, opacity: 1, fillOpacity: 0.2 },
            onEachFeature: (feature, layer) => {
              feature.properties = feature.properties || {};
              feature.properties.id = id;
              layer.feature = feature;
              layer.on("click", (e) => handleAreaClick(layer, e.latlng));
            },
          });
          newFeatureGroup.addLayer(geoJsonLayer);
        } catch (error) {
          console.error(`Error creating layer for area ${id}:`, error);
        }
      }
    });

    drawnItemsRef.current = newFeatureGroup;
    setAreas([...newFeatureGroup.getLayers()]);
  }, [popups, handleAreaClick]);

  // Auto-save: doar când datele crop-ului se schimbă, nu UI state (show/position)
  const prevCropDataRef = useRef({});
  useEffect(() => {
    if (!popups || Object.keys(popups).length === 0) return;

    const getCropDataOnly = (popupsObj) => {
      const cropData = {};
      Object.entries(popupsObj).forEach(([id, popup]) => {
        const { cropName, plantingDate, area, notes, aiRecommendations } = popup;
        cropData[id] = { cropName, plantingDate, area, notes, aiRecommendations };
      });
      return cropData;
    };

    const currentCropData = getCropDataOnly(popups);
    const isEqual = JSON.stringify(currentCropData) === JSON.stringify(prevCropDataRef.current);
    if (isEqual) return;

    prevCropDataRef.current = currentCropData;

    let isUnmounted = false;
    const saveData = async () => {
      try { await saveCropsToServer(popups); }
      catch (error) { console.error("Auto-save error:", error); }
    };

    saveData();

    const autoSaveInterval = setInterval(() => {
      if (!isUnmounted) saveData();
    }, 60000);

    return () => {
      isUnmounted = true;
      clearInterval(autoSaveInterval);
    };
  }, [popups, saveCropsToServer]);

  const handleClosePopup = (id) => {
    setPopups((prev) => ({ ...prev, [id]: { ...prev[id], show: false } }));
  };

  const updateCropName = (id, name) => {
    setPopups((prev) => ({ ...prev, [id]: { ...prev[id], cropName: name } }));
  };

  const updatePlantingDate = (id, date) => {
    setPopups((prev) => ({ ...prev, [id]: { ...prev[id], plantingDate: date } }));
  };

  const handleEraseArea = (id) => {
    const layers = drawnItemsRef.current.getLayers();
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      if (
        layer.feature?.properties?.id === id ||
        (layer._layers && Object.values(layer._layers).some(
          (l) => l.feature?.properties?.id === id
        ))
      ) {
        drawnItemsRef.current.removeLayer(layer);
        break;
      }
    }

    setPopups((prev) => {
      const newPopups = { ...prev };
      delete newPopups[id];
      setTimeout(() => saveCropsToServer(newPopups), 100);
      return newPopups;
    });

    setAreas([...drawnItemsRef.current.getLayers()]);
  };

  const handleShareTip = async () => {
    if (!activeCrop || !newTip.trim()) { alert("Please enter a tip to share"); return; }
    try {
      const newTipData = await shareCommunityTip(activeCrop, newTip.trim());
      setCommunityTips((prev) => [...prev, newTipData]);
      setNewTip("");
    } catch (error) {
      alert("Failed to share tip. Please try again.");
    }
  };

  const addTask = (fieldId, taskText, dueDate) => {
    const newTask = {
      id: `task-${Date.now()}`,
      text: taskText,
      dueDate: dueDate || new Date().toISOString().split("T")[0],
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setFieldTasks((prev) => ({ ...prev, [fieldId]: [...(prev[fieldId] || []), newTask] }));
  };

  const toggleTaskCompleted = (fieldId, taskId) => {
    setFieldTasks((prev) => ({
      ...prev,
      [fieldId]: prev[fieldId].map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ),
    }));
  };

  const deleteTask = (fieldId, taskId) => {
    setFieldTasks((prev) => ({
      ...prev,
      [fieldId]: prev[fieldId].filter((task) => task.id !== taskId),
    }));
  };

  const handleGetRecommendations = async (id) => {
    const popup = popups[id];
    setPopups((prev) => ({
      ...prev,
      [id]: { ...prev[id], aiRecommendations: `<p>Loading recommendations for ${popup.cropName}...</p>` },
    }));
    try {
      const recommendations = await getAIRecommendations(
        popup.cropName,
        popup.plantingDate,
        calculateFieldArea(popup.area)
      );
      setPopups((prev) => ({ ...prev, [id]: { ...prev[id], aiRecommendations: recommendations } }));
    } catch (error) {
      setPopups((prev) => ({
        ...prev,
        [id]: { ...prev[id], aiRecommendations: "<p>An error occurred. Please try again later.</p>" },
      }));
    }
  };

  const handleGenerateReport = (id) => {
    try {
      const field = popups[id];
      if (!field) return;
      generateReport(field, id);
    } catch (error) {
      alert("Failed to generate report: " + error.message);
    }
  };

  return (
    <div className={styles.cont}>
      <div className={styles.map}>
        {loading ? (
          <div>Loading map data...</div>
        ) : (
          <>
            <MapContainer center={[45.8217, 21.0559]} zoom={13} className={styles.map}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              <MapEvents
                drawnItemsRef={drawnItemsRef}
                setPopups={setPopups}
                setAreas={setAreas}
              />

              {Object.entries(popups).map(([id, popup]) =>
                popup.area ? (
                  <GeoJSON
                    key={id}
                    data={popup.area}
                    style={{ color: "#3388ff", weight: 3, opacity: 1, fillOpacity: 0.2 }}
                    eventHandlers={{
                      click: (e) => {
                        setPopups((prev) => ({
                          ...prev,
                          [id]: { ...prev[id], show: true, position: e.latlng },
                        }));
                        const cropName = popups[id]?.cropName;
                        if (cropName) handleFetchCommunityTips(cropName);
                      },
                    }}
                  />
                ) : null
              )}

              {Object.entries(popups).map(([id, popup]) =>
                popup.show ? (
                  <FieldPopup
                    key={`popup-${id}`}
                    id={id}
                    popup={popup}
                    temperature={temperature}
                    fieldTasks={fieldTasks}
                    setFieldTasks={setFieldTasks}
                    handleClosePopup={handleClosePopup}
                    updateCropName={updateCropName}
                    updatePlantingDate={updatePlantingDate}
                    getAIRecommendations={handleGetRecommendations}
                    fetchCommunityTips={handleFetchCommunityTips}
                    handleEraseArea={handleEraseArea}
                  />
                ) : null
              )}
            </MapContainer>

            {showCommunityPanel && (
              <CommunityPanel
                activeCrop={activeCrop}
                communityTips={communityTips}
                newTip={newTip}
                setNewTip={setNewTip}
                shareTip={handleShareTip}
                setShowCommunityPanel={setShowCommunityPanel}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default LeafletMap;