import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";

// Charger le bon fichier env selon l'environnement
dotenv.config({ 
  path: process.env.NODE_ENV === 'production' 
    ? '.env.production' 
    : '.env.development',
  override: true
});

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});



