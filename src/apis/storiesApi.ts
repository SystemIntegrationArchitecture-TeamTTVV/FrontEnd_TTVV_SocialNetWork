import type { Story } from '../types/story';
import { httpClient } from './http';
import { API_CONFIG } from './config';

class StoriesApi {
    private baseUrl = '/api/common/stories';

    async getStoryFeed(userId: string): Promise<Story[]> {
        return await httpClient.get<Story[]>(
            `${this.baseUrl}/feed/${userId}`
        );
    }

    //  Helper method để gửi FormData
    private async postFormData<T>(url: string, formData: FormData): Promise<T> {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {};
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        //  Dùng BASE_URL từ config
        const fullUrl = `${API_CONFIG.BASE_URL}${url}`;

        const response = await fetch(fullUrl, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ 
                message: `HTTP ${response.status}` 
            }));
            throw new Error(error.message);
        }

        return response.json();
    }

    async createStory(params: {
        userId: string;
        userName: string;
        userAvatar: string;
        contentType: 'text' | 'image' | 'video';
        content?: string;
        background?: string;
        /** Chú thích khi đăng ảnh/video */
        caption?: string;
        duration: number;
        file?: File;
    }): Promise<Story> {
        const formData = new FormData();

        formData.append('userId', params.userId);
        formData.append('userName', params.userName);
        formData.append('userAvatar', params.userAvatar);
        formData.append('contentType', params.contentType);

        if (params.content) {
            formData.append('content', params.content);
        }

        if (params.background) {
            formData.append('background', params.background);
        }

        if (params.caption?.trim()) {
            formData.append('caption', params.caption.trim());
        }

        if (params.file) {
            formData.append('file', params.file);
        }

        console.log('=== Sending FormData ===');
        for (const [key, value] of formData.entries()) {
            console.log(key, value);
        }

        return this.postFormData<Story>(this.baseUrl, formData);
    }
}

export const storiesApi = new StoriesApi();