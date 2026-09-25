import React, { useEffect, useRef, useState } from 'react';
import { checkWebGLSupport } from '../utils/webglUtils';

interface WebGLStrictModeWrapperProps {
  children: React.ReactNode;
}

// Global flag to prevent multiple WebGL contexts
let globalWebGLInitialized = false;
let globalWebGLInitializing = false;
let globalWebGLInstanceCount = 0;

/**
 * Wrapper component to handle React Strict Mode double rendering issues with WebGL
 * This prevents the "Canvas has an existing context of a different type" error
 */
const WebGLStrictModeWrapper: React.FC<WebGLStrictModeWrapperProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const mountedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Track instance count
    globalWebGLInstanceCount++;
    console.log(`WebGL Strict Mode wrapper instance ${globalWebGLInstanceCount} mounting`);

    // Check WebGL support first
    const webglSupport = checkWebGLSupport();
    if (!webglSupport.supported) {
      console.error('WebGL not supported, skipping WebGL components');
      return;
    }

    // Only allow the first instance to initialize
    if (globalWebGLInstanceCount > 1) {
      console.log(`WebGL instance ${globalWebGLInstanceCount} - skipping initialization (already have instance 1)`);
      return;
    }

    // Prevent double mounting in Strict Mode
    if (mountedRef.current || globalWebGLInitialized || globalWebGLInitializing) {
      console.log('WebGL already initialized or initializing, skipping...');
      return;
    }

    globalWebGLInitializing = true;
    mountedRef.current = true;

    // Longer delay to ensure proper initialization and prevent conflicts
    timeoutRef.current = setTimeout(() => {
      globalWebGLInitialized = true;
      globalWebGLInitializing = false;
      setIsReady(true);
      console.log('WebGL Strict Mode wrapper ready (instance 1)');
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      mountedRef.current = false;
      globalWebGLInitializing = false;
      globalWebGLInstanceCount--;
      console.log(`WebGL Strict Mode wrapper instance unmounting, count: ${globalWebGLInstanceCount}`);
    };
  }, []);

  // Reset on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      setIsReady(false);
      // Don't reset global flags on unmount to prevent re-initialization
    };
  }, []);

  // Only render if this is the primary instance and ready
  if (globalWebGLInstanceCount > 1) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-400">WebGL instance {globalWebGLInstanceCount} - waiting for primary instance...</p>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F766E] mx-auto mb-4"></div>
          <p className="text-[#5B7280] text-sm">Initializing WebGL...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default WebGLStrictModeWrapper;
