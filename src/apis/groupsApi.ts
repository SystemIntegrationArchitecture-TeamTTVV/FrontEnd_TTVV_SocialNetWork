import { httpClient } from './http';

export interface GroupData {
    id?: string;
    name: string;
    description?: string;
    avatar?: string;
    coverPhoto?: string;

    adminId?: string;
    adminName?: string;

    privacy?: 'PUBLIC' | 'PRIVATE' | 'SECRET';
    visibility?: 'VISIBLE' | 'HIDDEN';

    memberCount?: number;
    postCount?: number;

    tags?: string[];
    category?: string;

    createdAt?: string;
    updatedAt?: string;

    isActive?: boolean;
}

export interface CreateGroupRequest {
    name: string;
    description?: string;
    avatar?: string;
    coverPhoto?: string;

    adminId?: string;

    privacy?: 'PUBLIC' | 'PRIVATE' | 'SECRET';
    visibility?: 'VISIBLE' | 'HIDDEN';

    tags?: string[];
    category?: string;
}

export interface UpdateGroupRequest {
    name?: string;
    description?: string;
    avatar?: string;
    coverPhoto?: string;

    privacy?: 'PUBLIC' | 'PRIVATE' | 'SECRET';
    visibility?: 'VISIBLE' | 'HIDDEN';

    tags?: string[];
    category?: string;
}

class GroupsApi {

    private baseUrl = '/api/common/groups';

    /**
     * Get all groups
     */
    async getAllGroups(): Promise<GroupData[]> {
        try {
            console.log('📡 [Groups API] Fetching all groups...');
            const response = await httpClient.get<GroupData[]>(this.baseUrl);
            console.log('✅ [Groups API] Successfully fetched groups:', response.length);
            return response;
        } catch (error) {
            console.error('❌ [Groups API] Failed to fetch groups:', error);
            throw error;
        }
    }

    /**
     * Get group by ID
     */
    async getGroupById(id: string): Promise<GroupData> {
        try {
            console.log(`📡 [Groups API] Fetching group ${id}...`);
            const response = await httpClient.get<GroupData>(`${this.baseUrl}/${id}`);
            console.log('✅ [Groups API] Successfully fetched group:', response);
            return response;
        } catch (error) {
            console.error(`❌ [Groups API] Failed to fetch group ${id}:`, error);
            throw error;
        }
    }

    /**
     * Search groups
     */
    async searchGroups(name: string): Promise<GroupData[]> {
        try {
            console.log(`📡 [Groups API] Searching groups: ${name}`);
            const response = await httpClient.get<GroupData[]>(`${this.baseUrl}/search?name=${name}`);
            console.log('✅ [Groups API] Search result:', response.length);
            return response;
        } catch (error) {
            console.error('❌ [Groups API] Failed to search groups:', error);
            throw error;
        }
    }

    /**
     * Get groups by admin
     */
    async getGroupsByAdminId(adminId: string): Promise<GroupData[]> {
        try {
            console.log(`📡 [Groups API] Fetching groups by admin ${adminId}`);
            const response = await httpClient.get<GroupData[]>(`${this.baseUrl}/admin/${adminId}`);
            console.log('✅ [Groups API] Successfully fetched admin groups:', response.length);
            return response;
        } catch (error) {
            console.error('❌ [Groups API] Failed to fetch admin groups:', error);
            throw error;
        }
    }

    /**
     * Create group
     */
    async createGroup(groupData: CreateGroupRequest): Promise<GroupData> {
        try {
            console.log('📡 [Groups API] Creating group...', groupData);
            const response = await httpClient.post<GroupData>(this.baseUrl, groupData);
            console.log('✅ [Groups API] Successfully created group:', response);
            return response;
        } catch (error) {
            console.error('❌ [Groups API] Failed to create group:', error);
            throw error;
        }
    }

    /**
     * Update group
     */
    async updateGroup(id: string, groupData: UpdateGroupRequest): Promise<GroupData> {
        try {
            console.log(`📡 [Groups API] Updating group ${id}...`, groupData);
            const response = await httpClient.put<GroupData>(`${this.baseUrl}/${id}`, groupData);
            console.log('✅ [Groups API] Successfully updated group:', response);
            return response;
        } catch (error) {
            console.error(`❌ [Groups API] Failed to update group ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete group
     */
    async deleteGroup(id: string): Promise<void> {
        try {
            console.log(`📡 [Groups API] Deleting group ${id}...`);
            await httpClient.delete(`${this.baseUrl}/${id}`);
            console.log('✅ [Groups API] Successfully deleted group');
        } catch (error) {
            console.error(`❌ [Groups API] Failed to delete group ${id}:`, error);
            throw error;
        }
    }

    /**
     * Add members to group
     */
    async addMembers(groupId: string, userIds: string[]): Promise<void> {
        try {
            console.log(`📡 [Groups API] Adding members to group ${groupId}`, userIds);
            await httpClient.post(`${this.baseUrl}/${groupId}/members`, userIds);
            console.log('✅ [Groups API] Members added successfully');
        } catch (error) {
            console.error('❌ [Groups API] Failed to add members:', error);
            throw error;
        }
    }

    /**
     * Get group members
     */
    async getGroupMembers(groupId: string): Promise<any[]> {
        try {
            console.log(`📡 [Groups API] Fetching members of group ${groupId}`);
            const response = await httpClient.get<any[]>(`${this.baseUrl}/${groupId}/members`);
            console.log('✅ [Groups API] Members fetched:', response.length);
            return response;
        } catch (error) {
            console.error('❌ [Groups API] Failed to fetch members:', error);
            throw error;
        }
    }

    /**
     * Remove member
     */
    async removeMember(groupId: string, userId: string): Promise<void> {
        try {
            console.log(`📡 [Groups API] Removing member ${userId} from group ${groupId}`);
            await httpClient.delete(`${this.baseUrl}/${groupId}/members/${userId}`);
            console.log('✅ [Groups API] Member removed');
        } catch (error) {
            console.error('❌ [Groups API] Failed to remove member:', error);
            throw error;
        }
    }
    /**
   * Check if user is member of group
   */
    async checkUserMembership(groupId: string, userId: string): Promise<boolean> {
        try {

            console.log(`📡 [Groups API] Checking membership: user ${userId} in group ${groupId}`);

            const response = await httpClient.get<boolean>(
                `${this.baseUrl}/${groupId}/is-member/${userId}`
            );

            console.log("✅ [Groups API] Membership result:", response);

            return response;

        } catch (error) {

            console.error("❌ [Groups API] Failed to check membership:", error);

            throw error;

        }
    }
    /**
     * Join group
     */
    async joinGroup(groupId: string, userId: string): Promise<void> {

        console.log(`📡 [Groups API] User ${userId} joining group ${groupId}`);

        await httpClient.post(`${this.baseUrl}/${groupId}/join/${userId}`);

    }

    /**
     * Get user role in group
     */
    async getUserRole(groupId: string, userId: string): Promise<string | null> {

        try {

            console.log(`📡 [Groups API] Fetching role for user ${userId}`);

            const role = await httpClient.get<string>(
                `${this.baseUrl}/${groupId}/role/${userId}`
            );

            console.log("✅ Role:", role);

            return role;

        } catch (error) {

            console.log("ℹ️ User not in group");

            return null;

        }

    }
    /**
 * Leave group
 */
    async leaveGroup(groupId: string, userId: string): Promise<void> {

        console.log(`📡 [Groups API] User ${userId} leaving group ${groupId}`);

        await httpClient.delete(`${this.baseUrl}/${groupId}/leave/${userId}`);

    }
    async getGroupsByUserId(userId: string): Promise<GroupData[]> {

        console.log(`📡 [Groups API] Fetching groups of user ${userId}`);

        return await httpClient.get<GroupData[]>(
            `${this.baseUrl}/user/${userId}`
        );

    }

    //
    async getInvitableFriends(groupId: string, userId: string): Promise<any[]> {

    try {

        console.log(`📡 [Groups API] Fetching invitable friends for group ${groupId}`);

        const response = await httpClient.get<any[]>(
            `${this.baseUrl}/${groupId}/invitable-friends/${userId}`
        );

        console.log("✅ [Groups API] Invitable friends:", response.length);

        return response;

    } catch (error) {

        console.error("❌ [Groups API] Failed to fetch invitable friends:", error);

        throw error;

    }

}
    

}

export const groupsApi = new GroupsApi();