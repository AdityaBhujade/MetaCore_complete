import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import companyLogo from '../assets/company.png';
import azazKhanSignature from '../assets/azaz khan.png';
// import ReactQRCode from 'react-qr-code';

const ViewReport = () => {
  const { patientCode } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const reportRef = useRef();

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/reports/public/${patientCode}`);
        if (!response.ok) throw new Error('Report not found');
        const data = await response.json();
        setReport(data);
      } catch (err) {
        setError('Could not load report.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [patientCode]);

  const handleDownloadPDF = () => {
    if (!reportRef.current) return;
    import('html2pdf.js').then(html2pdf => {
      html2pdf.default(reportRef.current, {
        margin: [0, 0],
        filename: 'Lab_Report.pdf',
        html2canvas: { scale: 2, width: 794 }, // 210mm at 96dpi = 794px
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      });
    });
  };

  if (loading) return <div style={{textAlign:'center',marginTop:40}}>Loading...</div>;
  if (error) return <div style={{textAlign:'center',marginTop:40,color:'#d32f2f'}}>{error}</div>;
  if (!report) return <div style={{textAlign:'center',marginTop:40}}>No report found.</div>;

  // Flatten all tests and infer category if missing
  const allTests = (report.tests || []).map(t => ({
    ...t,
    category: t.testCategory && t.testCategory.trim() ? t.testCategory : 'Other',
  }));
  const now = new Date();
  const publicLink = `http://${window.location.hostname}:${window.location.port}/view-report/${report.patientCode || report.patient_code}`;

  return (
    <>
      <style>{`
        @media print {
          .report-content {
            width: 210mm !important;
            min-height: 297mm !important;
            max-width: 210mm !important;
            margin: 0 !important;
            padding: 12mm !important;
            box-sizing: border-box;
            overflow: hidden;
          }
          table, th, td {
            border: 1.5px solid #000 !important;
            border-collapse: collapse !important;
          }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
        }
        table, th, td {
          border: 1.5px solid #000;
          border-collapse: collapse;
        }
        th, td {
          padding: 8px;
        }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }
      `}</style>
      <div style={{ background: '#eaf2fb', color: '#222', width: '210mm', minHeight: '297mm', maxWidth: '210mm', fontFamily: 'Arial, sans-serif', margin: '0 auto', padding: 32, boxSizing: 'border-box', boxShadow: '0 0 0.5mm #ccc', overflow: 'hidden' }}>
        {/* Download PDF Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button onClick={handleDownloadPDF} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 20px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>
            Download PDF
          </button>
        </div>
        <div ref={reportRef} className="report-content" style={{ background: '#eaf2fb', color: '#222', width: '210mm', minHeight: '297mm', maxWidth: '210mm', fontFamily: 'Arial, sans-serif', margin: '0 auto', padding: 24, boxSizing: 'border-box', boxShadow: '0 0 0.5mm #ccc', overflow: 'hidden' }}>
          {/* Header: Company Info and Logo */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#1976d2', fontWeight: 'bold', fontSize: 28, marginBottom: 2 }}>{report.labName || 'Company Name'}</div>
              <div style={{ fontSize: 16, color: '#222', marginBottom: 2 }}>{report.labAddress}</div>
              <div style={{ fontSize: 16, color: '#222', marginBottom: 2 }}>Phone: {report.labPhone}</div>
              <div style={{ fontSize: 16, color: '#222' }}>Email: {report.labEmail}</div>
            </div>
            <img src={companyLogo} alt="Company Logo" style={{ height: 140, marginLeft: 32, marginRight: 0 }} />
          </div>
          <hr style={{ margin: '16px 0 8px 0', border: 'none', borderTop: '2px solid #1976d2' }} />
          <h2 style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 24, margin: '16px 0' }}>LABORATORY INVESTIGATION REPORT</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '24px 0' }}>
            <div style={{ flex: 1, marginRight: 16, background: '#fff', padding: 12, borderRadius: 8 }}>
              <h4 style={{ fontWeight: 'bold', marginBottom: 8 }}>PATIENT INFORMATION</h4>
              <div><b>Name:</b> {report.patientName}</div>
              <div><b>Age/Sex:</b> {report.patientAge} Years / {report.patientGender && report.patientGender[0].toUpperCase()}</div>
              <div><b>Patient ID:</b> {report.patientCode}</div>
              <div><b>Contact:</b> {report.patientContact || report.contactNumber || (report.patient && report.patient.contactNumber) || '-'}</div>
            </div>
            <div style={{ flex: 1, background: '#fff', padding: 12, borderRadius: 8 }}>
              <h4 style={{ fontWeight: 'bold', marginBottom: 8 }}>REPORT DETAILS</h4>
              <div><b>Report Date:</b> {now.toLocaleDateString()}</div>
              <div><b>Report Time:</b> {now.toLocaleTimeString()}</div>
              <div><b>REF. BY:</b> {report.refBy || report.ref_by || (report.patient && report.patient.refBy) || '-'}</div>
            </div>
          </div>
          {/* Group tests by category */}
          {Object.entries(allTests.reduce((acc, test) => {
            const category = test.category || 'Other';
            if (!acc[category]) acc[category] = [];
            acc[category].push(test);
            return acc;
          }, {})).map(([category, tests]) => (
            <React.Fragment key={category}>
              <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 0, borderLeft: '4px solid #1976d2', color: '#1976d2', background: '#fff', padding: 8, borderTopLeftRadius: 6, borderTopRightRadius: 6 }}>{category.toUpperCase()} PROFILE</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, background: '#fff', border: '1.5px solid #000', borderRadius: 8, overflow: 'hidden' }}>
                <thead>
                  <tr style={{ background: '#f9f9f9' }}>
                    <th style={{ padding: '10px 8px', border: '1.5px solid #000', color: '#1976d2', background: '#fff', fontWeight: 'bold' }}>TEST NAME</th>
                    <th style={{ padding: '10px 8px', border: '1.5px solid #000', color: '#1976d2', background: '#fff', fontWeight: 'bold' }}>RESULT</th>
                    <th style={{ padding: '10px 8px', border: '1.5px solid #000', color: '#1976d2', background: '#fff', fontWeight: 'bold' }}>UNIT</th>
                    <th style={{ padding: '10px 8px', border: '1.5px solid #000', color: '#1976d2', background: '#fff', fontWeight: 'bold' }}>REFERENCE RANGE</th>
                    <th style={{ padding: '10px 8px', border: '1.5px solid #000', color: '#1976d2', background: '#fff', fontWeight: 'bold' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((test, idx) => {
                    // Calculate status
                    let status = 'Normal', arrow = '', color = '#388e3c';
                    let value = parseFloat(test.testValue);
                    let refRange = test.normalRange || test.ref || '';
                    let min = null, max = null;
                    if (refRange && refRange.includes('–')) {
                      const [minStr, maxStr] = refRange.split('–');
                      min = parseFloat(minStr);
                      max = parseFloat(maxStr);
                    } else if (refRange && refRange.startsWith('<')) {
                      max = parseFloat(refRange.replace(/[^0-9.\-]/g, ''));
                    } else if (refRange && refRange.startsWith('>')) {
                      min = parseFloat(refRange.replace(/[^0-9.\-]/g, ''));
                    }
                    if (!isNaN(value)) {
                      if (min !== null && value < min) {
                        status = 'Low'; arrow = '↓'; color = '#d32f2f';
                      } else if (max !== null && value > max) {
                        status = 'High'; arrow = '↑'; color = '#d32f2f';
                      }
                    } else {
                      status = '';
                      arrow = '';
                      color = '#222';
                    }
                    return (
                      <tr key={idx} style={{ background: '#fff' }}>
                        <td style={{ padding: '8px', border: '1.5px solid #000' }}>{test.testName}</td>
                        <td style={{ padding: '8px', border: '1.5px solid #000', color }}>{test.testValue}</td>
                        <td style={{ padding: '8px', border: '1.5px solid #000' }}>{test.unit}</td>
                        <td style={{ padding: '8px', border: '1.5px solid #000' }}>{test.normalRange}</td>
                        <td style={{ padding: '8px', border: '1.5px solid #000', color, fontWeight: 'bold' }}>{status} {arrow}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </React.Fragment>
          ))}
          <div style={{ background: '#fff', borderLeft: '4px solid #ffe066', padding: '12px 24px', margin: 0, color: '#222', fontSize: 18, boxSizing: 'border-box' }}>
            <div style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 4 }}>CLINICAL INTERPRETATION</div>
            <ul style={{ margin: 0, paddingLeft: 22, fontSize: 17, color: '#222' }}>
              <li>Values marked with ↑ (High) or ↓ (Low) are outside the reference range.</li>
              <li>Reference ranges may vary based on age, gender, and laboratory methodology</li>
              <li>Please correlate with clinical findings and consult your physician for interpretation</li>
            </ul>
          </div>
          {/* Signature and Lab Director Info Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#eaf2fb', padding: '0 0 0 0', marginTop: 32, marginBottom: 48, pageBreakInside: 'avoid' }}>
            <div style={{ fontSize: 16, color: '#222', marginTop: 8 }}>
              Lab Director: Dr. Sarah Johnson, MD<br />
              Pathologist & Laboratory Director
              <div style={{ marginTop: 24 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Scan to view online:</div>
                <ReactQRCode value={publicLink} size={110} fgColor="#000000" />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right', marginTop: 0, minWidth: 260 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <img src={azazKhanSignature} alt="Signature" style={{ height: 48, marginBottom: 4 }} />
                <span style={{ fontWeight: 'bold', fontSize: 18, textAlign: 'center', width: '100%' }}>Dr. AJAZ KHAN<br />MD, (MBBS)</span>
              </div>
              <span style={{ fontWeight: 'bold', fontSize: 15, textAlign: 'center', width: '100%' }}>CONSULTANT PATHOLOGIST</span>
              <span style={{ fontSize: 13, color: '#222', textAlign: 'center', width: '100%' }}>This is a computer generated report</span>
              <span style={{ fontSize: 13, color: '#222', textAlign: 'center', width: '100%' }}>Report generated on: {now.toLocaleDateString()}, {now.toLocaleTimeString()}</span>
            </div>
          </div>
          <div style={{ clear: 'both', marginTop: 56, fontSize: 12, color: '#333', background: '#fff', padding: 12, borderRadius: 8 }}>
            <b style={{ color: '#1976d2' }}>IMPORTANT MEDICAL DISCLAIMER:</b><br />
            This report contains confidential medical information. The results should be interpreted by a qualified healthcare professional in conjunction with clinical history and other diagnostic tests. Normal values may vary between laboratories due to differences in equipment, reagents, and methodologies. For any queries regarding this report, please contact our laboratory at the above mentioned contact details.
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewReport;