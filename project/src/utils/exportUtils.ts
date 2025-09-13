import jsPDF from 'jspdf';
import PptxGenJS from 'pptxgenjs';
import { toPng } from 'html-to-image';

interface MediaFile {
  id: string;
  src: string;
  width: number;
  height: number;
  aspectRatio: number;
  caption?: string;
  alt?: string;
  file: File;
}

interface ProjectData {
  title: string;
  abstract: string;
  sections: Array<{
    title: string;
    content: string;
  }>;
  citations: string[];
}

// Convert image file to base64 data URL
const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Get image dimensions that fit within constraints while maintaining aspect ratio
const getScaledDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
) => {
  const aspectRatio = originalWidth / originalHeight;
  
  let width = originalWidth;
  let height = originalHeight;
  
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }
  
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  
  return { width, height };
};

export const exportToPDF = async (projectData: ProjectData, mediaFiles: MediaFile[]) => {
  try {
    // TODO: Replace with actual LLM API call for generating PDF content
    // Example: const response = await fetch('/api/generate-pdf-content', { method: 'POST', body: JSON.stringify({ projectData, mediaFiles }) });
    
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;
    
    // Add title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(projectData.title, margin, yPosition);
    yPosition += 15;
    
    // Add abstract
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const abstractLines = pdf.splitTextToSize(projectData.abstract, contentWidth);
    pdf.text(abstractLines, margin, yPosition);
    yPosition += abstractLines.length * 5 + 10;
    
    // Add sections
    for (const section of projectData.sections) {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
      }
      
      // Section title
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(section.title, margin, yPosition);
      yPosition += 10;
      
      // Section content
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const contentLines = pdf.splitTextToSize(section.content, contentWidth);
      pdf.text(contentLines, margin, yPosition);
      yPosition += contentLines.length * 4 + 10;
    }
    
    // Add Figures section if there are images
    if (mediaFiles.length > 0) {
      pdf.addPage();
      yPosition = margin;
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Figures', margin, yPosition);
      yPosition += 20;
      
      // Add each image
      for (let i = 0; i < mediaFiles.length; i++) {
        const mediaFile = mediaFiles[i];
        
        try {
          const imageDataURL = await fileToDataURL(mediaFile.file);
          
          // Calculate scaled dimensions to fit page width
          const maxImageWidth = contentWidth;
          const maxImageHeight = pageHeight - yPosition - 60; // Leave space for caption
          
          const { width: scaledWidth, height: scaledHeight } = getScaledDimensions(
            mediaFile.width,
            mediaFile.height,
            maxImageWidth,
            maxImageHeight
          );
          
          // Check if image fits on current page
          if (yPosition + scaledHeight + 30 > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          
          // Add image
          const xPosition = margin + (contentWidth - scaledWidth) / 2; // Center image
          pdf.addImage(imageDataURL, 'JPEG', xPosition, yPosition, scaledWidth, scaledHeight);
          yPosition += scaledHeight + 5;
          
          // Add caption
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'italic');
          const caption = `Figure ${i + 1}: ${mediaFile.caption || mediaFile.file.name}`;
          const captionLines = pdf.splitTextToSize(caption, contentWidth);
          pdf.text(captionLines, margin, yPosition);
          yPosition += captionLines.length * 4 + 15;
          
        } catch (error) {
          console.error(`Failed to add image ${mediaFile.file.name} to PDF:`, error);
        }
      }
    }
    
    // Add citations
    if (projectData.citations.length > 0) {
      pdf.addPage();
      yPosition = margin;
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('References', margin, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      projectData.citations.forEach((citation, index) => {
        const citationText = `${index + 1}. ${citation}`;
        const citationLines = pdf.splitTextToSize(citationText, contentWidth);
        pdf.text(citationLines, margin, yPosition);
        yPosition += citationLines.length * 4 + 5;
      });
    }
    
    // Save the PDF
    pdf.save(`${projectData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
    
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('Failed to export PDF. Please try again.');
  }
};

export const exportToPPTX = async (projectData: ProjectData, mediaFiles: MediaFile[]) => {
  try {
    // TODO: Replace with actual LLM API call for generating PPTX content
    // Example: const response = await fetch('/api/generate-pptx-content', { method: 'POST', body: JSON.stringify({ projectData, mediaFiles }) });
    
    const pptx = new PptxGenJS();
    
    // Title slide
    const titleSlide = pptx.addSlide();
    titleSlide.addText(projectData.title, {
      x: 0.5,
      y: 2,
      w: 9,
      h: 1.5,
      fontSize: 32,
      bold: true,
      align: 'center'
    });
    
    titleSlide.addText(projectData.abstract, {
      x: 1,
      y: 4,
      w: 8,
      h: 3,
      fontSize: 16,
      align: 'center'
    });
    
    // Content slides for each section
    projectData.sections.forEach((section) => {
      const slide = pptx.addSlide();
      
      slide.addText(section.title, {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 1,
        fontSize: 24,
        bold: true
      });
      
      slide.addText(section.content, {
        x: 0.5,
        y: 1.8,
        w: 9,
        h: 5,
        fontSize: 14,
        valign: 'top'
      });
    });
    
    // Visual slides with images
    if (mediaFiles.length > 0) {
      const imagesPerSlide = 6;
      const totalSlides = Math.ceil(mediaFiles.length / imagesPerSlide);
      
      for (let slideIndex = 0; slideIndex < totalSlides; slideIndex++) {
        const visualSlide = pptx.addSlide();
        
        // Add slide title
        const slideTitle = slideIndex === 0 ? 'Visuals' : `Visuals (${slideIndex + 1})`;
        visualSlide.addText(slideTitle, {
          x: 0.5,
          y: 0.3,
          w: 9,
          h: 0.8,
          fontSize: 24,
          bold: true,
          align: 'center'
        });
        
        // Calculate grid positions (3x2 grid)
        const startIndex = slideIndex * imagesPerSlide;
        const endIndex = Math.min(startIndex + imagesPerSlide, mediaFiles.length);
        const slideImages = mediaFiles.slice(startIndex, endIndex);
        
        const gridCols = 3;
        const gridRows = 2;
        const imageWidth = 2.8;
        const imageHeight = 2.1;
        const startX = 0.8;
        const startY = 1.5;
        const gapX = 3.2;
        const gapY = 2.8;
        
        for (let i = 0; i < slideImages.length; i++) {
          const mediaFile = slideImages[i];
          const row = Math.floor(i / gridCols);
          const col = i % gridCols;
          
          const x = startX + (col * gapX);
          const y = startY + (row * gapY);
          
          try {
            const imageDataURL = await fileToDataURL(mediaFile.file);
            
            // Add image
            visualSlide.addImage({
              data: imageDataURL,
              x: x,
              y: y,
              w: imageWidth,
              h: imageHeight,
              sizing: { type: 'contain', w: imageWidth, h: imageHeight }
            });
            
            // Add caption below image
            visualSlide.addText(mediaFile.caption || mediaFile.file.name, {
              x: x,
              y: y + imageHeight + 0.1,
              w: imageWidth,
              h: 0.4,
              fontSize: 10,
              align: 'center',
              italic: true
            });
            
          } catch (error) {
            console.error(`Failed to add image ${mediaFile.file.name} to PPTX:`, error);
            
            // Add placeholder text if image fails
            visualSlide.addText(`[Image: ${mediaFile.file.name}]`, {
              x: x,
              y: y,
              w: imageWidth,
              h: imageHeight,
              fontSize: 12,
              align: 'center',
              valign: 'middle',
              color: '666666'
            });
          }
        }
      }
    }
    
    // References slide
    if (projectData.citations.length > 0) {
      const referencesSlide = pptx.addSlide();
      
      referencesSlide.addText('References', {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 1,
        fontSize: 24,
        bold: true
      });
      
      const citationsText = projectData.citations
        .map((citation, index) => `${index + 1}. ${citation}`)
        .join('\n\n');
      
      referencesSlide.addText(citationsText, {
        x: 0.5,
        y: 1.8,
        w: 9,
        h: 5,
        fontSize: 12,
        valign: 'top'
      });
    }
    
    // Save the PPTX
    await pptx.writeFile({ fileName: `${projectData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pptx` });
    
  } catch (error) {
    console.error('PPTX export failed:', error);
    throw new Error('Failed to export PPTX. Please try again.');
  }
};

export const exportToPNG = async (galleryElementId: string, filename: string) => {
  try {
    // TODO: Replace with actual LLM API call for optimizing PNG export
    // Example: const response = await fetch('/api/optimize-png-export', { method: 'POST', body: JSON.stringify({ galleryElementId }) });
    
    const galleryElement = document.getElementById(galleryElementId);
    
    if (!galleryElement) {
      throw new Error('Gallery element not found');
    }
    
    // Export with 2x scale for clarity
    const dataUrl = await toPng(galleryElement, {
      quality: 1.0,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left'
      }
    });
    
    // Create download link
    const link = document.createElement('a');
    link.download = `${filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_gallery.png`;
    link.href = dataUrl;
    link.click();
    
  } catch (error) {
    console.error('PNG export failed:', error);
    throw new Error('Failed to export PNG. Please try again.');
  }
};