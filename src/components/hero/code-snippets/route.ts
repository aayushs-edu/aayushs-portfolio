import { z } from "zod";

const Query = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  tag: z.string().trim().toLowerCase().optional(),
});

type Entry = {
  id: string;
  title: string;
  tags: string[];
  createdAt: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = Query.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return Response.json(
      { error: "invalid query", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { cursor, limit, tag } = parsed.data;
  const rows = await db.entries.findMany({
    where: tag ? { tags: { has: tag } } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const page: Entry[] = rows.slice(0, limit).map((row) => ({
    id: row.id,
    title: row.title,
    tags: row.tags,
    createdAt: row.createdAt.toISOString(),
  }));

  return Response.json({
    items: page,
    next: rows.length > limit ? rows[limit].id : null,
  });
}
