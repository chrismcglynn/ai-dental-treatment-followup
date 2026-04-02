"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DENTAL_ROLES = [
  { value: "dentist", label: "Dentist" },
  { value: "hygienist", label: "Hygienist" },
  { value: "front_office", label: "Front Office" },
  { value: "office_manager", label: "Office Manager" },
  { value: "dental_assistant", label: "Dental Assistant" },
] as const;

export type DentalRole = (typeof DENTAL_ROLES)[number]["value"];

const demoSignupSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.string().min(1, "Please select a role"),
  email: z.string().email("Invalid email address"),
  practice_name: z.string().min(2, "Practice name must be at least 2 characters"),
});

type DemoSignupInput = z.infer<typeof demoSignupSchema>;

export interface DemoSignupData {
  full_name: string;
  role: DentalRole;
  email: string;
  practice_name: string;
}

interface DemoSignupFormProps {
  onSubmit: (data: DemoSignupData) => void;
  onBack: () => void;
}

export function DemoSignupForm({ onSubmit }: DemoSignupFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DemoSignupInput>({
    resolver: zodResolver(demoSignupSchema),
  });

  async function handleFormSubmit(data: DemoSignupInput) {
    setSubmitting(true);
    // Brief delay so it feels like something happened
    await new Promise((r) => setTimeout(r, 400));
    onSubmit(data as DemoSignupData);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Try the demo
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            Enter your info to explore the platform with simulated data
          </p>
        </div>

        <Card>
          <CardHeader className="sr-only">
            <h2>Demo signup</h2>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  placeholder="Jane Smith"
                  autoComplete="name"
                  autoFocus
                  {...register("full_name")}
                />
                {errors.full_name && (
                  <p className="text-xs text-destructive">
                    {errors.full_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  onValueChange={(val) => setValue("role", val, { shouldValidate: true })}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {DENTAL_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-xs text-destructive">
                    {errors.role.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@practice.com"
                  autoComplete="email"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="practice_name">Practice name</Label>
                <Input
                  id="practice_name"
                  placeholder="Bright Smiles Dental"
                  {...register("practice_name")}
                />
                {errors.practice_name && (
                  <p className="text-xs text-destructive">
                    {errors.practice_name.message}
                  </p>
                )}
              </div>

              <div className="pt-6">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Continue
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
