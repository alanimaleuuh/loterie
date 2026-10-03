import { db } from "@/server/db";

export async function getDrawDetail(id: string) {
  if (!/^[a-z0-9]{10,40}$/i.test(id)) return null;
  return db.draw.findUnique({
    where: { id },
    include: {
      product: { include: { category: true, images: { orderBy: { sortOrder: "asc" } } } },
      winner: true,
    },
  });
}
