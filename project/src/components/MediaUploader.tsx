import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import AutoLayout from './AutoLayout';
import { 
  processAndUploadFiles, 
  isCloudStorageAvailable, 
  generateProjectId, 
  getCurrentUserId,
  cleanupObjectUrls 
} from '../utils/storageUtils';

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

interface MediaUploaderProps {
  mediaFiles: MediaFile[];
  onMediaFilesChange: (files: MediaFile[]) => void;
  disabled?: boolean;
  projectContext?: {
    projectIdea: string;
    subject: string;
    steps: string;
  };
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ 
  mediaFiles, 
  onMediaFilesChange, 
  disabled = false,
  projectContext 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [projectId] = useState(() => generateProjectId());
  const [userId] = useState(() => getCurrentUserId());

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URLs on component unmount
  useEffect(() => {
    return () => {
      if (mediaFiles.length > 0) {
        cleanupObjectUrls(mediaFiles);
      }
    };
  }, [mediaFiles]);

  // Generate image metadata using project context
  const generateImageMeta = async (filename: string, projectContext: any) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const projectTitle = projectContext?.projectIdea || 'Academic Project';
    const subject = projectContext?.subject || 'Research';
    
    const cleanFilename = filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
    const words = cleanFilename.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
    
    const caption = `${words.join(' ')} in ${subject} Research`;
    const alt = `Visual representation of ${cleanFilename.toLowerCase()} related to ${projectTitle.toLowerCase()} research in ${subject.toLowerCase()}`;
    
    return {
      caption: caption.length > 60 ? words.slice(0, 3).join(' ') + ` Research Visual` : caption,
      alt: alt
    };
  };

  const processFiles = async (files: FileList) => {
    if (disabled) return;

    const maxFiles = 12;
    if (mediaFiles.length + files.length > maxFiles) {
      setErrors([`Maximum ${maxFiles} files allowed. You can add ${maxFiles - mediaFiles.length} more files.`]);
      setTimeout(() => setErrors([]), 5000);
      return;
    }

    const newFiles: MediaFile[] = [];
    const uploadErrors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = Date.now().toString() + i;

      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(file.type)) {
        uploadErrors.push(`${file.name}: Unsupported file type. Only JPG, PNG, and WebP are allowed.`);
        continue;
      }

      if (file.size > maxSize) {
        uploadErrors.push(`${file.name}: File too large. Maximum size is 10MB.`);
        continue;
      }

      try {
        // Create image element to get dimensions
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = URL.createObjectURL(file);
        });

        const width = img.width;
        const height = img.height;
        const aspectRatio = width / height;

        // Generate metadata
        const metadata = await generateImageMeta(file.name, projectContext);

        // Create media file object
        const mediaFile: MediaFile = {
          id: fileId,
          src: URL.createObjectURL(file),
          width,
          height,
          aspectRatio,
          caption: metadata.caption,
          alt: metadata.alt,
          file,
          uploadProgress: 100,
          isUploading: false
        };

        // Try cloud upload if available
        if (isCloudStorageAvailable()) {
          try {
            // This would be implemented with actual cloud upload
            // For now, we'll use local storage
            mediaFile.cloudUrl = mediaFile.src;
          } catch (error) {
            console.warn(`Cloud upload failed for ${file.name}, using local storage`);
          }
        }

        newFiles.push(mediaFile);

      } catch (error) {
        uploadErrors.push(`${file.name}: Failed to process image`);
        console.error(`Failed to process ${file.name}:`, error);
      }
    }

    // Update media files
    if (newFiles.length > 0) {
      onMediaFilesChange([...mediaFiles, ...newFiles]);
    }

    // Show errors if any
    if (uploadErrors.length > 0) {
      setErrors(uploadErrors);
      setTimeout(() => setErrors([]), 5000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleBrowseClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const removeFile = (fileId: string) => {
    if (disabled) return;
    const newFiles = mediaFiles.filter(f => f.id !== fileId);
    onMediaFilesChange(newFiles);
  };

  return (
    <div className="space-y-6">
      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Section Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Media</h3>
        <p className="text-sm text-gray-600">Upload images, charts, or diagrams to enhance your project</p>
      </div>

      {/* Drag & Drop Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
          disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 cursor-pointer'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!disabled ? handleBrowseClick : undefined}
      >
        <div className="flex flex-col items-center space-y-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            disabled
              ? 'bg-gray-200'
              : isDragOver 
              ? 'bg-blue-100' 
              : 'bg-gray-100'
          }`}>
            <Upload className={`h-6 w-6 ${
              disabled
                ? 'text-gray-400'
                : isDragOver 
                ? 'text-blue-600' 
                : 'text-gray-400'
            }`} />
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-3">
              {disabled 
                ? 'Upload disabled during generation'
                : 'Drag & drop your images here or click to browse'
              }
            </p>
            {!disabled && (
              <button
                type="button"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Browse
              </button>
            )}
          </div>
          
          <div className="text-xs text-gray-500 space-y-1">
            <p>Supported: JPG, PNG, WebP · Max 10MB/file · Up to 12 files</p>
            <p>Files: {mediaFiles.length}/12</p>
            {isCloudStorageAvailable() && (
              <p className="text-green-600">✓ Cloud storage enabled</p>
            )}
            {!isCloudStorageAvailable() && (
              <p className="text-amber-600">⚠ Local storage only</p>
            )}
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Media Files Display */}
      {mediaFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Uploaded Images ({mediaFiles.length})</h4>
            {!disabled && (
              <button
                onClick={() => onMediaFilesChange([])}
                className="text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {mediaFiles.map((file) => (
              <div key={file.id} className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden">
                <img
                  src={file.src}
                  alt={file.alt || file.caption || file.file.name}
                  className="w-full h-32 object-cover"
                />
                
                {!disabled && (
                  <button
                    onClick={() => removeFile(file.id)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    aria-label={`Remove ${file.file.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                
                <div className="p-3">
                  <p className="text-xs font-medium text-gray-800 truncate" title={file.caption}>
                    {file.caption || file.file.name}
                  </p>
                  <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                    <span>{file.width}×{file.height}</span>
                    <span>{(file.file.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUploader;