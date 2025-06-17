import db from "@/db";
import { advocates } from "@/db/schema";
import { advocateData } from "@/db/seed/advocates";
import { Advocate } from "@/db/types";
import { NextRequest } from "next/server";
import { sql, asc, desc, lt, gt, and, or, eq } from "drizzle-orm";

export type AdvocatesResponse = {
  data: Advocate[];
  pagination: {
    nextCursor: string;
    prevCursor: string;
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
  const direction = searchParams.get("direction") || "next";
  const pageSize = parseInt(searchParams.get("pageSize") || "5", 10);

  const cursor = encodedCursor ? decodeCursor(encodedCursor) : null;
  console.log(`Cursor: ${cursor?.createdAt} - ${cursor?.id} - ${direction}`);

  let where;
  let orderBy = [desc(advocates.createdAt), desc(advocates.id)];

  if (cursor) {
    if (direction === "next") {
      console.log("Cursor/Next query");
      where = or(
        lt(advocates.createdAt, cursor.createdAt),
        and(
          eq(advocates.createdAt, cursor.createdAt),
          lt(advocates.id, cursor.id),
        ),
      );
    } else {
      console.log("Cursor/Prev query");
      where = or(
        gt(advocates.createdAt, cursor.createdAt),
        and(
          eq(advocates.createdAt, cursor.createdAt),
          gt(advocates.id, cursor.id),
        ),
      );
      orderBy = [asc(advocates.createdAt), asc(advocates.id)];
    }
  }

  const data = await db.query.advocates.findMany({
    where,
    orderBy,
    limit: pageSize,
  });

  /*
   * When we go "previous", the order of results is reversed
   */
  const lastAdvocate = direction === "next" ? data[data.length - 1] : data[0];
  const firstAdvocate = direction === "next" ? data[0] : data[data.length - 1];
  console.log(
    `Last advocate/next Cursor: ${lastAdvocate.id} - ${lastAdvocate?.createdAt}`,
  );
  console.log(
    `First advocate/prev Cursor: ${firstAdvocate.id} - ${firstAdvocate?.createdAt}`,
  );

  const nextCursor = encodeCursor(lastAdvocate.createdAt, lastAdvocate.id);
  const prevCursor = encodeCursor(firstAdvocate.createdAt, firstAdvocate.id);

  const hasNextPage = await db.query.advocates.findFirst({
    where: or(
      lt(advocates.createdAt, lastAdvocate.createdAt),
      and(
        eq(advocates.createdAt, lastAdvocate.createdAt),
        lt(advocates.id, lastAdvocate.id),
      ),
    ),
    orderBy: [desc(advocates.createdAt), desc(advocates.id)],
  });

  const hasPrevPage = await db.query.advocates.findFirst({
    where: or(
      gt(advocates.createdAt, firstAdvocate.createdAt),
      and(
        eq(advocates.createdAt, firstAdvocate.createdAt),
        gt(advocates.id, firstAdvocate.id),
      ),
    ),
    orderBy: [asc(advocates.createdAt), asc(advocates.id)],
  });

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
