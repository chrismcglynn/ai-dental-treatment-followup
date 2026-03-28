"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Mail,
  Phone,
  Copy,
  Trash2,
  Pencil,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { type SequenceWithTouchpoints } from "@/types/app.types";

const channelIcons = {
  sms: MessageSquare,
  email: Mail,
  voicemail: Phone,
};

const channelColors = {
  sms: "text-blue-500",
  email: "text-purple-500",
  voicemail: "text-amber-500",
};

interface SequenceCardProps {
  sequence: SequenceWithTouchpoints;
  onToggleStatus: (id: string, active: boolean) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SequenceCard({
  sequence,
  onToggleStatus,
  onDuplicate,
  onDelete,
}: SequenceCardProps) {
  const router = useRouter();
  const [showActions, setShowActions] = useState(false);
  const isActive = sequence.status === "active";

  const channelSequence = (sequence.touchpoints ?? []).map((tp) => tp.channel);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="relative group cursor-pointer hover:shadow-md transition-shadow"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3
                className="font-semibold text-base truncate hover:text-primary transition-colors"
                onClick={() => router.push(`/sequences/${sequence.id}`)}
              >
                {sequence.name}
              </h3>
              {sequence.description && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {sequence.description}
                </p>
              )}
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={(checked) =>
                onToggleStatus(sequence.id, checked)
              }
              aria-label={`Toggle ${sequence.name}`}
            />
          </div>

          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-xs text-muted-foreground mr-1">
              {channelSequence.length} steps
            </span>
            {channelSequence.map((channel, i) => {
              const Icon = channelIcons[channel];
              return (
                <span key={i} className="flex items-center">
                  {i > 0 && (
                    <span className="text-muted-foreground/40 mx-0.5 text-xs">
                      &rarr;
                    </span>
                  )}
                  <Icon
                    className={`h-3.5 w-3.5 ${channelColors[channel]}`}
                  />
                </span>
              );
            })}
          </div>

          {sequence.treatment_type && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Badge variant="secondary" className="text-[10px] px-2 py-0">
                {sequence.treatment_type}
              </Badge>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>{(sequence.conversion_rate * 100).toFixed(0)}% conversion</span>
            </div>

            {showActions && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-0.5"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label={`Edit ${sequence.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/sequences/${sequence.id}`);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label={`Duplicate ${sequence.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(sequence.id);
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  aria-label={`Delete ${sequence.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(sequence.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
