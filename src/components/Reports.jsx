import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { patientService, labService, reportService } from '../services/api';

const Reports = () => {
    const [labInfo, setLabInfo] = useState(null);
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [report, setReport] = useState(null);
    const reportRef = useRef();

    useEffect(() => {
        fetchLabInfo();
        fetchPatients();
    }, []);

    const fetchLabInfo = async () => {
        try {
            const response = await labService.getInfo();
            if (response.success) {
                setLabInfo(response.data);
            } else {
                setError('Failed to fetch lab information');
            }
        } catch (e) {
            setError('Failed to fetch lab information');
        }
    };

    const fetchPatients = async () => {
        try {
            const response = await patientService.getAll();
            if (response.success) {
                setPatients(response.data);
                setError(null);
            } else {
                throw new Error('Failed to fetch patients');
            }
        } catch (err) {
            setError('Error loading patients. Please try again later.');
            console.error('Error fetching patients:', err);
        } finally {
            setLoading(false);
        }
    };

    // Filter patients based on search query
    const filteredPatients = patients.filter(patient => {
        const searchLower = searchQuery.toLowerCase();
        return patient.fullName.toLowerCase().includes(searchLower) || 
               patient.patientCode.toLowerCase().includes(searchLower);
    });

    // Handle patient selection
    const handlePatientSelect = (patient) => {
        setSelectedPatient(patient);
        setSearchQuery(patient.fullName);
        setShowDropdown(false);
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setShowDropdown(true);
        if (!e.target.value) {
            setSelectedPatient(null);
        }
    };

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.search-container')) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const generateReport = async () => {
        if (!selectedPatient) {
            setError('Please select a patient first');
            return;
        }
        try {
            setLoading(true);
            const response = await reportService.generate(selectedPatient.id);
            if (response.success) {
                setReport(response.data);
                setError(null);
            } else {
                throw new Error('Failed to generate report');
            }
        } catch (err) {
            setError('Error generating report. Please try again later.');
            console.error('Error generating report:', err);
        } finally {
            setLoading(false);
        }
    };

    const generateShareableLink = (patientCode) => {
        const port = window.location.port;
        return `http://${window.location.hostname}:${port}/view-report/${patientCode}`;
    };

    const shareViaWhatsApp = () => {
        const patientCode = selectedPatient.patientCode;
        const link = generateShareableLink(patientCode);
        const whatsappMessage = `Check out this report: ${link}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
        window.open(whatsappUrl, '_blank');
    };

    // Helper for age/sex string
    const getAgeSex = (age, gender) => `${age} Years / ${gender}`;
    // Helper for date/time
    const now = new Date();
    const reportDate = now.toLocaleDateString();
    const reportTime = now.toLocaleTimeString();

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return;

        try {
            const element = reportRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 800,
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.querySelector('[data-report]');
                    if (clonedElement) {
                        // Base styles for the container
                        clonedElement.style.backgroundColor = '#ffffff';
                        clonedElement.style.color = '#1f2937';
                        clonedElement.style.fontFamily = 'Arial, sans-serif';
                        clonedElement.style.padding = '32px';
                        clonedElement.style.margin = '0 auto';
                        clonedElement.style.width = '800px';
                        clonedElement.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                        clonedElement.style.borderRadius = '8px';

                        // Override all computed styles to replace oklch colors
                        const allElements = clonedElement.querySelectorAll('*');
                        allElements.forEach(el => {
                            const style = window.getComputedStyle(el);

                            // Override background colors
                            if (style.backgroundColor.includes('oklch')) {
                                el.style.backgroundColor = '#ffffff';
                            }

                            // Override text colors
                            if (style.color.includes('oklch')) {
                                el.style.color = '#1f2937';
                            }

                            // Override border colors
                            if (style.borderColor.includes('oklch')) {
                                el.style.borderColor = '#e5e7eb';
                            }

                            // Override any other color properties
                            ['color', 'backgroundColor', 'borderColor', 'borderTopColor',
                                'borderRightColor', 'borderBottomColor', 'borderLeftColor'].forEach(prop => {
                                    if (el.style[prop]?.includes('oklch')) {
                                        el.style.borderColor = '#e5e7eb';
                                    }
                                });
                        });

                        // Style the header section
                        const header = clonedElement.querySelector('.flex.justify-between');
                        if (header) {
                            header.style.borderBottom = '2px solid #e5e7eb';
                            header.style.paddingBottom = '16px';
                            header.style.marginBottom = '24px';
                        }

                        // Style the patient info section
                        const patientInfo = clonedElement.querySelector('.space-y-1');
                        if (patientInfo) {
                            patientInfo.style.marginBottom = '24px';
                        }

                        // Style the table
                        const table = clonedElement.querySelector('table');
                        if (table) {
                            table.style.width = '100%';
                            table.style.borderCollapse = 'collapse';
                            table.style.marginTop = '24px';
                            table.style.marginBottom = '24px';
                        }

                        // Style table headers
                        const thElements = clonedElement.querySelectorAll('th');
                        thElements.forEach(th => {
                            th.style.backgroundColor = '#f3f4f6';
                            th.style.padding = '12px';
                            th.style.textAlign = 'left';
                            th.style.fontWeight = '600';
                            th.style.borderBottom = '2px solid #e5e7eb';
                        });

                        // Style table cells
                        const tdElements = clonedElement.querySelectorAll('td');
                        tdElements.forEach(td => {
                            td.style.padding = '12px';
                            td.style.borderBottom = '1px solid #e5e7eb';
                        });

                        // Style status indicators
                        const statusElements = clonedElement.querySelectorAll('[class*="status-"]');
                        statusElements.forEach(el => {
                            if (el.classList.contains('status-low')) {
                                el.style.color = '#059669';
                                el.style.backgroundColor = '#ecfdf5';
                                el.style.padding = '4px 8px';
                                el.style.borderRadius = '4px';
                                el.style.fontWeight = '500';
                            } else if (el.classList.contains('status-normal')) {
                                el.style.color = '#2563eb';
                                el.style.backgroundColor = '#eff6ff';
                                el.style.padding = '4px 8px';
                                el.style.borderRadius = '4px';
                                el.style.fontWeight = '500';
                            } else if (el.classList.contains('status-high')) {
                                el.style.color = '#dc2626';
                                el.style.backgroundColor = '#fef2f2';
                                el.style.padding = '4px 8px';
                                el.style.borderRadius = '4px';
                                el.style.fontWeight = '500';
                            }
                        });

                        // Style the footer
                        const footer = clonedElement.querySelector('.mt-8');
                        if (footer) {
                            footer.style.marginTop = '32px';
                            footer.style.paddingTop = '16px';
                            footer.style.borderTop = '2px solid #e5e7eb';
                        }
                    }
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 10;

            pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
            pdf.save('lab_report.pdf');
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    const handlePrint = () => {
        if (!reportRef.current) return;

        const printContents = reportRef.current.innerHTML;
        const printWindow = window.open('', '', 'height=900,width=800');
        
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Report</title>
              <style>
                body { 
                  margin: 0;
                  padding: 0;
                  background: #fff;
                  color: #222;
                  font-family: Arial, sans-serif;
                }
                .report-content {
                  width: 800px;
                  margin: 0 auto;
                  padding: 24px;
                  box-sizing: border-box;
                }
                @media print {
                  body { margin: 0; }
                  .report-content { 
                    width: 100%;
                    padding: 0;
                  }
                }
              </style>
            </head>
            <body>
              <div class="report-content">
                ${printContents}
              </div>
            </body>
          </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        
        // Wait for images to load
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
    };

    // Helper: group tests by category
    const groupTestsByCategory = (tests) => {
        const grouped = {};
        tests.forEach(test => {
            if (!grouped[test.testCategory]) grouped[test.testCategory] = [];
            grouped[test.testCategory].push(test);
        });
        return grouped;
    };

    // Helper: status logic
    const getStatus = (test) => {
        const value = test.testValue;
        const ref = String(test.normalRange || '').trim();
        // Handle Positive/Negative
        if (/negative|positive/i.test(ref)) {
            if (String(value).toLowerCase() === 'negative') return 'Negative';
            if (String(value).toLowerCase() === 'positive') return 'Positive';
            // fallback
            return String(value);
        }
        // Numeric range logic
        const range = ref.replace('–', '-').replace(/ /g, '');
        const match = range.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
        if (match) {
            const low = parseFloat(match[1]);
            const high = parseFloat(match[2]);
            const num = parseFloat(value);
            if (!isNaN(num)) {
                if (num < low) return 'Low';
                if (num > high) return 'High';
                return 'Normal';
            }
        }
        // < or > logic
        if (range.startsWith('<')) {
            const high = parseFloat(range.slice(1));
            const num = parseFloat(value);
            if (!isNaN(num)) {
                if (num >= high) return 'High';
                return 'Normal';
            }
        }
        if (range.startsWith('>')) {
            const low = parseFloat(range.slice(1));
            const num = parseFloat(value);
            if (!isNaN(num)) {
                if (num <= low) return 'Low';
                return 'Normal';
            }
        }
        // fallback
        return 'Normal';
    };

    return (
        <div className="p-8 ml-64">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
                <p className="text-gray-600 mt-2">Generate and view patient reports</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Generate Report</h2>
                <div className="space-y-4">
                    <div className="mb-6">
                        <label className="block text-gray-700 font-semibold mb-1">Search Patient</label>
                        <div className="patient-dropdown relative">
                            <div 
                                className="w-full border rounded px-3 py-2 flex items-center justify-between cursor-pointer bg-white"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <span>
                                    {selectedPatient ? 
                                        patients.find(p => p.id === selectedPatient.id)?.fullName || 'Select a patient' : 
                                        'Select a patient'
                                    }
                                </span>
                                <span className="material-icons text-gray-400">
                                    {isDropdownOpen ? 'expand_less' : 'expand_more'}
                                </span>
                            </div>

                            {isDropdownOpen && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                                    <div className="p-2">
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border rounded"
                                            placeholder="Search patient..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="max-h-60 overflow-auto">
                                        {filteredPatients.length > 0 ? (
                                            filteredPatients.map(patient => (
                                                <div
                                                    key={patient.id}
                                                    onClick={() => {
                                                        handlePatientSelect(patient);
                                                        setIsDropdownOpen(false);
                                                        setSearchQuery('');
                                                    }}
                                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                >
                                                    <div className="font-medium">{patient.fullName}</div>
                                                    <div className="text-sm text-gray-500">Code: {patient.patientCode}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-2 text-gray-500">No patients found</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedPatient && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-md">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Patient Name</p>
                                    <p className="font-medium">{selectedPatient.fullName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Patient Code</p>
                                    <p className="font-medium">{selectedPatient.patientCode}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Age</p>
                                    <p className="font-medium">{selectedPatient.age}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Gender</p>
                                    <p className="font-medium">{selectedPatient.gender}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end mt-4">
                        <button
                            onClick={generateReport}
                            disabled={!selectedPatient || loading}
                            className={`px-4 py-2 rounded-md text-white flex items-center ${
                                !selectedPatient || loading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {loading ? (
                                <>
                                    <span className="material-icons animate-spin mr-2">refresh</span>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <span className="material-icons mr-2">description</span>
                                    Generate Report
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Display Section */}
            {report && labInfo && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-4xl mx-auto">
                    <div className="flex justify-end mb-4 gap-2">
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            Print Report
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Download Report
                        </button>
                        <button
                            onClick={shareViaWhatsApp}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            Share via WhatsApp
                        </button>
                    </div>
                    <div
                        ref={reportRef}
                        data-report
                        style={{
                            background: '#ffffff',
                            color: '#222222',
                            width: '800px',
                            fontFamily: 'Arial, sans-serif',
                            margin: '0 auto',
                            padding: '24px',
                            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                            borderRadius: '8px'
                        }}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h1 className="text-2xl font-bold text-blue-900 uppercase">{labInfo.name}</h1>
                                <p className="text-gray-700 text-sm font-medium">{labInfo.slogan}</p>
                                <div className="mt-2 text-gray-600 text-sm">
                                    <div className="flex items-center gap-2"><span className="material-icons text-base">location_on</span>{labInfo.address}</div>
                                    <div className="flex items-center gap-2"><span className="material-icons text-base">call</span>{labInfo.phone}</div>
                                    <div className="flex items-center gap-2"><span className="material-icons text-base">email</span>{labInfo.email}</div>
                                </div>
                            </div>
                            <div className="bg-blue-50 rounded-lg px-4 py-2 text-xs text-blue-900 font-semibold text-right shadow-sm">
                                NABL Accredited<br />ISO 15189:2012<br />CAP Certified
                            </div>
                        </div>
                        <hr className="my-4 border-blue-200" />
                        <div className="text-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800 tracking-wide">LABORATORY INVESTIGATION REPORT</h2>
                        </div>
                        <hr className="mb-6 border-blue-200" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-gray-50 rounded p-4 border border-gray-200">
                                <h3 className="font-semibold text-gray-700 mb-2 text-sm">PATIENT INFORMATION</h3>
                                <div className="text-sm">
                                    <div className="mb-1"><span className="font-medium">Name:</span> {report.patientName}</div>
                                    <div className="mb-1"><span className="font-medium">Age/Sex:</span> {getAgeSex(report.patientAge, report.patientGender)}</div>
                                    <div className="mb-1"><span className="font-medium">Patient ID:</span> {report.patientCode}</div>
                                    <div className="mb-1"><span className="font-medium">Contact:</span> {report.contactNumber}</div>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded p-4 border border-gray-200">
                                <h3 className="font-semibold text-gray-700 mb-2 text-sm">REPORT DETAILS</h3>
                                <div className="text-sm">
                                    <div className="mb-1"><span className="font-medium">Report Date:</span> {reportDate}</div>
                                    <div className="mb-1"><span className="font-medium">Report Time:</span> {reportTime}</div>
                                    <div className="mb-1"><span className="font-medium">REF. BY:</span> {report.refBy || '-'}</div>
                                    <div className="mb-1"><span className="font-medium">Lab Ref No:</span> {report.labRefNo || '-'}</div>
                                </div>
                            </div>
                        </div>
                        {/* Grouped test tables */}
                        {Object.entries(groupTestsByCategory(report.tests)).map(([category, tests]) => (
                            <div key={category} style={{ marginBottom: 32 }}>
                                <div style={{ background: '#eaf2fb', padding: 8, fontWeight: 'bold', fontSize: 16, marginBottom: 0, borderLeft: '4px solid #1976d2' }}>{category.toUpperCase()}</div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                                    <thead>
                                        <tr style={{ background: '#f7f7f7' }}>
                                            <th style={{ border: '1px solid #ccc', padding: 8 }}>TEST NAME</th>
                                            <th style={{ border: '1px solid #ccc', padding: 8 }}>RESULT</th>
                                            <th style={{ border: '1px solid #ccc', padding: 8 }}>UNIT</th>
                                            <th style={{ border: '1px solid #ccc', padding: 8 }}>REFERENCE RANGE</th>
                                            <th style={{ border: '1px solid #ccc', padding: 8 }}>STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tests.map((test, idx) => {
                                            const status = getStatus(test);
                                            let color = '#388e3c';
                                            if (status === 'Low' || status === 'High' || status === 'Positive') color = '#d32f2f';
                                            if (status === 'Negative' || status === 'Normal') color = '#388e3c';
                                            let arrow = '';
                                            if (status === 'Low') arrow = '↓';
                                            if (status === 'High') arrow = '↑';
                                            return (
                                                <tr key={test.id || idx}>
                                                    <td style={{ border: '1px solid #ccc', padding: 8 }}>{test.testName}</td>
                                                    <td style={{ border: '1px solid #ccc', padding: 8, color }}>{test.testValue} {arrow}</td>
                                                    <td style={{ border: '1px solid #ccc', padding: 8 }}>{test.unit}</td>
                                                    <td style={{ border: '1px solid #ccc', padding: 8 }}>{test.normalRange}</td>
                                                    <td style={{ border: '1px solid #ccc', padding: 8, color, fontWeight: 'bold' }}>{status}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                            <h4 className="font-bold text-gray-800 mb-2">CLINICAL INTERPRETATION</h4>
                            <ul className="list-disc pl-5 text-sm text-gray-700">
                                <li>Values marked with ↑ (High) or ↓ (Low) are outside the reference range</li>
                                <li>Reference ranges may vary based on age, gender, and laboratory methodology</li>
                                <li>Please correlate with clinical findings and consult your physician for interpretation</li>
                            </ul>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-600 mt-8">
                            <div>
                                <div>Lab Director: </div>
                                <div>Pathologist & Laboratory Director</div>
                            </div>
                            <div className="text-right">
                                <div>This is a computer generated report</div>
                                <div>Report generated on: {reportDate}, {reportTime}</div>
                            </div>
                        </div>
                        <div className="bg-gray-100 text-xs text-gray-700 p-4 rounded mt-6">
                            <span className="font-bold block mb-1">IMPORTANT MEDICAL DISCLAIMER:</span>
                            This report contains confidential medical information. The results should be interpreted by a qualified healthcare professional in conjunction with clinical history and other diagnostic tests. Normal values may vary between laboratories due to differences in equipment, reagents, and methodologies. For any queries regarding this report, please contact our laboratory at the above mentioned contact details.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports; 