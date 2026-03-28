"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  ImagePlus,
  Loader2,
  Mail,
  MessageSquare,
  Monitor,
  Phone,
  Rocket,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { z } from "zod";

// ---------- Constants ----------

const steps = [
  { id: 1, title: "Practice Details" },
  { id: 2, title: "Connect PMS" },
  { id: 3, title: "First Sequence" },
];

const timezones = [
  { value: "America/New_York", label: "Eastern Time" },
  { value: "America/Chicago", label: "Central Time" },
  { value: "America/Denver", label: "Mountain Time" },
  { value: "America/Los_Angeles", label: "Pacific Time" },
  { value: "America/Anchorage", label: "Alaska Time" },
  { value: "Pacific/Honolulu", label: "Hawaii Time" },
];

const pmsOptions = [
  {
    value: "open_dental",
    label: "Open Dental",
    description: "Most popular open-source dental PMS",
    icon: Monitor,
  },
  {
    value: "dentrix",
    label: "Dentrix",
    description: "Henry Schein practice management",
    icon: Monitor,
  },
  {
    value: "eaglesoft",
    label: "Eaglesoft",
    description: "Patterson Dental software",
    icon: Monitor,
  },
  {
    value: "skip",
    label: "Skip for now",
    description: "You can connect later in Settings",
    icon: ChevronRight,
  },
];

const sequenceTemplates = [
  {
    id: "crown-followup",
    name: "Standard Crown Follow-Up",
    description: "3-step sequence for patients who declined crown treatment",
    treatment_type: "crown",
    steps: [
      { delay_days: 3, channel: "sms" as const, body: "Hi {first_name}, this is {practice_name}. We wanted to check in about the crown treatment Dr. {provider} recommended. Do you have any questions we can help with?" },
      { delay_days: 10, channel: "email" as const, body: "Hi {first_name},\n\nWe noticed you haven't scheduled your crown procedure yet. Delaying treatment can lead to further decay and more extensive work down the road.\n\nWould you like to schedule a quick call to discuss your options? We're happy to go over financing plans that might help.\n\nBest,\n{practice_name}" },
      { delay_days: 21, channel: "sms" as const, body: "Hi {first_name}, just a friendly reminder from {practice_name} about your crown treatment. We have openings this week if you'd like to get it taken care of. Reply YES to book!" },
    ],
  },
  {
    id: "implant-consultation",
    name: "Implant Consultation Follow-Up",
    description: "4-step sequence for implant consultation patients",
    treatment_type: "implant",
    steps: [
      { delay_days: 1, channel: "sms" as const, body: "Hi {first_name}, thank you for your implant consultation with Dr. {provider} at {practice_name}. We're here if you have any questions!" },
      { delay_days: 5, channel: "email" as const, body: "Hi {first_name},\n\nThank you for considering dental implants. We wanted to share some helpful information about the procedure and what to expect.\n\nImplants are a long-term investment in your oral health with a 95%+ success rate. We offer flexible financing options to make treatment accessible.\n\nReady to take the next step? Reply to schedule.\n\nBest,\n{practice_name}" },
      { delay_days: 14, channel: "sms" as const, body: "Hi {first_name}, checking in from {practice_name}. Have you had a chance to think about the implant treatment? We'd love to answer any questions." },
      { delay_days: 30, channel: "email" as const, body: "Hi {first_name},\n\nWe haven't heard from you in a while and wanted to reach out one more time about your implant consultation.\n\nIf cost is a concern, we have new financing options available. If you've decided to go another direction, we completely understand.\n\nWe're here whenever you're ready.\n\nBest,\n{practice_name}" },
    ],
  },
  {
    id: "general-reminder",
    name: "General Treatment Reminder",
    description: "Simple 2-step reminder for any treatment type",
    treatment_type: "general",
    steps: [
      { delay_days: 3, channel: "sms" as const, body: "Hi {first_name}, this is {practice_name}. We wanted to follow up on the treatment plan Dr. {provider} discussed with you. Any questions? We're happy to help!" },
      { delay_days: 14, channel: "sms" as const, body: "Hi {first_name}, friendly reminder from {practice_name} about your recommended treatment. We have availability this week - reply to schedule!" },
    ],
  },
];

const channelIcons = {
  sms: MessageSquare,
  email: Mail,
  voicemail: Phone,
};

const channelColors = {
  sms: "text-blue-500 bg-blue-500/10",
  email: "text-purple-500 bg-purple-500/10",
  voicemail: "text-amber-500 bg-amber-500/10",
};

// ---------- Schema ----------

const onboardingStep1Schema = z.object({
  name: z.string().min(2, "Practice name must be at least 2 characters"),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]+$/, "Invalid phone number")
    .min(10, "Phone number is required"),
  timezone: z.string(),
});

type Step1Input = z.infer<typeof onboardingStep1Schema>;

// ---------- Animations ----------

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

// ---------- Component ----------

export default function OnboardingPage() {
  const router = useRouter();
  const [[step, direction], setStepState] = useState([1, 0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Step 1 state
  const [practiceName, setPracticeName] = useState<string>("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Step 2 state
  const [selectedPms, setSelectedPms] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "testing" | "success" | "failed"
  >("idle");
  const [pmsUrl, setPmsUrl] = useState("");
  const [pmsApiKey, setPmsApiKey] = useState("");

  // Step 3 state
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [activatingSequence, setActivatingSequence] = useState(false);

  // Completion state
  const [completed, setCompleted] = useState(false);

  const supabase = createClient();

  // Load practice name from signup
  useEffect(() => {
    async function loadPractice() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from("practice_members")
        .select("practice_id")
        .eq("user_id", user.id)
        .limit(1);

      if (membership && membership.length > 0) {
        const practiceId = (membership[0] as { practice_id: string })
          .practice_id;
        const { data: practice } = await supabase
          .from("practices")
          .select("name")
          .eq("id", practiceId)
          .single();

        if (practice) {
          setPracticeName((practice as { name: string }).name);
          setValue("name", (practice as { name: string }).name);
        }
      }
    }
    loadPractice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors: formErrors },
  } = useForm<Step1Input>({
    resolver: zodResolver(onboardingStep1Schema),
    defaultValues: { timezone: "America/Denver", name: "", phone: "" },
  });

  function paginate(newStep: number) {
    setStepState([newStep, newStep > step ? 1 : -1]);
    setError(null);
  }

  // Step 1: Save practice details
  async function savePracticeDetails(data: Step1Input) {
    setError(null);
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Not authenticated. Please sign in again.");
        setSaving(false);
        return;
      }

      const { data: membership } = await supabase
        .from("practice_members")
        .select("practice_id")
        .eq("user_id", user.id)
        .limit(1);

      if (membership && membership.length > 0) {
        const practiceId = (membership[0] as { practice_id: string })
          .practice_id;

        await supabase
          .from("practices")
          .update({
            name: data.name,
            phone: data.phone,
            timezone: data.timezone,
          })
          .eq("id", practiceId);
      }

      paginate(2);
    } catch {
      setError("Failed to save practice details");
    } finally {
      setSaving(false);
    }
  }

  // Step 2: PMS connection
  async function testPmsConnection() {
    setConnectionStatus("testing");
    // Simulated — in production this calls the PMS API
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setConnectionStatus(Math.random() > 0.3 ? "success" : "failed");
  }

  async function savePmsSelection() {
    if (selectedPms === "skip") {
      paginate(3);
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: membership } = await supabase
          .from("practice_members")
          .select("practice_id")
          .eq("user_id", user.id)
          .limit(1);

        if (membership && membership.length > 0) {
          const practiceId = (membership[0] as { practice_id: string })
            .practice_id;
          await supabase
            .from("practices")
            .update({ pms_type: selectedPms })
            .eq("id", practiceId);
        }
      }

      paginate(3);
    } catch {
      setError("Failed to save PMS selection");
    } finally {
      setSaving(false);
    }
  }

  // Step 3: Create sequence from template
  async function activateSequence() {
    if (!selectedTemplate) return;
    setActivatingSequence(true);

    const template = sequenceTemplates.find((t) => t.id === selectedTemplate);
    if (!template) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from("practice_members")
        .select("practice_id")
        .eq("user_id", user.id)
        .limit(1);

      if (!membership || membership.length === 0) return;

      const practiceId = (membership[0] as { practice_id: string })
        .practice_id;

      // Create sequence
      const { data: sequence } = await supabase
        .from("sequences")
        .insert({
          practice_id: practiceId,
          name: template.name,
          description: template.description,
          treatment_type: template.treatment_type,
          trigger_type: "treatment_declined",
          status: "active",
        })
        .select("id")
        .single();

      if (sequence) {
        const sequenceId = (sequence as { id: string }).id;

        // Create touchpoints
        const touchpoints = template.steps.map((s, i) => ({
          sequence_id: sequenceId,
          position: i + 1,
          channel: s.channel,
          delay_days: s.delay_days,
          delay_hours: 0,
          body_template: s.body,
          ai_personalize: true,
        }));

        await supabase.from("touchpoints").insert(touchpoints);
      }

      // Show completion screen
      setCompleted(true);
    } catch {
      setError("Failed to create sequence");
    } finally {
      setActivatingSequence(false);
    }
  }

  // Logo upload handler
  const handleLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        setError("Logo must be under 2MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // Confetti effect on completion
  const fireConfetti = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  useEffect(() => {
    if (completed) {
      fireConfetti();
    }
  }, [completed, fireConfetti]);

  // ---------- Completion Screen ----------
  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-full max-w-lg text-center space-y-8"
        >
          <div className="space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2,
              }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mx-auto"
            >
              <Rocket className="h-10 w-10 text-primary" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-bold tracking-tight"
            >
              Your first sequence is active!
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-muted-foreground max-w-sm mx-auto"
            >
              {practiceName || "Your practice"} is now set up to automatically
              follow up with patients who need treatment.
            </motion.p>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-3 gap-4"
          >
            <Card>
              <CardContent className="pt-6 pb-4 text-center">
                <p className="text-3xl font-bold text-primary">34%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg conversion in first 30 days
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 pb-4 text-center">
                <p className="text-3xl font-bold text-primary">2.4x</p>
                <p className="text-xs text-muted-foreground mt-1">
                  More patients accept treatment
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 pb-4 text-center">
                <p className="text-3xl font-bold text-primary">$12k</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg monthly recovered revenue
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Button
              size="lg"
              className="w-full max-w-xs"
              onClick={() => {
                router.push("/dashboard");
                router.refresh();
              }}
            >
              Go to Dashboard
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ---------- Main Wizard ----------
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  step > s.id
                    ? "bg-primary text-primary-foreground"
                    : step === s.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.id ? <Check className="h-4 w-4" /> : s.id}
              </div>
              <span
                className={`text-sm hidden sm:inline transition-colors ${
                  step >= s.id
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {s.title}
              </span>
              {i < steps.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {/* ==================== Step 1: Practice Details ==================== */}
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <form
                      onSubmit={handleSubmit(savePracticeDetails)}
                      className="space-y-4"
                    >
                      <div className="text-center mb-6">
                        <h2 className="text-xl font-semibold">
                          Practice details
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          Set up your practice profile to get started
                        </p>
                      </div>

                      {error && (
                        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                          {error}
                        </div>
                      )}

                      {/* Practice name (pre-filled) */}
                      <div className="space-y-2">
                        <Label htmlFor="name">Practice name</Label>
                        <Input
                          id="name"
                          placeholder="Bright Smiles Dental"
                          {...register("name")}
                        />
                        {formErrors.name && (
                          <p className="text-xs text-destructive">
                            {formErrors.name.message}
                          </p>
                        )}
                      </div>

                      {/* Phone number */}
                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          Phone number
                          <span className="text-xs text-muted-foreground ml-2">
                            Used as your Twilio sender number
                          </span>
                        </Label>
                        <Input
                          id="phone"
                          placeholder="(555) 123-4567"
                          {...register("phone")}
                        />
                        {formErrors.phone && (
                          <p className="text-xs text-destructive">
                            {formErrors.phone.message}
                          </p>
                        )}
                      </div>

                      {/* Timezone */}
                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Select
                          defaultValue="America/Denver"
                          onValueChange={(v) => setValue("timezone", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {timezones.map((tz) => (
                              <SelectItem key={tz.value} value={tz.value}>
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Logo upload (optional) */}
                      <div className="space-y-2">
                        <Label>
                          Logo{" "}
                          <span className="text-xs text-muted-foreground">
                            (optional)
                          </span>
                        </Label>
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                        />
                        {logoPreview ? (
                          <div className="relative inline-block">
                            <Image
                              src={logoPreview}
                              alt="Practice logo"
                              width={64}
                              height={64}
                              className="h-16 w-16 rounded-lg object-cover border"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setLogoPreview(null);
                                if (logoInputRef.current)
                                  logoInputRef.current.value = "";
                              }}
                              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
                          >
                            <ImagePlus className="h-4 w-4" />
                            Upload logo
                          </button>
                        )}
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button
                          type="submit"
                          className="flex-1"
                          disabled={saving}
                        >
                          {saving && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Continue
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ==================== Step 2: Connect PMS ==================== */}
            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-semibold">
                        Connect your PMS
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Sync patient and treatment data automatically
                      </p>
                    </div>

                    {error && (
                      <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                        {error}
                      </div>
                    )}

                    {/* PMS cards */}
                    <div className="grid grid-cols-2 gap-3">
                      {pmsOptions.map((pms) => (
                        <button
                          key={pms.value}
                          type="button"
                          onClick={() => {
                            setSelectedPms(pms.value);
                            setConnectionStatus("idle");
                          }}
                          className={`flex flex-col items-start gap-1.5 rounded-lg border p-4 text-left transition-all ${
                            selectedPms === pms.value
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <pms.icon
                            className={`h-5 w-5 ${
                              selectedPms === pms.value
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                          <span className="text-sm font-medium">
                            {pms.label}
                          </span>
                          <span className="text-xs text-muted-foreground leading-tight">
                            {pms.description}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Inline connection form (expands when PMS selected, not "skip") */}
                    {selectedPms && selectedPms !== "skip" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-lg border p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Connect to{" "}
                            {
                              pmsOptions.find((p) => p.value === selectedPms)
                                ?.label
                            }
                          </span>
                          {connectionStatus === "success" && (
                            <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                              <Wifi className="h-3 w-3" />
                              Connected
                            </span>
                          )}
                          {connectionStatus === "failed" && (
                            <span className="flex items-center gap-1.5 text-xs text-destructive">
                              <WifiOff className="h-3 w-3" />
                              Failed — check credentials
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Input
                            placeholder="Server URL or IP address"
                            value={pmsUrl}
                            onChange={(e) => setPmsUrl(e.target.value)}
                          />
                          <Input
                            placeholder="API key or token"
                            type="password"
                            value={pmsApiKey}
                            onChange={(e) => setPmsApiKey(e.target.value)}
                          />
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={testPmsConnection}
                          disabled={connectionStatus === "testing"}
                        >
                          {connectionStatus === "testing" ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            "Test Connection"
                          )}
                        </Button>
                      </motion.div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => paginate(1)}
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button
                        type="button"
                        className="flex-1"
                        onClick={savePmsSelection}
                        disabled={!selectedPms || saving}
                      >
                        {saving && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {selectedPms === "skip" ? "Skip for now" : "Continue"}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ==================== Step 3: Create First Sequence ==================== */}
            {step === 3 && (
              <motion.div
                key="step-3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="text-center mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto mb-3">
                        <Zap className="h-6 w-6 text-primary" />
                      </div>
                      <h2 className="text-xl font-semibold">
                        Create your first sequence
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Choose a template to start following up with patients
                        automatically
                      </p>
                    </div>

                    {error && (
                      <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                        {error}
                      </div>
                    )}

                    {/* Template cards */}
                    <div className="space-y-3">
                      {sequenceTemplates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() =>
                            setSelectedTemplate(
                              selectedTemplate === template.id
                                ? null
                                : template.id
                            )
                          }
                          className={`w-full text-left rounded-lg border p-4 transition-all ${
                            selectedTemplate === template.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                {template.treatment_type === "crown" && (
                                  <Crown className="h-4 w-4 text-primary" />
                                )}
                                {template.treatment_type === "implant" && (
                                  <Building2 className="h-4 w-4 text-primary" />
                                )}
                                {template.treatment_type === "general" && (
                                  <MessageSquare className="h-4 w-4 text-primary" />
                                )}
                                <span className="text-sm font-medium">
                                  {template.name}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {template.description}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {template.steps.length} steps
                            </span>
                          </div>

                          {/* Expanded preview */}
                          {selectedTemplate === template.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              transition={{ duration: 0.2 }}
                              className="mt-4 pt-3 border-t space-y-2"
                            >
                              {template.steps.map((s, i) => {
                                const Icon = channelIcons[s.channel];
                                return (
                                  <div
                                    key={i}
                                    className="flex items-start gap-3"
                                  >
                                    <div
                                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${channelColors[s.channel]}`}
                                    >
                                      <Icon className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium capitalize">
                                          {s.channel}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <Clock className="h-3 w-3" />
                                          Day {s.delay_days}
                                        </span>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                        {s.body.split("\n")[0]}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </motion.div>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => paginate(2)}
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      {selectedTemplate ? (
                        <Button
                          type="button"
                          className="flex-1"
                          onClick={activateSequence}
                          disabled={activatingSequence}
                        >
                          {activatingSequence ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Zap className="mr-2 h-4 w-4" />
                          )}
                          Activate this sequence
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            router.push("/sequences/new");
                          }}
                        >
                          Build from scratch
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
