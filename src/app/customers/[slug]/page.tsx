import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPublishedBusiness } from "@/server/services/commerce";
import { ArrowUpRight, Leaf, MapPin, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export default async function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getPublishedBusiness(slug).catch(() => null);
  if (!result) notFound();
  const p = result.version.profile;
  return (
    <main className="min-h-screen">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-7">
        <span className="flex items-center gap-2 font-semibold">
          <Leaf className="size-5 text-primary" />
          presence
        </span>
        <Badge variant="secondary">Fictional BaselHack hotel</Badge>
      </nav>
      <section className="mx-auto max-w-5xl px-6 py-20">
        <Badge variant="outline" className="mb-8">
          <ShieldCheck className="mr-2 size-3" />
          Owner-approved presence
        </Badge>
        <h1 className="max-w-3xl text-5xl font-semibold tracking-tight md:text-7xl">
          {p.name}
        </h1>
        <p className="mt-7 max-w-2xl text-xl leading-relaxed text-muted-foreground">
          {p.description}
        </p>
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-4" />
          {p.address}
        </p>
        <div className="mt-12 flex flex-wrap gap-3">
          {p.amenities.map((a) => (
            <Badge key={a} variant="secondary" className="px-4 py-2">
              {a}
            </Badge>
          ))}
        </div>
        <div className="mt-16 grid gap-5 sm:grid-cols-3">
          {[
            ["Check-in", p.checkIn],
            ["Check-out", p.checkOut],
            [
              "After-midnight arrival",
              p.lateArrival ? "Self check-in available" : "Ask the owner",
            ],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border bg-card p-6">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 font-medium">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap gap-4">
          <Button asChild>
            <a href={`/customers/${slug}/business.json`}>
              Read business JSON
              <ArrowUpRight className="size-4" />
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={`/customers/${slug}/openapi.json`}>
              Commerce API
              <ArrowUpRight className="size-4" />
            </a>
          </Button>
        </div>
        <p className="mt-10 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          One approved record serves both people and agents. Prices and
          availability require an owner-approved offer. This is a fictional
          business; no real accommodation is sold. Version{" "}
          {result.version.id.slice(0, 8)}.
        </p>
      </section>
    </main>
  );
}
