import OpenAI from "openai";

/**
 * This function calls the OpenAI API (gpt-4o-mini with vision).
 * Each successful scan uses tokens and will appear on your OpenAI billing dashboard.
 * If you don't see usage: ensure OPENAI_API_KEY is set in .env and you've run a scan.
 */

export type CardExtraction = {
  name: string;
  displayName?: string;
  description?: string;
  year?: number;
  setName?: string;
  rarity?: string;
  cardNumber?: string;
};

const SYSTEM_PROMPT = `You are an expert at identifying Pokemon Trading Card Game cards. 
Many cards share the same Pokemon name (e.g. many Pikachus). You MUST provide a full, unique display name.

Given an image of a Pokemon card, extract the following and return ONLY valid JSON with these exact keys (omit any you cannot read):
- name (string, required): The card/Pokemon name only, e.g. "Pikachu"
- displayName (string, required): The FULL unique card name as used on TCGPlayer/checklists. Use exactly this format:
  • For promos/sets with a set code: "Card Name (SetCode) — Full Set Name"
    Example: "Pikachu (SM76) — Sun & Moon Black Star Promo"
  • For numbered sets: "Card Name — Full Set Name (X/YY)"
    Example: "Charizard — Base Set (4/102)"
  Always use the COMPLETE set name (e.g. "Sun & Moon Black Star Promo", not just "Promo"). The displayName must uniquely identify this exact card.
- description (string): Card text, ability text, or flavor text
- year (number): Release year if shown
- setName (string): The full set name e.g. "Sun & Moon Black Star Promo", "Base Set", "Scarlet & Violet"
- rarity (string): Common, Uncommon, Rare, Holo Rare, etc.
- cardNumber (string): Set/card identifier e.g. "SM76", "58/102", "25/102"
Return only the JSON object, no markdown or explanation.`;

export async function extractCardFromImage(
  imageBase64: string,
  mimeType: string
): Promise<CardExtraction> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 500,
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("No response from OpenAI");

  const parsed = JSON.parse(raw) as CardExtraction;
  if (!parsed.name) throw new Error("Missing required field: name");
  if (!parsed.displayName?.trim()) {
    const name = parsed.name?.trim() || "Unknown";
    const set = parsed.setName?.trim();
    const num = parsed.cardNumber?.trim();
    if (set && num) {
      parsed.displayName = num.includes("/")
        ? `${name} — ${set} (${num})`
        : `${name} (${num}) — ${set}`;
    } else {
      parsed.displayName =
        [name, set].filter(Boolean).join(" — ") +
        (num ? ` (${num})` : "");
    }
  }
  return parsed;
}
