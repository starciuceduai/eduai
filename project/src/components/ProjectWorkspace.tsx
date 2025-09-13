import React, { useState } from 'react';
import { FileText, Presentation, Image, Sparkles } from 'lucide-react';
import ProjectStepper from './ProjectStepper';
import MediaUploader from './MediaUploader';

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

interface ProjectWorkspaceProps {
  onGenerate?: (formData: any, mediaFiles: MediaFile[]) => Promise<void>;
  isGenerating?: boolean;
  hasGenerated?: boolean;
  aiOutput?: any;
}

// Card component for consistent styling
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

// Progress bar component
const ProgressBar: React.FC = () => (
  <div className="w-full bg-gray-200 rounded-full h-1 mb-8">
    <div className="bg-blue-600 h-1 rounded-full animate-pulse" style={{ width: '100%' }}></div>
  </div>
);

const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ 
  onGenerate, 
  isGenerating = false,
  hasGenerated = false,
  aiOutput = null
}) => {
  const [formData, setFormData] = useState({
    projectIdea: '',
    subject: '',
    steps: ''
  });
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [activeTab, setActiveTab] = useState('report');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectIdea.trim() || !formData.subject.trim()) {
      alert('Please fill in the required fields');
      return;
    }

    if (onGenerate) {
      await onGenerate(formData, mediaFiles);
    }
  };

  const handleClearInputs = () => {
    setFormData({
      projectIdea: '',
      subject: '',
      steps: ''
    });
    setMediaFiles([]);
  };

  const tabs = [
    { id: 'report', label: 'Report', icon: FileText },
    { id: 'slides', label: 'Slides', icon: Presentation },
    { id: 'visuals', label: 'Visuals', icon: Image }
  ];

  const renderTabContent = () => {
    if (!aiOutput) return null;

    switch (activeTab) {
      case 'report':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
              <h4 className="text-lg font-bold text-gray-900 mb-2">{aiOutput.title}</h4>
              <p className="text-gray-700 leading-relaxed">{aiOutput.abstract}</p>
            </div>
            {aiOutput.sections?.map((section: any, index: number) => (
              <Card key={index} className="p-6">
                <h5 className="font-semibold text-gray-900 mb-3">{section.title}</h5>
                <p className="text-gray-700 leading-relaxed">{section.content}</p>
              </Card>
            ))}
          </div>
        );
      case 'slides':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Presentation Slides</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((slide) => (
                <Card key={slide} className="p-4 hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 rounded mb-2 flex items-center justify-center">
                    <Presentation className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-xs text-gray-600 text-center">Slide {slide}</p>
                </Card>
              ))}
            </div>
          </div>
        );
      case 'visuals':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Visual Content</h3>
            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Image className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600">Visual content will appear here after generation</p>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section id="workspace" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          AI Project Builder
        </h2>
        <p className="text-lg text-gray-600">
          Transform your ideas into comprehensive academic projects
        </p>
      </div>

      {/* Progress Bar */}
      {isGenerating && <ProgressBar />}

      {/* Project Form and Media Uploader */}
      {!hasGenerated && (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Project Form */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Project Details</h3>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="projectIdea" className="block text-sm font-medium text-gray-700 mb-2">
                    Project Idea
                  </label>
                  <textarea
                    id="projectIdea"
                    name="projectIdea"
                    rows={3}
                    value={formData.projectIdea}
                    onChange={handleInputChange}
                    disabled={isGenerating}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="Describe your project idea in detail…"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject/Discipline
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    disabled={isGenerating}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
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
                    disabled={isGenerating}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="List the main steps or outline for your project…"
                  />
                </div>
              </div>
            </Card>

            {/* Right Column - Media Uploader */}
            <Card className="p-6">
              <MediaUploader
                mediaFiles={mediaFiles}
                onMediaFilesChange={setMediaFiles}
                disabled={isGenerating}
                projectContext={formData}
              />
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="submit"
              disabled={isGenerating || !formData.projectIdea.trim() || !formData.subject.trim()}
              className="flex-1 sm:flex-none bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
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
            
            <button
              type="button"
              onClick={handleClearInputs}
              disabled={isGenerating}
              className="flex-1 sm:flex-none border border-gray-300 text-gray-700 py-3 px-8 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Clear Inputs
            </button>
          </div>
        </form>
      )}

      {/* Results Section */}
      {hasGenerated && aiOutput && (
        <div className="mt-16">
          {/* Tabs */}
          <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg max-w-md mx-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="min-h-96">
            {renderTabContent()}
          </div>

          {/* New Project Button */}
          <div className="mt-12 text-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Start New Project
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProjectWorkspace;