/**
 * Formal Academic PDF Generator for Quality Reports
 * Generates publication-ready PDF documents suitable for academic papers
 */

import jsPDF from 'jspdf';

interface QualityReport {
  file_name?: string;
  report_generated_at?: string | number;
  qc_version?: string;
  summary?: {
    total_data_points?: number;
    overall_quality_score?: number;
    quality_status?: string;
    flag_summary?: Record<string, number>;
  };
  detailed_metrics?: {
    overall_quality_score?: number;
    good_percentage?: number;
    suspect_percentage?: number;
    fail_percentage?: number;
    missing_percentage?: number;
  };
  data_analysis?: {
    has_coordinates?: boolean;
    has_temporal_data?: boolean;
    has_numeric_data?: boolean;
    numeric_column_count?: number;
    data_characteristics?: {
      sensor_data?: boolean;
      occurrence_data?: boolean;
      duplicate_percentage?: number;
      missing_percentage?: number;
    };
  };
  test_rationale?: Record<string, string>;
  tests_executed?: string[];
  test_results?: Record<string, any>;
  recommendations?: string[];
}

export function generateFormalPDF(qualityReport: QualityReport) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  // Helper function to add new page if needed
  const checkNewPage = (requiredHeight: number) => {
    if (yPos + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper function to add text with word wrap
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 11, fontStyle: 'normal' | 'bold' | 'italic' = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return lines.length * (fontSize * 0.35); // Approximate line height
  };

  // Title Page
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Data Quality Assessment Report', margin, yPos);
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Kadal AI Quality Control System', margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.text(`File: ${qualityReport.file_name || 'Unknown'}`, margin, yPos);
  yPos += 5;
  doc.text(`Generated: ${new Date(qualityReport.report_generated_at || Date.now()).toLocaleString()}`, margin, yPos);
  yPos += 5;
  doc.text(`QC Version: ${qualityReport.qc_version || '1.0.0'}`, margin, yPos);
  yPos += 15;

  // Abstract/Executive Summary
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', margin, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const summaryText = `This report presents a comprehensive quality assessment of the dataset "${qualityReport.file_name || 'Unknown'}". ` +
    `The analysis was conducted using the Kadal AI Quality Control (Kadal-QC) system, which employs intelligent test selection ` +
    `based on data characteristics. The dataset contains ${qualityReport.summary?.total_data_points || 0} data points, ` +
    `with an overall quality score of ${(qualityReport.summary?.overall_quality_score || qualityReport.detailed_metrics?.overall_quality_score || 0).toFixed(1)}% ` +
    `(${qualityReport.summary?.quality_status || 'UNKNOWN'} quality status).`;
  
  yPos += addWrappedText(summaryText, margin, yPos, contentWidth, 11);
  yPos += 10;

  // 1. Introduction
  checkNewPage(30);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Introduction', margin, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const introText = `Data quality assessment is a critical component of oceanographic and marine data management. ` +
    `This report documents the quality control procedures applied to the dataset using the Kadal-QC system, ` +
    `which implements intelligent test selection based on data structure analysis. The system automatically ` +
    `identifies appropriate quality control tests based on the presence of geographic coordinates, temporal ` +
    `data, numeric measurements, and other data characteristics.`;
  
  yPos += addWrappedText(introText, margin, yPos, contentWidth, 11);
  yPos += 10;

  // 2. Data Characteristics
  checkNewPage(40);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Data Characteristics', margin, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const dataAnalysis = qualityReport.data_analysis || {};
  let characteristicsText = `The dataset was analyzed to determine its structural characteristics:\n\n`;
  
  if (dataAnalysis.has_coordinates) {
    characteristicsText += `• Geographic coordinates present: The dataset contains latitude and longitude information.\n`;
  }
  if (dataAnalysis.has_temporal_data) {
    characteristicsText += `• Temporal data present: The dataset includes time-series information.\n`;
  }
  if (dataAnalysis.has_numeric_data) {
    characteristicsText += `• Numeric measurements: ${dataAnalysis.numeric_column_count || 0} numeric columns detected.\n`;
  }
  
  if (dataAnalysis.data_characteristics) {
    const chars = dataAnalysis.data_characteristics;
    if (chars.sensor_data) {
      characteristicsText += `• Sensor data detected: Multiple numeric columns suggest sensor-based measurements.\n`;
    }
    if (chars.occurrence_data) {
      characteristicsText += `• Occurrence data detected: Dataset appears to contain occurrence/observation records.\n`;
    }
    if (chars.duplicate_percentage !== undefined) {
      characteristicsText += `• Duplicate records: ${chars.duplicate_percentage.toFixed(1)}% of records are duplicates.\n`;
    }
    if (chars.missing_percentage !== undefined) {
      characteristicsText += `• Missing data: ${chars.missing_percentage.toFixed(1)}% of values are missing.\n`;
    }
  }

  yPos += addWrappedText(characteristicsText, margin, yPos, contentWidth, 11);
  yPos += 10;

  // 3. Quality Control Methodology
  checkNewPage(50);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Quality Control Methodology', margin, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const methodText = `The Kadal-QC system employs an intelligent test selection algorithm that analyzes the dataset ` +
    `structure and automatically selects appropriate quality control tests. This approach ensures that only ` +
    `relevant tests are applied, reducing false positives and improving efficiency. The following quality ` +
    `control tests were executed based on the data characteristics identified in Section 2:`;
  
  yPos += addWrappedText(methodText, margin, yPos, contentWidth, 11);
  yPos += 8;

  // Test Rationale
  if (qualityReport.test_rationale && Object.keys(qualityReport.test_rationale).length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('3.1 Test Selection Rationale', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const testsExecuted = qualityReport.tests_executed || Object.keys(qualityReport.test_rationale);
    testsExecuted.forEach((test, index) => {
      checkNewPage(20);
      const testName = test.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const rationale = qualityReport.test_rationale![test] || 'No rationale available.';
      
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${testName}`, margin, yPos);
      yPos += 6;
      
      doc.setFont('helvetica', 'normal');
      yPos += addWrappedText(rationale, margin + 5, yPos, contentWidth - 5, 10);
      yPos += 5;
    });
  }

  yPos += 5;

  // 4. Quality Control Results
  checkNewPage(60);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('4. Quality Control Results', margin, yPos);
  yPos += 8;

  // Flag Distribution Table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('4.1 Flag Distribution', margin, yPos);
  yPos += 8;

  const flagSummary = qualityReport.summary?.flag_summary || {};
  const totalPoints = qualityReport.summary?.total_data_points || 1;
  const tableHeaders = ['Flag', 'Count', 'Percentage'];
  const tableData = [
    ['GOOD', flagSummary.GOOD || 0, ((flagSummary.GOOD || 0) / totalPoints * 100).toFixed(2) + '%'],
    ['SUSPECT', flagSummary.SUSPECT || 0, ((flagSummary.SUSPECT || 0) / totalPoints * 100).toFixed(2) + '%'],
    ['FAIL', flagSummary.FAIL || 0, ((flagSummary.FAIL || 0) / totalPoints * 100).toFixed(2) + '%'],
    ['MISSING', flagSummary.MISSING || 0, ((flagSummary.MISSING || 0) / totalPoints * 100).toFixed(2) + '%'],
    ['UNKNOWN', flagSummary.UNKNOWN || 0, ((flagSummary.UNKNOWN || 0) / totalPoints * 100).toFixed(2) + '%']
  ];

  // Draw table
  const colWidths = [60, 40, 40];
  const rowHeight = 8;
  let xPos = margin;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  tableHeaders.forEach((header, i) => {
    doc.rect(xPos, yPos - 6, colWidths[i], rowHeight);
    doc.text(header, xPos + 2, yPos - 1);
    xPos += colWidths[i];
  });
  yPos += rowHeight;
  xPos = margin;

  // Data rows
  doc.setFont('helvetica', 'normal');
  tableData.forEach(row => {
    checkNewPage(rowHeight + 2);
    row.forEach((cell, i) => {
      doc.rect(xPos, yPos - 6, colWidths[i], rowHeight);
      doc.text(String(cell), xPos + 2, yPos - 1);
      xPos += colWidths[i];
    });
    yPos += rowHeight;
    xPos = margin;
  });
  yPos += 5;

  // Quality Metrics
  checkNewPage(30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('4.2 Quality Metrics', margin, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  const metrics = qualityReport.detailed_metrics || {};
  const metricsText = `Overall Quality Score: ${(metrics.overall_quality_score || 0).toFixed(2)}%\n` +
    `Good Data: ${(metrics.good_percentage || 0).toFixed(2)}%\n` +
    `Suspect Data: ${(metrics.suspect_percentage || 0).toFixed(2)}%\n` +
    `Failed Data: ${(metrics.fail_percentage || 0).toFixed(2)}%\n` +
    `Missing Data: ${(metrics.missing_percentage || 0).toFixed(2)}%`;
  
  yPos += addWrappedText(metricsText, margin, yPos, contentWidth, 11);
  yPos += 10;

  // 4.3 Individual Test Results
  const testResults = qualityReport.test_results || {};
  if (Object.keys(testResults).length > 0) {
    checkNewPage(50);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('4.3 Individual Test Results', margin, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    Object.entries(testResults).forEach(([testName, testData], testIndex) => {
      checkNewPage(50);
      const testDisplayName = testName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`${testIndex + 1}. ${testDisplayName}`, margin, yPos);
      yPos += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      const rowsFlagged = (testData as any).rows_flagged || (testData as any).total_rows_flagged || 0;
      let testDetails = `Total Rows Flagged: ${rowsFlagged}\n`;

      if ((testData as any).columns_checked && (testData as any).columns_checked.length > 0) {
        testDetails += `Columns Checked: ${(testData as any).columns_checked.join(', ')}\n\n`;
      }

      yPos += addWrappedText(testDetails, margin, yPos, contentWidth, 10);
      yPos += 10;
    });
  }

  // 5. Recommendations
  if (qualityReport.recommendations && qualityReport.recommendations.length > 0) {
    checkNewPage(40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('5. Recommendations', margin, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    qualityReport.recommendations.forEach((rec, index) => {
      checkNewPage(15);
      yPos += addWrappedText(`${index + 1}. ${rec}`, margin, yPos, contentWidth, 11);
      yPos += 5;
    });
  }

  // Footer on each page
  const addFooter = (pageNum: number) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Kadal AI Quality Control Report - Page ${pageNum}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      `Generated by Kadal-QC v${qualityReport.qc_version || '1.0.0'}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
    doc.setTextColor(0, 0, 0);
  };

  // Add footer to all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i);
  }

  // Save PDF
  const fileName = `Quality_Report_${(qualityReport.file_name || 'report').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

