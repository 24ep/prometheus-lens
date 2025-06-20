
"use client";

import type { User, Group, Permission } from '@/types';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, KeyRound, User as UserIcon, Mail, ShieldCheck, CheckSquare, Users2 } from 'lucide-react'; // Users2 for groups
import { cn } from '@/lib/utils';
import { getGroupById, getPermissionById } from '@/lib/mock-data';

interface UserListItemProps {
  user: User;
  allGroups: Group[]; 
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onResetPassword: (user: User) => void; 
}

export function UserListItem({ user, onEdit, onDelete, onResetPassword }: UserListItemProps) {
  const userGroups = user.groupIds?.map(gid => getGroupById(gid)).filter(Boolean) as Group[] || [];
  const userPermissions = user.permissionIds?.map(pid => getPermissionById(pid)).filter(Boolean) as Permission[] || [];

  return (
    <div className="group flex items-start gap-4 px-3 py-3 hover:bg-muted/50 rounded-md transition-colors duration-150 border-b last:border-b-0">
      <UserIcon className="h-8 w-8 text-primary mt-1 shrink-0" />
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-semibold text-base leading-tight">{user.name}</h3>
          <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 md:opacity-100">
            <Button variant="ghost" size="sm" onClick={() => onEdit(user)} title="Edit User">
              <Edit className="mr-1.5 h-3.5 w-3.5" />Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onResetPassword(user)} disabled title="Reset Password (disabled)">
              <KeyRound className="mr-1.5 h-3.5 w-3.5" />Reset
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(user)} className="text-destructive hover:text-destructive" title="Delete User">
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete
            </Button>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
          <Mail className="h-3 w-3"/> {user.email}
        </p>

        <div className="flex items-center gap-2 mt-1.5">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'} className="text-xs">{user.role}</Badge>
        </div>

        {userGroups.length > 0 && (
          <div className="mt-1.5">
            <div className="flex items-center text-xs text-muted-foreground gap-1.5">
              <Users2 className="h-3.5 w-3.5"/>
              <span className="font-medium">Groups:</span>
            </div>
            <div className="inline-flex flex-wrap gap-1 mt-0.5">
              {userGroups.map(group => (
                <Badge key={group.id} variant="outline" className="text-xs px-1.5 py-0.5">{group.name}</Badge>
              ))}
            </div>
          </div>
        )}

        {userPermissions.length > 0 && (
          <div className="mt-1.5">
            <div className="flex items-center text-xs text-muted-foreground gap-1.5">
               <CheckSquare className="h-3.5 w-3.5"/>
               <span className="font-medium">Permissions:</span>
            </div>
            <div className="inline-flex flex-wrap gap-1 mt-0.5">
              {userPermissions.map(permission => (
                <Badge key={permission.id} variant="secondary" className="text-xs font-normal px-1.5 py-0.5">{permission.name}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
