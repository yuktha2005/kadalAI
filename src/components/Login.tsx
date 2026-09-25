import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiLock, FiUser, FiLogIn, FiBriefcase } from 'react-icons/fi';
import WorldMap from './ui/world-map';

interface LoginProps {
  onLoginSuccess: () => void;
}

// Memoized WorldMap to prevent re-renders
const MemoizedWorldMap = React.memo(WorldMap);

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Scientist roles
  const scientistRoles = [
    { value: '', label: 'Select your role' },
    { value: 'principal_scientist', label: 'Principal Scientist' },
    { value: 'senior_scientist', label: 'Senior Scientist' },
    { value: 'scientist', label: 'Scientist' },
    { value: 'junior_scientist', label: 'Junior Scientist' },
    { value: 'researcher', label: 'Researcher' },
    { value: 'research_associate', label: 'Research Associate' },
    { value: 'postdoc', label: 'Postdoctoral Researcher' },
    { value: 'phd_student', label: 'PhD Student' },
    { value: 'masters_student', label: 'Masters Student' },
    { value: 'intern', label: 'Intern' },
  ];

  useEffect(() => {
    // Focus on username field when component mounts
    if (usernameRef.current) {
      usernameRef.current.focus();
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Get credentials from environment variables with fallback defaults
    const validUsername = process.env.REACT_APP_LOGIN_USERNAME || 'ADMIN';
    const validPassword = process.env.REACT_APP_LOGIN_PASSWORD || 'ADMIN123';

    // Validate role selection
    if (!role) {
      setError('Please select your role');
      setIsLoading(false);
      return;
    }

    // Check credentials immediately (no artificial delay)
    if (username === validUsername && password === validPassword) {
      // Store authentication state
      localStorage.setItem('Kadal AI:authenticated', 'true');
      localStorage.setItem('Kadal AI:username', username);
      localStorage.setItem('Kadal AI:role', role);
      // Small delay only for visual feedback
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess();
      }, 100);
    } else {
      setError('Invalid username or password');
      setIsLoading(false);
      // Clear password field on error
      setPassword('');
      if (passwordRef.current) {
        passwordRef.current.focus();
      }
    }
  }, [username, password, role, onLoginSuccess]);

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#0F2A3A] overflow-hidden relative flex items-center justify-center selection:bg-[#0F766E]/20">
      {/* Background World Map */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="h-full w-full">
          <MemoizedWorldMap />
        </div>
      </div>

      {/* Ambient background soft gradient */}
      <div className="absolute w-[500px] h-[500px] bg-[#0F766E]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full"
        >
          <div className="bg-white border border-[#D9E2E7] rounded-3xl p-8 shadow-paper relative">
            {/* Top highlight */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#0F766E] to-transparent" />

            {/* Logo/Title */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-[#D9E2E7] bg-white shadow-sm mx-auto mb-3">
                <img 
                  src="/WhatsApp Image 2025-09-29 at 03.04.02.jpeg" 
                  alt="Kadal AI Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#0F2A3A] mb-1">
                Kadal <span className="text-[#0F766E]">AI</span>
              </h1>
              <p className="text-xs text-[#5B7280] font-medium">
                Marine Observation & Spatio-temporal Research
              </p>
            </div>

            {/* Login Instructions */}
            <div className="mb-6 p-3.5 bg-[#EEF3F5] border border-[#D9E2E7] rounded-2xl">
              <p className="text-xs text-[#5B7280] leading-relaxed">
                <strong className="text-[#0F766E] font-bold">Scientific Access:</strong> Use the credentials shown below, and select <strong className="text-[#0F766E]">Principal Scientist</strong> for full analytical capabilities.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-xs font-semibold text-[#5B7280] uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FiUser className="h-4 w-4 text-[#0F766E]" />
                  </div>
                  <input
                    ref={usernameRef}
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError('');
                    }}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#F7F9FA] border border-[#D9E2E7] rounded-xl text-[#0F2A3A] text-sm focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition-all"
                    required
                    autoComplete="username"
                  />
                </div>
                <p className="mt-1 text-[11px] font-mono text-[#5B7280]">
                  Default ID: {process.env.REACT_APP_LOGIN_USERNAME || 'ADMIN'}
                </p>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-[#5B7280] uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FiLock className="h-4 w-4 text-[#0F766E]" />
                  </div>
                  <input
                    ref={passwordRef}
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#F7F9FA] border border-[#D9E2E7] rounded-xl text-[#0F2A3A] text-sm focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition-all"
                    required
                    autoComplete="current-password"
                  />
                </div>
                <p className="mt-1 text-[11px] font-mono text-[#5B7280]">
                  Default Password: {process.env.REACT_APP_LOGIN_PASSWORD || 'ADMIN123'}
                </p>
              </div>

              {/* Role Selection Field */}
              <div>
                <label htmlFor="role" className="block text-xs font-semibold text-[#5B7280] uppercase tracking-wider mb-1.5">
                  Scientific Designation / Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FiBriefcase className="h-4 w-4 text-[#0F766E]" />
                  </div>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      setError('');
                    }}
                    className="w-full pl-10 pr-10 py-2.5 bg-[#F7F9FA] border border-[#D9E2E7] rounded-xl text-[#0F2A3A] text-sm focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition-all appearance-none cursor-pointer"
                    required
                  >
                    {scientistRoles.map((roleOption) => (
                      <option
                        key={roleOption.value}
                        value={roleOption.value}
                      >
                        {roleOption.label}
                      </option>
                    ))}
                  </select>
                  {/* Custom dropdown arrow */}
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg
                      className="h-4 w-4 text-[#5B7280]"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-xl text-[#B91C1C] text-xs font-medium"
                >
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#0F766E] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm hover:bg-[#0B5F58] hover:shadow-md transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <FiLogIn className="w-4 h-4" />
                    <span>Authorize Mission Access</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-[#D9E2E7] text-center text-xs text-[#5B7280] font-mono">
              CMLRE • Ministry of Earth Sciences
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
