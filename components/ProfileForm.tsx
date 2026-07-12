"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";

type Props = {
  initialName: string;
  initialImageUrl: string | null;
};

export function ProfileForm({ initialName, initialImageUrl }: Props) {
  const { update: updateSession } = useSession();
  const [name, setName] = useState(initialName);
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl);
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [nameMessage, setNameMessage] = useState<"success" | "error" | null>(null);
  const [nameErrorText, setNameErrorText] = useState<string>("");
  const [avatarMessage, setAvatarMessage] = useState<"success" | "error" | null>(null);
  const [avatarErrorText, setAvatarErrorText] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveName = async () => {
    setSavingName(true);
    setNameMessage(null);
    setNameErrorText("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setNameMessage("success");
      await updateSession({ name: data.name });
    } catch (e) {
      setNameMessage("error");
      setNameErrorText(e instanceof Error ? e.message : "Could not save name.");
    } finally {
      setSavingName(false);
    }
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarMessage("error");
      return;
    }
    setUploadingAvatar(true);
    setAvatarMessage(null);
    setAvatarErrorText("");
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/user/avatar", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setImageUrl(data.imageUrl);
      setAvatarMessage("success");
      await updateSession({ image: data.imageUrl });
    } catch (e) {
      setAvatarMessage("error");
      setAvatarErrorText(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
        <div className="shrink-0 w-24">
          <span className="sr-only">Profile picture</span>
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-stone-200 dark:border-stone-600 bg-stone-100 dark:bg-stone-700 flex items-center justify-center">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-3xl text-stone-400 font-semibold">
                  {name.slice(0, 1).toUpperCase() || "?"}
                </span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onAvatarChange}
              className="hidden"
              aria-label="Upload profile picture"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-pokemon-blue text-white text-sm font-bold flex items-center justify-center hover:bg-pokemon-blue/90 focus-ring shadow-md"
            >
              {uploadingAvatar ? "…" : "+"}
            </button>
          </div>
        </div>

        <div className="flex-1 min-w-0 w-full sm:w-auto space-y-4">
        <div>
          <label htmlFor="profile-name" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
            Display name
          </label>
          <div className="flex gap-2">
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="flex-1 rounded-input border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-3 py-2 text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-pokemon-blue focus:border-transparent"
            />
            <Button
              onClick={saveName}
              disabled={savingName}
              loading={savingName}
            >
              Save
            </Button>
          </div>
          {nameMessage === "success" && (
            <p className="text-sm text-green-600 mt-1">Name saved.</p>
          )}
          {nameMessage === "error" && nameErrorText && (
            <p className="text-sm text-red-600 mt-1">{nameErrorText}</p>
          )}
        </div>
        </div>
      </div>

      {(avatarMessage === "success" || avatarMessage === "error") && (
        <p className={`text-sm ${avatarMessage === "success" ? "text-green-600" : "text-red-600"}`}>
          {avatarMessage === "success"
            ? "Photo updated."
            : avatarErrorText || "Upload failed. Use JPEG, PNG or WebP under 5MB."}
        </p>
      )}
    </div>
  );
}
