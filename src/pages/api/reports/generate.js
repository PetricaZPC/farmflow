import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export default async function handler(req, res) {
  // Allow both GET (for backward compatibility) and POST (new approach)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get data from query param (GET) or request body (POST)
    let reportData;
    if (req.method === 'GET') {
      const { data } = req.query;
      if (!data) {
        return res.status(400).json({ error: 'Missing data parameter' });
      }
      reportData = JSON.parse(data);
    } else {
      // POST request
      const { reportData: bodyData } = req.body;
      if (!bodyData) {
        return res.status(400).json({ error: 'Missing reportData in request body' });
      }
      reportData = typeof bodyData === 'string' ? JSON.parse(bodyData) : bodyData;
    }

    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const page = pdfDoc.addPage([612, 792]); 
    const { width, height } = page.getSize();
    const fontSize = 11;
    const titleSize = 24;
    const headingSize = 14;
    const margin = 50;
    const maxWidth = width - (margin * 2);
    
    // Start higher on the page for more space
    let y = height - 70;
    
    // Title
    page.drawText('FarmFlow Field Report', {
      x: margin,
      y,
      size: titleSize,
      font: boldFont,
      color: rgb(0.1, 0.4, 0.1),
    });
    
    // Increase spacing to prevent overlap
    y -= 50; // Changed from 40 to 50
    
    // Field name
    page.drawText(`Field: ${reportData.fieldName || "Unnamed Field"}`, {
      x: margin,
      y,
      size: headingSize,
      font: boldFont,
    });
    
    // Increase spacing after headings
    y -= 30; // Changed from 25 to 30
    
    // Area
    page.drawText(`Area: ${reportData.area || 0} hectares`, {
      x: margin,
      y,
      size: fontSize,
      font: helveticaFont,
    });
    
    y -= 25; // Adequate spacing for normal text
    
    // Planting date
    page.drawText(`Planting Date: ${reportData.plantingDate || "Not specified"}`, {
      x: margin,
      y,
      size: fontSize,
      font: helveticaFont,
    });
    
    // More spacing before next heading
    y -= 45; // Changed from 40 to 45
    
    page.drawText('Recommendations:', {
      x: margin,
      y,
      size: headingSize,
      font: boldFont,
    });
    
    y -= 25;
    
    const recommendations = reportData.recommendations || "No recommendations available";
    let plainRecommendations;
    
    if (typeof recommendations === 'string') {
      plainRecommendations = recommendations
        .replace(/<br\s*\/?>/gi, '\n')      
        .replace(/<\/p>/gi, '\n\n')          
        .replace(/<b>(.*?)<\/b>/gi, '$1')     
        .replace(/<[^>]*>/g, '')              
        .replace(/&nbsp;/g, ' ')              
        .replace(/&bull;/g, '• ')             
        .replace(/\n\s*\n/g, '\n\n')          
        .replace(/^\s+|\s+$/g, '');           
    } else {
      plainRecommendations = "No recommendations available";
    }
    
    const wrapText = (text, maxWidth, font, fontSize) => {
      const paragraphs = text.split('\n');
      const lines = [];
      
      for (const paragraph of paragraphs) {
        if (paragraph.trim() === '') {
          lines.push('');  
          continue;
        }
        
        const words = paragraph.split(' ');
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const textWidth = font.widthOfTextAtSize(testLine, fontSize);
          
          if (textWidth > maxWidth) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        
        if (currentLine) {
          lines.push(currentLine);
        }
      }
      
      return lines;
    };
    
    const drawWrappedText = (textLines, startY) => {
      let currentY = startY;
      let currentPage = page;
      
      for (const line of textLines) {
        // Check if we need a new page before drawing each line
        if (currentY < margin + 30) { // Add more buffer space (30 points)
          currentPage = pdfDoc.addPage([612, 792]);
          currentY = currentPage.getSize().height - margin;
        }
      
        if (line === '') {
          currentY -= fontSize;
          continue;
        }
        
        let xPosition = margin;
        let lineText = line;
        
        if (line.startsWith('• ')) {
          xPosition = margin + 15;  
          lineText = line.substring(2);
        } else if (/^\d+\.\s/.test(line)) {
          xPosition = margin + 15;  
        }
        
        currentPage.drawText(lineText, {
          x: xPosition,
          y: currentY,
          size: fontSize,
          font: helveticaFont,
        });
        
        currentY -= fontSize + 5;
      }
      
      return currentY;
    };
    
    const textLines = wrapText(plainRecommendations, maxWidth - 20, helveticaFont, fontSize);
    y = drawWrappedText(textLines, y);

    // Add additional space after recommendations
    y -= 20; // Add extra buffer space
    
    if (reportData.weatherData && Object.keys(reportData.weatherData).length > 0) {
      y -= 30;
      
      if (y < 100) {
        page = pdfDoc.addPage([612, 792]);
        y = page.getSize().height - margin;
      }
      
      page.drawText('Weather Data:', {
        x: margin,
        y,
        size: headingSize,
        font: boldFont,
      });
      
      y -= 25;
      
      Object.entries(reportData.weatherData).forEach(([key, value]) => {
        if (y < margin) {
          page = pdfDoc.addPage([612, 792]);
          y = page.getSize().height - margin;
        }
        
        const weatherText = `${key}: ${value}`;
        page.drawText(weatherText, {
          x: margin,
          y,
          size: fontSize,
          font: helveticaFont,
        });
        
        y -= 15;
      });
    }
    
    if (reportData.coordinates && reportData.coordinates.length > 0) {
      y -= 30;
      
      // Change from 100 to a larger value to create new page sooner
      if (y < 150) { // Instead of 100, use 150
        page = pdfDoc.addPage([612, 792]);
        y = page.getSize().height - margin;
      }
      
      page.drawText('Field Coordinates:', {
        x: margin,
        y,
        size: headingSize,
        font: boldFont,
      });
      
      y -= 25;
      
      const maxCoords = 5;
      for (let i = 0; i < Math.min(maxCoords, reportData.coordinates[0].length); i++) {
        if (y < margin) {
          page = pdfDoc.addPage([612, 792]);
          y = page.getSize().height - margin;
        }
        
        const coord = reportData.coordinates[0][i];
        if (Array.isArray(coord) && coord.length >= 2) {
          const coordText = `Point ${i+1}: ${coord[0].toFixed(6)}, ${coord[1].toFixed(6)}`;
          page.drawText(coordText, {
            x: margin,
            y,
            size: fontSize,
            font: helveticaFont,
          });
          
          y -= 15;
        }
      }
      
      if (reportData.coordinates[0].length > maxCoords) {
        page.drawText(`... and ${reportData.coordinates[0].length - maxCoords} more points`, {
          x: margin,
          y,
          size: fontSize,
          font: helveticaFont,
          color: rgb(0.5, 0.5, 0.5),
        });
        y -= 15;
      }
    }
    
    const pages = pdfDoc.getPages();
    const currentDate = new Date().toLocaleDateString();
    const footerText = `Generated on: ${currentDate}`;
    const footerWidth = helveticaFont.widthOfTextAtSize(footerText, 10);
    
    for (const p of pages) {
      p.drawText(footerText, {
        x: p.getSize().width - margin - footerWidth,
        y: margin / 2,
        size: 10,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      p.drawText(`Page ${pages.indexOf(p) + 1} of ${pages.length}`, {
        x: margin,
        y: margin / 2,
        size: 10,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });
    }
    
    const pdfBytes = await pdfDoc.save();
    
    // Set proper headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${reportData.fieldName.replace(/\s+/g, '_')}_report.pdf`);
    res.send(Buffer.from(pdfBytes));
    
  } catch (error) {
    console.error('Error generating report:', error);
    console.error('Error details:', error.message, error.stack);
    
    // Return an HTML error page instead of JSON for better user experience
    res.status(500);
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <html>
        <head><title>Report Generation Error</title></head>
        <body>
          <h1>Error Generating Report</h1>
          <p>Sorry, we encountered an error while generating your field report.</p>
          <p>Error details: ${error.message}</p>
          <button onclick="window.close()">Close</button>
        </body>
      </html>
    `);
  }
}