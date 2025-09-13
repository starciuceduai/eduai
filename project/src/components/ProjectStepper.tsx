import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Upload, FileText, Sparkles } from 'lucide-react';
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

interface ProjectStepperProps {
  onGenerate?: (formData: any, mediaFiles: MediaFile[]) => void;
  isGenerating?: boolean;
}

const ProjectStepper: React.FC<ProjectStepperProps> = ({ 
  onGenerate, 
  isGenerating = false 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    projectIdea: '',
    subject: '',
    steps: ''
  });
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [projectId] = useState(() => generateProjectId());
  const [userId] = useState(() => getCurrentUserId());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stepperRef = useRef<HTMLDivElement>(null);

  const steps = [
    { number: 1, label: 'Idea', icon: FileText },
    { number: 2, label: 'Media', icon: Upload },
    { number: 3, label: 'Generate', icon: Sparkles }
  ];

  // Generate image metadata using project context
  const generateImageMeta = async (filename: string, projectContext: any) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const projectTitle = projectContext?.title || formData.projectIdea || 'Academic Project';
    const subject = projectContext?.subject || formData.subject || 'Research';
    
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

  // Cleanup object URLs on component unmount
  useEffect(() => {
    return () => {
      if (mediaFiles.length > 0) {
        cleanupObjectUrls(mediaFiles);
      }
    };
  }, [mediaFiles]);

  // Keyboard navigation for stepper
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stepperRef.current?.contains(e.target as Node)) {
        if (e.key === 'ArrowLeft' && currentStep > 1) {
          e.preventDefault();
          setCurrentStep(currentStep - 1);
        } else if (e.key === 'ArrowRight' && currentStep < 3) {
          e.preventDefault();
          setCurrentStep(currentStep + 1);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentStep]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.projectIdea.trim().length >= 20 && formData.subject.trim() !== '';
      case 2:
        return true; // No required fields for media step
      case 3:
        return validateStep(1); // Must have valid step 1 to generate
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 3 && validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    if (step <= currentStep || (step === currentStep + 1 && validateStep(currentStep))) {
      setCurrentStep(step);
    }
  };

  const processFiles = async (files: FileList) => {
    await processAndUploadFiles(
      files,
      userId,
      projectId,
      mediaFiles,
      (fileId, progress, isUploading) => {
        setMediaFiles(prev => prev.map(file => 
          file.id === fileId 
            ? { ...file, uploadProgress: progress, isUploading }
            : file
        ));
      },
      async (newFiles) => {
        const filesWithMetadata = await Promise.all(
          newFiles.map(async (file) => {
            const projectContext = {
              title: formData.projectIdea,
              subject: formData.subject,
              steps: formData.steps
            };
            
            const metadata = await generateImageMeta(file.file.name, projectContext);
            return {
              ...file,
              caption: metadata.caption,
              alt: metadata.alt
            };
          })
        );
        
        setMediaFiles(prev => [...prev, ...filesWithMetadata]);
      },
      (error) => {
        setErrors([error]);
        setTimeout(() => setErrors([]), 5000);
      }
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleGenerate = () => {
    if (validateStep(1) && onGenerate) {
      onGenerate(formData, mediaFiles);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Project Details</h3>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="projectIdea" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Idea *
                </label>
                <textarea
                  id="projectIdea"
                  name="projectIdea"
                  rows={3}
                  value={formData.projectIdea}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Describe your project idea in detail…"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.projectIdea.length}/20 characters minimum
                </p>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject/Discipline *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a discipline</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Business">Business</option>
                  <option value="Psychology">Psychology</option>
                  <option value="Biology">Biology</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Physics">Physics</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Economics">Economics</option>
                  <option value="Literature">Literature</option>
                  <option value="History">History</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="steps" className="block text-sm font-medium text-gray-700 mb-2">
                  Steps/Outline
                </label>
                <textarea
                  id="steps"
                  name="steps"
                  rows={4}
                  value={formData.steps}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="List the main steps or outline for your project…"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Project Media</h3>
            <p className="text-sm text-gray-600 mb-6">Upload images, charts, or diagrams to enhance your project</p>
            
            {/* Drag & Drop Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 mb-6 ${
                isDragOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center space-y-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isDragOver ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Upload className={`h-6 w-6 ${isDragOver ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Drag & drop your images here or click to browse
                  </p>
                  <button
                    type="button"
                    onClick={handleBrowseClick}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Browse
                  </button>
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
            />

            {/* Media Files Display */}
            {mediaFiles.length > 0 && (
              <AutoLayout 
                mediaFiles={mediaFiles} 
                onReorder={setMediaFiles}
              />
            )}
          </div>
        );

      case 3:
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Project Summary</h3>
            
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Project Idea</h4>
                <p className="text-gray-700 text-sm">{formData.projectIdea}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Subject</h4>
                  <p className="text-gray-700 text-sm">{formData.subject}</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Media Files</h4>
                  <p className="text-gray-700 text-sm">{mediaFiles.length} images uploaded</p>
                </div>
              </div>
              
              {formData.steps && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Steps/Outline</h4>
                  <p className="text-gray-700 text-sm">{formData.steps}</p>
                </div>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <strong>Ready to generate!</strong> You can still go back to edit your project details or add more media files.
                </p>
              </div>
              
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !validateStep(1)}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generating Project...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>Generate Project</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="mb-6 space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Stepper Navigation */}
      <div 
        ref={stepperRef}
        className="flex items-center justify-center mb-8"
        role="tablist"
        aria-label="Project creation steps"
      >
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          const isClickable = step.number <= currentStep || (step.number === currentStep + 1 && validateStep(currentStep));
          
          return (
            <React.Fragment key={step.number}>
              <button
                onClick={() => handleStepClick(step.number)}
                disabled={!isClickable}
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isCompleted
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : isClickable
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
                role="tab"
                aria-selected={isActive}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`Step ${step.number}: ${step.label}`}
                tabIndex={isActive ? 0 : -1}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  isActive
                    ? 'bg-white text-blue-600'
                    : isCompleted
                    ? 'bg-green-600 text-white'
                    : 'bg-current bg-opacity-20'
                }`}>
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span className="font-medium">{step.label}</span>
              </button>
              
              {index < steps.length - 1 && (
                <div className="w-8 h-px bg-gray-300 mx-2" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Go to previous step"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        
        {currentStep < 3 && (
          <button
            onClick={handleNext}
            disabled={!validateStep(currentStep)}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            aria-label="Go to next step"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjectStepper;