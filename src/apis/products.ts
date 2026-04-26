import { httpClient } from './http';

interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}
export interface ProductDTO {
    id?: string;
    title: string;
    description: string;
    seller?: {
        id: string;
        fullName: string;
        avatar?: string;
    };
    price: number;
    currency?: string;
    condition: 'NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR';
    location: string;
    address?: string;
    images: string[];
    tags?: string[];
    category: string;
    isSold?: boolean;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
    active: boolean;
    sold: boolean;
}

export interface CreateProductRequest {
    title: string;
    description: string;
    price: number;
    currency?: string;
    condition: 'NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR';
    location: string;
    address?: string;
    images: string[];
    tags?: string[];
    category: string;
}

export interface UpdateProductRequest {
    title?: string;
    description?: string;
    price?: number;
    currency?: string;
    condition?: 'NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR';
    location?: string;
    address?: string;
    images?: string[];
    tags?: string[];
    category?: string;
    isActive?: boolean;
    isSold?: boolean;
    active?: boolean;
    sold?: boolean;
}

class ProductApi {
    private baseUrl = '/api/social/products';

    /**
     * Get all products with pagination and filters
     */
    async getAllProducts(params?: {
        page?: number;
        pageSize?: number;
        category?: string;
        search?: string;
        sortBy?: 'createdAt' | 'price' | 'title';
        sortOrder?: 'ASC' | 'DESC';
    }): Promise<ProductDTO[]> {
        try {
            console.log('📡 [Product API] Fetching all products...', params);

            const queryParams = new URLSearchParams();
            if (params?.page) queryParams.append('page', String(params.page));
            if (params?.pageSize) queryParams.append('pageSize', String(params.pageSize));
            if (params?.category) queryParams.append('category', params.category);
            if (params?.search) queryParams.append('search', params.search);
            if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
            if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

            const url = `${this.baseUrl}${queryParams.toString() ? '?' + queryParams : ''}`;

            const response = await httpClient.get<PageResponse<ProductDTO>>(url);

            console.log('✅ [Product API] content:', response.content.length);

            return response.content; // 
        } catch (error) {
            console.error('❌ [Product API] Failed to fetch products:', error);
            throw error;
        }
    }

    /**
     * Get product by ID
     */
    async getProductById(id: string): Promise<ProductDTO> {
        try {
            console.log(`📡 [Product API] Fetching product ${id}...`);
            const response = await httpClient.get<ProductDTO>(`${this.baseUrl}/${id}`);
            console.log('✅ [Product API] Successfully fetched product:', response);
            return response;
        } catch (error) {
            console.error(`❌ [Product API] Failed to fetch product ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get user's products (seller's products)
     */
    async getUserProducts(userId: string, params?: {
        page?: number;
        pageSize?: number;
    }): Promise<ProductDTO[]> {
        try {
            const queryParams = new URLSearchParams();
            if (params?.page) queryParams.append('page', String(params.page));
            if (params?.pageSize) queryParams.append('pageSize', String(params.pageSize));

            const url = `${this.baseUrl}/user/${userId}${queryParams.toString() ? '?' + queryParams : ''}`;

            const response = await httpClient.get<any>(url);

            return response.content; // 
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    /**
     * Create a new product
     */
    async createProduct(
        data: CreateProductRequest,
        userId: string
    ): Promise<ProductDTO> {
        return httpClient.post<ProductDTO>(
            `${this.baseUrl}/${userId}`, // 👈 đưa userId vào URL
            data
        );
    }

    // ✅ UPDATE
    async updateProduct(
        id: string,
        data: UpdateProductRequest,
        userId: string
    ): Promise<ProductDTO> {
        return httpClient.put<ProductDTO>(
            `${this.baseUrl}/${userId}/${id}`, // 👈 userId + id
            data
        );
    }

    // ✅ DELETE
    async deleteProduct(id: string, userId: string): Promise<void> {
        return httpClient.delete(
            `${this.baseUrl}/${userId}/${id}`
        );
    }

    // ✅ MARK SOLD
    async markAsSold(id: string, userId: string): Promise<ProductDTO> {
        return httpClient.put<ProductDTO>(
            `${this.baseUrl}/${userId}/${id}/mark-sold`
        );
    }

    /**
     * Get categories
     */
    async getCategories(): Promise<string[]> {
        try {
            console.log('📡 [Product API] Fetching categories...');
            const response = await httpClient.get<string[]>(`${this.baseUrl}/categories`);
            console.log('✅ [Product API] Successfully fetched categories:', response);
            return response;
        } catch (error) {
            console.error('❌ [Product API] Failed to fetch categories:', error);
            throw error;
        }
    }

    /**
     * Search products
     */
    async searchProducts(query: string, params?: {
        category?: string;
        minPrice?: number;
        maxPrice?: number;
    }): Promise<ProductDTO[]> {
        try {
            console.log('📡 [Product API] Searching products...', query, params);
            const queryParams = new URLSearchParams();
            queryParams.append('search', query);
            if (params?.category) queryParams.append('category', params.category);
            if (params?.minPrice) queryParams.append('minPrice', String(params.minPrice));
            if (params?.maxPrice) queryParams.append('maxPrice', String(params.maxPrice));

            const response = await httpClient.get<ProductDTO[]>(`${this.baseUrl}/search?${queryParams.toString()}`);
            console.log('✅ [Product API] Successfully searched products:', response.length);
            return response;
        } catch (error) {
            console.error('❌ [Product API] Failed to search products:', error);
            throw error;
        }
    }
}

export const productApi = new ProductApi();
