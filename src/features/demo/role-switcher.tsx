import { Button } from "@/components/ui/button";
import { Leaf, UserRound } from "lucide-react";
import Link from "next/link";

export function RoleSwitcher({
  actor,
  ownerHref = "/owner",
}: {
  actor: "owner" | "traveller";
  ownerHref?: string;
}) {
  return (
    <nav
      aria-label="Demo role"
      className="ml-auto flex shrink-0 items-center gap-1 rounded-full border bg-card p-1"
    >
      <Button
        asChild
        size="sm"
        variant={actor === "traveller" ? "secondary" : "ghost"}
        className="h-8 rounded-full px-3 text-xs"
      >
        <Link
          href="/traveller"
          aria-current={actor === "traveller" ? "page" : undefined}
        >
          <UserRound className="size-3.5" />
          Traveller
        </Link>
      </Button>
      <Button
        asChild
        size="sm"
        variant={actor === "owner" ? "secondary" : "ghost"}
        className="h-8 rounded-full px-3 text-xs"
      >
        <Link
          href={ownerHref}
          aria-current={actor === "owner" ? "page" : undefined}
        >
          <Leaf className="size-3.5" />
          Hotel owner
        </Link>
      </Button>
    </nav>
  );
}
