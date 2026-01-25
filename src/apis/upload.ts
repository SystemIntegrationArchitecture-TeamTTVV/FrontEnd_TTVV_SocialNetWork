import { API_CONFIG } from './config';

export interface UploadResponse {
  url: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export const uploadApi = {
  /**
   * Upload a file (image, video, or document)
   * TEMPORARY: Using mock upload since backend endpoint doesn't exist yet
   */
  uploadFile: async (file: File): Promise<UploadResponse> => {
    // MOCK IMPLEMENTATION - Replace with real S3 upload later
    console.log('⚠️ Using mock upload for:', file.name);
    
    // Create a local preview URL
    const mockUrl = URL.createObjectURL(file);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      url: mockUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    };
    
    /* REAL IMPLEMENTATION - Uncomment when backend is ready:
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/message/api/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(error.message || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      return {
        url: data.url || data.fileUrl || data.path,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
    */
  },

  /**
   * Upload multiple files
   */
  uploadFiles: async (files: File[]): Promise<UploadResponse[]> => {
    const uploadPromises = files.map(file => uploadApi.uploadFile(file));
    return Promise.all(uploadPromises);
  },
};
