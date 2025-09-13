// Image processing utilities for compression, EXIF stripping, and validation

interface ProcessedImage {
  file: File;
  width: number;
  height: number;
  aspectRatio: number;
}

// Allowed MIME types for security
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp'
];

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Maximum width for compression
const MAX_WIDTH = 2000;

// Validate file before processing
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File "${file.name}" is too large. Maximum size is 10MB.`
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `File "${file.name}" has unsupported format. Only JPG, PNG, and WebP are allowed.`
    };
  }

  // Additional suspicious file checks
  const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.com', '.pif'];
  const fileName = file.name.toLowerCase();
  
  if (suspiciousExtensions.some(ext => fileName.includes(ext))) {
    return {
      isValid: false,
      error: `File "${file.name}" appears to be suspicious and cannot be uploaded.`
    };
  }

  return { isValid: true };
};

// Strip EXIF data and compress image
export const processImage = async (file: File): Promise<ProcessedImage> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Get original dimensions
        const originalWidth = img.width;
        const originalHeight = img.height;
        const aspectRatio = originalWidth / originalHeight;

        // Calculate new dimensions (compress if needed)
        let newWidth = originalWidth;
        let newHeight = originalHeight;

        if (originalWidth > MAX_WIDTH) {
          newWidth = MAX_WIDTH;
          newHeight = Math.round(MAX_WIDTH / aspectRatio);
        }

        // Set canvas dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw image (this strips EXIF data automatically)
        ctx?.drawImage(img, 0, 0, newWidth, newHeight);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to process image'));
              return;
            }

            // Create new file with processed data
            const processedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });

            resolve({
              file: processedFile,
              width: newWidth,
              height: newHeight,
              aspectRatio: newWidth / newHeight
            });
          },
          file.type,
          0.9 // Quality for JPEG compression
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${file.name}`));
    };

    // Load image
    img.src = URL.createObjectURL(file);
  });
};

// Optional moderation check (placeholder for API integration)
export const moderateImage = async (file: File): Promise<{ approved: boolean; reason?: string }> => {
  // TODO: Replace with actual moderation API call
  // Example: const response = await fetch('/api/moderate-image', { method: 'POST', body: formData });
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock moderation - in real implementation, this would call a service like:
  // - AWS Rekognition
  // - Google Cloud Vision API
  // - Microsoft Azure Content Moderator
  // - OpenAI Moderation API
  
  // For now, just approve all images (replace with real logic)
  return { approved: true };
};

// Get image dimensions without loading full image
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};