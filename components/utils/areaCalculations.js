export const calculateFieldArea = (geoJson) => {
  try {
    if (
      !geoJson ||
      !geoJson.geometry ||
      !geoJson.geometry.coordinates ||
      !geoJson.geometry.coordinates[0] ||
      geoJson.geometry.coordinates[0].length < 3
    ) {
      console.error("Invalid GeoJSON for area calculation:", geoJson);
      return 0;
    }

    const coords = geoJson.geometry.coordinates[0];

    let area = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      area += coords[i][0] * coords[i + 1][1] - coords[i + 1][0] * coords[i][1];
    }
    area = Math.abs(area) / 2;

    const approxHectares = (area * 111319.9 * 111319.9) / 10000;
    return Math.round(approxHectares * 100) / 100;
  } catch (error) {
    console.error("Error calculating field area:", error);
    return 0;
  }
};

export const calculateYieldEstimate = (field, yieldRanges) => {
  if (!field || !field.cropName) return null;

  const area = calculateFieldArea(field.area);
  const cropName = field.cropName.toLowerCase();

  const range = yieldRanges[cropName] || { min: 0, max: 0 };

  const minYield = Math.round(area * range.min * 10) / 10;
  const maxYield = Math.round(area * range.max * 10) / 10;

  let soilModifier = 1.0;
  if (field.soilType) {
    switch (field.soilType.toLowerCase()) {
      case "clay":
        soilModifier = 0.9;
        break;
      case "sandy":
        soilModifier = 0.8;
        break;
      case "loam":
        soilModifier = 1.1;
        break;
      case "silty":
        soilModifier = 1.05;
        break;
      case "peaty":
        soilModifier = 1.0;
        break;
    }
  }

  return {
    minYield: Math.round(minYield * soilModifier * 10) / 10,
    maxYield: Math.round(maxYield * soilModifier * 10) / 10,
  };
};

export const getSoilTypeDescription = (soilType) => {
  const descriptions = {
    clay: "Clay soil is heavy, with good water retention but poor drainage. It's rich in nutrients but can be difficult to work with.",
    sandy:
      "Sandy soil is light and drains quickly. It warms up faster in spring but has lower nutrient content and water retention.",
    loam: "Loam is the ideal soil type with balanced properties. It has good structure, drainage, and nutrient content.",
    silty:
      "Silty soil is fertile with good water retention and drainage. It's easy to work with but can become compacted.",
    peaty:
      "Peaty soil is dark, high in organic matter and moisture retention. It's typically acidic and warms slowly in spring.",
  };

  return (
    descriptions[soilType.toLowerCase()] ||
    "No information available for this soil type."
  );
};
