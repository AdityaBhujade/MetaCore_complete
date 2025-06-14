import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const Sidebar = () => {
  return (
    <div className="h-screen w-64 bg-gray-50 border-r border-gray-200 fixed left-0 top-0 flex flex-col">
      <div className="p-6">
        <div className="flex items-center mb-8">
          <img src="/logo.svg" alt="MetaCore Logo" className="w-10 h-10 mr-3" />
          <span className="text-2xl font-semibold">MetaCore</span>
        </div>
      </div>
      <nav className="mt-6 flex-1">
        <Link to="/dashboard" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors cursor-pointer">
          <span className="material-icons mr-3">dashboard</span>
          Dashboard
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
    </div>
  );
};

export default Sidebar;
