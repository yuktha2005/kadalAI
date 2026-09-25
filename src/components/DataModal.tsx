import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMapPin, FiCalendar, FiEye, FiUser, FiCompass, FiLayers } from 'react-icons/fi';
import { DataPoint } from '../App';

interface DataModalProps {
  dataPoint: DataPoint;
  onClose: () => void;
}

const DataModal: React.FC<DataModalProps> = ({ dataPoint, onClose }) => {
  const getWaterBodyBadge = (waterBody: string) => {
    switch (waterBody) {
      case 'Arabian Sea':
        return 'bg-[#DCFCE7] border-[#BBF7D0] text-[#15803D]';
      case 'Bay of Bengal':
        return 'bg-[#FEF3C7] border-[#FDE68A] text-[#B45309]';
      case 'Andaman Sea':
        return 'bg-[#E0F2FE] border-[#BAE6FD] text-[#0369A1]';
      default:
        return 'bg-[#FFEDD5] border-[#FED7AA] text-[#C2410C]';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-[#0F2A3A]/30 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal Content */}
        <motion.div
          className="relative bg-white border border-[#D9E2E7] rounded-3xl p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-[0_4px_6px_-1px_rgba(15,42,58,0.07),0_12px_32px_rgba(15,42,58,0.09)] text-[#0F2A3A] z-10"
          initial={{ opacity: 0, scale: 0.97, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-[#5B7280] hover:text-[#0F2A3A] rounded-xl hover:bg-[#EEF3F5] transition-colors duration-150"
            aria-label="Close record modal"
          >
            <FiX className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="mb-6 pr-8">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-1.5">
              <FiCompass className="w-3.5 h-3.5" />
              <span>Marine Observation Record</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-[#0F2A3A] tracking-tight mb-2 font-display">
              {dataPoint.scientificName}
            </h2>
            <div className="flex items-center text-xs font-semibold text-[#0369A1]">
              <FiMapPin className="w-4 h-4 mr-1.5 text-[#0F766E]" />
              <span>{dataPoint.locality || 'Unknown Locality'}</span>
            </div>
          </div>

          {/* Content Grid */}
          <div className="space-y-5">
            {/* Telemetry Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Event Date */}
              <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-[#D9E2E7] flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] text-[#15803D] flex-shrink-0">
                  <FiCalendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#5B7280]">Observation Date</p>
                  <p className="text-sm font-bold text-[#0F2A3A] num-tabular mt-0.5">
                    {new Date(dataPoint.eventDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Water Body */}
              <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-[#D9E2E7] flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] text-[#0369A1] flex-shrink-0">
                  <FiLayers className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#5B7280]">Water Body</p>
                  <p className="text-sm font-bold text-[#0F2A3A] mt-0.5 flex items-center gap-1.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getWaterBodyBadge(dataPoint.waterBody)}`}>
                      {dataPoint.waterBody}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Coordinates Grid */}
            <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-[#D9E2E7]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#5B7280] mb-2">
                Geographic Coordinates
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-3 border border-[#D9E2E7] shadow-sm">
                  <span className="text-xs text-[#5B7280] block font-medium">Latitude</span>
                  <span className="text-base font-mono font-bold text-[#0F766E] num-tabular">
                    {dataPoint.decimalLatitude}° N
                  </span>
                </div>
                <div className="bg-white rounded-xl p-3 border border-[#D9E2E7] shadow-sm">
                  <span className="text-xs text-[#5B7280] block font-medium">Longitude</span>
                  <span className="text-base font-mono font-bold text-[#0F766E] num-tabular">
                    {dataPoint.decimalLongitude}° E
                  </span>
                </div>
              </div>
            </div>

            {/* Sampling Details */}
            <div className="bg-[#F8FAFC] rounded-2xl p-5 border border-[#D9E2E7]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-3 flex items-center">
                <FiEye className="w-4 h-4 mr-1.5" />
                Sampling Protocol & Depth Stratification
              </h3>
              <div className="space-y-3 text-xs">
                <div className="bg-white rounded-xl p-3 border border-[#D9E2E7] shadow-sm">
                  <p className="text-[11px] text-[#5B7280] font-medium">Protocol</p>
                  <p className="text-[#0F2A3A] font-semibold mt-0.5">{dataPoint.samplingProtocol || 'Standard Pelagic Trawl'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-3 border border-[#D9E2E7] shadow-sm">
                    <p className="text-[11px] text-[#5B7280] font-medium">Min Depth</p>
                    <p className="text-[#0F2A3A] font-mono font-bold text-sm mt-0.5">{dataPoint.minimumDepthInMeters}m</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-[#D9E2E7] shadow-sm">
                    <p className="text-[11px] text-[#5B7280] font-medium">Max Depth</p>
                    <p className="text-[#0F2A3A] font-mono font-bold text-sm mt-0.5">{dataPoint.maximumDepthInMeters}m</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2.5 bg-white rounded-xl p-3 border border-[#D9E2E7] shadow-sm">
                  <FiUser className="w-4 h-4 text-[#15803D] flex-shrink-0" />
                  <div>
                    <p className="text-[11px] text-[#5B7280] font-medium">Identified By</p>
                    <p className="text-[#0F2A3A] font-semibold">{dataPoint.identifiedBy || 'Marine Research Taxonomist'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-2">
              <motion.button
                className="flex-1 px-5 py-2.5 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-semibold text-xs rounded-xl shadow-sm transition-all duration-150 min-h-[40px]"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                View Full Record
              </motion.button>
              <motion.button
                onClick={onClose}
                className="px-5 py-2.5 bg-white hover:bg-[#EEF3F5] border border-[#D9E2E7] text-xs font-semibold text-[#0F2A3A] rounded-xl transition-all duration-150 min-h-[40px]"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                Close
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DataModal;
