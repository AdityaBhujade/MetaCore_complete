import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const Sidebar = () => {
  const { signOut } = useAuth();

  return (
    <div className="h-screen w-64 bg-white border-r border-gray-200 fixed left-0 top-0 flex flex-col">
      <div className="p-6">
        <div className="flex items-center">
          <img src="/logo.svg" alt="MedLab Pro Logo" className="w-8 h-8 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">MedLab Pro</h1>
        </div>
      </div>
      <nav className="mt-6 flex-1">
        <Link to="/dashboard" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors cursor-pointer">
          <span className="material-icons mr-3">dashboard</span>
          Overview
        </Link>
        <Link to="/patients" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors cursor-pointer">
          <span className="material-icons mr-3">people</span>
          Patients
        </Link>
        <Link to="/tests" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors cursor-pointer">
          <span className="material-icons mr-3">science</span>
          Tests
        </Link>
        <Link to="/reports" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors cursor-pointer">
          <span className="material-icons mr-3">description</span>
          Reports
        </Link>
        <Link to="/analytics" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors cursor-pointer">
          <span className="material-icons mr-3">analytics</span>
          Analytics
        </Link>
        <Link to="/administration" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors cursor-pointer">
          <span className="material-icons mr-3">business</span>
          Administration
        </Link>
      </nav>
      <div className="p-4 mt-auto">
        <button
          className="w-full bg-red-100 text-red-700 py-2 rounded font-semibold hover:bg-red-200 transition"
          onClick={() => {
            signOut();
            window.location.href = '/login';
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
