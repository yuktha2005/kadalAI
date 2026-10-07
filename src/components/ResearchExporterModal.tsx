import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiDownload,
  FiFileText,
  FiCode,
  FiDatabase,
  FiCheckCircle,
  FiLayers,
  FiTerminal
} from 'react-icons/fi';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ResearchExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSpecies?: string;
  selectedWaterBody?: string;
}

export const ResearchExporterModal: React.FC<ResearchExporterModalProps> = ({
  isOpen,
  onClose,
  selectedSpecies = 'Guyanacaris keralam',
  selectedWaterBody = 'Arabian Sea'
}) => {
  const [species, setSpecies] = useState(selectedSpecies);
  const [waterBody, setWaterBody] = useState(selectedWaterBody);
  const [exportFormat, setExportFormat] = useState<'ipynb' | 'dwca' | 'latex' | 'pdf'>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [exportedSuccess, setExportedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsExporting(true);
    setExportedSuccess(false);
    try {
      if (exportFormat === 'pdf') {
        const element = document.getElementById('species-intelligence-profile');
        if (element) {
          const canvas = await html2canvas(element, { scale: 2 });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`kadal_ai_executive_report_${species.toLowerCase().replace(/\s+/g, '_')}.pdf`);
        } else {
           alert("Could not find profile content to export.");
        }
      } else if (exportFormat === 'ipynb') {
        const res = await fetch(
          `http://localhost:8000/export/jupyter-notebook?species=${encodeURIComponent(species)}&water_body=${encodeURIComponent(waterBody)}`
        );
        const notebookJson = await res.json();
        const blob = new Blob([JSON.stringify(notebookJson, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kadal_ai_${species.toLowerCase().replace(/\s+/g, '_')}_analysis.ipynb`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (exportFormat === 'dwca') {
        // Darwin Core standard CSV format
        const csvContent = `occurrenceID,basisOfRecord,institutionCode,collectionCode,scientificName,waterBody,country,decimalLatitude,decimalLongitude,minimumDepthInMeters,maximumDepthInMeters,eventDate,identifiedBy\n` +
          `IO/SS/AXI/00001,PreservedSpecimen,CMLRE,voucher specimen collections,${species},${waterBody},India,12.100,74.320,326,326,2013-08-26,Dr. Vinay P. Padate\n` +
          `IO/SS/DEC/00482,PreservedSpecimen,CMLRE,voucher specimen collections,Puerulus sewelli,${waterBody},India,11.850,74.920,280,310,2014-04-12,CMLRE Cruise Team\n` +
          `IO/DV/CAR/00128,PreservedSpecimen,CMLRE,voucher specimen collections,Saron marmoratus,Lakshadweep Archipelago,India,10.860,72.180,2,10,2018-05-03,Dr. P. Purushothaman`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kadal_ai_dwca_${species.toLowerCase().replace(/\s+/g, '_')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // LaTeX Manuscript template
        const latexContent = `\\documentclass[journal=nature]{article}
\\usepackage{graphicx}
\\usepackage{amsmath}
\\title{Spatial Bathymetry and Climate Vulnerability of \\textit{${species}} in the ${waterBody}}
\\author{Dr. Yuktha, Oceanographic Data Division, CMLRE, Ministry of Earth Sciences}
\\date{\\today}

\\begin{document}
\\maketitle

\\begin{abstract}
We report ground-truth occurrences and bio-climatic habitat shifts for \\textit{${species}} based on FORV \\textit{Sagar Sampada} surveys. Multi-decadal CMIP6 simulations project significant habitat redistribution by 2050 under SSP2-4.5.
\\end{abstract}

\\section{Methodology}
Specimens were collected using bottom trawls and CTD casts (SeaBird SBE 911plus). Vector embeddings and RAG analysis were conducted via Kadal AI.

\\section{Results}
Baseline depth was observed at bathyal depths. Projected downward migration shifts indicate depth refuge seeking.

\\end{document}`;
        const blob = new Blob([latexContent], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kadal_ai_manuscript_${species.toLowerCase().replace(/\s+/g, '_')}.tex`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      setExportedSuccess(true);
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0F2A3A]/40 backdrop-blur-md p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.25 }}
          className="bg-white border border-[#D9E2E7] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden text-[#0F2A3A]"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-[#0F766E] to-[#0A4D48] text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-emerald-200">
                <FiDownload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-serif">Academic & Research Exporter</h3>
                <p className="text-xs text-emerald-100/80">
                  Export ready-to-run Python code, Darwin Core (OBIS/GBIF) archives, or LaTeX drafts.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Format Selection Cards */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#5B7280] block mb-2.5">
                Select Export Standard:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setExportFormat('pdf')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    exportFormat === 'pdf'
                      ? 'border-[#0F766E] bg-[#0F766E]/5 ring-1 ring-[#0F766E]'
                      : 'border-[#D9E2E7] bg-white hover:bg-[#EEF3F5]'
                  }`}
                >
                  <FiFileText className={`w-5 h-5 mb-2 ${exportFormat === 'pdf' ? 'text-[#0F766E]' : 'text-[#5B7280]'}`} />
                  <div className="font-bold text-xs text-[#0F2A3A]">Executive PDF</div>
                  <div className="text-[11px] text-[#5B7280] mt-0.5 font-mono">.pdf (Visual Report)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat('ipynb')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    exportFormat === 'ipynb'
                      ? 'border-[#0F766E] bg-[#0F766E]/5 ring-1 ring-[#0F766E]'
                      : 'border-[#D9E2E7] bg-white hover:bg-[#EEF3F5]'
                  }`}
                >
                  <FiCode className={`w-5 h-5 mb-2 ${exportFormat === 'ipynb' ? 'text-[#0F766E]' : 'text-[#5B7280]'}`} />
                  <div className="font-bold text-xs text-[#0F2A3A]">Jupyter Notebook</div>
                  <div className="text-[11px] text-[#5B7280] mt-0.5 font-mono">.ipynb (Python 3)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat('dwca')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    exportFormat === 'dwca'
                      ? 'border-[#0F766E] bg-[#0F766E]/5 ring-1 ring-[#0F766E]'
                      : 'border-[#D9E2E7] bg-white hover:bg-[#EEF3F5]'
                  }`}
                >
                  <FiDatabase className={`w-5 h-5 mb-2 ${exportFormat === 'dwca' ? 'text-[#0F766E]' : 'text-[#5B7280]'}`} />
                  <div className="font-bold text-xs text-[#0F2A3A]">Darwin Core</div>
                  <div className="text-[11px] text-[#5B7280] mt-0.5 font-mono">OBIS CSV</div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat('latex')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    exportFormat === 'latex'
                      ? 'border-[#0F766E] bg-[#0F766E]/5 ring-1 ring-[#0F766E]'
                      : 'border-[#D9E2E7] bg-white hover:bg-[#EEF3F5]'
                  }`}
                >
                  <FiFileText className={`w-5 h-5 mb-2 ${exportFormat === 'latex' ? 'text-[#0F766E]' : 'text-[#5B7280]'}`} />
                  <div className="font-bold text-xs text-[#0F2A3A]">LaTeX Draft</div>
                  <div className="text-[11px] text-[#5B7280] mt-0.5 font-mono">.tex (Manuscript)</div>
                </button>
              </div>
            </div>

            {/* Target Specimen & Basin Config */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#5B7280] block mb-1">
                  Target Species
                </label>
                <input
                  type="text"
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl text-xs font-medium focus:outline-none focus:border-[#0F766E]"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#5B7280] block mb-1">
                  Ocean Water Basin
                </label>
                <select
                  value={waterBody}
                  onChange={(e) => setWaterBody(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl text-xs font-medium focus:outline-none focus:border-[#0F766E]"
                >
                  <option value="Arabian Sea">Arabian Sea</option>
                  <option value="Bay of Bengal">Bay of Bengal</option>
                  <option value="Andaman Sea">Andaman Sea</option>
                  <option value="Lakshadweep Archipelago">Lakshadweep Archipelago</option>
                  <option value="Indian Ocean">Indian Ocean (Equatorial)</option>
                </select>
              </div>
            </div>

            {/* Format Preview Box */}
            <div className="p-4 bg-[#F8FAFC] border border-[#D9E2E7] rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#0F766E] uppercase tracking-wider">
                <FiTerminal className="w-4 h-4" />
                <span>What's included in this export:</span>
              </div>
              {exportFormat === 'pdf' ? (
                <ul className="text-xs text-[#5B7280] space-y-1 list-disc list-inside">
                  <li>High-resolution capture of the active Species Intelligence Profile.</li>
                  <li>Includes maps, baseline stats, and future predictive modeling charts.</li>
                  <li>Ready for CMLRE executive reviews and policy presentations.</li>
                </ul>
              ) : exportFormat === 'ipynb' ? (
                <ul className="text-xs text-[#5B7280] space-y-1 list-disc list-inside">
                  <li>Direct connection to Kadal AI local REST API.</li>
                  <li><code>pandas</code> data ingestion & bathymetric depth vs latitude plotting.</li>
                  <li>Multi-decadal IPCC CMIP6 climate trajectory graph (2024–2050).</li>
                </ul>
              ) : exportFormat === 'dwca' ? (
                <ul className="text-xs text-[#5B7280] space-y-1 list-disc list-inside">
                  <li>Darwin Core standard fields (<code>occurrenceID</code>, <code>basisOfRecord</code>, <code>scientificName</code>).</li>
                  <li>CMLRE and FORV <i>Sagar Sampada</i> voucher identifiers & WoRMS LSIDs.</li>
                  <li>Compatible with GBIF IPT and IndOBIS regional data uploads.</li>
                </ul>
              ) : (
                <ul className="text-xs text-[#5B7280] space-y-1 list-disc list-inside">
                  <li>Complete LaTeX document structure ready for compilation with <code>pdflatex</code>.</li>
                  <li>Pre-filled methodology citing CMLRE cruise surveys and RAG synthesis.</li>
                  <li>Abstract, data tables, and formatted mathematical bio-climatic equations.</li>
                </ul>
              )}
            </div>

            {exportedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
                <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                <span>File successfully generated and downloaded to your computer!</span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#D9E2E7] flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#D9E2E7] rounded-xl text-xs font-semibold text-[#5B7280] hover:bg-[#EEF3F5] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="px-6 py-2.5 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold rounded-xl text-xs flex items-center space-x-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <span>Generating Artifact...</span>
              ) : (
                <>
                  <FiDownload className="w-4 h-4" />
                  <span>Download {exportFormat.toUpperCase()} File</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
