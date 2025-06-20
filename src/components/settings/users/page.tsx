
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
import { ScrollArea } from '@/components/ui/scroll-area'; // Added ScrollArea

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
    setUsers([...mockUsersData].sort((a, b) => a.name.localeCompare(b.name)));
    setGroups([...mockGroupsData].sort((a, b) => a.name.localeCompare(b.name)));
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
    toast({
        title: "Password Reset (Mock)",
        description: `Password reset requested for ${user.name}. This is a mock action.`,
    });
  };

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
      <div className="container mx-auto py-4 flex flex-col h-[calc(100vh-var(--header-height,4rem)-2rem)]"> {/* Adjust height for full page scroll area */}
        <CardHeader className="px-0 pb-4">
          <CardTitle className="font-headline text-3xl">Users & Groups</CardTitle>
          <CardDescription>Manage user accounts and group permissions.</CardDescription>
        </CardHeader>

        <Tabs defaultValue="users" className="w-full flex-grow flex flex-col">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <TabsList>
              <TabsTrigger value="users"><UsersIcon className="mr-2 h-4 w-4" />Users ({users.length})</TabsTrigger>
              <TabsTrigger value="groups"><Building className="mr-2 h-4 w-4" />Groups ({groups.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="users" className="mt-0 data-[state=inactive]:hidden"> {/* Hide if inactive */}
                 <Button onClick={handleOpenAddUserDialog}><PlusCircle className="mr-2 h-4 w-4"/>Add User</Button>
            </TabsContent>
             <TabsContent value="groups" className="mt-0 data-[state=inactive]:hidden"> {/* Hide if inactive */}
                <Button onClick={handleOpenAddGroupDialog}><PlusCircle className="mr-2 h-4 w-4"/>Add Group</Button>
            </TabsContent>
          </div>
          
          <ScrollArea className="flex-grow pr-1"> {/* ScrollArea for content */}
            <TabsContent value="users" className="mt-0 data-[state=inactive]:hidden">
              <div className="border rounded-md"> {/* Optional: Add border around list */}
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
                {users.length === 0 && <p className="text-muted-foreground text-center py-8">No users found.</p>}
              </div>
            </TabsContent>

            <TabsContent value="groups" className="mt-0 data-[state=inactive]:hidden">
              <div className="space-y-2"> {/* Reduced space for denser list */}
                {groups.map(group => (
                  <Card key={group.id} className="overflow-hidden transition-all hover:shadow-sm w-full border">
                    <CardContent className="p-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 text-sm">
                      <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                             <Building className="h-5 w-5 text-primary shrink-0" />
                              <div>
                                  <h3 className="font-headline font-semibold text-base leading-tight">{group.name}</h3>
                                  {group.description && <p className="text-xs text-muted-foreground">{group.description}</p>}
                              </div>
                          </div>
                          <p className="text-xs text-muted-foreground pl-7">
                              Members: {users.filter(u => u.groupIds?.includes(group.id)).length}
                          </p>
                      </div>
                       <div className="flex flex-col sm:flex-row gap-1.5 md:ml-3 shrink-0 pt-1 sm:pt-0">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenEditGroupDialog(group)}>
                          <Edit className="mr-1.5 h-3.5 w-3.5" />Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleOpenDeleteGroupDialog(group)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete
                          </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {groups.length === 0 && <p className="text-muted-foreground text-center py-8">No groups found.</p>}
              </div>
            </TabsContent>
          </ScrollArea>
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
