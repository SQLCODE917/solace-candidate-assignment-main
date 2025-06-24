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

export type Column = keyof Advocate;

/*
 * Since a type does not survive runtime, have to hardcode props
 * into the type guard. This is tech debt that will need to be
 * addressed, so that when types get updated, the type guards
 * don't have to be manually updated
 */
const isAdvocateKey = (key: string | null): key is Column =>
  key !== null &&
  [
    "id",
    "firstName",
    "lastName",
    "city",
    "degree",
    "specialties",
    "yearsOfExperience",
    "phoneNumber",
    "createdAt",
  ].includes(key);

export type Sort = "asc" | "desc";

const isSort = (sort: string | null): sort is Sort =>
  sort !== null && ["asc", "desc"].includes(sort);

export type Cursor<K extends Column> = {
  sort: Sort;
  column: K;
  value: Advocate[K];
};

export function encodeCursor<K extends Column>(cursor: Cursor<K>): string {
  const encoded = Buffer.from(JSON.stringify(cursor)).toString("base64");

  return encoded;
}

export function decodeCursor<K extends Column>(cursor: string): Cursor<K> {
  const decoded = JSON.parse(Buffer.from(cursor, "base64").toString());
  return decoded;
}

/*
 * Params (all optional):
 * - column     - define for SORT state
 * - sort       - define for SORT state
 * - direction  - define for PAGINATION state
 * - cursor     - define for PAGINATION state
 *   - column
 *   - sort
 *   - value
 * - pageSize   - irrelevant for now, kept for a possible user control of the number of results per page
 *
 * * As an aside, with this approach, by adding more sort props (within reason - let's stay within 2000 characters),
 * we can add secondary, tertiary, etc sort
 *
 * Request types:
 * 1. INITIAL LOAD: no params, default sort, returns first page of data
 * 2. SORT: explicit sort, returns first page of data
 *  column:Column
 *  sort: "asc" | "desc"
 * 3. PAGINATION: implicit sort (from cursor), returns next/prev page of data
 *  direction: "next" | "prev"
 *  cursor: Cursor
 *
 * * by expressing the INITIAL LOAD as a SORT by id, desc, we achieve a dimensionality reduction
 *
 * * cursor-based pagination allows us to avoid a query for the size of the table to do pagination-by-numbers
 *
 * * when working with sortable tables before, the UX always called for resetting the pagination to the first page on sort:
 * i.e. when on page 5, changing the sort column or sort order reset the table to page 1, not page 5
 * so, I'm keeping to that guidance here as well
 *
 * Cursors, Previous and Next checks, given sort:
 * ASC:
 * 1 2 3 4 5 6 7 8 9 10
 * F         L
 * Prev: column < F.value
 * Next: column > L.value
 *
 * DESC:
 * 10 9 8 7 6 5 4 3 2 1
 * F        L
 * Prev: column > F.value
 * Next: column < L.value
 *
 * To keep this within a 45 minute limit, leaving the code in a Red->Green state, no time to Refactor
 * (adding docs was extra, but I stopped the timer already - because you should always make time to document your hacks =)
 * Given more time, this could be refactored to remove repeated logic, esp in "hasNextPage" and "hasPrevPage"
 * Given even more time, and team's code organization standards, would invest that time into decoupling different domains:
 * - separating HTTP request/response concerns
 * - DB logic
 * - pagination logic
 * - cursor encoding/decoding
 */
export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  // 'next' or 'prev'
  const direction = searchParams.get("direction") || "next";
  const pageSize = parseInt(searchParams.get("pageSize") || "5", 10);
  const encodedCursor = searchParams.get("cursor");
  const cursor = encodedCursor ? decodeCursor(encodedCursor) : undefined;
  const columnParam = searchParams.get("column");
  const column = isAdvocateKey(columnParam) ? columnParam : "id";
  const sortParam = searchParams.get("sort");
  const sort = isSort(sortParam) ? sortParam : "desc";

  console.log(`column: ${columnParam}/${column}, sort: ${sortParam}/${sort}`);

  let where;
  let orderBy;

  if (!cursor) {
    console.log("INITIAL LOAD / SORT");
    if (sort === "desc") {
      orderBy = [desc(advocates[column])];
    } else {
      orderBy = [asc(advocates[column])];
    }
  } else {
    console.log("PAGINATION");
    console.log(
      `Direction: ${direction}, column: ${cursor.column}, sort: ${cursor.sort}, value: ${cursor.value}`,
    );
    if (cursor.sort === "asc") {
      orderBy = [asc(advocates[cursor.column])];
    } else {
      orderBy = [desc(advocates[cursor.column])];
    }

    if (direction === "next") {
      console.log("Cursor/Next query");
      if (cursor.sort === "asc") {
        console.log("\tASC");
        where = gt(advocates[cursor.column], cursor.value);
      } else {
        console.log("\tDESC");
        where = lt(advocates[cursor.column], cursor.value);
      }
    } else {
      console.log("Cursor/Prev query");
      if (cursor.sort === "asc") {
        console.log("\tASC");
        where = lt(advocates[cursor.column], cursor.value);
      } else {
        console.log("\tDESC");
        where = gt(advocates[cursor.column], cursor.value);
      }
    }
  }

  /* Debugging only - WHAT IS THE FINAL QUERY?
  // https://www.answeroverflow.com/m/1143438583131275294
  const statement = db.query.advocates
    .findMany({
      where,
      orderBy,
      limit: pageSize,
    })
    .prepare("advocates");

  console.log(statement["query"]);
  */

  const data = await db.query.advocates.findMany({
    where,
    orderBy,
    limit: pageSize,
  });

  const first = data[0];
  const last = data[data.length - 1];

  let firstCursor, lastCursor;
  let hasPrevPage, hasNextPage;

  if (!cursor) {
    console.log(`first cursor: ${first[column]}`);
    console.log(`last Cursor: ${last[column]}`);
    firstCursor = encodeCursor({
      sort,
      column,
      value: first[column],
    });
    lastCursor = encodeCursor({
      sort,
      column,
      value: last[column],
    });

    if (sort === "desc") {
      hasPrevPage = await db.query.advocates.findFirst({
        where: gt(advocates[column], first[column]),
        orderBy: [desc(advocates[column])],
      });
      hasNextPage = await db.query.advocates.findFirst({
        where: lt(advocates[column], last[column]),
        orderBy: [desc(advocates[column])],
      });
    } else {
      hasPrevPage = await db.query.advocates.findFirst({
        where: lt(advocates[column], first[column]),
        orderBy: [asc(advocates[column])],
      });
      hasNextPage = await db.query.advocates.findFirst({
        where: gt(advocates[column], last[column]),
        orderBy: [asc(advocates[column])],
      });
    }
  } else {
    console.log(`first cursor: ${first[cursor.column]}`);
    console.log(`last Cursor: ${last[cursor.column]}`);
    firstCursor = encodeCursor({
      sort: cursor.sort,
      column: cursor.column,
      value: first[cursor.column],
    });
    lastCursor = encodeCursor({
      sort: cursor.sort,
      column: cursor.column,
      value: last[cursor.column],
    });

    if (cursor.sort === "asc") {
      hasPrevPage = await db.query.advocates.findFirst({
        where: lt(advocates[cursor.column], first[cursor.column]),
        orderBy: [asc(advocates[cursor.column])],
      });
      hasNextPage = await db.query.advocates.findFirst({
        where: gt(advocates[cursor.column], last[cursor.column]),
        orderBy: [asc(advocates[cursor.column])],
      });
    } else {
      hasPrevPage = await db.query.advocates.findFirst({
        where: gt(advocates[cursor.column], first[cursor.column]),
        orderBy: [desc(advocates[cursor.column])],
      });
      hasNextPage = await db.query.advocates.findFirst({
        where: lt(advocates[cursor.column], last[cursor.column]),
        orderBy: [desc(advocates[cursor.column])],
      });
    }
  }

  return Response.json({
    data,
    pagination: {
      nextCursor: lastCursor,
      prevCursor: firstCursor,
      hasNextPage,
      hasPrevPage,
    },
  });
}
