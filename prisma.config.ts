import "dotenv/config";
import { defineConfig } from "prisma/config";
import { env } from "./lib/env";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrate: {
    seed: undefined,
  },
  datasource: {
    url: env.DATABASE_URL,
  },
});
