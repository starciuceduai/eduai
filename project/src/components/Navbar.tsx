import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Brain, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <Brain className="h-6 w-6 text-blue-600 transition-transform group-hover:scale-110" aria-hidden="true" />
              <span className="font-extrabold tracking-tight text-xl md:text-2xl">
                <span className="text-blue-600">Starciuc</span><span className="text-gray-800 dark:text-gray-100">/EduAI</span>
              </span>
            </Link>
            
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Dashboard
                </Link>
                <a
                  href="#workspace"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    const workspaceSection = document.getElementById('workspace');
                    if (workspaceSection) {
                      workspaceSection.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                      });
                    }
                  }}
                >
                  Get Started
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{user?.name}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;