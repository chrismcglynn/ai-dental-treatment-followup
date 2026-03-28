"use client";

import { useState } from "react";
import {
  Check,
  X,
  RefreshCw,
  Copy,
  Download,
  Loader2,
  ExternalLink,
  Wifi,
  WifiOff,
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { useTestPmsConnection } from "@/hooks/useSettings";

interface PMSCard {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  lastSync: string | null;
}

const PMS_CARDS: PMSCard[] = [
  {
    id: "open_dental",
    name: "Open Dental",
    description: "Connect directly via API for real-time patient and treatment sync",
    connected: false,
    lastSync: null,
  },
  {
    id: "dentrix",
    name: "Dentrix",
    description: "Set up the Dentrix connector for automated data sync",
    connected: false,
    lastSync: null,
  },
  {
    id: "eaglesoft",
    name: "Eaglesoft",
    description: "Import patient data via scheduled CSV uploads",
    connected: false,
    lastSync: null,
  },
  {
    id: "manual",
    name: "Manual / Other PMS",
    description: "Use webhooks or CSV uploads to import patient data",
    connected: false,
    lastSync: null,
  },
];

export function IntegrationsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-1">Practice Management System</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your PMS to automatically sync patient and treatment data
        </p>
      </div>

      {PMS_CARDS.map((card) => (
        <PMSConnectionCard key={card.id} card={card} />
      ))}
    </div>
  );
}

function PMSConnectionCard({ card }: { card: PMSCard }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            {card.connected ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{card.name}</p>
              <Badge variant={card.connected ? "default" : "secondary"}>
                {card.connected ? (
                  <>
                    <Check className="mr-1 h-3 w-3" />
                    Connected
                  </>
                ) : (
                  "Not connected"
                )}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {card.description}
            </p>
            {card.connected && card.lastSync && (
              <p className="text-xs text-muted-foreground mt-1">
                Last synced: {card.lastSync}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {card.connected && (
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-3 w-3" />
                Sync Now
              </Button>
            )}
            <Button
              variant={expanded ? "secondary" : "outline"}
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Close" : "Configure"}
            </Button>
          </div>
        </div>

        {expanded && (
          <>
            <Separator className="my-4" />
            {card.id === "open_dental" && <OpenDentalConfig />}
            {card.id === "dentrix" && <DentrixConfig />}
            {card.id === "eaglesoft" && <EaglesoftConfig />}
            {card.id === "manual" && <ManualConfig />}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function OpenDentalConfig() {
  const testConnection = useTestPmsConnection();
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");

  const handleTest = () => {
    testConnection.mutate({
      pmsType: "open_dental",
      credentials: { apiUrl, apiKey },
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="od-url">API URL</Label>
          <Input
            id="od-url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://your-server:30223/api/v1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="od-key">API Key</Label>
          <Input
            id="od-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Open Dental API key"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={handleTest}
          disabled={!apiUrl || !apiKey || testConnection.isPending}
          size="sm"
        >
          {testConnection.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Test Connection
        </Button>
        {testConnection.isSuccess && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <Check className="h-4 w-4" /> Connection successful
          </span>
        )}
        {testConnection.isError && (
          <span className="flex items-center gap-1 text-sm text-destructive">
            <X className="h-4 w-4" /> {testConnection.error.message}
          </span>
        )}
      </div>

      <div className="flex justify-end">
        <Button size="sm" disabled={!testConnection.isSuccess}>
          Save & Connect
        </Button>
      </div>
    </div>
  );
}

function DentrixConfig() {
  const webhookUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/pms/dentrix`;

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/50 p-4">
        <h4 className="text-sm font-medium mb-2">Setup Instructions</h4>
        <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
          <li>Download and install the Dentrix Connector from your admin portal</li>
          <li>Open the connector settings and enter the webhook URL below</li>
          <li>Select the data types to sync (patients, treatments, appointments)</li>
          <li>Click &ldquo;Test Connection&rdquo; in the connector to verify</li>
        </ol>
      </div>

      <div className="space-y-2">
        <Label>Webhook URL</Label>
        <div className="flex gap-2">
          <Input value={webhookUrl} readOnly className="font-mono text-xs" />
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigator.clipboard.writeText(webhookUrl)}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function EaglesoftConfig() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/50 p-4">
        <h4 className="text-sm font-medium mb-2">CSV Upload Instructions</h4>
        <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
          <li>Export patient data from Eaglesoft as a CSV file</li>
          <li>Ensure the CSV matches the required format (download template below)</li>
          <li>Upload the CSV file using the button below</li>
          <li>Set up a recurring schedule for automatic re-imports</li>
        </ol>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Download CSV Template
        </Button>
        <Button variant="outline" size="sm">
          <ExternalLink className="mr-2 h-4 w-4" />
          Upload CSV
        </Button>
      </div>

      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Schedule Configuration</CardTitle>
          <CardDescription className="text-xs">
            Set up automatic CSV imports on a schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No schedule configured. Upload a CSV first to enable scheduling.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ManualConfig() {
  const webhookUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/pms/manual`;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Webhook Endpoint</Label>
        <div className="flex gap-2">
          <Input value={webhookUrl} readOnly className="font-mono text-xs" />
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigator.clipboard.writeText(webhookUrl)}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          POST patient and treatment data to this endpoint in JSON format
        </p>
      </div>

      <Separator />

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Download CSV Template
        </Button>
        <Button variant="outline" size="sm">
          <ExternalLink className="mr-2 h-4 w-4" />
          Upload CSV
        </Button>
      </div>
    </div>
  );
}
