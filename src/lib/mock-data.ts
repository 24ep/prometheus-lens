
import type { User, Group, Permission } from '@/types';
// Asset and AssetFolder types are still imported for other parts of the app if needed,
// but their data management is now through src/lib/db.ts and API routes.

// Available Permissions
export const availablePermissions: Permission[] = [
  { id: 'perm-view-assets', name: 'View Assets', description: 'Allows viewing all asset details and configurations.' },
  { id: 'perm-edit-assets', name: 'Edit Assets', description: 'Allows editing asset configurations, tags, and metadata.' },
  { id: 'perm-delete-assets', name: 'Delete Assets', description: 'Allows deleting assets from the system.' },
  { id: 'perm-manage-folders', name: 'Manage Folders', description: 'Allows creating, editing, and deleting asset folders.' },
  { id: 'perm-manage-users', name: 'Manage Users & Groups', description: 'Allows creating, editing, and deleting users and groups.' },
  { id: 'perm-manage-settings', name: 'Manage Settings', description: 'Allows changing global application settings.' },
  { id: 'perm-test-connections', name: 'Test Connections', description: 'Allows initiating connection tests for assets.' },
];

// User and Group Mock Data (remains as mock data for now)
export let mockUsersData: User[] = [
  { id: 'user-1', name: 'Alice Wonderland', email: 'alice@example.com', role: 'Admin', groupIds: ['group-admin'], permissionIds: availablePermissions.map(p => p.id) },
  { id: 'user-2', name: 'Bob The Builder', email: 'bob@example.com', role: 'Editor', groupIds: ['group-editors', 'group-dev'], permissionIds: ['perm-view-assets', 'perm-edit-assets', 'perm-test-connections', 'perm-manage-folders'] },
  { id: 'user-3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'Viewer', groupIds: ['group-viewers'], permissionIds: ['perm-view-assets'] },
];

export let mockGroupsData: Group[] = [
  { id: 'group-admin', name: 'Administrators', description: 'Users with full system access.' },
  { id: 'group-editors', name: 'Content Editors', description: 'Users who can edit asset configurations.' },
  { id: 'group-dev', name: 'Developers', description: 'Development team members.' },
  { id: 'group-viewers', name: 'Viewers', description: 'Users with read-only access.' },
];

// User CRUD (mock)
export const addUser = (userData: Omit<User, 'id'>): User => {
  const newUser: User = { ...userData, id: `user-${Date.now()}` };
  mockUsersData.push(newUser);
  return newUser;
};

export const updateUser = (userId: string, userData: Partial<Omit<User, 'id'>>): User | undefined => {
  let updatedUser: User | undefined;
  mockUsersData = mockUsersData.map(user => {
    if (user.id === userId) {
      updatedUser = { ...user, ...userData };
      return updatedUser;
    }
    return user;
  });
  return updatedUser;
};

export const deleteUser = (userId: string): boolean => {
  const initialLength = mockUsersData.length;
  mockUsersData = mockUsersData.filter(user => user.id !== userId);
  return mockUsersData.length < initialLength;
};

// Group CRUD (mock)
export const addGroup = (groupData: Omit<Group, 'id'>): Group => {
  const newGroup: Group = { ...groupData, id: `group-${Date.now()}` };
  mockGroupsData.push(newGroup);
  return newGroup;
};

export const updateGroup = (groupId: string, groupData: Partial<Omit<Group, 'id'>>): Group | undefined => {
  let updatedGroup: Group | undefined;
  mockGroupsData = mockGroupsData.map(group => {
    if (group.id === groupId) {
      updatedGroup = { ...group, ...groupData };
      return updatedGroup;
    }
    return group;
  });
  return updatedGroup;
};

export const deleteGroup = (groupId: string): boolean => {
  const initialLength = mockGroupsData.length;
  mockGroupsData = mockGroupsData.filter(group => group.id !== groupId);
  mockUsersData = mockUsersData.map(user => ({
    ...user,
    groupIds: user.groupIds?.filter(id => id !== groupId)
  }));
  return mockGroupsData.length < initialLength;
};

export const getGroupById = (groupId: string): Group | undefined => {
    return mockGroupsData.find(g => g.id === groupId);
};

export const getUserById = (userId: string): User | undefined => {
    return mockUsersData.find(u => u.id === userId);
};

export const getPermissionById = (permissionId: string): Permission | undefined => {
    return availablePermissions.find(p => p.id === permissionId);
};

// Deprecated mock folder and asset data functions - these are now handled by API routes using the database.
// Keeping the file for User/Group/Permission mock data and related functions for now.
