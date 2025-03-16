export const fetchCommunityTips = async (cropName) => {
    try {
        const response = await fetch(`/api/community/tips?crop=${encodeURIComponent(cropName)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.tips || [];
    } catch (error) {
        console.error("Error fetching community tips:", error);
        return [];
    }
};

export const shareCommunityTip = async (crop, tip) => {
    try {
        const response = await fetch('/api/community/shareTip', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ crop, tip }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.tip;
    } catch (error) {
        console.error("Error sharing tip:", error);
        throw error;
    }
};

export const getAIRecommendations = async (crop, plantingDate, area) => {
    try {
        if (!crop) {
            console.warn("Missing crop parameter in getAIRecommendations");
            return '<p>Please select a crop to get recommendations.</p>';
        }

        let formattedDate = null;
        try {
            formattedDate = plantingDate ? new Date(plantingDate).toISOString().split('T')[0] : null;
        } catch (e) {
            console.warn("Invalid planting date:", plantingDate, e);
            formattedDate = null;
        }
        
        const fieldArea = (!area || isNaN(Number(area))) ? 1 : Number(area);
        
        const areaStr = fieldArea ? `${fieldArea} hectares` : "unknown size";
        const dateInfo = formattedDate ? `planted on ${formattedDate}` : "with unknown planting date";
        
        const prompt = `Please provide detailed farming recommendations for a ${crop} field of ${areaStr} ${dateInfo}.
        Include specific advice on:
        1. Watering schedule
        2. Fertilizing
        3. Pest management
        4. Harvesting timeline
        5. Soil management tips
        Use bullet points and headings to organize the information clearly.
        Keep the information practical and specific for this crop.`;
        
        console.log("Requesting recommendations with prompt:", prompt);
        
        const response = await fetch('/api/ai/actions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                message: prompt
            }),
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API error (${response.status}):`, errorText);
            return `<p>Server error: ${response.status}. Please try again later.</p>`;
        }
        
        const data = await response.json();
        if (!data || !data.reply) {
            return '<p>No specific recommendations available for this crop.</p>';
        }
        
        return data.reply;
    } catch (error) {
        console.error("Error getting AI recommendations:", error);
        return `<p>An error occurred while fetching recommendations. Please try again later.</p>`;
    }
};
