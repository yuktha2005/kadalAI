import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight, FiCalendar, FiCompass, FiActivity } from 'react-icons/fi';
import { Project } from '../App';

interface ProjectCardProps {
  project: Project;
  onSelect: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect }) => {
  const getWaterBodyBadge = (waterBody: string) => {
    switch (waterBody) {
      case 'Arabian Sea':
        return {
          bg: 'bg-[#DCFCE7] border-[#BBF7D0] text-[#15803D]',
          dot: 'bg-[#15803D]',
        };
      case 'Bay of Bengal':
        return {
          bg: 'bg-[#FEF3C7] border-[#FDE68A] text-[#B45309]',
          dot: 'bg-[#D97706]',
        };
      case 'Andaman Sea':
        return {
          bg: 'bg-[#E0F2FE] border-[#BAE6FD] text-[#0369A1]',
          dot: 'bg-[#0369A1]',
        };
      default:
        return {
          bg: 'bg-[#FFEDD5] border-[#FED7AA] text-[#C2410C]',
          dot: 'bg-[#E4572E]',
        };
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  const badgeStyle = getWaterBodyBadge(project.waterBody);

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKey}
      className="group relative cursor-pointer bg-white rounded-2xl p-6 border border-[#D9E2E7] shadow-[0_1px_2px_rgba(15,42,58,0.06),0_8px_24px_rgba(15,42,58,0.06)] hover:border-[#0F766E] hover:shadow-[0_4px_20px_rgba(15,118,110,0.12)] transition-all duration-200 h-80 flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-[#0F766E]/50"
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div>
        {/* Header Tags & Water body indicator */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap gap-2">
            {project.waterBody && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${badgeStyle.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`} />
                {project.waterBody}
              </span>
            )}
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-[#EEF3F5] border border-[#D9E2E7] text-[#0F2A3A]"
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="text-[11px] font-mono text-[#5B7280] flex items-center gap-1">
            <FiCompass className="w-3.5 h-3.5 text-[#0F766E]" />
            Active
          </span>
        </div>

        {/* Project Title */}
        <motion.h3 
          className="text-xl font-bold text-[#0F2A3A] mb-2 group-hover:text-[#0F766E] transition-colors duration-150 line-clamp-1 tracking-tight font-display"
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          {project.title}
        </motion.h3>

        {/* Date & Progress */}
        <motion.div 
          className="flex items-center space-x-3 text-[#5B7280] text-xs mb-3 font-medium"
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: 0.08 }}
        >
          <span className="flex items-center">
            <FiCalendar className="w-3.5 h-3.5 mr-1.5 text-[#0F766E]" />
            <span>{new Date(project.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </span>
          <span className="text-[#CBD5E1]">•</span>
          <span className="flex items-center text-[#0F2A3A] font-mono">
            <FiActivity className="w-3.5 h-3.5 mr-1 text-[#15803D]" />
            {project.progress || 0}% analyzed
          </span>
        </motion.div>

        {/* Description */}
        <motion.p 
          className="text-[#5B7280] text-sm leading-relaxed line-clamp-2"
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          {project.description || 'Comprehensive marine survey and biodiversity observation dataset.'}
        </motion.p>
      </div>

      {/* Bottom Section - Progress bar + CTA */}
      <div className="mt-4 pt-4 border-t border-[#D9E2E7]">
        {/* Progress bar */}
        <div className="w-full bg-[#EEF3F5] rounded-full h-1.5 mb-3 overflow-hidden border border-[#D9E2E7]/60">
          <div
            className="bg-gradient-to-r from-[#0F766E] to-[#0369A1] h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${Math.max(5, Math.min(100, project.progress || 25))}%` }}
          />
        </div>

        {/* Open Project CTA */}
        <div
          className="w-full flex items-center justify-between px-4 py-2.5 bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl text-[#0F766E] font-semibold group-hover:bg-[#0F766E] group-hover:text-white group-hover:border-transparent transition-all duration-150 shadow-sm"
        >
          <span className="text-xs tracking-wider uppercase">Open Investigation</span>
          <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-150" />
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
