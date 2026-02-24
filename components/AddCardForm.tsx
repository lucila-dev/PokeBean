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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPT_TYPES = ["image/jpeg", "image/png", "image/webp"];

function validImageFile(f: File): boolean {
  if (!f.type.startsWith("image/") || !ACCEPT_TYPES.includes(f.type)) return false;
  if (f.size > MAX_FILE_SIZE) return false;
  return true;
}

export function AddCardForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const goToDashboard = () => {
    window.location.href = "/dashboard";
  };

  const setFilesFromList = (newFiles: File[]) => {
    setError(null);
    setSavedCards([]);
    previews.forEach((url) => URL.revokeObjectURL(url));
    if (newFiles.length === 0) {
      setFiles([]);
      setPreviews([]);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const valid: File[] = [];
    const invalid: string[] = [];
    for (const f of newFiles) {
      if (!f.type.startsWith("image/") || !ACCEPT_TYPES.includes(f.type)) {
        invalid.push(`${f.name}: wrong type (use JPEG, PNG, or WebP)`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        invalid.push(`${f.name}: too large (max 5MB)`);
        continue;
      }
      valid.push(f);
    }
    if (valid.length === 0) {
      setFiles([]);
      setPreviews([]);
      if (invalid.length > 0) setError(invalid.join(". "));
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (invalid.length > 0) setError(invalid.join(". "));
    setFiles(valid);
    setPreviews(valid.map((f) => URL.createObjectURL(f)));
    if (inputRef.current) inputRef.current.value = "";
  };

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles?.length) return;
    setFilesFromList(Array.from(newFiles));
  };

  const removeFileAt = (index: number) => {
    const nextFiles = files.filter((_, i) => i !== index);
    const urlToRevoke = previews[index];
    if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
    const nextPreviews = previews.filter((_, i) => i !== index);
    setFiles(nextFiles);
    setPreviews(nextPreviews);
    setError(null);
  };

  const onGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (list?.length) setFilesFromList(Array.from(list));
  };

  const onCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFilesFromList(f ? [f] : []);
    e.target.value = "";
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
    const list = e.dataTransfer.files;
    if (list?.length) addFiles(list);
  };

  const submit = async () => {
    if (files.length === 0) {
      setError("Choose at least one image.");
      return;
    }
    setLoading(true);
    setError(null);
    setSavedCards([]);
    const results: SavedCard[] = [];
    let lastError: string | null = null;
    try {
      for (let i = 0; i < files.length; i++) {
        const form = new FormData();
        form.append("image", files[i]);
        const res = await fetch("/api/cards/scan", { method: "POST", body: form });
        const data = await res.json();
        if (res.ok) {
          results.push(data);
        } else {
          lastError = data.error ?? "Scan failed";
        }
      }
      setSavedCards(results);
      if (results.length === 0 && lastError) setError(lastError);
      else if (results.length < files.length && lastError) setError(`Some scans failed. ${lastError}`);
      if (results.length > 0) {
        previews.forEach((url) => URL.revokeObjectURL(url));
        setFiles([]);
        setPreviews([]);
        if (inputRef.current) inputRef.current.value = "";
        if (cameraInputRef.current) cameraInputRef.current.value = "";
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-display text-3xl font-bold text-pokemon-dark dark:text-stone-100 mb-2">
        Add a card
      </h1>
      <p className="text-stone-600 dark:text-stone-400 mb-8">
        Drop a photo of your Pokemon card here or browse to upload. We&apos;ll
        use AI to read the name, set, year, and rarity, then add it to your
        collection. Or{" "}
        <Link href="/browse" className="text-pokemon-blue dark:text-pokemon-yellow hover:underline font-medium">
          search the catalog
        </Link>{" "}
        to add a card without a photo.
      </p>

      <div
        className={`
          bg-white dark:bg-stone-800/90 rounded-card shadow-card border-2 border-dashed p-10 text-center transition-colors
          ${dragOver ? "border-pokemon-blue bg-pokemon-blue-muted/50 dark:bg-pokemon-blue/20" : "border-stone-300 dark:border-stone-600 bg-stone-50/50 dark:bg-stone-800/50"}
        `}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={onGalleryChange}
          className="hidden"
          id="file-input"
          aria-label="Choose card images from gallery"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={onCameraChange}
          className="hidden"
          id="camera-input"
          aria-label="Take photo with camera"
        />
        {previews.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {previews.map((url, i) => (
                <div key={url} className="relative group">
                  <img
                    src={url}
                    alt={`Preview ${i + 1}`}
                    className="w-full aspect-[2.5/3.5] object-cover rounded-card border border-stone-200 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeFileAt(i)}
                    className="absolute top-1 right-1 w-7 h-7 rounded-full bg-stone-800/80 text-white text-sm font-bold flex items-center justify-center hover:bg-stone-900 focus-ring"
                    aria-label={`Remove image ${i + 1}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <p className="text-sm text-stone-500">
              {files.length} image{files.length !== 1 ? "s" : ""} selected. Scan all or choose different ones.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                variant="secondary"
                onClick={() => inputRef.current?.click()}
              >
                Change selection
              </Button>
              <Button
                variant="primary"
                onClick={submit}
                disabled={loading}
                loading={loading}
              >
                {loading ? "Scanning…" : files.length > 1 ? `Scan & save all (${files.length})` : "Scan & save"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-stone-600 dark:text-stone-400 font-medium mb-1">
              Take a photo with your camera or choose one or more from your gallery
            </p>
            <p className="text-sm text-stone-500 dark:text-stone-500 mb-6">
              JPEG, PNG or WebP · max 5MB each
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                type="button"
                variant="primary"
                onClick={() => cameraInputRef.current?.click()}
              >
                Take photo
              </Button>
              <Button
                type="button"
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

      {savedCards.length > 0 && (
        <Card className="mt-6 p-6 border-2 border-semantic-success/30 bg-semantic-success-light/50">
          <div className="flex items-center gap-2 mb-4">
            <span
              className="w-10 h-10 rounded-full bg-semantic-success/20 flex items-center justify-center text-semantic-success text-xl"
              aria-hidden
            >
              ✓
            </span>
            <h2 className="font-display font-semibold text-green-800 text-lg">
              {savedCards.length === 1 ? "Card saved" : `${savedCards.length} cards saved`}
            </h2>
          </div>
          <ul className="bg-white rounded-card shadow-card p-4 mb-6 space-y-2 max-h-48 overflow-y-auto">
            {savedCards.map((c) => (
              <li key={c.id} className="text-sm">
                <p className="font-medium text-pokemon-dark">
                  {c.displayName?.trim() ||
                    [c.name, c.setName].filter(Boolean).join(" - ") +
                      (c.cardNumber ? ` (${c.cardNumber})` : "")}
                </p>
                <div className="flex flex-wrap gap-2 text-stone-600">
                  {c.setName && <span>{c.setName}</span>}
                  {c.year && <span>· {c.year}</span>}
                  {c.rarity && <Badge variant={c.rarity}>{c.rarity}</Badge>}
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={goToDashboard}>
              View in dashboard
            </Button>
            <Button variant="secondary" onClick={() => setSavedCards([])}>
              Add more
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
