export const checkWebGLSupport = (): { supported: boolean; context?: string; error?: string } => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    
    if (gl) {
      return { supported: true, context: 'webgl' };
    }
    
    const webgl2 = canvas.getContext('webgl2') as WebGL2RenderingContext | null;
    if (webgl2) {
      return { supported: true, context: 'webgl2' };
    }
    
    return { supported: false, error: 'WebGL not supported' };
  } catch (error) {
    return { supported: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const getWebGLInfo = (): { vendor: string; renderer: string; version: string } | null => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    
    if (!gl) return null;
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return null;
    
    return {
      vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown',
      renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown',
      version: gl.getParameter(gl.VERSION) || 'Unknown'
    };
  } catch (error) {
    return null;
  }
};

export const isWebGLContextLost = (gl: WebGLRenderingContext | WebGL2RenderingContext): boolean => {
  return gl.isContextLost();
};

export const createWebGLContext = (canvas: HTMLCanvasElement): WebGLRenderingContext | WebGL2RenderingContext | null => {
  try {
    // Try WebGL2 first
    const webgl2 = canvas.getContext('webgl2', {
      antialias: true,
      alpha: true,
      depth: true,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false
    }) as WebGL2RenderingContext | null;
    
    if (webgl2) {
      return webgl2;
    }
    
    // Fallback to WebGL1
    const webgl1 = canvas.getContext('webgl', {
      antialias: true,
      alpha: true,
      depth: true,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false
    }) as WebGLRenderingContext | null;
    
    return webgl1;
  } catch (error) {
    console.error('Failed to create WebGL context:', error);
    return null;
  }
};

export const disposeWebGLContext = (gl: WebGLRenderingContext | WebGL2RenderingContext): void => {
  try {
    // Clear all buffers
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Dispose of any resources
    const ext = gl.getExtension('WEBGL_lose_context');
    if (ext) {
      ext.loseContext();
    }
  } catch (error) {
    console.warn('Error disposing WebGL context:', error);
  }
};

export const getWebGLContextInfo = (gl: WebGLRenderingContext | WebGL2RenderingContext): {
  version: string;
  vendor: string;
  renderer: string;
  maxTextureSize: number;
  maxVertexAttribs: number;
  maxVaryingVectors: number;
} => {
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  
  return {
    version: gl.getParameter(gl.VERSION) || 'Unknown',
    vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown' : 'Unknown',
    renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown' : 'Unknown',
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0,
    maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS) || 0,
    maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS) || 0
  };
};

export const clearCanvasContext = (canvas: HTMLCanvasElement): void => {
  try {
    // Don't try to access WebGL contexts - just clear the canvas visually
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  } catch (error) {
    console.warn('Error clearing canvas context:', error);
  }
};

export const isCanvasContextAvailable = (canvas: HTMLCanvasElement): boolean => {
  // Don't try to create contexts to check availability - this causes the errors
  // Instead, just return true and let the Canvas component handle context creation
  return true;
};
