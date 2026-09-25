/**
 * Service for interacting with the Otolith Classifier API
 * Handles otolith image classification and prediction
 */

const OTOLITH_API_BASE_URL = process.env.REACT_APP_OTOLITH_API_URL || 'https://chinmay0805-37-otolith-classifier.hf.space';

export interface OtolithValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface OtolithErrorResponse {
  detail: OtolithValidationError[];
}

export interface OtolithPredictionResponse {
  // The actual success response structure - this may vary
  // Based on the API docs format, we'll handle dynamic response
  [key: string]: any;
}

export interface PredictOptions {
  // If true, will send file directly instead of base64 string
  useFileUpload?: boolean;
}

export class OtolithService {
  private static instance: OtolithService;

  private constructor() {}

  public static getInstance(): OtolithService {
    if (!OtolithService.instance) {
      OtolithService.instance = new OtolithService();
    }
    return OtolithService.instance;
  }

  /**
   * Predict otolith classification from input string or file
   * @param input - String input for prediction (could be image data, file path, or other identifier) or File object
   * @param options - Optional configuration
   * @returns Prediction result or validation error
   */
  async predict(input: string | File, options?: PredictOptions): Promise<OtolithPredictionResponse | OtolithErrorResponse> {
    // Helper function to read response once
    const readResponse = async (response: Response) => {
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return { error: text, rawResponse: text };
      }
    };

    // If input is a File and we want to use file upload
    if (input instanceof File && options?.useFileUpload) {
      try {
        const formData = new FormData();
        formData.append('file', input);
        
        const response = await fetch(`${OTOLITH_API_BASE_URL}/predict`, {
          method: 'POST',
          body: formData,
        });

        const data = await readResponse(response);

        if (data?.detail && Array.isArray(data.detail)) {
          return data as OtolithErrorResponse;
        }

        if (!response.ok) {
          const errorMsg = data?.error || data?.detail || JSON.stringify(data) || response.statusText;
          throw new Error(`API request failed (${response.status}): ${errorMsg}`);
        }

        return data as OtolithPredictionResponse;
      } catch (error) {
        console.error('Otolith API prediction (file upload) failed:', error);
        throw error;
      }
    }

    // Otherwise, treat input as string
    const inputString = input instanceof File ? '' : input;

    try {
      // Try sending string directly first (as specified in API docs: "input: string")
      let response = await fetch(`${OTOLITH_API_BASE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputString), // Send string directly, not wrapped
      });

      let data = await readResponse(response);

      // If we get a validation error (422), try alternative formats
      if (response.status === 422 || (data?.detail && Array.isArray(data.detail))) {
        // Try Gradio format: JSON array (common for HuggingFace Spaces)
        response = await fetch(`${OTOLITH_API_BASE_URL}/predict`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([inputString]), // Gradio often expects array
        });
        data = await readResponse(response);
      }

      // If still failing, try JSON object with "input" field
      if (response.status === 422 || (data?.detail && Array.isArray(data.detail))) {
        response = await fetch(`${OTOLITH_API_BASE_URL}/predict`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ input: inputString }),
        });
        data = await readResponse(response);
      }

      // Check if response is a validation error
      if (data?.detail && Array.isArray(data.detail)) {
        // Return the validation error with detailed messages
        return data as OtolithErrorResponse;
      }

      // If request failed, throw error with details
      if (!response.ok) {
        const errorMsg = data?.error || (data?.detail ? JSON.stringify(data.detail) : null) || data?.rawResponse || JSON.stringify(data) || response.statusText;
        throw new Error(`API request failed (${response.status}): ${errorMsg}`);
      }

      // Otherwise, treat as successful prediction
      return data as OtolithPredictionResponse;
    } catch (error) {
      console.error('Otolith API prediction failed:', error);
      throw error;
    }
  }

  /**
   * Convert image file to base64 string for API submission
   */
  async imageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Remove data URL prefix if present
          const base64 = reader.result.split(',')[1] || reader.result;
          resolve(base64);
        } else {
          reject(new Error('Failed to convert image to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export default OtolithService.getInstance();

