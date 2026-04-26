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
   */
  uploadFile: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/social/api/upload`, {
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
      
      // Convert relative URL to absolute URL
      const fileUrl = data.url.startsWith('http') 
        ? data.url 
        : `${API_CONFIG.BASE_URL}${data.url}`;
      
      return {
        url: fileUrl,
        fileName: data.fileName || file.name,
        fileSize: data.fileSize || file.size,
        fileType: data.fileType || file.type,
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  /**
   * Upload multiple files
   */
  uploadFiles: async (files: File[]): Promise<UploadResponse[]> => {
    const uploadPromises = files.map(file => uploadApi.uploadFile(file));
    return Promise.all(uploadPromises);
  },
};
