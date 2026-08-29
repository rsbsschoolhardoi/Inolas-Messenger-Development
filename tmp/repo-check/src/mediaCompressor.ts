/**
 * MediaCompressor - Client-Side Intelligent Image & Media Compression Engine
 * Compresses images by up to 85% before cloud transmission and storage.
 */

export interface CompressionResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
  width: number;
  height: number;
  format: string;
}

export type CompressionQualityMode = 'hd' | 'standard' | 'data_saver';

export async function compressImage(
  dataUrlOrFile: string | File | Blob,
  mode: CompressionQualityMode = 'standard'
): Promise<CompressionResult> {
  return new Promise(async (resolve, reject) => {
    let sourceDataUrl = '';

    if (typeof dataUrlOrFile === 'string') {
      sourceDataUrl = dataUrlOrFile;
    } else {
      sourceDataUrl = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(dataUrlOrFile);
      });
    }

    const originalSize = sourceDataUrl.length;

    // Config based on quality mode
    let maxDimension = 1280;
    let quality = 0.78;
    let targetMime = 'image/jpeg';

    if (mode === 'hd') {
      maxDimension = 1920;
      quality = 0.85;
    } else if (mode === 'data_saver') {
      maxDimension = 854;
      quality = 0.60;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let { width, height } = img;

      // Scale down proportionally if larger than maxDimension
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
        resolve({
          dataUrl: sourceDataUrl,
          originalSize,
          compressedSize: originalSize,
          savedPercent: 0,
          width: img.width,
          height: img.height,
          format: 'original'
        });
        return;
      }

      // Smooth resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(img, 0, 0, width, height);

      let compressedDataUrl = '';
      try {
        // Try webp first if supported for even higher compression
        compressedDataUrl = canvas.toDataURL('image/webp', quality);
        if (!compressedDataUrl.startsWith('data:image/webp')) {
          compressedDataUrl = canvas.toDataURL(targetMime, quality);
        }
      } catch (e) {
        compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      const compressedSize = compressedDataUrl.length;
      const savedPercent = originalSize > 0 
        ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100)) 
        : 0;

      // If compression somehow produced a larger file, keep the smaller one
      if (compressedSize < originalSize) {
        resolve({
          dataUrl: compressedDataUrl,
          originalSize,
          compressedSize,
          savedPercent,
          width,
          height,
          format: compressedDataUrl.startsWith('data:image/webp') ? 'webp' : 'jpeg'
        });
      } else {
        resolve({
          dataUrl: sourceDataUrl,
          originalSize,
          compressedSize: originalSize,
          savedPercent: 0,
          width: img.width,
          height: img.height,
          format: 'original'
        });
      }
    };

    img.onerror = (err) => {
      resolve({
        dataUrl: sourceDataUrl,
        originalSize,
        compressedSize: originalSize,
        savedPercent: 0,
        width: 0,
        height: 0,
        format: 'fallback'
      });
    };

    img.src = sourceDataUrl;
  });
}
