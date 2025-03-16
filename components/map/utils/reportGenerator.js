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

    // Create a form element
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/reports/generate';
    form.target = '_blank'; // Open in new tab/window
    
    // Add the data as a hidden input field
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'reportData';
    input.value = JSON.stringify(reportData);
    form.appendChild(input);
    
    // Add the form to the document and submit it
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
};