import { calculateFieldArea } from './areaCalculations';

/**
 * Generate a field report and open it in a new window
 */
export const generateFieldReport = (field, id) => {
    if (!field) return;
    
    const area = calculateFieldArea(field.area);
    
    // Create the report data
    const reportData = {
        fieldName: field.cropName || "Unnamed Field",
        area: area,
        plantingDate: field.plantingDate || "Not specified",
        recommendations: field.aiRecommendations || "No recommendations available",
        weatherData: field.historicalWeather || {},
        coordinates: field.area?.geometry?.coordinates || []
    };
    
    // Open the report in a new tab/window
    const reportUrl = `/api/reports/generate?data=${encodeURIComponent(JSON.stringify(reportData))}`;
    window.open(reportUrl);
};