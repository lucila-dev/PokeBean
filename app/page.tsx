import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PokeballIcon } from "@/components/PokeballIcon";

export default function HomePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="font-brand text-7xl sm:text-8xl font-semibold text-pokemon-dark dark:text-stone-100 mb-4 flex items-center justify-center gap-4 flex-wrap">
          <span className="w-14 h-14 sm:w-20 sm:h-20 shrink-0 inline-flex items-center justify-center">
            <PokeballIcon className="w-full h-full" />
          </span>
          <span>PokeBean</span>
        </h1>
        <p className="text-2xl text-stone-600 dark:text-stone-400">
          Keep your card collection in one place.
        </p>
      </div>

      <Card className="p-8 mb-8">
        <h2 className="font-display text-2xl font-semibold text-pokemon-dark dark:text-stone-100 mb-5">
          What you can do
        </h2>
        <ul className="space-y-4 text-stone-700 dark:text-stone-300 text-lg leading-relaxed">
          <li className="flex gap-3">
            <span className="text-pokemon-yellow font-bold shrink-0">1.</span>
            <span><strong>Add cards with a photo</strong> — name, set, number, and rarity are saved automatically.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-pokemon-yellow font-bold shrink-0">2.</span>
            <span><strong>Save and organize</strong> — each card is stored with clear details so you can tell printings apart.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-pokemon-yellow font-bold shrink-0">3.</span>
            <span><strong>Browse and search</strong> — view as table or cards, filter by set or rarity, and remove cards you don’t have.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-pokemon-yellow font-bold shrink-0">4.</span>
            <span><strong>See your stats</strong> — charts by set, year, and rarity, plus how your collection grows.</span>
          </li>
        </ul>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/dashboard">
          <Button variant="primary">View my collection</Button>
        </Link>
        <Link href="/add">
          <Button variant="secondary">Scan a card</Button>
        </Link>
      </div>
    </div>
  );
}
