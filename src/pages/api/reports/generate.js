import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data } = req.query;
    
    if (!data) {
      return res.status(400).json({ error: 'Missing data parameter' });
    }
    
    const reportData = JSON.parse(data);
    
    
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
    
    
    let y = height - 50;
    
    
    page.drawText('FarmFlow Field Report', {
      x: margin,
      y,
      size: titleSize,
      font: boldFont,
      color: rgb(0.1, 0.4, 0.1),
    });
    
    y -= 40;
    
    
    page.drawText(`Field: ${reportData.fieldName || "Unnamed Field"}`, {
      x: margin,
      y,
      size: headingSize,
      font: boldFont,
    });
    
    y -= 25;
    
    
    page.drawText(`Area: ${reportData.area || 0} hectares`, {
      x: margin,
      y,
      size: fontSize,
      font: helveticaFont,
    });
    
    y -= 20;
    
    
    page.drawText(`Planting Date: ${reportData.plantingDate || "Not specified"}`, {
      x: margin,
      y,
      size: fontSize,
      font: helveticaFont,
    });
    
    y -= 40;
    
    
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
      
        if (line === '') {
          currentY -= fontSize;
          continue;
        }
        
        
        if (currentY < margin) {
          currentPage = pdfDoc.addPage([612, 792]);
          currentY = currentPage.getSize().height - margin;
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
      
      
      if (y < 100) {
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
    
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${reportData.fieldName.replace(/\s+/g, '_')}_report.pdf`);
    res.send(Buffer.from(pdfBytes));
    
  } catch (error) {
    console.error('Error generating report:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to generate report' });
  }
}