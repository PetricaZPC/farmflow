import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { v4 as uuidv4 } from 'uuid';

function MapEvents({ drawnItemsRef, setPopups, setAreas }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map.drawControl) {
      const drawControl = new L.Control.Draw({
        draw: {
          polyline: false,
          rectangle: false,
          circle: false,
          circlemarker: false,
          marker: false,
          polygon: {
            allowIntersection: false,
            showArea: true
          }
        },
        edit: {
          featureGroup: drawnItemsRef.current,
          poly: {
            allowIntersection: false
          }
        }
      });
      
      map.drawControl = drawControl;
      map.addControl(drawControl);
      
      map.addLayer(drawnItemsRef.current);
      
      map.on(L.Draw.Event.CREATED, (event) => {
        const layer = event.layer;
        const id = uuidv4();
        
        const geoJson = layer.toGeoJSON();
        
        geoJson.properties = geoJson.properties || {};
        geoJson.properties.id = id;
        
        const newPopup = {
          id: id,
          position: layer.getBounds().getCenter(),
          show: true,
          area: geoJson,
          cropName: '',
          plantingDate: new Date().toISOString().split('T')[0],
          aiRecommendations: ''
        };
        
        drawnItemsRef.current.addLayer(layer);
        setPopups(prev => ({ ...prev, [id]: newPopup }));
        setAreas([...drawnItemsRef.current.getLayers()]);
      });
      
      map.on(L.Draw.Event.EDITED, (event) => {
        const layers = event.layers;
        
        layers.eachLayer((layer) => {
          let id = '';
          
          if (layer.feature && layer.feature.properties && layer.feature.properties.id) {
            id = layer.feature.properties.id;
          } else {
            console.error("Could not find ID for edited layer:", layer);
            return;
          }
          
          const geoJson = layer.toGeoJSON();
          geoJson.properties = geoJson.properties || {};
          geoJson.properties.id = id;
          
          setPopups(prev => ({
            ...prev,
            [id]: {
              ...prev[id],
              area: geoJson,
              position: layer.getBounds().getCenter()
            }
          }));
        });
        
        setAreas([...drawnItemsRef.current.getLayers()]);
      });
      
      map.on(L.Draw.Event.DELETED, (event) => {
        const layers = event.layers;
        
        layers.eachLayer((layer) => {
          let id = '';
          
          if (layer.feature && layer.feature.properties && layer.feature.properties.id) {
            id = layer.feature.properties.id;
          } else {
            console.error("Could not find ID for deleted layer:", layer);
            return;
          }
          
          setPopups(prev => {
            const newPopups = { ...prev };
            delete newPopups[id];
            return newPopups;
          });
        });
        
        setAreas([...drawnItemsRef.current.getLayers()]);
      });
    }
    
    return () => {
      if (map.drawControl) {
        map.removeControl(map.drawControl);
        delete map.drawControl;
      }
    };
  }, [map, drawnItemsRef, setPopups, setAreas]); 
  
  return null;
}

export default MapEvents;
