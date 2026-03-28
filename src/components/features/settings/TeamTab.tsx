"use client";

import { useState } from "react";
import { UserPlus, Trash2, Shield, ShieldCheck, User } from "lucide-react";
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
  usePracticeMembers,
  useInviteMember,
  useRemoveMember,
} from "@/hooks/useSettings";
import { type PracticeMember } from "@/types/app.types";

const ROLE_CONFIG: Record<
  PracticeMember["role"],
  { label: string; icon: typeof Shield; variant: "default" | "secondary" | "outline" }
> = {
  owner: { label: "Owner", icon: ShieldCheck, variant: "default" },
  admin: { label: "Admin", icon: Shield, variant: "secondary" },
  member: { label: "Member", icon: User, variant: "outline" },
};

// Demo members for display — replaced by real data when API connected
const DEMO_MEMBERS = [
  {
    id: "1",
    user_id: "u1",
    practice_id: "p1",
    role: "owner" as const,
    email: "dr.smith@brightsmiles.com",
    full_name: "Dr. Sarah Smith",
    created_at: "2024-01-15T00:00:00Z",
  },
  {
    id: "2",
    user_id: "u2",
    practice_id: "p1",
    role: "admin" as const,
    email: "mgr@brightsmiles.com",
    full_name: "Jessica Martinez",
    created_at: "2024-02-10T00:00:00Z",
  },
  {
    id: "3",
    user_id: "u3",
    practice_id: "p1",
    role: "member" as const,
    email: "front@brightsmiles.com",
    full_name: "Alex Chen",
    created_at: "2024-03-05T00:00:00Z",
  },
];

export function TeamTab() {
  const { data: members } = usePracticeMembers();
  const inviteMember = useInviteMember();
  const removeMember = useRemoveMember();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<PracticeMember["role"]>("member");
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  // Use real data when available, fall back to demo
  const displayMembers = members && members.length > 0 ? members : DEMO_MEMBERS;

  const handleInvite = () => {
    inviteMember.mutate(
      { email: inviteEmail, role: inviteRole },
      {
        onSuccess: () => {
          setInviteOpen(false);
          setInviteEmail("");
          setInviteRole("member");
        },
      }
    );
  };

  const handleRemove = (memberId: string) => {
    removeMember.mutate(memberId, {
      onSuccess: () => setRemoveTarget(null),
    });
  };

  return (
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
                      onValueChange={(v) =>
                        setInviteRole(v as PracticeMember["role"])
                      }
                    >
                      <SelectTrigger id="invite-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Admins can manage settings and team. Members can view and
                      manage patients and sequences.
                    </p>
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
                    disabled={!inviteEmail || inviteMember.isPending}
                  >
                    {inviteMember.isPending ? "Sending..." : "Send Invite"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {displayMembers.map((member, idx) => {
              const config = ROLE_CONFIG[member.role];
              const RoleIcon = config.icon;
              const initials =
                member.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() ?? "?";

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
                      <p className="text-sm font-medium truncate">
                        {member.full_name ?? "Unnamed User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.email}
                      </p>
                    </div>
                    <Badge variant={config.variant} className="gap-1">
                      <RoleIcon className="h-3 w-3" />
                      {config.label}
                    </Badge>
                    {member.role !== "owner" && (
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
                                {member.full_name ?? member.email}
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
                              disabled={removeMember.isPending}
                            >
                              {removeMember.isPending
                                ? "Removing..."
                                : "Remove Member"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
