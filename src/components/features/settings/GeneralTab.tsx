"use client";

import { useState } from "react";
import { Building2, Upload, Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { usePracticeStore } from "@/stores/practice-store";
import { useUpdatePractice } from "@/hooks/useSettings";
import { useSandbox } from "@/lib/sandbox";
import { useSandboxStore } from "@/stores/sandbox-store";

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HT)" },
];

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DEFAULT_HOURS: Record<string, { open: string; close: string; enabled: boolean }> = {
  Monday: { open: "08:00", close: "17:00", enabled: true },
  Tuesday: { open: "08:00", close: "17:00", enabled: true },
  Wednesday: { open: "08:00", close: "17:00", enabled: true },
  Thursday: { open: "08:00", close: "17:00", enabled: true },
  Friday: { open: "08:00", close: "17:00", enabled: true },
  Saturday: { open: "09:00", close: "13:00", enabled: false },
  Sunday: { open: "09:00", close: "13:00", enabled: false },
};

export function GeneralTab() {
  const practice = usePracticeStore((s) => s.activePractice);
  const updatePractice = useUpdatePractice();
  const { isSandbox } = useSandbox();
  const demoUser = useSandboxStore((s) => s.demoUser);
  const sandboxMembers = useSandboxStore((s) => s.teamMembers);
  const isAdmin = isSandbox
    ? sandboxMembers.some((m) => m.email === demoUser?.email && m.isAdmin)
    : true;

  const [name, setName] = useState(practice?.name ?? "");
  const [phone, setPhone] = useState(practice?.phone ?? "");
  const [email, setEmail] = useState(practice?.email ?? "");
  const [timezone, setTimezone] = useState(practice?.timezone ?? "");
  const [businessHours, setBusinessHours] = useState(DEFAULT_HOURS);

  const handleSave = () => {
    updatePractice.mutate({ name, phone, email, timezone });
  };

  const toggleDay = (day: string) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  };

  const updateHour = (day: string, field: "open" | "close", value: string) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
          <Lock className="h-4 w-4 shrink-0" />
          <span>Only admins can edit practice settings. Contact your admin for changes.</span>
        </div>
      )}
      {/* Practice Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Practice Information</CardTitle>
          <CardDescription>
            Update your practice name, contact info, and timezone
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="practice-name">Practice Name</Label>
              <Input
                id="practice-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bright Smiles Dental"
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="practice-phone">Phone</Label>
              <Input
                id="practice-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="practice-email">Email</Label>
              <Input
                id="practice-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="office@brightsmiles.com"
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="practice-timezone">Timezone</Label>
              <Select value={timezone || undefined} onValueChange={setTimezone} disabled={!isAdmin}>
                <SelectTrigger id="practice-timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={updatePractice.isPending}
              >
                {updatePractice.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Practice Logo</CardTitle>
          <CardDescription>
            Upload your logo for branded emails and reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/50">
              <Building2 className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div className="space-y-2">
              <Button variant="outline" size="sm" disabled={!isAdmin}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Logo
              </Button>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, or SVG. Max 2MB. Recommended 200x200px.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Business Hours
          </CardTitle>
          <CardDescription>
            Messages will only be scheduled within your business hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DAYS.map((day) => {
              const hours = businessHours[day];
              return (
                <div key={day} className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => isAdmin && toggleDay(day)}
                    className="w-24 text-left text-sm font-medium"
                    disabled={!isAdmin}
                  >
                    <span className={hours.enabled ? "" : "text-muted-foreground line-through"}>
                      {day}
                    </span>
                  </button>

                  {hours.enabled ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={hours.open}
                        onChange={(e) => updateHour(day, "open", e.target.value)}
                        className="w-[130px] text-sm"
                        disabled={!isAdmin}
                      />
                      <span className="text-sm text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={hours.close}
                        onChange={(e) => updateHour(day, "close", e.target.value)}
                        className="w-[130px] text-sm"
                        disabled={!isAdmin}
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Closed</span>
                  )}
                </div>
              );
            })}
          </div>
          <Separator className="my-4" />
          {isAdmin && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm">
                Save Hours
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
