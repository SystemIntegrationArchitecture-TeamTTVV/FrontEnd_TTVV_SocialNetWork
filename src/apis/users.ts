import { httpClient } from './http';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar?: string;
  coverPhoto?: string;
  bio?: string;
  city?: string;
  country?: string;
  isActive: boolean;
  isVerified: boolean;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export const usersApi = {
  searchUsers: async (query: string): Promise<User[]> => {
    return httpClient.get<User[]>(`/api/common/users/search?query=${encodeURIComponent(query)}`);
  },

  getUserById: async (id: string): Promise<User> => {
    return httpClient.get<User>(`/api/common/users/${id}`);
  },

  getUserByUsername: async (username: string): Promise<User> => {
    return httpClient.get<User>(`/api/common/users/username/${username}`);
  },
};
