import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class WebGLErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's a WebGL-related error
    const isWebGLError = error.message.includes('WebGL') || 
                        error.message.includes('context') ||
                        error.message.includes('three') ||
                        error.message.includes('globe');
    
    if (isWebGLError) {
      return { hasError: true, error };
    }
    
    // Re-throw non-WebGL errors
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WebGL Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center h-full bg-[#F7F9FA]">
          <div className="text-center p-8 bg-white rounded-2xl border border-[#D9E2E7] shadow-lg max-w-md">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#B91C1C]/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#B91C1C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#0F2A3A] mb-2 font-serif">WebGL Rendering Issue</h3>
              <p className="text-[#5B7280] mb-4 text-sm">
                Unable to initialize 3D globe. This may be due to:
              </p>
              <ul className="text-sm text-[#5B7280] text-left mb-6 space-y-1">
                <li>• WebGL not supported in your browser</li>
                <li>• GPU driver issues or hardware acceleration disabled</li>
                <li>• Insufficient system resources</li>
                <li>• Browser security restrictions</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full px-4 py-2.5 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold rounded-xl transition-colors duration-200 shadow-sm text-sm"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="w-full px-4 py-2.5 bg-[#EEF3F5] hover:bg-[#D9E2E7] border border-[#D9E2E7] rounded-xl text-[#0F2A3A] font-medium transition-colors duration-200 text-sm"
              >
                Reload Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-[#5B7280] cursor-pointer">Error Details</summary>
                <pre className="mt-2 text-xs text-[#0F2A3A] bg-[#F7F9FA] border border-[#D9E2E7] p-2.5 rounded-lg overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default WebGLErrorBoundary;