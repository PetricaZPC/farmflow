import { calculateFieldArea } from './areaCalculations';


export const generateFieldReport = (field, id) => {
    if (!field) return;
    
    const area = calculateFieldArea(field.area);
    
    
    const reportData = {
        fieldName: field.cropName || "Unnamed Field",
        area: area,
        plantingDate: field.plantingDate || "Not specified",
        recommendations: field.aiRecommendations || "No recommendations available",
        weatherData: field.historicalWeather || {},
        coordinates: field.area?.geometry?.coordinates || []
    };
    

    const reportUrl = `/api/reports/generate?data=${encodeURIComponent(JSON.stringify(reportData))}`;
    window.open(reportUrl);
};