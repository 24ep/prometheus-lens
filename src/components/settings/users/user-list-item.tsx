
"use client";

import type { User, Group, Permission } from '@/types';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, KeyRound, Users, Mail, Shield, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getGroupById, getPermissionById } from '@/lib/mock-data'; // To resolve group/permission names

interface UserListItemProps {
  user: User;
  allGroups: Group[]; // Though not directly used if getGroupById is efficient from mock-data
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onResetPassword: (user: User) => void; 
}

export function UserListItem({ user, onEdit, onDelete, onResetPassword }: UserListItemProps) {
  const userGroups = user.groupIds?.map(gid => getGroupById(gid)).filter(Boolean) as Group[] || [];
  const userPermissions = user.permissionIds?.map(pid => getPermissionById(pid)).filter(Boolean) as Permission[] || [];

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md w-full">
      <CardContent className="p-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4 text-sm">
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary shrink-0" />
            <div>
              <h3 className="font-headline font-semibold text-base leading-tight">{user.name}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3"/> {user.email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>{user.role}</Badge>
          </div>

          {userGroups.length > 0 && (
            <div className="pt-1">
              <span className="text-xs font-medium text-muted-foreground mr-1.5">Groups:</span>
              <div className="inline-flex flex-wrap gap-1.5">
                {userGroups.map(group => (
                  <Badge key={group.id} variant="outline" className="text-xs">{group.name}</Badge>
                ))}
              </div>
            </div>
          )}
          {userGroups.length === 0 && (
             <p className="text-xs text-muted-foreground italic pt-1">Not assigned to any groups.</p>
          )}

          {userPermissions.length > 0 && (
            <div className="pt-1">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckSquare className="h-3.5 w-3.5 text-muted-foreground"/>
                <span className="text-xs font-medium text-muted-foreground">Assigned Permissions:</span>
              </div>
              <div className="inline-flex flex-wrap gap-1.5">
                {userPermissions.map(permission => (
                  <Badge key={permission.id} variant="secondary" className="text-xs font-normal">{permission.name}</Badge>
                ))}
              </div>
            </div>
          )}
           {userPermissions.length === 0 && (
             <p className="text-xs text-muted-foreground italic pt-1">No specific permissions assigned.</p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 md:ml-4 shrink-0 pt-1 md:pt-0">
          <Button variant="outline" size="sm" onClick={() => onEdit(user)}>
            <Edit className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => onResetPassword(user)} disabled>
            <KeyRound className="mr-1.5 h-3.5 w-3.5" />
            Reset Password
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(user)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
