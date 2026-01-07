
/**
 * Local utility to generate a tiled passport photo sheet without AI intervention.
 */

interface PassportSheetParams {
  mainImage: string;
  additionalImages: { base64: string; mimeType: string }[];
  quantity: number | 'max';
  paperSize: string;
  dimensions: string;
}

const DPI = 300; // Standard print resolution

const PAPER_DIMENSIONS: Record<string, { w: number; h: number }> = {
  '4x6': { w: 4 * DPI, h: 6 * DPI },
  '5x7': { w: 5 * DPI, h: 7 * DPI },
  'A4': { w: 8.27 * DPI, h: 11.69 * DPI },
  'Letter': { w: 8.5 * DPI, h: 11 * DPI },
};

const PHOTO_DIMENSIONS: Record<string, { w: number; h: number }> = {
  '35mm x 45mm': { w: (35 / 25.4) * DPI, h: (45 / 25.4) * DPI },
  '2 x 2 inches': { w: 2 * DPI, h: 2 * DPI },
  '50mm x 70mm': { w: (50 / 25.4) * DPI, h: (70 / 25.4) * DPI },
  '33mm x 48mm': { w: (33 / 25.4) * DPI, h: (48 / 25.4) * DPI },
};

/**
 * Calculates the maximum number of photos that can fit on a sheet.
 */
export function calculateMaxCapacity(paperSize: string, dimensions: string): number {
  const paper = PAPER_DIMENSIONS[paperSize] || PAPER_DIMENSIONS['4x6'];
  const photo = PHOTO_DIMENSIONS[dimensions] || PHOTO_DIMENSIONS['35mm x 45mm'];
  const padding = 0.1 * DPI;

  const cols = Math.floor((paper.w - padding) / (photo.w + padding));
  const rows = Math.floor((paper.h - padding) / (photo.h + padding));
  
  return Math.max(0, cols * rows);
}

export async function generateLocalPassportSheet({
  mainImage,
  additionalImages,
  quantity,
  paperSize,
  dimensions
}: PassportSheetParams): Promise<string> {
  const paper = PAPER_DIMENSIONS[paperSize] || PAPER_DIMENSIONS['4x6'];
  const photo = PHOTO_DIMENSIONS[dimensions] || PHOTO_DIMENSIONS['35mm x 45mm'];

  const canvas = document.createElement('canvas');
  canvas.width = paper.w;
  canvas.height = paper.h;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error("Could not create canvas context");

  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Load all images
  const imageElements: HTMLImageElement[] = await Promise.all([
    loadImage(mainImage),
    ...additionalImages.map(img => loadImage(`data:${img.mimeType};base64,${img.base64}`))
  ]);

  const totalSubjects = imageElements.length;
  const padding = 0.15 * DPI; // Increased padding slightly for easier cutting
  
  // Calculate Grid
  const cols = Math.floor((paper.w - padding) / (photo.w + padding));
  const rows = Math.floor((paper.h - padding) / (photo.h + padding));
  const maxCapacity = cols * rows;
  
  const actualQuantity = quantity === 'max' ? maxCapacity : Math.min(quantity, maxCapacity);

  // Centering Logic
  const activeCols = Math.min(actualQuantity, cols);
  const activeRows = Math.ceil(actualQuantity / activeCols);
  
  const gridWidth = activeCols * photo.w + (activeCols - 1) * padding;
  const gridHeight = activeRows * photo.h + (activeRows - 1) * padding;
  
  const startX = (paper.w - gridWidth) / 2;
  const startY = (paper.h - gridHeight) / 2;

  let drawnCount = 0;
  for (let r = 0; r < rows && drawnCount < actualQuantity; r++) {
    for (let c = 0; c < cols && drawnCount < actualQuantity; c++) {
      const img = imageElements[drawnCount % totalSubjects];
      
      const currentX = startX + c * (photo.w + padding);
      const currentY = startY + r * (photo.h + padding);

      // Draw image centered in the photo slot (Cover mode)
      const scale = Math.max(photo.w / img.width, photo.h / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const offsetX = (photo.w - drawW) / 2;
      const offsetY = (photo.h - drawH) / 2;

      ctx.save();
      ctx.beginPath();
      ctx.rect(currentX, currentY, photo.w, photo.h);
      ctx.clip();
      ctx.drawImage(img, currentX + offsetX, currentY + offsetY, drawW, drawH);
      
      // Cut lines (very faint)
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.strokeRect(currentX, currentY, photo.w, photo.h);
      ctx.restore();

      drawnCount++;
    }
  }

  return canvas.toDataURL('image/jpeg', 0.95);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
