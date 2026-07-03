export type CardFields = {
  name: string;
  displayName?: string | null;
  description?: string | null;
  year?: number | null;
  setName?: string | null;
  rarity?: string | null;
  cardNumber?: string | null;
};

export type CardExtraction = CardFields;

export function stripTcgPrefix(value: string): string {
  return value.replace(/^(Pokémon TCG|Pokemon TCG):\s*/gi, "").trim();
}

export function normalizeRarity(rarity?: string | null): string | null {
  if (!rarity?.trim()) return null;
  const r = rarity.trim();
  if (/^none$/i.test(r)) return null;
  if (/^[\s★●♦◦•·]+$/i.test(r) || r.length <= 2) return "Rare";
  if (/rare\s+ultra/i.test(r)) return "Ultra Rare";
  if (/^rare\s+holo$/i.test(r)) return "Holo Rare";
  if (/^holo\s+rare$/i.test(r)) return "Holo Rare";
  return r;
}

export function parseYearFromText(text?: string | null): number | null {
  if (!text?.trim()) return null;
  const match = text.match(/\b(19|20)\d{2}\b/);
  if (!match) return null;
  const year = parseInt(match[0], 10);
  return Number.isNaN(year) ? null : year;
}

export function extractCardName(rawName: string): string {
  const raw = rawName.trim() || "Unknown";
  const emDash = raw.match(/^(.+?)\s—\s/);
  if (emDash) return emDash[1].trim();
  const hyphenSet = raw.match(/^(.+?)\s-\s\d/);
  if (hyphenSet) return hyphenSet[1].trim();
  return raw;
}

export function formatDisplayName(fields: {
  name: string;
  setName?: string | null;
  cardNumber?: string | null;
}): string {
  const name = fields.name.trim() || "Unknown";
  const setName = fields.setName?.trim() ? stripTcgPrefix(fields.setName.trim()) : "";
  const num = fields.cardNumber?.trim() ?? "";

  if (setName && num) {
    return num.includes("/")
      ? `${name} — ${setName} (${num})`
      : `${name} (${num}) — ${setName}`;
  }
  if (setName) return `${name} — ${setName}`;
  return num ? `${name} (${num})` : name;
}

export function getDisplayLabel(card: CardFields): string {
  if (card.displayName?.trim()) return card.displayName.trim();
  return formatDisplayName({
    name: card.name,
    setName: card.setName,
    cardNumber: card.cardNumber,
  });
}

export function isCatalogImageUrl(src: string): boolean {
  return src.startsWith("/api/catalog/image");
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatAttackLine(raw: string): string | null {
  const text = stripHtml(raw);
  if (!text) return null;

  const lines = raw.split(/\r?\n|<br\s*\/?>/i).map((line) => stripHtml(line)).filter(Boolean);
  const head = lines[0] ?? text;
  const effect = lines.slice(1).join(" ").trim();

  const match = head.match(/^\[[^\]]+\]\s*(.+?)(?:\s*\(([^)]+)\))?$/);
  if (match) {
    const attackName = match[1].trim();
    const damage = match[2]?.trim();
    const label = damage ? `${attackName} — ${damage}` : attackName;
    return effect ? `${label} — ${effect}` : label;
  }

  return effect ? `${head} — ${effect}` : head;
}

function formatAbilityLine(raw: string): string | null {
  const text = stripHtml(raw);
  if (!text) return null;

  const abilityMatch = text.match(
    /^(Ability|Pok[ée]mon-Body|Pok[ée]mon-Power|Pok[ée]mon-EX rule|Ancient Trait)\s*:?\s*(.+)$/i
  );
  if (abilityMatch) {
    const kind = abilityMatch[1];
    const rest = abilityMatch[2].trim();
    const dashSplit = rest.match(/^(.+?)\s[-—]\s(.+)$/);
    if (dashSplit) {
      return `${kind}: ${dashSplit[1].trim()} — ${dashSplit[2].trim()}`;
    }
    return `${kind}: ${rest}`;
  }

  const dashSplit = text.match(/^(.+?)\s[-—]\s(.+)$/);
  if (dashSplit && /body|ability|power|rule/i.test(dashSplit[1])) {
    return `${dashSplit[1].trim()} — ${dashSplit[2].trim()}`;
  }

  return text;
}

export function buildCardDescription(input: {
  cardText?: string | null;
  attacks?: string[] | null;
  abilities?: string[] | null;
}): string | null {
  const parts: string[] = [];

  for (const ability of input.abilities ?? []) {
    const formatted = formatAbilityLine(ability);
    if (formatted) parts.push(formatted);
  }

  if (input.cardText?.trim()) {
    const segments = input.cardText.split(/\r?\n|<br\s*\/?>/i);
    for (const segment of segments) {
      const formatted = formatAbilityLine(segment);
      if (formatted && !parts.includes(formatted)) parts.push(formatted);
    }
  }

  for (const attack of input.attacks ?? []) {
    const formatted = formatAttackLine(attack);
    if (formatted) parts.push(formatted);
  }

  const description = parts.join("\n\n").trim();
  return description || null;
}

export function normalizeCardFields<T extends CardFields>(card: T): T {
  const next = { ...card };

  if (next.setName?.trim()) {
    const set = stripTcgPrefix(next.setName.trim());
    next.setName = set.toLowerCase() === "full set name" ? null : set;
  }

  next.name = extractCardName(next.name);
  next.rarity = normalizeRarity(next.rarity);

  if (next.displayName?.includes("Full Set Name")) {
    next.displayName = next.displayName.replace(
      /\s*Full Set Name\s*/gi,
      next.setName ?? "Unknown Set"
    );
  }
  if (next.displayName?.trim()) {
    next.displayName = stripTcgPrefix(next.displayName.trim());
  }

  if (next.description?.trim()) {
    const d = next.description.trim();
    const set = (next.setName ?? "").trim();
    const rarity = (next.rarity ?? "").trim();
    if (set && rarity && (d === `${set} ${rarity}` || d === `${set} ${rarity}.`)) {
      next.description = null;
    }
  }

  if (!next.displayName?.trim()) {
    next.displayName = formatDisplayName({
      name: next.name,
      setName: next.setName,
      cardNumber: next.cardNumber,
    });
  }

  if (next.year == null && next.setName) {
    next.year = parseYearFromText(next.setName);
  }

  return next;
}
