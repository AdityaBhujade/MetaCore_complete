import React, { useState, useEffect } from 'react';
import { patientService, testService } from '../services/api';

// Test catalog (biochemistry, hematology, microbiology, urine/stool)
const TEST_CATALOG = [
  // Biochemistry
  { category: 'Biochemistry', name: 'Fasting Blood Sugar (FBS)', unit: 'mg/dL', ref: '70–110' },
  { category: 'Biochemistry', name: 'Postprandial Blood Sugar (PPBS)', unit: 'mg/dL', ref: '110–160' },
  { category: 'Biochemistry', name: 'Random Blood Sugar (RBS)', unit: 'mg/dL', ref: '70–140' },
  { category: 'Biochemistry', name: 'HbA1c', unit: '%', ref: '4.4–6.7' },
  { category: 'Biochemistry', name: 'Blood Urea Nitrogen (BUN)', unit: 'mg/dL', ref: '25–40' },
  { category: 'Biochemistry', name: 'Serum Creatinine', unit: 'mg/dL', ref: '0.6–1.5' },
  { category: 'Biochemistry', name: 'Uric Acid', unit: 'mg/dL', ref: 'M: 3.5–7.2; F: 2.6–6.0' },
  { category: 'Biochemistry', name: 'Total Bilirubin', unit: 'mg/dL', ref: '0–1.2' },
  { category: 'Biochemistry', name: 'Direct Bilirubin', unit: 'mg/dL', ref: '0–0.2' },
  { category: 'Biochemistry', name: 'Indirect Bilirubin', unit: 'mg/dL', ref: '0.1–1.1' },
  { category: 'Biochemistry', name: 'SGOT (AST)', unit: 'U/L', ref: '8–40' },
  { category: 'Biochemistry', name: 'SGPT (ALT)', unit: 'U/L', ref: '8–40' },
  { category: 'Biochemistry', name: 'Alkaline Phosphatase (ALP)', unit: 'U/L', ref: '108–306' },
  { category: 'Biochemistry', name: 'Gamma GT (GGT)', unit: 'U/L', ref: 'Up to 60' },
  { category: 'Biochemistry', name: 'Total Protein', unit: 'g/dL', ref: '6–8' },
  { category: 'Biochemistry', name: 'Albumin', unit: 'g/dL', ref: '3.5–5.5' },
  { category: 'Biochemistry', name: 'Globulin', unit: 'g/dL', ref: '2.5–3.5' },
  { category: 'Biochemistry', name: 'A/G Ratio', unit: 'Ratio', ref: '1.2–2.2' },
  { category: 'Biochemistry', name: 'Calcium (Total)', unit: 'mg/dL', ref: '8.5–10.5' },
  { category: 'Biochemistry', name: 'Phosphorus', unit: 'mg/dL', ref: '2.5–5.0' },
  { category: 'Biochemistry', name: 'Sodium', unit: 'mEq/L', ref: '135–145' },
  { category: 'Biochemistry', name: 'Potassium', unit: 'mEq/L', ref: '3.5–5.0' },
  { category: 'Biochemistry', name: 'Chloride', unit: 'mEq/L', ref: '98–119' },
  { category: 'Biochemistry', name: 'Lipid Profile', unit: '-', ref: 'Varies per component' },
  { category: 'Biochemistry', name: 'Amylase', unit: 'U/L', ref: 'Up to 85' },
  { category: 'Biochemistry', name: 'Lipase', unit: 'U/L', ref: 'Up to 200' },
  // Hematology
  { category: 'Hematology', name: 'Hemoglobin (Hb)', unit: 'g/dL', ref: 'M: 13–16; F: 11.5–14.5' },
  { category: 'Hematology', name: 'Total Leukocyte Count (TLC)', unit: 'x10³/μL', ref: '4–11' },
  { category: 'Hematology', name: 'Red Blood Cell Count (RBC)', unit: 'x10⁶/μL', ref: 'M: 4.5–6.0; F: 4.0–4.5' },
  { category: 'Hematology', name: 'Packed Cell Volume (PCV)', unit: '%', ref: 'M: 42–52; F: 36–48' },
  { category: 'Hematology', name: 'Mean Corpuscular Volume (MCV)', unit: 'fL', ref: '82–92' },
  { category: 'Hematology', name: 'Mean Corpuscular Hemoglobin (MCH)', unit: 'pg', ref: '27–32' },
  { category: 'Hematology', name: 'Mean Corpuscular Hemoglobin Concentration (MCHC)', unit: 'g/dL', ref: '32–36' },
  { category: 'Hematology', name: 'Differential Leukocyte Count (DLC)', unit: '%', ref: 'Neutrophils: 40–75; Lymphocytes: 20–45; Monocytes: 2–8; Eosinophils: 1–6; Basophils: 0–1' },
  { category: 'Hematology', name: 'Erythrocyte Sedimentation Rate (ESR)', unit: 'mm/hr', ref: 'M: up to 15; F: up to 20' },
  { category: 'Hematology', name: 'Reticulocyte Count', unit: '%', ref: 'Adult: 0.5–2; Infant: 2–6' },
  { category: 'Hematology', name: 'Bleeding Time', unit: 'minutes', ref: '2–7' },
  { category: 'Hematology', name: 'Clotting Time', unit: 'minutes', ref: '4–9' },
  { category: 'Hematology', name: 'Prothrombin Time (PT)', unit: 'seconds', ref: '10–14' },
  { category: 'Hematology', name: 'International Normalized Ratio (INR)', unit: 'Ratio', ref: '<1.1' },
  { category: 'Hematology', name: 'Activated Partial Thromboplastin Time (APTT)', unit: 'seconds', ref: '30–40' },
  // Microbiology & Serology
  { category: 'Microbiology', name: 'Widal Test', unit: '-', ref: 'Negative' },
  { category: 'Microbiology', name: 'HIV Test', unit: '-', ref: 'Negative' },
  { category: 'Microbiology', name: 'HCV Test', unit: '-', ref: 'Negative' },
  { category: 'Microbiology', name: 'HBsAg Test', unit: '-', ref: 'Negative' },
  { category: 'Microbiology', name: 'Dengue NS1 Antigen', unit: '-', ref: 'Negative' },
  { category: 'Microbiology', name: 'Dengue IgG/IgM', unit: '-', ref: 'Negative' },
  { category: 'Microbiology', name: 'Malaria Parasite Test', unit: '-', ref: 'Negative' },
  { category: 'Microbiology', name: 'Mantoux Test', unit: 'mm', ref: '<5 mm (negative)' },
  // Urine and Stool
  { category: 'Urine/Stool', name: 'Urine Routine Examination', unit: '-', ref: 'Normal' },
  { category: 'Urine/Stool', name: 'Urine Pregnancy Test', unit: '-', ref: 'Negative' },
  { category: 'Urine/Stool', name: 'Stool Routine Examination', unit: '-', ref: 'Normal' },
];

const AddTestResults = ({ onTestAdded }) => {
  const [tests, setTests] = useState([
    { testName: '', value: '', normalRange: '', unit: '' },
  ]);
  const [patientId, setPatientId] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [availableTests, setAvailableTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);

  // Get available tests for the selected category
  const filteredTests = category 
    ? availableTests.filter(tc => tc.category === category)
    : [];

  useEffect(() => {
    const fetchData = async () => {
      setLoadingPatients(true);
      setLoadingTests(true);
      try {
        // Fetch patients
        const patientsRes = await patientService.getAll();
        if (patientsRes.success) {
          setPatients(patientsRes.data);
        } else {
          setError('Failed to load patients');
        }

        // Fetch tests
        const testsRes = await testService.getCategories();
        if (testsRes.success) {
          // Flatten the nested structure
          const flattenedTests = testsRes.data.flatMap(cat => 
            cat.tests.map(test => ({
              ...test,
              category: cat.category
            }))
          );
          setAvailableTests(flattenedTests);
        } else {
          console.error('Failed to fetch tests:', testsRes.error);
          setError('Failed to load test data. Please try again later.');
        }
      } catch (e) {
        console.error('Error fetching data:', e);
        setError('Failed to connect to server. Please check your connection.');
        setPatients([]);
        setAvailableTests([]);
      } finally {
        setLoadingPatients(false);
        setLoadingTests(false);
      }
    };
    fetchData();
  }, []);

  // Reset tests when category changes
  useEffect(() => {
    setTests([{ testName: '', value: '', normalRange: '', unit: '' }]);
  }, [category]);

  const handleTestChange = (idx, field, value) => {
    setTests((prev) => prev.map((t, i) => {
      if (i !== idx) return t;
      if (field === 'testName') {
        const found = availableTests.find(tc => tc.name === value);
        return {
          ...t,
          testName: value,
          unit: found ? found.unit : '',
          normalRange: found ? found.referenceRange : '',
        };
      }
      return { ...t, [field]: value };
    }));
  };

  const addTestRow = () => {
    setTests([...tests, { testName: '', value: '', normalRange: '', unit: '' }]);
  };

  const removeTestRow = (idx) => {
    setTests(tests.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (!patientId || !category || tests.some(t => !t.testName || !t.value)) {
      setError('Please fill all required fields.');
      return;
    }
    try {
      // Format tests data to match backend requirements
      const formattedTests = tests.map(test => ({
        test_name: test.testName,
        test_value: test.value,
        normal_range: test.normalRange,
        unit: test.unit
      }));

      const response = await testService.addResults({
        patient_id: Number(patientId),
        test_category: category,
        tests: formattedTests,
        additional_note: notes
      });

      if (response.success) {
        setMessage('Test results saved successfully!');
        setTests([{ testName: '', value: '', normalRange: '', unit: '' }]);
        setPatientId('');
        setCategory('');
        setNotes('');
        if (onTestAdded) onTestAdded();
      } else {
        setError(response.error || 'Failed to save test results');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold mb-2">Add Test Results</h2>
      <p className="text-gray-600 mb-6">Enter laboratory test results for a patient</p>
      <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Patient *</label>
          <select className="w-full border rounded px-3 py-2" value={patientId} onChange={e => setPatientId(e.target.value)} required>
            <option key="patient-default" value="">{loadingPatients ? 'Loading...' : 'Select a patient'}</option>
            {patients.map(p => (
              <option key={`patient-${p.id}`} value={p.id}>{p.fullName} ({p.patientCode})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Test Category *</label>
          <select 
            className="w-full border rounded px-3 py-2" 
            value={category} 
            onChange={e => setCategory(e.target.value)} 
            required
          >
            <option key="category-default" value="">{loadingTests ? 'Loading...' : 'Select test category'}</option>
            {Array.from(new Set(availableTests.map(tc => tc.category))).map(cat => (
              <option key={`category-${cat}`} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <div className="bg-gray-50 border rounded p-4 mt-4">
            <h3 className="text-lg font-semibold mb-4">Test Results</h3>
            {tests.map((test, idx) => (
              <div key={`test-row-${idx}`} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end mb-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Test Name *</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={test.testName}
                    onChange={e => handleTestChange(idx, 'testName', e.target.value)}
                    required
                    disabled={!category}
                  >
                    <option key={`test-default-${idx}`} value="">Select test name</option>
                    {filteredTests.map(tc => (
                      <option key={`test-${tc.id}-${idx}`} value={tc.name}>{tc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Value *</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={test.value}
                    onChange={e => handleTestChange(idx, 'value', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Normal Range</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 bg-gray-50"
                    value={test.normalRange}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Unit</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 bg-gray-50"
                    value={test.unit}
                    readOnly
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => removeTestRow(idx)}
                    className="text-red-600 hover:text-red-800"
                    disabled={tests.length === 1}
                  >
                    Remove
                    </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addTestRow}
              className="text-blue-600 hover:text-blue-800"
            >
              + Add Another Test
              </button>
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-gray-700 font-semibold mb-1">Additional Notes</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows="3"
          />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Save Test Results
          </button>
        </div>
        {message && (
          <div className="md:col-span-2 text-green-600">
            {message}
          </div>
        )}
        {error && (
          <div className="md:col-span-2 text-red-600">
            {error}
        </div>
        )}
      </form>
    </div>
  );
};

const TestHistory = ({ refreshFlag }) => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patients, setPatients] = useState({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch patients first
        const patientsRes = await patientService.getAll();
        if (!patientsRes.success) {
          throw new Error('Failed to fetch patients');
        }
        const patientsMap = {};
        patientsRes.data.forEach(p => {
          patientsMap[p.id] = p;
        });
        setPatients(patientsMap);

        // Then fetch tests
        const testsRes = await testService.getAll();
        if (!testsRes.success) {
          throw new Error('Failed to fetch tests');
        }
        setTests(testsRes.data || []); // Ensure tests is always an array
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load test history');
        setTests([]); // Set empty array on error
      }
      setLoading(false);
    };
    fetchData();
  }, [refreshFlag]);

  // Group tests by patientId
  const grouped = {};
  tests.forEach(test => {
    if (!grouped[test.patientId]) grouped[test.patientId] = [];
    grouped[test.patientId].push(test);
  });

  // Filter patients by search
  const filteredPatientIds = Object.keys(grouped).filter(pid => {
    const patient = patients[pid];
    if (!patient) return false;
    return patient.fullName.toLowerCase().includes(search.toLowerCase());
  });

  const getPatientName = (id) => {
    const patient = patients[id];
    return patient ? `${patient.fullName} (${patient.patientCode})` : 'Unknown Patient';
  };

  const handleDelete = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this test result?')) return;
    try {
      const res = await testService.deleteResult(testId);
      if (res.success) {
        setTests(prev => prev.filter(t => t.id !== testId));
      } else {
        setError('Failed to delete test result');
      }
    } catch (err) {
      setError('Failed to connect to backend');
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!tests || tests.length === 0) return (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center">
      <span className="text-5xl text-gray-300 mb-4">🧪</span>
      <div className="text-xl font-semibold text-gray-500 mb-2">No test results found.</div>
      <div className="text-gray-400">Add test results to see them here.</div>
    </div>
  );

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold mb-2">Test History</h2>
      <input
        type="text"
        className="mb-4 px-3 py-2 border rounded w-full max-w-md"
        placeholder="Search patient by name..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {filteredPatientIds.length === 0 ? (
        <div className="text-gray-500">No patients found.</div>
      ) : (
        filteredPatientIds.map((pid, idx) => (
          <div key={pid} className="mb-10">
            <div className="font-bold text-lg mb-2">{idx + 1}. {getPatientName(pid)}</div>
      <div className="overflow-x-auto">
              <table className="min-w-full border text-sm mb-2 rounded-lg overflow-hidden shadow-sm">
          <thead>
                  <tr className="bg-blue-50 text-gray-700">
              <th className="px-4 py-2 border">Category</th>
              <th className="px-4 py-2 border">Date</th>
                    <th className="px-4 py-2 border">Test Name</th>
                    <th className="px-4 py-2 border">Value</th>
                    <th className="px-4 py-2 border">Normal Range</th>
                    <th className="px-4 py-2 border">Unit</th>
              <th className="px-4 py-2 border">Notes</th>
                    <th className="px-4 py-2 border text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
                  {grouped[pid].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((test, tIdx) => (
                    <tr key={test.id} className={tIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 border align-top">{test.category}</td>
                      <td className="px-4 py-2 border align-top whitespace-nowrap">{new Date(test.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-2 border align-top">{test.testName || '-'}</td>
                      <td className="px-4 py-2 border align-top">{test.value || '-'}</td>
                      <td className="px-4 py-2 border align-top">{test.normalRange || '-'}</td>
                      <td className="px-4 py-2 border align-top">{test.unit || '-'}</td>
                      <td className="px-4 py-2 border align-top">{test.notes || '-'}</td>
                      <td className="px-4 py-2 border align-top text-center">
                  <button
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-red-100 focus:outline-none"
                          onClick={() => handleDelete(test.id)}
                    title="Delete test result"
                  >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
          </div>
        ))
      )}
    </div>
  );
};

const Test = () => {
  const [activeTab, setActiveTab] = useState('add');
  const [refreshFlag, setRefreshFlag] = useState(0);
  const handleTestAdded = () => setRefreshFlag(f => f + 1);

  return (
    <div className="p-8 ml-64">
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded font-semibold ${activeTab === 'add' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setActiveTab('add')}
        >
          Add Test Results
        </button>
        <button
          className={`px-4 py-2 rounded font-semibold ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setActiveTab('history')}
        >
          Test History
        </button>
      </div>
      {activeTab === 'add' ? <AddTestResults onTestAdded={handleTestAdded} /> : <TestHistory refreshFlag={refreshFlag} />}
    </div>
  );
};

export default Test;
