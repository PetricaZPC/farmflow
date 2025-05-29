import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-draw";

function MapEvents({ drawnItemsRef, setPopups, setAreas }) {
  const mapRef = useRef(null);

  const map = useMap();
  mapRef.current = map;

  useEffect(() => {
    if (!map) return;

    map.addLayer(drawnItemsRef.current);

    // Initialize the draw control
    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItemsRef.current,
        poly: {
          allowIntersection: false,
        },
      },
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
        },
        polyline: false,
        rectangle: true,
        circle: false,
        marker: false,
        circlemarker: false,
      },
    });

    map.addControl(drawControl);

    // Handle newly drawn items
    map.on(L.Draw.Event.CREATED, (event) => {
      const layer = event.layer;
      const type = event.layerType;
      const id = `area-${Date.now()}`;

      // Add properties to the layer
      if (layer.feature === undefined) {
        layer.feature = { type: "Feature", properties: {} };
      }
      
      layer.feature.properties.id = id;
      
      // Set up click handler for this layer
      layer.on("click", (e) => {
        handleAreaClick(layer, e.latlng);
      });
      
      // Add layer to drawn items
      drawnItemsRef.current.addLayer(layer);
      
      // Convert to GeoJSON for storage
      const geoJson = layer.toGeoJSON();
      
      // Set popup data with valid info and no blank entries
      setPopups((prev) => ({
        ...prev,
        [id]: {
          cropName: "",  // Start with empty string, not null or undefined
          plantingDate: "",
          area: geoJson,
          show: true,
          position: layer.getBounds().getCenter(),
          notes: "",
        },
      }));
      
      setAreas([...drawnItemsRef.current.getLayers()]);
    });

    // Handle edited items
    map.on(L.Draw.Event.EDITED, (event) => {
      const layers = event.layers;
      
      layers.eachLayer((layer) => {
        if (layer.feature && layer.feature.properties && layer.feature.properties.id) {
          const id = layer.feature.properties.id;
          const geoJson = layer.toGeoJSON();
          
          setPopups((prev) => ({
            ...prev,
            [id]: {
              ...prev[id],
              area: geoJson,
            },
          }));
        }
      });
      
      setAreas([...drawnItemsRef.current.getLayers()]);
    });

    // Handle deleted items
    map.on(L.Draw.Event.DELETED, (event) => {
      const layers = event.layers;
      
      layers.eachLayer((layer) => {
        if (layer.feature && layer.feature.properties && layer.feature.properties.id) {
          const id = layer.feature.properties.id;
          
          setPopups((prev) => {
            const newPopups = { ...prev };
            delete newPopups[id];
            return newPopups;
          });
        }
      });
      
      setAreas([...drawnItemsRef.current.getLayers()]);
    });

    return () => {
      map.removeControl(drawControl);
      map.off(L.Draw.Event.CREATED);
      map.off(L.Draw.Event.EDITED);
      map.off(L.Draw.Event.DELETED);
    };
  }, [map, drawnItemsRef, setPopups, setAreas]);

  const handleAreaClick = (layer, latlng) => {
    const id = layer.feature.properties.id;
    
    setPopups((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        show: true,
        position: latlng,
      },
    }));
  };

  return null;
}

export default MapEvents;
