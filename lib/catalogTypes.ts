export type CatalogCard = {
  id: string;
  name: string;
  displayName: string;
  setName: string | null;
  year: number | null;
  rarity: string | null;
  cardNumber: string | null;
  imageUrl: string | null;
  imageUrlLarge: string | null;
  /** Direct CDN fallback when PokeWallet has no image (e.g. some JP sets). */
  imageUrlExternal: string | null;
  description: string | null;
};
