/**
 * OCR Service - FPT.AI OCR API Integration
 * Extract information from Vietnamese ID card images
 */

export interface OCRData {
  idNumber: string;
  fullName: string;
  dateOfBirth: string;
  issueDate: string;
  issuePlace: string;
  gender: 'male' | 'female';
}

export interface FPTOCRResponse {
  data?: Array<{
    Số?: string;
    id?: string;
    Tên?: string;
    name?: string;
    'Ngày sinh'?: string;
    dob?: string;
    'Giới tính'?: string;
    sex?: string;
    'Ngày cấp'?: string;
    issue_date?: string;
    'Nơi cấp'?: string;
    issue_place?: string;
  }>;
}

/**
 * Extract information from Vietnamese ID card images
 * @param frontImage - URL or base64 of front image
 * @param backImage - URL or base64 of back image
 * @returns Extracted ID card information
 */
export async function processOCRWithFPT(
  frontImage: string, 
  backImage: string
): Promise<OCRData> {
  try {
    // Convert image URLs to base64
    const frontBase64 = await convertImageToBase64(frontImage);
    const backBase64 = await convertImageToBase64(backImage);
    
    // Call FPT.AI Reader API for front image
    const frontFormData = new FormData();
    frontFormData.append('image', await base64ToBlob(frontBase64), 'front.jpg');
    
    const apiKey = process.env.NEXT_PUBLIC_FPT_AI_API_KEY;
    if (!apiKey) {
      throw new Error('FPT AI API key is not configured. Please set NEXT_PUBLIC_FPT_AI_API_KEY in environment variables.');
    }

    const frontResponse = await fetch('https://api.fpt.ai/vision/idr/vnm', {
      method: 'POST',
      headers: {
        'api_key': apiKey,
      },
      body: frontFormData
    });
    
    const frontData: FPTOCRResponse = await frontResponse.json();
    
    // Call FPT.AI Reader API for back image
    const backFormData = new FormData();
    backFormData.append('image', await base64ToBlob(backBase64), 'back.jpg');
    
    const backResponse = await fetch('https://api.fpt.ai/vision/idr/vnm', {
      method: 'POST',
      headers: {
        'api_key': apiKey,
      },
      body: backFormData
    });
    
    const backData: FPTOCRResponse = await backResponse.json();
    
    // Extract and combine data from both images
    return extractDataFromFPTResponse(frontData, backData);
    
  } catch (error) {
    throw new Error(`Failed to extract ID card information: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert image URL to base64
 * @param imageUrl - Image URL
 * @returns Base64 string
 */
async function convertImageToBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]); // Remove data:image/jpeg;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert base64 to Blob for FormData
 * @param base64 - Base64 string
 * @returns Blob object
 */
async function base64ToBlob(base64: string): Promise<Blob> {
  const response = await fetch(`data:image/jpeg;base64,${base64}`);
  return response.blob();
}

/**
 * Extract data from FPT.AI OCR response
 * @param frontData - Response from front image
 * @param backData - Response from back image
 * @returns Processed information
 */
function extractDataFromFPTResponse(frontData: FPTOCRResponse, backData: FPTOCRResponse): OCRData {
  // FPT.AI response structure based on the API documentation
  const frontInfo = frontData.data?.[0] || {};
  const backInfo = backData.data?.[0] || {};
  
  return {
    idNumber: frontInfo.Số || frontInfo.id || '',
    fullName: frontInfo.Tên || frontInfo.name || '',
    dateOfBirth: formatDate(frontInfo['Ngày sinh'] || frontInfo.dob || '') || '',
    issueDate: formatDate(backInfo['Ngày cấp'] || backInfo.issue_date || '') || '',
    issuePlace: backInfo['Nơi cấp'] || backInfo.issue_place || '',
    gender: (frontInfo['Giới tính'] === 'Nam' || frontInfo.sex === 'Nam' ? 'male' : 'female') as 'male' | 'female'
  };
}

/**
 * Format date from various formats to YYYY-MM-DD
 * @param dateStr - Date string in various formats
 * @returns Formatted date string (YYYY-MM-DD)
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // Handle Vietnamese date format: DD/MM/YYYY
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  
  // Handle other date formats
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  
  return date.toISOString().split('T')[0];
}
