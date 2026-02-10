import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="font-brand text-4xl font-semibold text-pokemon-dark mb-4">
          PokeBean
        </h1>
        <p className="text-xl text-stone-600">
          Scan, catalog, and analyze your Pokemon TCG cards in one place.
        </p>
      </div>

      <Card className="p-8 mb-8">
        <h2 className="font-display text-xl font-semibold text-pokemon-dark mb-4">
          What this app does
        </h2>
        <ul className="space-y-4 text-stone-700">
          <li className="flex gap-3">
            <span className="text-pokemon-yellow font-bold shrink-0">1.</span>
            <span>
              <strong>Scan cards with your camera.</strong> Take a photo of any Pokemon card
              and the app uses AI to read the name, set, number, rarity, and description.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-pokemon-yellow font-bold shrink-0">2.</span>
            <span>
              <strong>Store your collection.</strong> Every scanned card is saved with a
              clear, unique name (TCGPlayer-style) so you can tell different printings apart.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-pokemon-yellow font-bold shrink-0">3.</span>
            <span>
              <strong>Browse and search.</strong> View your cards in a table or card layout,
              filter by set or rarity, search by name or description, and delete cards you no
              longer have.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-pokemon-yellow font-bold shrink-0">4.</span>
            <span>
              <strong>See analytics.</strong> Charts show how many cards you have per set,
              per year, and by rarity, plus how your collection has grown over time.
            </span>
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
