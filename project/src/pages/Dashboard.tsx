import React, { useState, useEffect } from 'react';
import { Brain, ArrowLeft, FileText, Presentation, Image, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import AutoLayout from '../components/AutoLayout';
import { exportToPDF, exportToPPTX, exportToPNG } from '../utils/exportUtils';
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

// Mock AI function - Replace with real AI API call
const generateProjectWithAI = async (projectData: {
  projectIdea: string;
  subject: string;
  steps: string;
}) => {
  // TODO: Replace this with actual AI API call (OpenAI, Claude, etc.)
  // Example: const response = await fetch('/api/generate-project', { method: 'POST', body: JSON.stringify(projectData) });
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Mock AI response - Replace with real AI-generated content
  return {
    report: {
      title: `AI-Generated Report: ${projectData.projectIdea}`,
      abstract: `This comprehensive academic report explores ${projectData.projectIdea} within the field of ${projectData.subject}. Through systematic analysis and research methodology, this project aims to contribute valuable insights to the academic community.`,
      sections: [
        {
          title: "1. Introduction and Problem Statement",
          content: `The field of ${projectData.subject} presents numerous opportunities for innovative research. This project focuses on ${projectData.projectIdea}, addressing key challenges and proposing novel solutions.`
        },
        {
          title: "2. Literature Review and Background",
          content: `Recent studies in ${projectData.subject} have shown significant developments. This section reviews relevant literature and identifies research gaps that this project aims to address.`
        },
        {
          title: "3. Methodology and Approach",
          content: `Based on the outlined steps: ${projectData.steps}, this project employs a systematic approach combining theoretical analysis with practical implementation.`
        },
        {
          title: "4. Expected Results and Analysis",
          content: `The anticipated outcomes of this research include significant contributions to ${projectData.subject}, with potential applications in both academic and practical contexts.`
        },
        {
          title: "5. Conclusion and Future Work",
          content: `This project represents a meaningful contribution to ${projectData.subject}. Future research directions include expanding the scope and exploring additional applications.`
        }
      ],
      citations: [
        "Smith, J. (2023). Recent Advances in " + projectData.subject + ". Academic Journal, 15(3), 45-62.",
        "Johnson, A. et al. (2024). Innovative Approaches to " + projectData.projectIdea + ". Research Quarterly, 8(2), 123-140.",
        "Brown, M. (2023). Methodological Frameworks in " + projectData.subject + ". University Press."
      ]
    }
  };
};

const Dashboard: React.FC = () => {
  const [formData, setFormData] = useState({
    projectIdea: '',
    subject: '',
    steps: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [aiOutput, setAiOutput] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('report');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [projectId] = useState(() => generateProjectId());
  const [userId] = useState(() => getCurrentUserId());

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
    // TODO: Replace with actual LLM API call (OpenAI, Claude, etc.)
    // Example: const response = await fetch('/api/generate-image-meta', { method: 'POST', body: JSON.stringify({ filename, projectContext }) });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock LLM response - Replace with real AI-generated content
    const projectTitle = projectContext?.title || formData.projectIdea || 'Academic Project';
    const subject = projectContext?.subject || formData.subject || 'Research';
    
    // Generate contextual caption based on filename and project
    const cleanFilename = filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
    const words = cleanFilename.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
    
    // Create contextual caption (6-10 words)
    const caption = `${words.join(' ')} for ${subject} Analysis`;
    
    // Create descriptive alt text
    const alt = `Academic visual showing ${cleanFilename.toLowerCase()} data related to ${projectTitle.toLowerCase()} in ${subject.toLowerCase()} research`;
    
    return { caption, alt };
  };

  const handleFileUpload = async (files: FileList) => {
    if (mediaFiles.length > 0) {
      cleanupObjectUrls(mediaFiles); // Clean up previous files
    }
    
    const projectContext = {
      title: formData.projectIdea,
      subject: formData.subject,
      steps: formData.steps,
      aiOutput: aiOutput
    };
    
    try {
      const processedFiles = await processAndUploadFiles(files, userId, projectId, generateImageMeta, projectContext);
      setMediaFiles(processedFiles);
    } catch (error) {
      console.error('File upload failed:', error);
      alert('Failed to upload files. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectIdea.trim() || !formData.subject.trim() || !formData.steps.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Call mock AI function - Replace with real AI API
      const result = await generateProjectWithAI(formData);
      setAiOutput(result);
      setHasGenerated(true);
    } catch (error) {
      console.error('AI generation failed:', error);
      alert('Failed to generate project. Please try again.');
    }
    
    setIsGenerating(false);
  };

  const handleExport = async (format: 'pdf' | 'pptx' | 'png') => {
    if (!aiOutput?.report) {
      alert('Please generate a project first');
      return;
    }

    setIsExporting(format);

    try {
      switch (format) {
        case 'pdf':
          await exportToPDF(aiOutput.report, mediaFiles);
          break;
        case 'pptx':
          await exportToPPTX(aiOutput.report, mediaFiles);
          break;
        case 'png':
          await exportToPNG('gallery-container', formData.projectIdea || 'project');
          break;
      }
    } catch (error) {
      console.error(`${format.toUpperCase()} export failed:`, error);
      alert(`Failed to export ${format.toUpperCase()}. Please try again.`);
    } finally {
      setIsExporting(null);
    }
  };

  const tabs = [
    { id: 'report', label: 'Report', icon: FileText },
    { id: 'slides', label: 'Slides', icon: Presentation },
    { id: 'visuals', label: 'Visuals', icon: Image }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'report':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">AI-Generated Academic Report</h3>
            
            {aiOutput?.report ? (
              <div className="space-y-6">
                {/* Report Title */}
                <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{aiOutput.report.title}</h4>
                  <p className="text-gray-700 leading-relaxed">{aiOutput.report.abstract}</p>
                </div>
                
                {/* Report Sections */}
                <div className="space-y-4">
                  {aiOutput.report.sections.map((section: any, index: number) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-5">
                      <h5 className="font-semibold text-gray-900 mb-3">{section.title}</h5>
                      <p className="text-gray-700 leading-relaxed">{section.content}</p>
                    </div>
                  ))}
                </div>
                
                {/* Citations */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-3">References</h5>
                  <div className="space-y-2">
                    {aiOutput.report.citations.map((citation: string, index: number) => (
                      <p key={index} className="text-sm text-gray-600 pl-4 border-l-2 border-gray-300">
                        {citation}
                      </p>
                    ))}
                  </div>
                </div>
                
                {/* Auto Layout Gallery */}
                {mediaFiles.length > 0 && (
                  <div className="mt-8">
                    <AutoLayout 
                      mediaFiles={mediaFiles} 
                      onReorder={setMediaFiles}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <p className="text-gray-600 italic">
                  AI-generated project report will appear here after clicking "Generate Project"
                </p>
              </div>
            )}
          </div>
        );
      case 'slides':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Presentation Slides</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((slide) => (
                <div key={slide} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 rounded mb-2 flex items-center justify-center">
                    <Presentation className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-xs text-gray-600 text-center">Slide {slide}</p>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                Generated 12 professional slides covering your project from introduction to conclusion, 
                with consistent design and academic formatting.
              </p>
            </div>
          </div>
        );
      case 'visuals':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Visual Content</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-3">Charts & Graphs</h4>
                <div className="aspect-square bg-gradient-to-br from-green-50 to-blue-50 rounded-lg flex items-center justify-center mb-3">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Image className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600">Data Visualization</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Generated charts based on your methodology</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-3">Diagrams</h4>
                <div className="aspect-square bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg flex items-center justify-center mb-3">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Image className="h-8 w-8 text-purple-600" />
                    </div>
                    <p className="text-sm text-gray-600">Process Flow</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Workflow and process diagrams</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Link to="/" className="flex items-center gap-2 group">
                <Brain className="h-6 w-6 text-blue-600 transition-transform group-hover:scale-110" aria-hidden="true" />
                <span className="font-extrabold tracking-tight text-xl md:text-2xl">
                  <span className="text-blue-600">Starciuc</span><span className="text-gray-800 dark:text-gray-100">/EduAI</span>
                </span>
              </Link>
            </div>
            <Link
              to="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Project Builder
          </h1>
          <p className="text-lg text-gray-600">
            Transform your ideas into comprehensive academic projects
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Project Details</h2>
            
            <form onSubmit={handleGenerateProject} className="space-y-6">
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
                  placeholder="Describe your project idea in detail..."
                  required
                />
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
                  Steps/Outline *
                </label>
                <textarea
                  id="steps"
                  name="steps"
                  rows={4}
                  value={formData.steps}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="List the main steps or outline for your project..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating}
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
            </form>
          </div>

          {/* Output Area */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Generated Content</h2>
            
            {!hasGenerated ? (
              <div className="flex flex-col items-center justify-center h-96 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Brain className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Generate</h3>
                <p className="text-gray-600 max-w-sm">
                  Fill out the project details and click "Generate Project" to see your AI-powered academic content.
                </p>
              </div>
            ) : (
              <div>
                {/* Tabs */}
                <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
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

                {/* Export Buttons */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Download Your Project</h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={() => handleExport('pdf')}
                      disabled={isExporting === 'pdf'}
                      className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      {isExporting === 'pdf' ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      <span>{isExporting === 'pdf' ? 'Exporting...' : 'Download PDF'}</span>
                    </button>
                    <button 
                      onClick={() => handleExport('pptx')}
                      disabled={isExporting === 'pptx'}
                      className="flex-1 bg-orange-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      {isExporting === 'pptx' ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      <span>{isExporting === 'pptx' ? 'Exporting...' : 'Download PPTX'}</span>
                    </button>
                    <button 
                      onClick={() => handleExport('png')}
                      disabled={isExporting === 'png' || mediaFiles.length === 0}
                      className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      {isExporting === 'png' ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      <span>{isExporting === 'png' ? 'Exporting...' : 'Download PNG'}</span>
                    </button>
                  </div>
                  {mediaFiles.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      Upload images to enable PNG gallery export
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;