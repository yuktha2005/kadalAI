import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

/**
 * Ocean Paper Light Theme Presentational UI Wrappers
 * Purely presentational - zero behavior / logic alterations.
 */

// 1. Ocean Card Wrapper
export interface OceanCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'subtle' | 'interactive';
  glowOnHover?: boolean;
}

export const OceanCard: React.FC<OceanCardProps> = ({
  children,
  className = '',
  variant = 'default',
  glowOnHover = false,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white border border-[#D9E2E7] shadow-[0_1px_2px_rgba(15,42,58,0.06),0_8px_24px_rgba(15,42,58,0.06)] rounded-2xl',
    elevated: 'bg-white border border-[#CBD5E1] shadow-[0_4px_6px_-1px_rgba(15,42,58,0.07),0_12px_32px_rgba(15,42,58,0.09)] rounded-2xl',
    subtle: 'bg-[#EEF3F5] border border-[#D9E2E7] shadow-sm rounded-xl',
    interactive: 'bg-white border border-[#D9E2E7] shadow-[0_1px_2px_rgba(15,42,58,0.06),0_8px_24px_rgba(15,42,58,0.06)] rounded-2xl hover:border-[#0F766E] hover:shadow-[0_4px_16px_rgba(15,118,110,0.12)] transition-all duration-200 cursor-pointer',
  }[variant];

  return (
    <motion.div
      className={`relative overflow-hidden ${variantStyles} ${className}`}
      {...props}
    >
      {glowOnHover && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F766E]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      )}
      {children}
    </motion.div>
  );
};

// 2. Metric / Stat Card Wrapper
export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'cyan' | 'green' | 'yellow' | 'orange' | 'teal' | 'purple';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  subtext,
  color = 'teal',
  className = '',
}) => {
  const colorMap = {
    cyan: 'text-[#0369A1] border-[#BAE6FD] bg-[#F0F9FF]',
    green: 'text-[#15803D] border-[#BBF7D0] bg-[#F0FDF4]',
    yellow: 'text-[#D97706] border-[#FDE68A] bg-[#FFFBEB]',
    orange: 'text-[#E4572E] border-[#FECACA] bg-[#FEF2F2]',
    teal: 'text-[#0F766E] border-[#99F6E4] bg-[#F0FDFA]',
    purple: 'text-[#7C3AED] border-[#DDD6FE] bg-[#F5F3FF]',
  }[color];

  return (
    <div className={`bg-white rounded-2xl p-5 border border-[#D9E2E7] shadow-[0_1px_2px_rgba(15,42,58,0.06),0_8px_24px_rgba(15,42,58,0.06)] hover:border-[#0F766E]/50 transition-all duration-200 flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold tracking-wider uppercase text-[#5B7280]">{label}</span>
        {icon && (
          <div className={`p-2 rounded-xl border ${colorMap} flex-shrink-0`}>
            {icon}
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl lg:text-3xl font-bold tracking-tight text-[#0F2A3A] num-tabular">
          {value}
        </div>
        {subtext && (
          <p className="text-xs text-[#5B7280] mt-1 font-medium">{subtext}</p>
        )}
      </div>
    </div>
  );
};

// 3. Section Header
export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon,
  badge,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 ${className}`}>
      <div className="flex items-center space-x-3">
        {icon && <div className="text-[#0F766E] text-xl flex-shrink-0">{icon}</div>}
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#0F2A3A]">{title}</h2>
            {badge}
          </div>
          {subtitle && <p className="text-sm text-[#5B7280] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

// 4. Badges / Chips (WCAG AA Compliant Light Theme)
export interface BadgeProps {
  children: React.ReactNode;
  color?: 'cyan' | 'green' | 'yellow' | 'orange' | 'teal' | 'purple' | 'gray' | 'danger';
  variant?: 'solid' | 'outline' | 'glass';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  color = 'teal',
  variant = 'glass',
  className = '',
}) => {
  const colorStyles = {
    cyan: variant === 'solid' ? 'bg-[#0369A1] text-white' : 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]',
    green: variant === 'solid' ? 'bg-[#15803D] text-white' : 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]',
    yellow: variant === 'solid' ? 'bg-[#D97706] text-white' : 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
    orange: variant === 'solid' ? 'bg-[#E4572E] text-white' : 'bg-[#FFEDD5] text-[#C2410C] border-[#FED7AA]',
    teal: variant === 'solid' ? 'bg-[#0F766E] text-white' : 'bg-[#CCFBF1] text-[#0F766E] border-[#99F6E4]',
    purple: variant === 'solid' ? 'bg-[#7C3AED] text-white' : 'bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE]',
    gray: variant === 'solid' ? 'bg-[#475569] text-white' : 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]',
    danger: variant === 'solid' ? 'bg-[#B91C1C] text-white' : 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]',
  }[color];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border ${colorStyles} ${className}`}
    >
      {children}
    </span>
  );
};

// 5. Presentational Button Wrapper
export interface OceanButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const OceanButton: React.FC<OceanButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2 text-sm rounded-xl gap-2',
    lg: 'px-6 py-3 text-base rounded-xl gap-2.5 font-semibold',
  }[size];

  const variantStyles = {
    primary: 'bg-[#0F766E] hover:bg-[#0B5F58] text-white font-semibold shadow-sm hover:shadow active:scale-[0.98] transition-all duration-150',
    secondary: 'bg-white hover:bg-[#EEF3F5] border border-[#D9E2E7] text-[#0F2A3A] hover:border-[#BCCBD5] active:scale-[0.98] transition-all duration-150',
    ghost: 'bg-transparent hover:bg-[#EEF3F5] text-[#5B7280] hover:text-[#0F2A3A] border border-transparent transition-colors duration-150',
    danger: 'bg-red-50 hover:bg-red-100 text-[#B91C1C] border border-red-200 active:scale-[0.98] transition-all duration-150',
  }[variant];

  return (
    <motion.button
      className={`inline-flex items-center justify-center font-medium focus:outline-none focus:ring-2 focus:ring-[#0F766E]/40 disabled:opacity-50 disabled:pointer-events-none min-h-[38px] ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </motion.button>
  );
};

// 6. Loading Skeleton Box
export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-6 w-full' }) => (
  <div className={`animate-pulse bg-[#EEF3F5] border border-[#D9E2E7]/40 rounded-xl ${className}`} />
);
