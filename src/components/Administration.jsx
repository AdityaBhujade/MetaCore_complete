import React, { useState, useEffect } from 'react';
import { labService, testService, doctorService } from '../services/api';

const Administration = () => {
  const [labForm, setLabForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  });
  const [testForm, setTestForm] = useState({
    name: '',
    category: '',
    newCategory: '',
    referenceRange: '',
    unit: ''
  });
  const [refDoctorForm, setRefDoctorForm] = useState({
    name: '',
    specialization: ''
  });
  const [labInfo, setLabInfo] = useState(null);
  const [tests, setTests] = useState([]);
  const [refDoctors, setRefDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('lab'); // 'lab', 'tests', 'doctors'
  const [editingTest, setEditingTest] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingDoctor, setEditingDoctor] = useState(null);

  useEffect(() => {
    fetchLabInfo();
    fetchTests();
    fetchRefDoctors();
  }, []);

  const fetchLabInfo = async () => {
    try {
      const response = await labService.getInfo();
      if (response.success) {
        setLabInfo(response.data);
        setLabForm(response.data);
      } else {
        setError('Failed to fetch lab info');
      }
    } catch (e) {
      setError('Failed to fetch lab info');
    }
  };

  const fetchTests = async () => {
    try {
      const response = await testService.getCategories();
      if (response.success) {
        setTests(response.data);
        // If current category no longer exists, reset the filter
        if (selectedCategory && !response.data.some(cat => cat.category === selectedCategory)) {
          setSelectedCategory('');
        }
      } else {
        setError('Failed to fetch tests');
      }
    } catch (e) {
      setError('Failed to fetch tests');
    }
  };

  const fetchRefDoctors = async () => {
    try {
      const response = await doctorService.getAll();
      if (response.success) {
        setRefDoctors(response.data);
      } else {
        setError('Failed to fetch reference doctors');
      }
    } catch (e) {
      setError('Failed to fetch reference doctors');
    }
    setLoading(false);
  };

  const handleLabChange = (e) => {
    setLabForm({ ...labForm, [e.target.name]: e.target.value });
  };

  const handleTestChange = (e) => {
    setTestForm({ ...testForm, [e.target.name]: e.target.value });
  };

  const handleRefDoctorChange = (e) => {
    setRefDoctorForm({ ...refDoctorForm, [e.target.name]: e.target.value });
  };

  const handleLabSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const response = labInfo 
        ? await labService.updateInfo(labForm)
        : await labService.createInfo(labForm);

      if (response.success) {
        setSuccess('Lab info updated successfully!');
        fetchLabInfo();
      } else {
        setError(response.error || 'Failed to update lab info');
      }
    } catch (e) {
      setError('Failed to update lab info');
    }
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const testData = {
        ...testForm,
        category: testForm.newCategory || testForm.category
      };
      const response = editingTest 
        ? await testService.update(editingTest.id, testData)
        : await testService.create(testData);

      if (response.success) {
        setSuccess(editingTest ? 'Test updated successfully!' : 'Test added successfully!');
        setTestForm({
          name: '',
          category: '',
          newCategory: '',
          referenceRange: '',
          unit: ''
        });
        setEditingTest(null);
        // Reset category filter if we added a new category
        if (testForm.newCategory) {
          setSelectedCategory('');
        }
        await fetchTests();
      } else {
        setError(response.error || (editingTest ? 'Failed to update test' : 'Failed to add test'));
      }
    } catch (e) {
      setError(editingTest ? 'Failed to update test' : 'Failed to add test');
    }
  };

  const handleRefDoctorSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const response = await doctorService.create(refDoctorForm);
      if (response.success) {
        setSuccess('Reference doctor added successfully!');
        setRefDoctorForm({ name: '', specialization: '' });
        fetchRefDoctors();
      } else {
        setError(response.error || 'Failed to add reference doctor');
      }
    } catch (e) {
      setError('Failed to add reference doctor');
    }
  };

  const handleEditTest = (test) => {
    setEditingTest(test);
    setTestForm({
      name: test.name,
      category: test.category,
      newCategory: '',
      referenceRange: test.referenceRange,
      unit: test.unit
    });
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this test?')) return;
    
    setError(null);
    setSuccess(null);
    try {
      const response = await testService.delete(testId);
      if (response.success) {
        setSuccess('Test deleted successfully!');
        // Reset category filter if we deleted the last test in a category
        await fetchTests();
      } else {
        setError(response.error || 'Failed to delete test');
      }
    } catch (e) {
      setError('Failed to delete test');
    }
  };

  const handleCancelEdit = () => {
    setEditingTest(null);
    setTestForm({
      name: '',
      category: '',
      newCategory: '',
      referenceRange: '',
      unit: ''
    });
  };

  // Filter tests based on selected category and search query
  const filteredTests = selectedCategory
    ? tests.find(cat => cat.category === selectedCategory)?.tests || []
    : [];

  // Apply search filter to tests
  const searchFilteredTests = searchQuery
    ? filteredTests.filter(test => 
        test.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredTests;

  // Get unique categories for the filter dropdown
  const categories = tests.map(cat => cat.category);

  const handleEditDoctor = (doctor) => {
    setEditingDoctor(doctor);
    setRefDoctorForm({
      name: doctor.name,
      specialization: doctor.specialization
    });
  };

  const handleDeleteDoctor = async (doctorId) => {
    if (!window.confirm('Are you sure you want to delete this reference doctor?')) return;
    
    setError(null);
    setSuccess(null);
    try {
      const response = await doctorService.delete(doctorId);
      if (response.success) {
        setSuccess('Reference doctor deleted successfully!');
        fetchRefDoctors();
      } else {
        setError(response.error || 'Failed to delete reference doctor');
      }
    } catch (e) {
      setError('Failed to delete reference doctor');
    }
  };

  const handleUpdateDoctor = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const response = await doctorService.update(editingDoctor.id, refDoctorForm);
      if (response.success) {
        setSuccess('Reference doctor updated successfully!');
        setRefDoctorForm({ name: '', specialization: '' });
        setEditingDoctor(null);
        fetchRefDoctors();
      } else {
        setError(response.error || 'Failed to update reference doctor');
      }
    } catch (e) {
      setError('Failed to update reference doctor');
    }
  };

  const handleCancelEditDoctor = () => {
    setEditingDoctor(null);
    setRefDoctorForm({ name: '', specialization: '' });
  };

  return (
    <div className="p-8 ml-64">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Administration</h1>
      <p className="text-gray-600 mb-6">Manage lab information, tests, and reference doctors</p>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('lab')}
          className={`px-4 py-2 rounded-md ${activeTab === 'lab' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Lab Info
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2 rounded-md ${activeTab === 'tests' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Test Management
        </button>
        <button
          onClick={() => setActiveTab('doctors')}
          className={`px-4 py-2 rounded-md ${activeTab === 'doctors' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Reference Doctors
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">{success}</div>}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      ) : (
        <>
          {/* Lab Info Tab */}
          {activeTab === 'lab' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Lab Information</h2>
              <form onSubmit={handleLabSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lab Name</label>
                    <input
                      type="text"
                      name="name"
                      value={labForm.name}
                      onChange={handleLabChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={labForm.address}
                      onChange={handleLabChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={labForm.phone}
                      onChange={handleLabChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={labForm.email}
                      onChange={handleLabChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {labInfo ? 'Update Lab Info' : 'Add Lab Info'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Test Management Tab */}
          {activeTab === 'tests' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {editingTest ? 'Edit Test' : 'Add New Test'}
                </h2>
                <form onSubmit={handleTestSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
                      <input
                        type="text"
                        name="name"
                        value={testForm.name}
                        onChange={handleTestChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        name="category"
                        value={testForm.category}
                        onChange={handleTestChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required={!testForm.newCategory}
                      >
                        <option value="">Select Category</option>
                        {categories.map((category) => (
                          <option key={`category-${category}`} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Category (Optional)</label>
                      <input
                        type="text"
                        name="newCategory"
                        value={testForm.newCategory}
                        onChange={handleTestChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Enter new category if needed"
                        required={!testForm.category}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reference Range</label>
                      <input
                        type="text"
                        name="referenceRange"
                        value={testForm.referenceRange}
                        onChange={handleTestChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                      <input
                        type="text"
                        name="unit"
                        value={testForm.unit}
                        onChange={handleTestChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex space-x-4">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {editingTest ? 'Update Test' : 'Add Test'}
                    </button>
                    {editingTest && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">All Tests</h2>
                  <div className="flex items-center space-x-4">
                    <div className="w-64">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Search Tests</label>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by test name..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="w-64">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Category</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">All Categories</option>
                        {categories.map((category) => (
                          <option key={`filter-${category}`} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {selectedCategory ? (
                  // Show filtered tests for selected category
                  <div className="overflow-x-auto">
                    <table className="w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Reference Range</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Unit</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {searchFilteredTests.map((test) => (
                          <tr key={`test-${test.id}`}>
                            <td className="px-4 py-4 text-sm text-gray-900 break-words">{test.name}</td>
                            <td className="px-4 py-4 text-sm text-gray-900 break-words">{test.referenceRange}</td>
                            <td className="px-4 py-4 text-sm text-gray-900 break-words">{test.unit}</td>
                            <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                              <button
                                onClick={() => handleEditTest(test)}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteTest(test.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  // Show all tests grouped by category
                  <div className="space-y-6">
                    {tests.map((categoryData) => {
                      // Filter tests within each category based on search query
                      const filteredCategoryTests = searchQuery
                        ? categoryData.tests.filter(test => 
                            test.name.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                        : categoryData.tests;

                      // Only show category if it has matching tests
                      if (filteredCategoryTests.length === 0) return null;

                      return (
                        <div key={`category-${categoryData.category}`} className="border-b border-gray-200 pb-6 last:border-b-0">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">{categoryData.category}</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Name</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Reference Range</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Unit</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {filteredCategoryTests.map((test) => (
                                  <tr key={`test-${test.id}`}>
                                    <td className="px-4 py-4 text-sm text-gray-900 break-words">{test.name}</td>
                                    <td className="px-4 py-4 text-sm text-gray-900 break-words">{test.referenceRange}</td>
                                    <td className="px-4 py-4 text-sm text-gray-900 break-words">{test.unit}</td>
                                    <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                                      <button
                                        onClick={() => handleEditTest(test)}
                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTest(test.id)}
                                        className="text-red-600 hover:text-red-900"
                                      >
                                        Delete
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reference Doctors Tab */}
          {activeTab === 'doctors' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {editingDoctor ? 'Edit Reference Doctor' : 'Add Reference Doctor'}
                </h2>
                <form onSubmit={editingDoctor ? handleUpdateDoctor : handleRefDoctorSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
                      <input
                        type="text"
                        name="name"
                        value={refDoctorForm.name}
                        onChange={handleRefDoctorChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                      <input
                        type="text"
                        name="specialization"
                        value={refDoctorForm.specialization}
                        onChange={handleRefDoctorChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex space-x-4">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {editingDoctor ? 'Update Doctor' : 'Add Doctor'}
                    </button>
                    {editingDoctor && (
                      <button
                        type="button"
                        onClick={handleCancelEditDoctor}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">All Reference Doctors</h2>
                <div className="overflow-x-auto">
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Specialization</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {refDoctors.map((doctor) => (
                        <tr key={`doctor-${doctor.id}`}>
                          <td className="px-4 py-4 text-sm text-gray-900 break-words">{doctor.name}</td>
                          <td className="px-4 py-4 text-sm text-gray-900 break-words">{doctor.specialization}</td>
                          <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                            <button
                              onClick={() => handleEditDoctor(doctor)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteDoctor(doctor.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Administration; 