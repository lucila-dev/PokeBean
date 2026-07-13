import OpenAI from "openai";
import { normalizeCardFields, type CardExtraction } from "@/lib/cardFormat";

export type { CardExtraction };

const SYSTEM_PROMPT = `You are an expert at identifying Pokemon Trading Card Game cards. 
Many cards share the same Pokemon name (e.g. many Pikachus). You MUST provide a full, unique display name.

CRITICAL RULES:
1) Set name and displayName: Use the ACTUAL official expansion / product name printed or clearly indicated on the card.
   - Do NOT include the prefix "Pokémon TCG:" or "Pokemon TCG:".
   - Never output "Full Set Name" as a placeholder.
   - For theme decks / trainer kits / battle decks, use the FULL product name (e.g. "HS—Trainer Kit", "HeartGold & SoulSilver Trainer Kit"), NOT only the featured Pokemon on the box (never setName = just "Gyarados" or "Raichu" for a kit).
   - Prefer the expansion name from the bottom of the card or set symbol when readable.
2) Set codes and card numbers: Copy EXACTLY what is printed (e.g. "3/30", "M-EWEN", "SM76"). Do not invent numbers.
3) Rarity: Always use a WORD, never a symbol. Use "Ultra Rare" (not "Rare Ultra"), "Holo Rare", "Rare", "Uncommon", "Common", "Legend", etc. If the card shows only a star (★), use "Rare" or "Holo Rare" — never output ★ or other symbols.
4) Description is NEVER the set name. Description is ONLY the printed text from the card body:
   - Attacks (name + effect + damage)
   - Abilities / Poké-Powers / Poké-Bodies
   - Trainer/Energy rules text
   - Flavor text at the bottom of the text box (the italic lore sentence), if present
   - Copy wording accurately. Separate blocks with a blank line.
   - Do NOT write things like "Gyarados set", "from the X set", rarity, year, or card number in description.
   - If you cannot read the text box, omit description.

Given an image of a Pokemon card, extract the following and return ONLY valid JSON with these exact keys (omit any you cannot read):
- name (string, required): The card/Pokemon name only, e.g. "Flaaffy"
- displayName (string, required): "Card Name — Actual Set Name (X/YY)" using the real expansion name
- description (string): Card body text only (attacks/abilities/flavor). Never the set name.
- year (number): Copyright / release year if shown (e.g. 2010)
- setName (string): Official expansion or product name, e.g. "HeartGold & SoulSilver", "HS—Trainer Kit"
- rarity (string): "Ultra Rare", "Holo Rare", "Rare", "Uncommon", "Common", or "Legend". Never symbols.
- cardNumber (string): Exactly as printed, e.g. "3/30", "58/102"
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
