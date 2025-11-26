/**
 * FaceMatch Service - FPT.AI FaceMatch API Integration
 * Compare user face with ID card photo
 */

export interface FaceMatchResult {
  match: boolean;
  similarity: number;
  confidence?: 'high' | 'low'; // Only 2 states according to API guide
}

export interface FaceMatchResponse {
  code: string;
  data: {
    isMatch: boolean;
    similarity: number;
    isBothImgIDCard: boolean;
  };
  message: string;
}

/**
 * Compare user face with ID card photo
 * @param cccdImage - URL or base64 of ID card front image
 * @param faceImage - URL or base64 of user face image
 * @returns Face comparison result
 */
export async function compareFaces(
  cccdImage: string, 
  faceImage: string
): Promise<FaceMatchResult> {
  try {
    // Convert images to Blob objects
    const cccdBlob = await convertImageToBlob(cccdImage);
    const faceBlob = await convertImageToBlob(faceImage);

    // Prepare FormData for FPT.AI API
    const formData = new FormData();
    formData.append('file[]', cccdBlob, 'cccd.jpg');
    formData.append('file[]', faceBlob, 'face.jpg');

    // Call FPT.AI FaceMatch API
    const response = await fetch('https://api.fpt.ai/dmp/checkface/v1', {
      method: 'POST',
      headers: {
        'api_key': process.env.NEXT_PUBLIC_FPT_AI_API_KEY || 'FpwWCzDI8aMcEoLLAuZVeqwvLguAeNCB',
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`FaceMatch API error: ${response.status} ${response.statusText}`);
    }

    const apiResponse: FaceMatchResponse = await response.json();
    
    // Check if API call was successful
    if (apiResponse.code !== '200') {
      let errorMessage = apiResponse.message;
      
      // Handle specific error codes
      switch (apiResponse.code) {
        case '407':
          errorMessage = 'No face detected in image';
          break;
        case '408':
          errorMessage = 'Invalid image format (only JPG, PNG supported)';
          break;
        case '409':
          errorMessage = 'Please upload exactly 2 images for comparison';
          break;
        default:
          errorMessage = apiResponse.message || 'Unknown error';
      }
      
      throw new Error(errorMessage);
    }

    const data = apiResponse.data;
    
    // Calculate confidence based on similarity (only 2 states)
    const confidence = data.similarity >= 50 ? 'high' : 'low';

    return {
      match: data.isMatch || false,
      similarity: data.similarity || 0,
      confidence
    };
  } catch (error) {
    throw new Error(`Failed to compare faces: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert image URL or base64 to Blob
 * @param image - URL or base64 string
 * @returns Blob object
 */
async function convertImageToBlob(image: string): Promise<Blob> {
  try {
    // If it's a base64 string
    if (image.startsWith('data:image/')) {
      const response = await fetch(image);
      return response.blob();
    }
    
    // If it's a URL (from URL.createObjectURL)
    if (image.startsWith('blob:')) {
      const response = await fetch(image);
      return response.blob();
    }
    
    // If it's a regular URL
    const response = await fetch(image);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    return response.blob();
  } catch (error) {
    throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate FaceMatch result
 * @param result - FaceMatch result
 * @returns true if valid
 */
export function validateFaceMatchResult(result: any): result is FaceMatchResult {
  return (
    result &&
    typeof result.match === 'boolean' &&
    typeof result.similarity === 'number' &&
    result.similarity >= 0 &&
    result.similarity <= 100
  );
}

/**
 * Get status based on FaceMatch result - theo API guide mới
 * @param result - FaceMatch result
 * @returns Status string
 */
export function getStatusFromFaceMatch(result: FaceMatchResult): 'approved' | 'pending' {
  return result.similarity >= 50 ? 'approved' : 'pending';
}

/**
 * Get status message for UI - theo API guide mới
 * @param result - FaceMatch result
 * @returns Status message
 */
export function getStatusMessage(result: FaceMatchResult): string {
  if (result.similarity >= 50) {
    return `Face Match: ${result.similarity}% (High) - AUTO APPROVED`;
  } else {
    return `Face Match: ${result.similarity}% (Low) - PENDING`;
  }
}

/**
 * Create FaceMatchResult for backend submission
 * Backend sẽ tự động tính confidence dựa trên similarity
 * Frontend chỉ cần gửi match và similarity
 */
export function createFaceMatchResult(match: boolean, similarity: number): FaceMatchResult {
  return { 
    match, 
    similarity 
    // confidence sẽ được Backend tự động tính: "high" nếu similarity >= 50%, "low" nếu < 50%
  };
}
