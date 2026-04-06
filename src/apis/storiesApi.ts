import type { Story } from '../types/story';
import { httpClient } from './http';
import { API_CONFIG } from './config';

/** Không gửi base64/blob trong FormData — vừa nặng vừa dễ vượt giới hạn Tomcat ~2MB. BE đã có userId để resolve. */
function sanitizeStoryAvatar(avatar: string | undefined): string {
    if (!avatar?.trim()) return '';
    const a = avatar.trim();
    if (a.startsWith('data:') || a.startsWith('blob:')) return '';
    if (a.length > 8000) return '';
    return a;
}

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
            if (response.status === 413) {
                throw new Error('413 Payload Too Large');
            }
            const error = await response.json().catch(() => ({
                message: `HTTP ${response.status}`,
            }));
            throw new Error(
                typeof error.message === 'string' ? error.message : `HTTP ${response.status}`,
            );
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
        formData.append('userAvatar', sanitizeStoryAvatar(params.userAvatar));
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

        return this.postFormData<Story>(this.baseUrl, formData);
    }
}

export const storiesApi = new StoriesApi();