import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Project {
  id: string;
  title: string;
  discipline: string;
  type: string;
  status: 'draft' | 'in-progress' | 'completed';
  createdAt: string;
  lastModified: string;
  progress: number;
  sections: {
    basics: any;
    literature: any;
    methodology: any;
    outcomes: any;
  };
}

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  createProject: (projectData: Partial<Project>) => string;
  updateProject: (id: string, updates: Partial<Project>) => void;
  setCurrentProject: (project: Project | null) => void;
  deleteProject: (id: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  children: ReactNode;
}

const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      title: 'Machine Learning Applications in Climate Prediction',
      discipline: 'Computer Science',
      type: 'Thesis Proposal',
      status: 'in-progress',
      createdAt: '2024-01-15',
      lastModified: '2024-01-20',
      progress: 65,
      sections: {
        basics: { completed: true },
        literature: { completed: true },
        methodology: { completed: false },
        outcomes: { completed: false }
      }
    },
    {
      id: '2',
      title: 'Sustainable Urban Planning Strategies',
      discipline: 'Urban Studies',
      type: 'Research Grant',
      status: 'draft',
      createdAt: '2024-01-10',
      lastModified: '2024-01-18',
      progress: 25,
      sections: {
        basics: { completed: true },
        literature: { completed: false },
        methodology: { completed: false },
        outcomes: { completed: false }
      }
    }
  ]);

  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  const createProject = (projectData: Partial<Project>): string => {
    const newProject: Project = {
      id: Date.now().toString(),
      title: projectData.title || 'Untitled Project',
      discipline: projectData.discipline || '',
      type: projectData.type || '',
      status: 'draft',
      createdAt: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      progress: 0,
      sections: {
        basics: { completed: false },
        literature: { completed: false },
        methodology: { completed: false },
        outcomes: { completed: false }
      },
      ...projectData
    };

    setProjects(prev => [...prev, newProject]);
    return newProject.id;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(project => 
      project.id === id 
        ? { ...project, ...updates, lastModified: new Date().toISOString().split('T')[0] }
        : project
    ));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(project => project.id !== id));
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      currentProject,
      createProject,
      updateProject,
      setCurrentProject,
      deleteProject
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export default ProjectProvider;