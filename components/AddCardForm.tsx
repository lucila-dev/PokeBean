"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";

type SavedCard = {
  id: string;
  name: string;
  displayName: string | null;
  description: string | null;
  year: number | null;
  setName: string | null;
  rarity: string | null;
  cardNumber: string | null;
  createdAt: string;
};

export function AddCardForm() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCard, setSavedCard] = useState<SavedCard | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const goToDashboard = () => {
    // Full navigation so the dashboard loads fresh data from the server (avoids stale RSC cache)
    window.location.href = "/dashboard";
  };

  const setFileFromBlob = (f: File | null) => {
    setError(null);
    setSavedCard(null);
    if (preview) URL.revokeObjectURL(preview);
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!f.type.startsWith("image/")) {
      setError("Please choose an image (JPEG, PNG, or WebP).");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileFromBlob(e.target.files?.[0] ?? null);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFileFromBlob(f);
  };

  const submit = async () => {
    if (!file) {
      setError("Choose an image first.");
      return;
    }
    setLoading(true);
    setError(null);
    setSavedCard(null);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/cards/scan", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scan failed");
      setSavedCard(data);
      setFile(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-display text-3xl font-bold text-pokemon-dark mb-2">
        Add a card
      </h1>
      <p className="text-stone-600 mb-8">
        Drop a photo of your Pokemon card here or browse to upload. We&apos;ll
        use AI to read the name, set, year, and rarity, then add it to your
        collection.
      </p>

      <div
        className={`
          bg-white rounded-card shadow-card border-2 border-dashed p-10 text-center transition-colors
          ${dragOver ? "border-pokemon-blue bg-pokemon-blue-muted/50" : "border-stone-300 bg-stone-50/50"}
        `}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFileChange}
          className="hidden"
          id="file-input"
          aria-label="Choose card image from gallery"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={onFileChange}
          className="hidden"
          id="camera-input"
          aria-label="Take photo with camera"
        />
        {preview ? (
          <div className="space-y-4">
            <img
              src={preview}
              alt="Card preview"
              className="max-h-72 mx-auto rounded-card border border-stone-200 shadow-card"
            />
            <p className="text-sm text-stone-500">
              Ready to scan. Click &quot;Scan & save&quot; or choose another image.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                variant="secondary"
                onClick={() => inputRef.current?.click()}
              >
                Change image
              </Button>
              <Button
                variant="primary"
                onClick={submit}
                disabled={loading}
                loading={loading}
              >
                {loading ? "Scanning…" : "Scan & save"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-stone-600 font-medium mb-1">
              Take a photo with your camera or choose from your gallery
            </p>
            <p className="text-sm text-stone-500 mb-6">
              JPEG, PNG or WebP · max 5MB
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                variant="primary"
                onClick={() => cameraInputRef.current?.click()}
              >
                Take photo
              </Button>
              <Button
                variant="secondary"
                onClick={() => inputRef.current?.click()}
              >
                Choose from gallery
              </Button>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="mt-6">
          <Alert variant="error" role="alert">
            {error}
          </Alert>
        </div>
      )}

      {savedCard && (
        <Card className="mt-6 p-6 border-2 border-semantic-success/30 bg-semantic-success-light/50">
          <div className="flex items-center gap-2 mb-4">
            <span
              className="w-10 h-10 rounded-full bg-semantic-success/20 flex items-center justify-center text-semantic-success text-xl"
              aria-hidden
            >
              ✓
            </span>
            <h2 className="font-display font-semibold text-green-800 text-lg">
              Card saved
            </h2>
          </div>
          <div className="bg-white rounded-card shadow-card p-4 mb-6 space-y-2">
            <p className="font-medium text-pokemon-dark">
              {savedCard.displayName?.trim() ||
                [savedCard.name, savedCard.setName].filter(Boolean).join(" - ") +
                  (savedCard.cardNumber ? ` (${savedCard.cardNumber})` : "")}
            </p>
            <div className="flex flex-wrap gap-2 text-sm text-stone-600">
              {savedCard.setName && <span>{savedCard.setName}</span>}
              {savedCard.year && <span>· {savedCard.year}</span>}
              {savedCard.rarity && (
                <Badge variant={savedCard.rarity}>{savedCard.rarity}</Badge>
              )}
              {savedCard.cardNumber && <span>· {savedCard.cardNumber}</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={goToDashboard}>
              View in dashboard
            </Button>
            <Button variant="secondary" onClick={() => setSavedCard(null)}>
              Add another
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
