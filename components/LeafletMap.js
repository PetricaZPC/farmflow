import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet-draw";
import styles from "../src/styles/Home.module.css";

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

  useEffect(() => {
    if (userCrops) {
      console.log("Loaded userCrops:", userCrops);
      setPopups(userCrops);

      const newFeatureGroup = new L.FeatureGroup();

      Object.entries(userCrops).forEach(([id, popup]) => {
        if (popup.area) {
          try {
            const geoJsonLayer = L.geoJSON(popup.area, {
              style: {
                color: "#3388ff",
                weight: 3,
                opacity: 1,
                fillOpacity: 0.2,
              },
              onEachFeature: (feature, layer) => {
                feature.properties = feature.properties || {};
                feature.properties.id = id;
                layer.feature = feature;

                layer.on("click", (e) => {
                  handleAreaClick(layer, e.latlng);
                });
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
    }
    setLoading(false);
  }, [userCrops]);

  const handleClosePopup = (id) => {
    setPopups((prev) => ({
      ...prev,
      [id]: { ...prev[id], show: false },
    }));
  };

  const updateCropName = (id, name) => {
    setPopups((prev) => ({
      ...prev,
      [id]: { ...prev[id], cropName: name },
    }));
  };

  const updatePlantingDate = (id, date) => {
    setPopups((prev) => ({
      ...prev,
      [id]: { ...prev[id], plantingDate: date },
    }));
  };

  const handleEraseArea = (id) => {
    const layers = drawnItemsRef.current.getLayers();
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      if (
        layer.feature &&
        layer.feature.properties &&
        layer.feature.properties.id === id
      ) {
        drawnItemsRef.current.removeLayer(layer);
        break;
      }
    }

    setPopups((prev) => {
      const newPopups = { ...prev };
      delete newPopups[id];
      return newPopups;
    });

    setAreas([...drawnItemsRef.current.getLayers()]);
  };

  const handleAreaClick = (layer, latlng) => {
    let id;

    if (
      layer.feature &&
      layer.feature.properties &&
      layer.feature.properties.id
    ) {
      id = layer.feature.properties.id;
    } else if (
      layer.options &&
      layer.options.data &&
      layer.options.data.properties &&
      layer.options.data.properties.id
    ) {
      id = layer.options.data.properties.id;
    } else {
      id = layer.properties ? layer.properties.id : null;
    }

    if (!id) {
      console.error("Could not determine ID from layer:", layer);
      return;
    }

    console.log(`Clicked on area with ID: ${id}`);

    setPopups((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        show: true,
        position: latlng,
      },
    }));

    const cropName = popups[id]?.cropName;
    if (cropName) {
      handleFetchCommunityTips(cropName);
    }
  };

  const handleFetchCommunityTips = async (cropName) => {
    if (!cropName) return;

    setActiveCrop(cropName);
    setShowCommunityPanel(true);

    try {
      const tips = await fetchCommunityTips(cropName);
      setCommunityTips(tips || []);
    } catch (error) {
      console.error("Error fetching community tips:", error);
      setCommunityTips([]);
    }
  };

  const handleShareTip = async () => {
    if (!activeCrop || !newTip.trim()) {
      alert("Please enter a tip to share");
      return;
    }

    try {
      const newTipData = await shareCommunityTip(activeCrop, newTip.trim());
      setCommunityTips((prev) => [...prev, newTipData]);
      setNewTip("");
    } catch (error) {
      console.error("Error sharing tip:", error);
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

    setFieldTasks((prev) => ({
      ...prev,
      [fieldId]: [...(prev[fieldId] || []), newTask],
    }));
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
      [id]: {
        ...prev[id],
        aiRecommendations: `<p>Loading recommendations for ${popup.cropName}...</p>`,
      },
    }));

    try {
      const recommendations = await getAIRecommendations(
        popup.cropName,
        popup.plantingDate,
        calculateFieldArea(popup.area)
      );

      setPopups((prev) => ({
        ...prev,
        [id]: { ...prev[id], aiRecommendations: recommendations },
      }));
    } catch (error) {
      console.error("Error getting AI recommendations:", error);
      setPopups((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          aiRecommendations:
            "<p>An error occurred while fetching recommendations. Please try again later.</p>",
        },
      }));
    }
  };

  const handleGenerateReport = (id) => {
    try {
      const field = popups[id];
      if (!field) {
        console.error("Field not found for ID:", id);
        return;
      }
      generateReport(field, id);
    } catch (error) {
      console.error("Error generating report:", error);
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
            <MapContainer
              center={[45.8217, 21.0559]}
              zoom={13}
              className={styles.map}
            >
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
                    style={{
                      color: "#3388ff",
                      weight: 3,
                      opacity: 1,
                      fillOpacity: 0.2,
                    }}
                    eventHandlers={{
                      click: (e) => {
                        setPopups((prev) => ({
                          ...prev,
                          [id]: { ...prev[id], show: true, position: e.latlng },
                        }));

                        if (popup.cropName) {
                          handleFetchCommunityTips(popup.cropName);
                        }
                      },
                    }}
                  />
                ) : null
              )}

              {Object.entries(popups).map(
                ([id, popup]) =>
                  popup.show && (
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
                  )
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
