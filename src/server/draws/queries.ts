import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";

export const drawCardInclude = {
  product: {
    select: {
      name: true,
      brand: true,
      reference: true,
      displayValue: true,
      shortDescription: true,
      category: { select: { name: true, slug: true } },
      images: { select: { url: true, alt: true }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
  },
  winner: { select: { publicName: true, ticketNumber: true, drawnAt: true } },
} satisfies Prisma.DrawInclude;

export type DrawCardData = Prisma.DrawGetPayload<{ include: typeof drawCardInclude }>;

/** Tirages visibles par le public */
export const publicDrawWhere: Prisma.DrawWhereInput = {
  status: { not: "DISABLED" },
  product: { status: "ACTIVE" },
};

export type DrawFilters = {
  q?: string;
  category?: string;
  maxTicketPrice?: number; // centimes
  minValue?: number;
  maxValue?: number;
  view?: "open" | "upcoming" | "ending" | "new" | "finished" | "all";
  sort?: "recent" | "ending" | "price_asc" | "price_desc" | "popular" | "value_desc";
};

export async function listDraws(f: DrawFilters = {}, take = 60): Promise<DrawCardData[]> {
  const now = new Date();
  const and: Prisma.DrawWhereInput[] = [publicDrawWhere];

  if (f.q) {
    const q = f.q.trim().slice(0, 80);
    and.push({
      product: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { brand: { contains: q, mode: "insensitive" } },
          { reference: { contains: q, mode: "insensitive" } },
          { category: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
    });
  }
  if (f.category) and.push({ product: { category: { slug: f.category } } });
  if (f.maxTicketPrice) and.push({ ticketPrice: { lte: f.maxTicketPrice } });
  if (f.minValue) and.push({ product: { displayValue: { gte: f.minValue } } });
  if (f.maxValue) and.push({ product: { displayValue: { lte: f.maxValue } } });

  const open: Prisma.DrawWhereInput = { status: "SCHEDULED", startsAt: { lte: now }, endsAt: { gt: now } };
  switch (f.view ?? "open") {
    case "open":
      and.push(open);
      break;
    case "upcoming":
      and.push({ status: "SCHEDULED", startsAt: { gt: now } });
      break;
    case "ending":
      and.push(open, { endsAt: { lte: new Date(now.getTime() + 48 * 3600_000) } });
      break;
    case "new":
      and.push(open, { startsAt: { gte: new Date(now.getTime() - 4 * 24 * 3600_000) } });
      break;
    case "finished":
      and.push({ status: { in: ["DRAWN", "CANCELLED", "CLOSED"] } });
      break;
  }

  const orderBy: Prisma.DrawOrderByWithRelationInput[] = (() => {
    switch (f.sort) {
      case "ending":
        return [{ endsAt: "asc" }];
      case "price_asc":
        return [{ ticketPrice: "asc" }, { endsAt: "asc" }];
      case "price_desc":
        return [{ ticketPrice: "desc" }, { endsAt: "asc" }];
      case "value_desc":
        return [{ product: { displayValue: "desc" } }];
      case "popular":
        return [{ soldTickets: "desc" }];
      case "recent":
      default:
        return f.view === "finished" ? [{ endsAt: "desc" }] : [{ startsAt: "desc" }];
    }
  })();

  const draws = await db.draw.findMany({ where: { AND: and }, include: drawCardInclude, orderBy, take });
  if (f.sort === "popular") {
    // Popularité = taux de remplissage
    draws.sort((a, b) => b.soldTickets / b.maxTickets - a.soldTickets / a.maxTickets);
  }
  return draws;
}

export async function getCategories() {
  return db.category.findMany({ orderBy: { sortOrder: "asc" } });
}
