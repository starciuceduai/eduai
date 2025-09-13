import { createClient } from '@supabase/supabase-js';
import { validateImageFile, processImage, moderateImage } from './imageUtils';

interface MediaFile {
  id: string;
  src: string;
  width: number;
  height: number;
  aspectRatio: number;
  caption?: string;
  alt?: string;
  file: File;
  uploadProgress?: number;
  isUploading?: boolean;
  cloudUrl?: string;
}

interface UploadProgress {
  fileId: string;
  progress: number;
  isUploading: boolean;
}

// Initialize Supabase client if environment variables are available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Check if cloud storage is available
export const isCloudStorageAvailable = (): boolean => {
  return !!supabase;
};

// Generate a unique project ID
export const generateProjectId = (): string => {
  return Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
};

// Generate a mock user ID (in real app, this would come from auth)
export const getCurrentUserId = (): string => {
  // In a real app, this would come from authentication context
  return 'user_' + Math.random().toString(36).substr(2, 9);
};

// Upload file to Supabase storage
export const uploadFileToCloud = async (
  file: File,
  userId: string,
  projectId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  if (!supabase) {
    throw new Error('Cloud storage not available');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
  const filePath = `projects/${userId}/${projectId}/${fileName}`;

  try {
    // Simulate upload progress since Supabase doesn't provide native progress
    const progressInterval = setInterval(() => {
      if (onProgress) {
        const currentProgress = Math.min(90, Math.random() * 80 + 10);
        onProgress(currentProgress);
      }
    }, 200);

    const { data, error } = await supabase.storage
      .from('project-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    clearInterval(progressInterval);

    if (error) {
      throw error;
    }

    if (onProgress) {
      onProgress(100);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('project-media')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Upload failed:', error);
    throw new Error(`Failed to upload ${file.name}: ${error.message}`);
  }
};

// Process and upload multiple files
export const processAndUploadFiles = async (
  files: FileList,
  userId: string,
  projectId: string,
  existingFiles: MediaFile[],
  onProgress?: (fileId: string, progress: number, isUploading: boolean) => void,
  onComplete?: (newFiles: MediaFile[]) => void,
  onError?: (error: string) => void
): Promise<void> => {
  const maxFiles = 12;

  // Check total file limit
  if (existingFiles.length + files.length > maxFiles) {
    onError?.(`Maximum ${maxFiles} files allowed. You can add ${maxFiles - existingFiles.length} more files.`);
    return;
  }

  const newFiles: MediaFile[] = [];
  const errors: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileId = Date.now().toString() + i;

    // Validate file using utility function
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      errors.push(validation.error!);
      continue;
    }

    try {
      // Process image (compress, strip EXIF)
      onProgress?.(fileId, 10, true);
      const processedImage = await processImage(file);
      
      // Optional moderation check
      onProgress?.(fileId, 20, true);
      const moderationResult = await moderateImage(processedImage.file);
      
      if (!moderationResult.approved) {
        errors.push(`${file.name}: ${moderationResult.reason || 'Content not approved'}`);
        continue;
      }
      
      // Create initial media file object
      const mediaFile: MediaFile = {
        id: fileId,
        src: '', // Will be set after upload or fallback
        width: processedImage.width,
        height: processedImage.height,
        aspectRatio: processedImage.aspectRatio,
        file: processedImage.file,
        uploadProgress: 0,
        isUploading: true
      };

      newFiles.push(mediaFile);

      // Try cloud upload first, fallback to local
      if (isCloudStorageAvailable()) {
        try {
          onProgress?.(fileId, 30, true);
          
          const cloudUrl = await uploadFileToCloud(
            processedImage.file,
            userId,
            projectId,
            (progress) => onProgress?.(fileId, Math.max(30, progress), true)
          );

          // Update with cloud URL
          mediaFile.src = cloudUrl;
          mediaFile.cloudUrl = cloudUrl;
          mediaFile.isUploading = false;
          mediaFile.uploadProgress = 100;
          
          onProgress?.(fileId, 100, false);
        } catch (uploadError) {
          console.warn(`Cloud upload failed for ${file.name}, falling back to local storage:`, uploadError);
          
          // Fallback to local storage
          mediaFile.src = URL.createObjectURL(processedImage.file);
          mediaFile.isUploading = false;
          mediaFile.uploadProgress = 100;
          
          onProgress?.(fileId, 100, false);
        }
      } else {
        // Use local storage directly
        mediaFile.src = URL.createObjectURL(processedImage.file);
        mediaFile.isUploading = false;
        mediaFile.uploadProgress = 100;
        
        // Simulate upload progress for consistency
        let progress = 30;
        const progressInterval = setInterval(() => {
          progress += 20;
          onProgress?.(fileId, progress, progress < 100);
          
          if (progress >= 100) {
            clearInterval(progressInterval);
          }
        }, 100);
      }

    } catch (error) {
      errors.push(`${file.name}: Failed to process image`);
      console.error(`Failed to process ${file.name}:`, error);
    }
  }

  // Report errors
  if (errors.length > 0) {
    onError?.(errors.join('\n'));
  }

  // Return new files
  if (newFiles.length > 0) {
    onComplete?.(newFiles);
  }
};

// Clean up object URLs (for local storage)
export const cleanupObjectUrls = (mediaFiles: MediaFile[]): void => {
  mediaFiles.forEach(file => {
    if (file.src.startsWith('blob:') && !file.cloudUrl) {
      URL.revokeObjectURL(file.src);
    }
  });
};

// Delete file from cloud storage
export const deleteFileFromCloud = async (cloudUrl: string): Promise<void> => {
  if (!supabase || !cloudUrl) return;

  try {
    // Extract file path from URL
    const url = new URL(cloudUrl);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(-4).join('/'); // projects/userId/projectId/filename

    await supabase.storage
      .from('project-media')
      .remove([filePath]);
  } catch (error) {
    console.error('Failed to delete file from cloud:', error);
  }
};