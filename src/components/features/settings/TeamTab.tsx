"use client";

import { useState } from "react";
import { UserPlus, Trash2, Stethoscope, Sparkles, Phone, ClipboardList, Wrench, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  usePracticeMembers,
  useInviteMember,
  useRemoveMember,
} from "@/hooks/useSettings";
import { useSandbox } from "@/lib/sandbox";
import { useSandboxStore, type DentalRole } from "@/stores/sandbox-store";

const DENTAL_ROLES: { value: DentalRole; label: string; icon: typeof Stethoscope; variant: "default" | "secondary" | "outline" }[] = [
  { value: "dentist", label: "Dentist", icon: Stethoscope, variant: "default" },
  { value: "hygienist", label: "Hygienist", icon: Sparkles, variant: "secondary" },
  { value: "front_office", label: "Front Office", icon: Phone, variant: "outline" },
  { value: "office_manager", label: "Office Manager", icon: ClipboardList, variant: "secondary" },
  { value: "dental_assistant", label: "Dental Assistant", icon: Wrench, variant: "outline" },
];

function getRoleConfig(role: DentalRole) {
  return DENTAL_ROLES.find((r) => r.value === role) ?? DENTAL_ROLES[2];
}

export function TeamTab() {
  const { data: members } = usePracticeMembers();
  const inviteMember = useInviteMember();
  const removeMember = useRemoveMember();
  const { isSandbox } = useSandbox();
  const sandboxMembers = useSandboxStore((s) => s.teamMembers);
  const demoUser = useSandboxStore((s) => s.demoUser);
  const addTeamMember = useSandboxStore((s) => s.addTeamMember);
  const updateTeamMember = useSandboxStore((s) => s.updateTeamMember);
  const removeTeamMember = useSandboxStore((s) => s.removeTeamMember);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<DentalRole>("front_office");
  const [inviteAdmin, setInviteAdmin] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  // Use sandbox members in demo mode, real data otherwise
  const useSandboxMembers = isSandbox && sandboxMembers.length > 0;

  // Check if current user is admin
  const currentUserEmail = demoUser?.email;
  const isCurrentUserAdmin = useSandboxMembers
    ? sandboxMembers.some((m) => m.email === currentUserEmail && m.isAdmin)
    : true; // non-sandbox: assume admin (real auth handles this)

  const displayMembers = useSandboxMembers
    ? sandboxMembers.map((m) => ({
        id: m.id,
        full_name: m.full_name,
        email: m.email,
        role: m.role as DentalRole,
        isAdmin: m.isAdmin,
        created_at: m.created_at,
      }))
    : (members ?? []).map((m) => ({
        id: m.id,
        full_name: m.full_name ?? "Unnamed User",
        email: m.email,
        role: (m.role === "owner" ? "dentist" : m.role === "admin" ? "office_manager" : "front_office") as DentalRole,
        isAdmin: m.role === "owner" || m.role === "admin",
        created_at: m.created_at,
      }));

  const handleInvite = () => {
    if (useSandboxMembers) {
      addTeamMember({ full_name: inviteName, email: inviteEmail, role: inviteRole, isAdmin: inviteAdmin });
      setInviteOpen(false);
      setInviteName("");
      setInviteEmail("");
      setInviteRole("front_office");
      setInviteAdmin(false);
      return;
    }
    inviteMember.mutate(
      { email: inviteEmail, role: inviteRole === "dentist" ? "owner" : inviteRole === "office_manager" ? "admin" : "member" },
      {
        onSuccess: () => {
          setInviteOpen(false);
          setInviteName("");
          setInviteEmail("");
          setInviteRole("front_office");
          setInviteAdmin(false);
        },
      }
    );
  };

  const handleRemove = (memberId: string) => {
    if (useSandboxMembers) {
      removeTeamMember(memberId);
      setRemoveTarget(null);
      return;
    }
    removeMember.mutate(memberId, {
      onSuccess: () => setRemoveTarget(null),
    });
  };

  const handleRoleChange = (memberId: string, newRole: DentalRole) => {
    if (useSandboxMembers) {
      updateTeamMember(memberId, { role: newRole });
    }
  };

  const handleToggleAdmin = (memberId: string, currentIsAdmin: boolean) => {
    if (useSandboxMembers) {
      updateTeamMember(memberId, { isAdmin: !currentIsAdmin });
    }
  };

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Team Members</CardTitle>
              <CardDescription>
                Manage who has access to your practice
              </CardDescription>
            </div>
            {isCurrentUserAdmin && (
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to join your practice. They&apos;ll receive
                      an email with a signup link.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-name">Full Name</Label>
                      <Input
                        id="invite-name"
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        placeholder="Jane Smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite-email">Email Address</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite-role">Role</Label>
                      <Select
                        value={inviteRole}
                        onValueChange={(v) => setInviteRole(v as DentalRole)}
                      >
                        <SelectTrigger id="invite-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DENTAL_ROLES.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="invite-admin"
                        type="checkbox"
                        checked={inviteAdmin}
                        onChange={(e) => setInviteAdmin(e.target.checked)}
                        className="h-4 w-4 rounded border-input"
                      />
                      <Label htmlFor="invite-admin" className="text-sm font-normal">
                        Grant admin permissions (can manage settings and team)
                      </Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setInviteOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleInvite}
                      disabled={!inviteEmail || !inviteName || (!useSandboxMembers && inviteMember.isPending)}
                    >
                      {!useSandboxMembers && inviteMember.isPending ? "Sending..." : "Add Member"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {displayMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No team members yet. Invite your first team member above.
            </p>
          ) : (
            <div className="space-y-1">
              {displayMembers.map((member, idx) => {
                const config = getRoleConfig(member.role);
                const RoleIcon = config.icon;
                const initials = member.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() || "?";
                const isSelf = member.email === currentUserEmail;

                return (
                  <div key={member.id}>
                    {idx > 0 && <Separator className="my-3" />}
                    <div className="flex items-center gap-3 py-1">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {member.full_name}
                          </p>
                          {isSelf && (
                            <span className="text-xs text-muted-foreground">(you)</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.isAdmin && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="default" className="gap-1 bg-primary hover:bg-primary/90">
                                <Shield className="h-3 w-3" />
                                Admin
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              Can manage settings and team members
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {isCurrentUserAdmin ? (
                          <Select
                            value={member.role}
                            onValueChange={(v) => handleRoleChange(member.id, v as DentalRole)}
                          >
                            <SelectTrigger className="w-[160px] h-8 text-xs">
                              <div className="flex items-center gap-1.5">
                                <RoleIcon className="h-3 w-3" />
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              {DENTAL_ROLES.map((r) => (
                                <SelectItem key={r.value} value={r.value}>
                                  {r.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={config.variant} className="gap-1">
                            <RoleIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        )}
                        {isCurrentUserAdmin && !isSelf && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant={member.isAdmin ? "secondary" : "ghost"}
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleToggleAdmin(member.id, member.isAdmin)}
                                >
                                  <Shield className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {member.isAdmin ? "Remove admin" : "Make admin"}
                              </TooltipContent>
                            </Tooltip>
                            <Dialog
                              open={removeTarget === member.id}
                              onOpenChange={(open) =>
                                setRemoveTarget(open ? member.id : null)
                              }
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Remove Team Member</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to remove{" "}
                                    <span className="font-medium">
                                      {member.full_name}
                                    </span>{" "}
                                    from this practice? They will lose access
                                    immediately.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => setRemoveTarget(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleRemove(member.id)}
                                    disabled={!useSandboxMembers && removeMember.isPending}
                                  >
                                    {!useSandboxMembers && removeMember.isPending
                                      ? "Removing..."
                                      : "Remove Member"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  );
}
