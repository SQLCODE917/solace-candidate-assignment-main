import { InferModel } from "drizzle-orm";
import { advocates } from "./schema";

export type Advocate = InferModel<typeof advocates>;
