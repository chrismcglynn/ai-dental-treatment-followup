"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Building2,
  Users,
  Plug,
  CreditCard,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePageHeader } from "@/hooks/usePageHeader";
import { GeneralTab } from "@/components/features/settings/GeneralTab";
import { TeamTab } from "@/components/features/settings/TeamTab";
import { IntegrationsTab } from "@/components/features/settings/IntegrationsTab";
import { BillingTab } from "@/components/features/settings/BillingTab";
import { NotificationsTab } from "@/components/features/settings/NotificationsTab";

const TABS = [
  { id: "general", label: "General", icon: Building2 },
  { id: "team", label: "Team", icon: Users },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
] as const;

type TabId = (typeof TABS)[number]["id"];

const TAB_COMPONENTS: Record<TabId, React.ComponentType> = {
  general: GeneralTab,
  team: TeamTab,
  integrations: IntegrationsTab,
  billing: BillingTab,
  notifications: NotificationsTab,
};

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get("tab") as TabId) || "general";
  const [activeTab, setActiveTab] = useState<TabId>(
    TABS.some((t) => t.id === initialTab) ? initialTab : "general"
  );

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    router.replace(`/settings?tab=${tab}`, { scroll: false });
  };

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  usePageHeader({ title: "Settings" });

  return (
    <div className="space-y-6">

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Vertical Tab Navigation */}
        <nav className="lg:w-56 shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors whitespace-nowrap",
                    "hover:bg-muted",
                    isActive
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Tab Content */}
        <div className="flex-1 min-w-0 max-w-2xl">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
