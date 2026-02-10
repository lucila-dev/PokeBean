import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardTitle } from "@/components/ui/Card";
import { ProfileForm } from "@/components/ProfileForm";
import { ProfileAppearance } from "@/components/ProfileAppearance";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=/profile");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  if (!user) redirect("/login");

  const imageUrl = session.user?.image ?? null;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-pokemon-dark dark:text-stone-100 mb-2">
        Profile
      </h1>
      <p className="text-stone-600 dark:text-stone-400 mb-8">
        Manage your account and settings.
      </p>

      <div className="max-w-xl space-y-6">
        <Card>
          <CardTitle>Your info</CardTitle>
          <ProfileForm
            initialName={user.name ?? ""}
            initialImageUrl={imageUrl}
          />
          <div className="mt-6 pt-6 border-t border-stone-200 dark:border-stone-600 space-y-1 text-sm text-stone-600 dark:text-stone-400">
            <p>
              <span className="font-medium text-stone-700 dark:text-stone-300">Email</span>{" "}
              {user.email}
            </p>
            <p>
              <span className="font-medium text-stone-700 dark:text-stone-300">Member since</span>{" "}
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </Card>
        <ProfileAppearance />
      </div>
    </div>
  );
}
