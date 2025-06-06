import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const setup = () => {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    throw new Error("process.env.DATABASE_URL is not set");
  }
  /* ISSUE: this breaks the type of the return of this function.
     * I need a PostgresJsDatabase<typeof schema>, not PostgresJsDatabase<typeof schema> | randomnulltype.
     * If you want to have a null object, which is a valid pattern that can be used to handle errors gracefully, you then must also pay the cost: take it upon yourself to also do the type narrowing!
    return {
      select: () => ({
        from: () => [],
      }),
    };
  }*/

  // for query purposes
  const queryClient = postgres(process.env.DATABASE_URL);
  const db = drizzle(queryClient, {
    schema,
  });
  return db;
};

export default setup();
