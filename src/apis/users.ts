import { httpClient } from './http';

export interface User {
  id?: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatar?: string;
  coverPhoto?: string;
  bio?: string;
  city?: string;
  country?: string;
  // Extended profile fields
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  workPlace?: string;
  education?: string;
  interests?: string[];
  profileVisibility?: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  postVisibility?: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  showEmail?: boolean;
  showPhone?: boolean;
  // Messaging & Call privacy
  allowMessageFrom?: 'EVERYONE' | 'FRIENDS_ONLY';
  allowCallFrom?: 'EVERYONE' | 'FRIENDS_ONLY';
  allowGroupInviteFrom?: 'EVERYONE' | 'FRIENDS_ONLY';
  isActive?: boolean;
  isVerified?: boolean;
  role?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PresenceStatus {
  userId: string;
  username?: string;
  online: boolean;
  lastSeenAt?: string | null;
}

export const usersApi = {
  /**
   * Get all users (admin only)
   */
  getAllUsers: async (): Promise<User[]> => {
    try {
      return await httpClient.get<User[]>('/api/common/users');
    } catch (error) {
      console.error('Failed to get all users:', error);
      throw error;
    }
  },

  /**
   * Search users by query
   */
  searchUsers: async (query: string): Promise<User[]> => {
    return httpClient.get<User[]>(`/api/common/users/search?query=${encodeURIComponent(query)}`);
  },

  /**
   * Get user by ID
   */
  getUserById: async (id: string): Promise<User> => {
    return httpClient.get<User>(`/api/common/users/${id}`);
  },

  /**
   * Get user by username
   */
  getUserByUsername: async (username: string): Promise<User> => {
    return httpClient.get<User>(`/api/common/users/username/${username}`);
  },

  /**
   * Update user status (admin only)
   */
  updateUserStatus: async (userId: string, status: string): Promise<User> => {
    try {
      return await httpClient.put<User>(`/api/common/users/${userId}/status`, { status });
    } catch (error) {
      console.error('Failed to update user status:', error);
      throw error;
    }
  },

  /**
   * Update user role (admin only)
   */
  updateUserRole: async (userId: string, role: string): Promise<User> => {
    try {
      return await httpClient.put<User>(`/api/common/users/${userId}/role`, { role });
    } catch (error) {
      console.error('Failed to update user role:', error);
      throw error;
    }
  },

  /**
   * Delete user (admin only)
   */
  deleteUser: async (userId: string): Promise<void> => {
    try {
      await httpClient.delete(`/api/common/users/${userId}`);
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  },

  /**
   * Update user profile
   */
  updateUserProfile: async (userId: string, data: Partial<User>): Promise<User> => {
    try {
      return await httpClient.put<User>(`/api/common/users/${userId}`, data);
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  },

  getPresenceByUserIds: async (userIds: string[]): Promise<Record<string, PresenceStatus>> => {
    if (!userIds || userIds.length === 0) {
      return {};
    }
    const query = encodeURIComponent(userIds.join(','));
    return httpClient.get<Record<string, PresenceStatus>>(`/api/common/socket/presence?userIds=${query}`);
  },
};
