import React, { useState } from 'react';
import { Move, ToggleLeft, ToggleRight, Edit3, Check, X } from 'lucide-react';

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

interface AutoLayoutProps {
  mediaFiles: MediaFile[];
  onReorder?: (files: MediaFile[]) => void;
}

const AutoLayout: React.FC<AutoLayoutProps> = ({ mediaFiles, onReorder }) => {
  const [autoPlace, setAutoPlace] = useState(true);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [editingAlt, setEditingAlt] = useState<string | null>(null);
  const [tempAltText, setTempAltText] = useState<string>('');

  // Generate captions based on file names or use existing captions
  const getCaption = (file: MediaFile): string => {
    // Use AI-generated caption if available, otherwise fallback to filename
    return file.caption || file.file.name.replace(/\.[^/.]+$/, "");
  };

  // Determine which section an image should be placed after based on caption keywords
  const getSectionPlacement = (caption: string): string => {
    const lowerCaption = caption.toLowerCase();
    
    if (lowerCaption.includes('intro') || lowerCaption.includes('background') || lowerCaption.includes('overview')) {
      return 'introduction';
    }
    if (lowerCaption.includes('method') || lowerCaption.includes('approach') || lowerCaption.includes('process')) {
      return 'methodology';
    }
    if (lowerCaption.includes('result') || lowerCaption.includes('data') || lowerCaption.includes('chart') || lowerCaption.includes('graph')) {
      return 'results';
    }
    
    // Default fallback
    return 'results';
  };

  const handleDragStart = (e: React.DragEvent, fileId: string) => {
    setDraggedItem(fileId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetId || !onReorder) return;
    
    const draggedIndex = mediaFiles.findIndex(f => f.id === draggedItem);
    const targetIndex = mediaFiles.findIndex(f => f.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const newFiles = [...mediaFiles];
    const [draggedFile] = newFiles.splice(draggedIndex, 1);
    newFiles.splice(targetIndex, 0, draggedFile);
    
    onReorder(newFiles);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, fileId: string, action: 'remove' | 'edit') => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (action === 'remove') {
        removeFile(fileId);
      } else if (action === 'edit') {
        startEditingAlt(fileId);
      }
    }
  };

  const removeFile = (fileId: string) => {
    if (!onReorder) return;
    const newFiles = mediaFiles.filter(f => f.id !== fileId);
    onReorder(newFiles);
  };

  const startEditingAlt = (fileId: string) => {
    const file = mediaFiles.find(f => f.id === fileId);
    if (file) {
      setEditingAlt(fileId);
      setTempAltText(file.alt || '');
    }
  };

  const saveAltText = (fileId: string) => {
    if (!onReorder) return;
    const newFiles = mediaFiles.map(f => 
      f.id === fileId ? { ...f, alt: tempAltText } : f
    );
    onReorder(newFiles);
    setEditingAlt(null);
    setTempAltText('');
  };

  const cancelEditingAlt = () => {
    setEditingAlt(null);
    setTempAltText('');
  };

  if (mediaFiles.length === 0) return null;

  return (
    <div id="gallery-container" className="mt-8 space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Project Media</h3>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600">Auto place images</span>
          <button
            onClick={() => setAutoPlace(!autoPlace)}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
          >
            {autoPlace ? (
              <ToggleRight className="h-5 w-5" />
            ) : (
              <ToggleLeft className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Auto-placement info */}
      {autoPlace && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Images are automatically placed after relevant sections based on their content. 
            Images will appear after Introduction, Methodology, or Results sections as appropriate.
          </p>
        </div>
      )}

      {/* Manual reordering info */}
      {!autoPlace && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-700 flex items-center space-x-2">
            <Move className="h-4 w-4" />
            <span>Drag and drop images to reorder them manually.</span>
          </p>
        </div>
      )}

      {/* Image Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mediaFiles.map((file) => {
          const caption = getCaption(file);
          const sectionPlacement = getSectionPlacement(caption);
          
          return (
            <figure
              key={file.id}
              className={`group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500 ${
                !autoPlace ? 'cursor-move' : ''
              } ${draggedItem === file.id ? 'opacity-50 scale-95' : ''}`}
              draggable={!autoPlace}
              onDragStart={(e) => handleDragStart(e, file.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, file.id)}
              onDragEnd={handleDragEnd}
            >
              {/* Image */}
              <div className="relative overflow-hidden">
                <img
                  src={file.src}
                  alt={file.alt || `Image: ${caption}`}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                  style={{ aspectRatio: file.aspectRatio }}
                />
                
                {/* Remove button */}
                <button
                  onClick={() => removeFile(file.id)}
                  onKeyDown={(e) => handleKeyDown(e, file.id, 'remove')}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label={`Remove image: ${caption}`}
                  tabIndex={0}
                >
                  <X className="h-4 w-4" />
                </button>
                
                {/* Drag handle for manual mode */}
                {!autoPlace && (
                  <div 
                    className="absolute top-2 left-2 w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                    tabIndex={0}
                    role="button"
                    aria-label={`Drag to reorder image: ${caption}`}
                  >
                    <Move className="h-3 w-3 text-gray-600" />
                  </div>
                )}
                
                {/* Auto-placement indicator */}
                {autoPlace && (
                  <div className="absolute top-2 left-2 px-3 py-1 bg-black bg-opacity-70 text-white text-xs rounded-full">
                    {sectionPlacement}
                  </div>
                )}
              </div>
              
              {/* Caption */}
              <figcaption className="p-4">
                <p className="text-sm font-medium text-gray-800 mb-2" title={caption}>
                  {caption}
                </p>
                
                {/* Alt text editing */}
                <div className="mb-2">
                  {editingAlt === file.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={tempAltText}
                        onChange={(e) => setTempAltText(e.target.value)}
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 resize-none"
                        rows={2}
                        placeholder="Enter descriptive alt text..."
                        autoFocus
                      />
                      <div className="flex space-x-1">
                        <button
                          onClick={() => saveAltText(file.id)}
                          className="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <Check className="h-3 w-3" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={cancelEditingAlt}
                          className="flex items-center space-x-1 px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                          <X className="h-3 w-3" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <p className="text-xs text-gray-500 flex-1 mr-2" title={file.alt}>
                        Alt: {file.alt || 'No alt text'}
                      </p>
                      <button
                        onClick={() => startEditingAlt(file.id)}
                        onKeyDown={(e) => handleKeyDown(e, file.id, 'edit')}
                        className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                        aria-label={`Edit alt text for: ${caption}`}
                        tabIndex={0}
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                  <span>{file.width}×{file.height}</span>
                  <span>{(file.file.size / 1024).toFixed(1)} KB</span>
                </div>
              </figcaption>
            </figure>
          );
        })}
      </div>

      {/* Gallery Stats */}
      <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
        <p>
          {mediaFiles.length} image{mediaFiles.length !== 1 ? 's' : ''} uploaded
          {mediaFiles.length > 0 && (
            <span className="ml-2 text-xs">
              (Use Tab to navigate, Enter/Space to interact)
            </span>
          )}
        </p>
        {autoPlace && (
          <p className="mt-1">
            Images will be distributed across sections: Introduction, Methodology, and Results
          </p>
        )}
      </div>
    </div>
  );
};

export default AutoLayout;