"use client";

import { useState } from "react";
import { Bell, Mail, BarChart3, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  icon: typeof Bell;
  defaultValue: boolean;
}

const NOTIFICATION_SETTINGS: NotificationSetting[] = [
  {
    id: "patient_reply",
    label: "Patient Replies",
    description: "Email me when a patient replies to a sequence message",
    icon: Mail,
    defaultValue: true,
  },
  {
    id: "daily_summary",
    label: "Daily Summary",
    description: "Email me a daily summary of sequence activity",
    icon: BarChart3,
    defaultValue: false,
  },
  {
    id: "sequence_failure",
    label: "Sequence Failures",
    description: "Alert me when a sequence message fails to send",
    icon: AlertTriangle,
    defaultValue: true,
  },
];

export function NotificationsTab() {
  const [settings, setSettings] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      NOTIFICATION_SETTINGS.map((s) => [s.id, s.defaultValue])
    )
  );

  const toggle = (id: string) => {
    setSettings((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Choose which notifications you&apos;d like to receive by email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {NOTIFICATION_SETTINGS.map((setting, idx) => {
            const Icon = setting.icon;
            return (
              <div key={setting.id}>
                {idx > 0 && <Separator className="my-4" />}
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-muted p-2 mt-0.5">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label
                        htmlFor={setting.id}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {setting.label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {setting.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={setting.id}
                    checked={settings[setting.id]}
                    onCheckedChange={() => toggle(setting.id)}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="sm">Save Preferences</Button>
      </div>
    </div>
  );
}
