"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { User, Mail, Save, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface SettingsFormProps {
  initialFirstName: string;
  initialLastName: string;
  initialEmail: string;
  onSave: (firstName: string, lastName: string) => Promise<void>;
}

function SettingsForm({
  initialFirstName,
  initialLastName,
  initialEmail,
  onSave,
}: SettingsFormProps) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim()) {
      toast.error("First name cannot be empty.");
      return;
    }

    try {
      setIsSaving(true);
      await onSave(firstName.trim(), lastName.trim());
    } catch (err: unknown) {
      console.error("❌ Failed to update profile:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save profile changes.";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
      <div className="space-y-4">
        {/* First Name Field */}
        <div className="space-y-1.5">
          <Label
            htmlFor="firstName"
            className="text-xs font-semibold text-white/70 flex items-center gap-1.5"
          >
            <User size={13} className="text-white/30" />
            First Name
          </Label>
          <Input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter your first name"
            className="h-10 w-full rounded-xl border border-white/8 bg-white/2 text-sm text-white placeholder-white/20 focus:border-forge-accent/50 focus:ring-0 focus:bg-white/4 transition-all"
            disabled={isSaving}
          />
        </div>

        {/* Last Name Field */}
        <div className="space-y-1.5">
          <Label
            htmlFor="lastName"
            className="text-xs font-semibold text-white/70 flex items-center gap-1.5"
          >
            <User size={13} className="text-white/30" />
            Last Name
          </Label>
          <Input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter your last name"
            className="h-10 w-full rounded-xl border border-white/8 bg-white/2 text-sm text-white placeholder-white/20 focus:border-forge-accent/50 focus:ring-0 focus:bg-white/4 transition-all"
            disabled={isSaving}
          />
        </div>

        {/* Email Field (Readonly) */}
        <div className="space-y-1.5 opacity-70">
          <Label
            htmlFor="email"
            className="text-xs font-semibold text-white/50 flex items-center gap-1.5"
          >
            <Mail size={13} className="text-white/30" />
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={initialEmail}
            readOnly
            placeholder="Email address"
            className="h-10 w-full rounded-xl border border-white/5 bg-white/1 text-sm text-white/55 cursor-not-allowed select-none focus:border-white/5 focus:ring-0"
          />
          <span className="block text-[10px] text-white/25 mt-1 font-sans">
            Email addresses are linked directly to your Google / Auth account.
          </span>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/8">
        <Link href="/dashboard">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl text-xs px-4 h-9 cursor-pointer"
            disabled={isSaving}
          >
            Back to Dashboard
          </Button>
        </Link>
        <Button
          type="submit"
          variant="default"
          className="rounded-xl text-xs px-5 h-9 font-bold cursor-pointer flex items-center gap-1.5 bg-gradient-forge shadow-[0_0_15px_rgba(124,106,250,0.3)] hover:shadow-[0_0_20px_rgba(124,106,250,0.5)] transition-all text-white"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <Save size={13} />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser();

  const handleSave = async (firstName: string, lastName: string) => {
    if (!user) {
      throw new Error("You must be logged in to update your profile.");
    }

    // 1. Update Clerk user profile (forces instant browser state refresh)
    await user.update({
      firstName,
      lastName,
    });

    // 2. Call local database endpoint to synchronize profile details
    const response = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName,
        lastName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update database profile.");
    }

    toast.success("Profile updated successfully!");
  };

  if (!isLoaded || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="animate-spin text-forge-accent h-8 w-8" />
        <span className="text-sm text-white/40">Loading settings...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8 max-w-[650px] mx-auto will-change-transform pb-12"
    >
      {/* Settings Header */}
      <div className="flex flex-col gap-2 pb-4 border-b border-white/15">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="text-white/45 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-forge-accent/20 bg-forge-accent/10 px-3 py-0.5">
            <Sparkles size={11} className="text-forge-accent" />
            <span className="font-mono text-[9px] font-semibold tracking-wider uppercase text-forge-accent">
              User Profile Configuration
            </span>
          </div>
        </div>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-white mt-1.5">
          Account Settings
        </h1>
        <p className="text-white/55 text-xs font-sans">
          Manage your personal details and sync account state across devices.
        </p>
      </div>

      {/* Main Settings Card */}
      <Card className="relative overflow-hidden bg-zinc-900 border border-white/8 backdrop-blur-xl rounded-[24px] shadow-forge-panel p-6 md:p-8 select-none">
        <span className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-forge-accent/10 blur-3xl pointer-events-none" />

        <SettingsForm
          initialFirstName={user.firstName || ""}
          initialLastName={user.lastName || ""}
          initialEmail={user.primaryEmailAddress?.emailAddress || ""}
          onSave={handleSave}
        />
      </Card>
    </motion.div>
  );
}
