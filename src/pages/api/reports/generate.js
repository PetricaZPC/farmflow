import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get data from query param or request body
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
    
    // Change from const to let so it can be reassigned
    let page = pdfDoc.addPage([612, 792]); 
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
    
    y -= 50;
    
    // Field name
    page.drawText(`Field: ${reportData.fieldName || "Unnamed Field"}`, {
      x: margin,
      y,
      size: headingSize,
      font: boldFont,
    });
    
    y -= 30;
    
    // Area
    page.drawText(`Area: ${reportData.area || 0} hectares`, {
      x: margin,
      y,
      size: fontSize,
      font: helveticaFont,
    });
    
    y -= 25;
    
    // Planting date
    page.drawText(`Planting Date: ${reportData.plantingDate || "Not specified"}`, {
      x: margin,
      y,
      size: fontSize,
      font: helveticaFont,
    });
    
    y -= 45;
    
    // SWITCH ORDER: Field coordinates first, before recommendations
    if (reportData.coordinates && reportData.coordinates.length > 0) {
      page.drawText('Field Coordinates:', {
        x: margin,
        y,
        size: headingSize,
        font: boldFont,
      });
      
      y -= 30;
      
      const maxCoords = 5;
      let coordsShown = 0;
      
      if (reportData.coordinates[0] && reportData.coordinates[0].length > 0) {
        for (let i = 0; i < Math.min(maxCoords, reportData.coordinates[0].length); i++) {
          // Check remaining space
          if (y < margin + 50) {
            // Not enough space, start a new page
            page = pdfDoc.addPage([612, 792]);
            y = page.getSize().height - margin;
          }
          
          const coord = reportData.coordinates[0][i];
          if (Array.isArray(coord) && coord.length >= 2) {
            const coordText = `Point ${i+1}: Lat ${coord[1].toFixed(6)}, Long ${coord[0].toFixed(6)}`;
            page.drawText(coordText, {
              x: margin,
              y,
              size: fontSize,
              font: helveticaFont,
            });
            
            y -= 20; // More space between coordinate lines
            coordsShown++;
          }
        }
        
        if (reportData.coordinates[0].length > maxCoords) {
          if (y < margin + 30) {
            page = pdfDoc.addPage([612, 792]);
            y = page.getSize().height - margin;
          }
          
          page.drawText(`... and ${reportData.coordinates[0].length - maxCoords} more points`, {
            x: margin,
            y,
            size: fontSize,
            font: helveticaFont,
            color: rgb(0.5, 0.5, 0.5),
          });
          y -= 30; // More space after the "more points" text
        }
      }
    }
    
    // Always start recommendations on a new page
    page = pdfDoc.addPage([612, 792]);
    y = page.getSize().height - margin;
    
    page.drawText('Recommendations:', {
      x: margin,
      y,
      size: headingSize,
      font: boldFont,
    });
    
    y -= 30;
    
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
        if (currentY < margin + 30) {
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
    
    // Weather data, if available (still at the end)
    if (reportData.weatherData && Object.keys(reportData.weatherData).length > 0) {
      y -= 40;
      
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
      
      y -= 30;
      
      Object.entries(reportData.weatherData).forEach(([key, value]) => {
        if (y < margin + 20) {
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
        
        y -= 20;
      });
    }
    
    // Add page numbers and footer
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
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${reportData.fieldName.replace(/\s+/g, '_')}_report.pdf`);
    res.send(Buffer.from(pdfBytes));
    
  } catch (error) {
    console.error('Error generating report:', error);
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