// Stylistic change: "@"
import db from "@/db";
import { advocates } from "@/db/schema";
import { advocateData } from "@/db/seed/advocates";
import { Advocate } from "@/db/types";
import { NextRequest } from "next/server";
import { sql, asc, desc, lt, gt, and, or, eq } from "drizzle-orm";

export type AdvocatesResponse = {
  data: Advocate[];
  pagination: {
    nextCursor: string | null;
    prevCursor: string | null;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export function encodeCursor(createdAt: string, id: number): string {
  const cursor = Buffer.from(
    JSON.stringify({
      createdAt: createdAt,
      id: id,
    }),
  ).toString("base64");

  return cursor;
}

export function decodeCursor(cursor: string): {
  createdAt: string;
  id: number;
} {
  const { createdAt, id } = JSON.parse(
    Buffer.from(cursor, "base64").toString(),
  );

  return { createdAt, id };
}

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const encodedCursor = searchParams.get("cursor");
  // 'next' or 'prev'
  const direction = searchParams.get("direction") || "prev";
  const pageSize = parseInt(searchParams.get("pageSize") || "5", 10);

  const cursor = encodedCursor ? decodeCursor(encodedCursor) : null;
  console.log(`Cursor: ${cursor?.createdAt} - ${cursor?.id}`);

  let where;

  if (cursor) {
    if (direction === "next") {
      where = or(
        lt(advocates.createdAt, cursor.createdAt),
        and(
          eq(advocates.createdAt, cursor.createdAt),
          lt(advocates.id, cursor.id),
        ),
      );
    } else {
      where = or(
        gt(advocates.createdAt, cursor.createdAt),
        and(
          eq(advocates.createdAt, cursor.createdAt),
          gt(advocates.id, cursor.id),
        ),
      );
    }
  }

  const data = await db.query.advocates.findMany({
    where,
    limit: pageSize,
    orderBy: [desc(advocates.createdAt), desc(advocates.id)],
  });

  const lastAdvocate = data[data.length - 1];
  const firstAdvocate = data[0];
  console.log(
    `Last advocate/next Cursor: ${lastAdvocate.id} - ${lastAdvocate?.createdAt}`,
  );
  console.log(
    `First advocate/prev Cursor: ${firstAdvocate.id} - ${firstAdvocate?.createdAt}`,
  );

  const nextCursor = lastAdvocate?.createdAt
    ? encodeCursor(lastAdvocate.createdAt, lastAdvocate.id)
    : null;
  const prevCursor = firstAdvocate?.createdAt
    ? encodeCursor(firstAdvocate.createdAt, firstAdvocate.id)
    : null;

  const hasNextPageWhere = lastAdvocate?.createdAt
    ? or(
        lt(advocates.createdAt, lastAdvocate.createdAt),
        and(
          eq(advocates.createdAt, lastAdvocate.createdAt),
          lt(advocates.id, lastAdvocate.id),
        ),
      )
    : undefined;

  const hasNextPage = nextCursor
    ? await db.query.advocates.findFirst({
        where: hasNextPageWhere,
        orderBy: [desc(advocates.createdAt), desc(advocates.id)],
      })
    : false;

  const hasPrevPageWhere = firstAdvocate?.createdAt
    ? or(
        gt(advocates.createdAt, firstAdvocate.createdAt),
        and(
          eq(advocates.createdAt, firstAdvocate.createdAt),
          gt(advocates.id, firstAdvocate.id),
        ),
      )
    : undefined;

  const hasPrevPage = prevCursor
    ? await db.query.advocates.findFirst({
        where: hasPrevPageWhere,
        orderBy: [asc(advocates.createdAt), asc(advocates.id)],
      })
    : false;

  return Response.json({
    data,
    pagination: {
      nextCursor,
      prevCursor,
      hasNextPage,
      hasPrevPage,
    },
  });
}
