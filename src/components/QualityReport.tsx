import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiDownload, FiChevronDown, FiChevronUp, FiFileText } from 'react-icons/fi';
import { saveAs } from 'file-saver';
import { generateFormalPDF } from '../lib/pdfGenerator';
import './QualityReport.css';

interface QualityReportProps {
  qualityReport: any;
  onClose: () => void;
}

const QualityReport: React.FC<QualityReportProps> = ({ qualityReport, onClose }) => {
  const [expandedTests, setExpandedTests] = useState<Record<string, boolean>>({});

  if (!qualityReport) return null;

  const { summary, detailed_metrics, recommendations, tests_executed, test_results, test_rationale } = qualityReport;
  
  const qualityScore = detailed_metrics?.overall_quality_score || 0;
  const qualityStatus = summary?.quality_status || 'UNKNOWN';

  const toggleTest = (testName: string) => {
    setExpandedTests(prev => ({
      ...prev,
      [testName]: !prev[testName]
    }));
  };

  const handleDownloadJSON = () => {
    const dataStr = JSON.stringify(qualityReport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const filename = qualityReport.file_name || 'report';
    const dateStr = new Date().toISOString().split('T')[0];
    saveAs(dataBlob, `quality-report-${filename}-${dateStr}.json`);
  };

  const handleDownloadPDF = () => {
    try {
      generateFormalPDF(qualityReport);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GOOD':
        return '#15803D'; // success green
      case 'SUSPECT':
        return '#D97706'; // accent amber
      case 'FAIL':
        return '#B91C1C'; // danger red
      default:
        return '#5B7280'; // text-muted
    }
  };

  const getFlagColor = (flag: string) => {
    switch (flag) {
      case 'GOOD':
        return '#15803D';
      case 'SUSPECT':
        return '#D97706';
      case 'FAIL':
        return '#B91C1C';
      case 'MISSING':
        return '#5B7280';
      default:
        return '#5B7280';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="quality-report-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="quality-report-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="quality-report-header">
            <div>
              <h2 className="quality-report-title">Data Quality Report</h2>
              <p className="quality-report-subtitle">
                {qualityReport.file_name || 'Unknown File'}
              </p>
            </div>
            <div className="quality-report-actions">
              <button
                className="quality-report-btn download-btn"
                onClick={handleDownloadJSON}
              >
                <FiDownload className="icon" />
                JSON
              </button>
              <button
                className="quality-report-btn pdf-btn"
                onClick={handleDownloadPDF}
              >
                <FiFileText className="icon" />
                PDF
              </button>
              <button
                className="quality-report-btn close-btn"
                onClick={onClose}
              >
                <FiX className="icon" />
                Close
              </button>
            </div>
          </div>

          {/* Quality Score Card */}
          <div 
            className="quality-score-card"
            style={{ borderColor: getStatusColor(qualityStatus) }}
          >
            <div className="quality-score-value" style={{ color: getStatusColor(qualityStatus) }}>
              {qualityScore.toFixed(1)}%
            </div>
            <div className="quality-status-text" style={{ color: getStatusColor(qualityStatus) }}>
              {qualityStatus}
            </div>
            <div className="quality-score-label">Overall Quality Score</div>
          </div>

          {/* Flag Summary */}
          {summary?.flag_summary && (
            <div className="quality-section">
              <h3 className="quality-section-title">Flag Distribution</h3>
              <div className="flag-summary-grid">
                {Object.entries(summary.flag_summary).map(([flag, count]) => (
                  <div key={flag} className="flag-summary-item">
                    <div 
                      className="flag-indicator"
                      style={{ backgroundColor: getFlagColor(flag) }}
                    />
                    <div className="flag-info">
                      <div className="flag-name">{flag}</div>
                      <div className="flag-count">{count as number} points</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Metrics */}
          {detailed_metrics && (
            <div className="quality-section">
              <h3 className="quality-section-title">Detailed Metrics</h3>
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-label">Good Data</div>
                  <div className="metric-value" style={{ color: '#00ff88' }}>
                    {detailed_metrics.good_percentage?.toFixed(1) || 0}%
                  </div>
                  <div className="metric-count">
                    {summary?.flag_summary?.GOOD || 0} points
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Suspect Data</div>
                  <div className="metric-value" style={{ color: '#ffd700' }}>
                    {detailed_metrics.suspect_percentage?.toFixed(1) || 0}%
                  </div>
                  <div className="metric-count">
                    {summary?.flag_summary?.SUSPECT || 0} points
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Failed Data</div>
                  <div className="metric-value" style={{ color: '#ef4444' }}>
                    {detailed_metrics.fail_percentage?.toFixed(1) || 0}%
                  </div>
                  <div className="metric-count">
                    {summary?.flag_summary?.FAIL || 0} points
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Missing Data</div>
                  <div className="metric-value" style={{ color: '#9ca3af' }}>
                    {detailed_metrics.missing_percentage?.toFixed(1) || 0}%
                  </div>
                  <div className="metric-count">
                    {summary?.flag_summary?.MISSING || 0} points
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tests Executed */}
          {tests_executed && tests_executed.length > 0 && (
            <div className="quality-section">
              <h3 className="quality-section-title">QC Tests Executed</h3>
              <div className="tests-list">
                {tests_executed.map((test: string, idx: number) => {
                  const testName = test.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  const rationale = test_rationale?.[test] || 'Test applied based on data characteristics.';
                  const testData = test_results?.[test];
                  const isExpanded = expandedTests[test];

                  return (
                    <div key={idx} className="test-item">
                      <div 
                        className="test-header"
                        onClick={() => toggleTest(test)}
                      >
                        <div className="test-name-badge">{testName}</div>
                        {testData && (
                          <div className="test-flagged-badge">
                            {testData.rows_flagged || testData.total_rows_flagged || 0} rows flagged
                          </div>
                        )}
                        {isExpanded ? (
                          <FiChevronUp className="test-toggle-icon" />
                        ) : (
                          <FiChevronDown className="test-toggle-icon" />
                        )}
                      </div>
                      <div className="test-rationale">{rationale}</div>
                      
                      {isExpanded && testData && (
                        <div className="test-details">
                          {testData.columns_checked && testData.columns_checked.length > 0 && (
                            <div className="test-detail-item">
                              <span className="test-detail-label">Columns Checked:</span>
                              <span className="test-detail-value">
                                {testData.columns_checked.join(', ')}
                              </span>
                            </div>
                          )}
                          {testData.column_results && Object.keys(testData.column_results).length > 0 && (
                            <div className="test-column-results">
                              <div className="test-detail-label">Column-Specific Results:</div>
                              {Object.entries(testData.column_results).map(([colName, colResult]: [string, any]) => (
                                <div key={colName} className="column-result-item">
                                  <div className="column-result-header">
                                    <span className="column-name">{colName}</span>
                                    <span className="column-flagged">
                                      {colResult.rows_flagged || 0} flagged
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations && recommendations.length > 0 && (
            <div className="quality-section">
              <h3 className="quality-section-title">Recommendations</h3>
              <div className="recommendations-list">
                {recommendations.map((rec: string, idx: number) => (
                  <div key={idx} className="recommendation-item">
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QualityReport;

