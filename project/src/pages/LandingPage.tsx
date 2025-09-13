import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, ArrowRight } from 'lucide-react';
import ProjectWorkspace from '../components/ProjectWorkspace';

const LandingPage: React.FC = () => {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [hasGenerated, setHasGenerated] = React.useState(false);
  const [aiOutput, setAiOutput] = React.useState<any>(null);

  const handleGetStartedClick = () => {
    const workspaceSection = document.getElementById('workspace');
    if (workspaceSection) {
      workspaceSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };
  const handleGenerateProject = async (formData: any, mediaFiles: any[]) => {
    if (!formData.projectIdea.trim() || !formData.subject.trim()) {
      alert('Please fill in the required fields');
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock AI output
    const mockOutput = {
      title: `AI-Generated Project: ${formData.projectIdea}`,
      abstract: `This comprehensive academic project explores ${formData.projectIdea} within the field of ${formData.subject}. Through systematic analysis and research methodology, this project aims to contribute valuable insights to the academic community.`,
      sections: [
        {
          title: "1. Introduction and Problem Statement",
          content: `The field of ${formData.subject} presents numerous opportunities for innovative research. This project focuses on ${formData.projectIdea}, addressing key challenges and proposing novel solutions.`
        },
        {
          title: "2. Literature Review and Background", 
          content: `Recent studies in ${formData.subject} have shown significant developments. This section reviews relevant literature and identifies research gaps that this project aims to address.`
        },
        {
          title: "3. Methodology and Approach",
          content: `Based on the outlined steps: ${formData.steps}, this project employs a systematic approach combining theoretical analysis with practical implementation.`
        }
      ]
    };
    
    setAiOutput(mockOutput);
    setHasGenerated(true);
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <Link to="/" className="flex items-center gap-2 group">
                <Brain className="h-6 w-6 text-blue-600 transition-transform group-hover:scale-110" aria-hidden="true" />
                <span className="font-extrabold tracking-tight text-xl md:text-2xl">
                  <span className="text-blue-600">Starciuc</span><span className="text-gray-800 dark:text-gray-100">/EduAI</span>
                </span>
              </Link>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                to="/" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
              >
                Home
              </Link>
              <Link 
                to="#features" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
              >
                Features
              </Link>
              <Link 
                to="#login" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
              >
                Login
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="text-gray-700 hover:text-blue-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Turn your idea into a full academic project
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Reports, presentations, visuals – all generated with AI
            </p>
            
            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleGetStartedClick}
                className="group bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
              
              <button className="text-gray-600 hover:text-gray-800 font-medium px-6 py-4 transition-colors duration-200">
                Watch Demo
              </button>
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Free to start</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Trusted by 10,000+ students</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Workspace */}
      <section id="workspace" className="py-16 bg-gray-50">
        <ProjectWorkspace 
          onGenerate={handleGenerateProject}
          isGenerating={isGenerating}
          hasGenerated={hasGenerated}
          aiOutput={aiOutput}
        />
      </section>

      {/* Features Preview Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need for academic success
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From initial idea to polished presentation, EduAI handles every step of your academic project creation
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AI-Generated Reports</h3>
              <p className="text-gray-600">
                Transform your ideas into comprehensive academic reports with proper structure and citations
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Presentations</h3>
              <p className="text-gray-600">
                Create stunning presentations that perfectly complement your research and findings
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Visual Content</h3>
              <p className="text-gray-600">
                Generate charts, diagrams, and infographics that make your data come alive
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <Link to="/" className="flex items-center gap-2 group">
              <Brain className="h-6 w-6 text-blue-400 transition-transform group-hover:scale-110" aria-hidden="true" />
              <span className="font-extrabold tracking-tight text-xl">
                <span className="text-blue-400">Starciuc</span><span className="text-white">/EduAI</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Starciuc / EduAI. All rights reserved.
            </p>
            </div>
          </div>
      </footer>
    </div>
  );
};

export default LandingPage;