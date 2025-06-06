// Stylistic change: "@"
import db from "@/db";
import { advocates } from "@/db/schema";
import { advocateData } from "@/db/seed/advocates";
import { Advocate } from "@/db/types";
import { NextRequest } from "next/server";
import { sql } from "drizzle-orm";

export type AdvocatesResponse = {
  data: Advocate[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "5", 10);

  const offset = (page - 1) * pageSize;
  // Uncomment this line to use a database
  //const data = await db.select().from(advocates);
  //
  //const data = advocateData;

  // ISSUE: drizzle-orm was v0.33, which was out of date with the documentation.
  // updating to latest version (v0.44.2) so that I can learn to use it from the documentation.
  // ISSUE: no pagination, cannot support large datasets.

  const [data, totalResult] = await Promise.all([
    db.query.advocates.findMany({
      offset,
      limit: pageSize,
    }),
    db.execute(
      sql<{ count: number }>`SELECT count(*)::int as count FROM ${advocates}`,
    ),
  ]);
  const total = Number(totalResult[0]?.count) || 0;
  const totalPages = Math.ceil(total / pageSize);

  return Response.json({
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
}
