/**
 * Image optimization & compression utility for Prescription Camera & OCR
 * 
 * Solves:
 * 1. 10MB+ raw phone camera photos exceeding localStorage 5MB quota (QuotaExceededError)
 * 2. Sluggish / crashing OCR on massive 12MP images in mobile browser WebAssembly
 * 3. Keeps text ultra-sharp with balanced contrast for Tesseract OCR
 */
export async function optimizePrescriptionImage(
  fileOrDataUrl: File | Blob | string,
  maxDimension: number = 1600
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio while bounding to maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : img.src);
          return;
        }

        // Draw with white background to prevent transparent artifacts
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Gentle contrast & brightness normalization for optimal OCR reading
        ctx.filter = 'contrast(1.05) brightness(1.02)';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to high-efficiency JPEG (approx 150KB - 300KB instead of 10MB)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.84);
        resolve(compressedDataUrl);
      } catch (err) {
        console.warn('Image optimization canvas error:', err);
        resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : img.src);
      }
    };

    img.onerror = () => {
      resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          img.src = reader.result;
        } else {
          resolve('');
        }
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
