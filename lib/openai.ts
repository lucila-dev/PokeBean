import OpenAI from "openai";
import { normalizeCardFields, type CardExtraction } from "@/lib/cardFormat";

export type { CardExtraction };

const SYSTEM_PROMPT = `You are an expert at identifying Pokemon Trading Card Game cards. 
Many cards share the same Pokemon name (e.g. many Pikachus). You MUST provide a full, unique display name.

CRITICAL RULES:
1) Set name and displayName: Use the ACTUAL set name from the card. Do NOT include the prefix "Pokémon TCG:" or "Pokemon TCG:" — use only the set name (e.g. "Scarlet & Violet", "Paldea Evolved", "Pokémon EX", "Sun & Moon Black Star Promo"). Never output "Full Set Name" as a placeholder.
2) Set codes and card numbers: Copy EXACTLY what is printed (e.g. "M-EWEN", "SM76"). Do not interpret or correct (e.g. never output "Mew" for "M-EWEN").
3) Rarity: Always use a WORD, never a symbol. Use "Ultra Rare" (not "Rare Ultra"), "Holo Rare", "Rare", "Uncommon", "Common", "Legend", etc. If the card shows only a star (★), use "Rare" or "Holo Rare" — never output ★ or other symbols.

Given an image of a Pokemon card, extract the following and return ONLY valid JSON with these exact keys (omit any you cannot read):
- name (string, required): The card/Pokemon name only, e.g. "Pikachu"
- displayName (string, required): "Card Name (SetCode) — Actual Set Name" or "Card Name — Actual Set Name (X/YY)". Use the real set name from the card, e.g. "Daisy's Help (M-EWEN) — Pokémon EX". Never use "Full Set Name" as text.
- description (string): The text from the card's main text box ONLY. Copy accurately and completely:
  • For Pokémon: include Ability name and effect, then each Attack name and effect (e.g. "Expanding Body — ...\\n\\nFriend Tackle — 90+ ..."). Use the exact wording from the card.
  • Separate each ability and attack with a blank line (double newline).
  • For Trainers: the card effect text verbatim.
  • For Energy: any rules or flavor text in the text box.
  Do NOT put the set name, rarity, or card number in description. Do NOT summarize or paraphrase — copy what is written. If there is no text box, omit or leave empty.
- year (number): Release year if shown
- setName (string): The set name WITHOUT the "Pokémon TCG:" prefix, e.g. "Scarlet & Violet", "Pokémon EX"
- rarity (string): Use "Ultra Rare" (not "Rare Ultra"), "Holo Rare", "Rare", "Uncommon", "Common", or "Legend". Never use symbols like ★.
- cardNumber (string): Set/card identifier exactly as printed, e.g. "M-EWEN", "58/102"
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
    max_tokens: 800,
    temperature: 0,
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("No response from OpenAI");

  const parsed = JSON.parse(raw) as CardExtraction;
  if (!parsed.name) throw new Error("Missing required field: name");

  return normalizeCardFields(parsed);
}
