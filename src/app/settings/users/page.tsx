
"use client";

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Users as UsersIcon, Building, Edit, Trash2 } from 'lucide-react';
import type { User, Group } from '@/types';
import { mockUsersData, mockGroupsData, addUser as addMockUser, updateUser as updateMockUser, deleteUser as deleteMockUser, addGroup as addMockGroup, updateGroup as updateMockGroup, deleteGroup as deleteMockGroup } from '@/lib/mock-data';
import { ManageUserDialog } from '@/components/settings/users/manage-user-dialog';
import { ManageGroupDialog } from '@/components/settings/users/manage-group-dialog';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import { UserListItem } from '@/components/settings/users/user-list-item';

export default function UsersAndGroupsPage() {
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  const [isManageUserDialogOpen, setIsManageUserDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isConfirmDeleteUserDialogOpen, setIsConfirmDeleteUserDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [isManageGroupDialogOpen, setIsManageGroupDialogOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<Group | null>(null);
  const [isConfirmDeleteGroupDialogOpen, setIsConfirmDeleteGroupDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

  const refreshData = () => {
    setUsers([...mockUsersData]);
    setGroups([...mockGroupsData]);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleOpenAddUserDialog = () => {
    setUserToEdit(null);
    setIsManageUserDialogOpen(true);
  };

  const handleOpenEditUserDialog = (user: User) => {
    setUserToEdit(user);
    setIsManageUserDialogOpen(true);
  };

  const handleSaveUser = (userData: Omit<User, 'id'> | User) => {
    if ('id' in userData && userData.id) {
      updateMockUser(userData.id, userData);
      toast({ title: "User Updated", description: `User "${userData.name}" has been updated.` });
    } else {
      addMockUser(userData);
      toast({ title: "User Added", description: `User "${userData.name}" has been added.` });
    }
    refreshData();
    setIsManageUserDialogOpen(false);
  };

  const handleOpenDeleteUserDialog = (user: User) => {
    setUserToDelete(user);
    setIsConfirmDeleteUserDialogOpen(true);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      deleteMockUser(userToDelete.id);
      toast({ title: "User Deleted", description: `User "${userToDelete.name}" has been removed.` });
      refreshData();
    }
    setIsConfirmDeleteUserDialogOpen(false);
    setUserToDelete(null);
  };

  const handleResetPassword = (user: User) => {
    // In a real app, this would trigger a password reset flow (e.g., email).
    // For this mock, we'll just show a toast.
    toast({
        title: "Password Reset (Mock)",
        description: `Password reset requested for ${user.name}. This is a mock action.`,
    });
  };

  // Group Handlers
  const handleOpenAddGroupDialog = () => {
    setGroupToEdit(null);
    setIsManageGroupDialogOpen(true);
  };

  const handleOpenEditGroupDialog = (group: Group) => {
    setGroupToEdit(group);
    setIsManageGroupDialogOpen(true);
  };

  const handleSaveGroup = (groupData: Omit<Group, 'id'> | Group) => {
    if ('id' in groupData && groupData.id) {
      updateMockGroup(groupData.id, groupData);
      toast({ title: "Group Updated", description: `Group "${groupData.name}" has been updated.` });
    } else {
      addMockGroup(groupData);
      toast({ title: "Group Added", description: `Group "${groupData.name}" has been added.` });
    }
    refreshData();
    setIsManageGroupDialogOpen(false);
  };

  const handleOpenDeleteGroupDialog = (group: Group) => {
    setGroupToDelete(group);
    setIsConfirmDeleteGroupDialogOpen(true);
  };

  const confirmDeleteGroup = () => {
    if (groupToDelete) {
      deleteMockGroup(groupToDelete.id);
      toast({ title: "Group Deleted", description: `Group "${groupToDelete.name}" has been removed.` });
      refreshData(); 
    }
    setIsConfirmDeleteGroupDialogOpen(false);
    setGroupToDelete(null);
  };


  return (
    <AppLayout>
      <div className="container mx-auto py-4">
        <CardHeader className="px-0 pb-4">
          <CardTitle className="font-headline text-3xl">Users & Groups</CardTitle>
          <CardDescription>Manage user accounts and group permissions.</CardDescription>
        </CardHeader>

        <Tabs defaultValue="users" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="users"><UsersIcon className="mr-2 h-4 w-4" />Users ({users.length})</TabsTrigger>
              <TabsTrigger value="groups"><Building className="mr-2 h-4 w-4" />Groups ({groups.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="users" className="mt-0">
                 <Button onClick={handleOpenAddUserDialog}><PlusCircle className="mr-2 h-4 w-4"/>Add User</Button>
            </TabsContent>
             <TabsContent value="groups" className="mt-0">
                <Button onClick={handleOpenAddGroupDialog}><PlusCircle className="mr-2 h-4 w-4"/>Add Group</Button>
            </TabsContent>
          </div>

          <TabsContent value="users">
            <div className="space-y-4">
              {users.map(user => (
                <UserListItem 
                  key={user.id} 
                  user={user} 
                  allGroups={groups}
                  onEdit={() => handleOpenEditUserDialog(user)}
                  onDelete={() => handleOpenDeleteUserDialog(user)}
                  onResetPassword={() => handleResetPassword(user)} 
                />
              ))}
               {users.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">No users found.</p>}
            </div>
          </TabsContent>

          <TabsContent value="groups">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {groups.map(group => (
                <Card key={group.id}>
                  <CardHeader>
                    <CardTitle className="text-xl">{group.name}</CardTitle>
                    {group.description && <CardDescription>{group.description}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Members: {users.filter(u => u.groupIds?.includes(group.id)).length}
                    </p>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEditGroupDialog(group)} className="mr-2">
                      <Edit className="mr-2 h-4 w-4" />Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleOpenDeleteGroupDialog(group)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="mr-2 h-4 w-4" />Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              {groups.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">No groups found.</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {isManageUserDialogOpen && (
        <ManageUserDialog
          isOpen={isManageUserDialogOpen}
          onOpenChange={setIsManageUserDialogOpen}
          onSave={handleSaveUser}
          existingUser={userToEdit}
          allGroups={groups}
        />
      )}
      {userToDelete && (
        <ConfirmDialog
          isOpen={isConfirmDeleteUserDialogOpen}
          onOpenChange={setIsConfirmDeleteUserDialogOpen}
          onConfirm={confirmDeleteUser}
          title={`Delete User: ${userToDelete.name}`}
          description="Are you sure you want to delete this user? This action cannot be undone."
        />
      )}

      {isManageGroupDialogOpen && (
        <ManageGroupDialog
          isOpen={isManageGroupDialogOpen}
          onOpenChange={setIsManageGroupDialogOpen}
          onSave={handleSaveGroup}
          existingGroup={groupToEdit}
        />
      )}
      {groupToDelete && (
        <ConfirmDialog
          isOpen={isConfirmDeleteGroupDialogOpen}
          onOpenChange={setIsConfirmDeleteGroupDialogOpen}
          onConfirm={confirmDeleteGroup}
          title={`Delete Group: ${groupToDelete.name}`}
          description="Are you sure you want to delete this group? This action cannot be undone."
        />
      )}

    </AppLayout>
  );
}
