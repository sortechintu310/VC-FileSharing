import fs from "fs";
import path from "path";
import process from "process";
import { fileURLToPath, pathToFileURL } from "url";
import Sequelize from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = process.env.NODE_ENV || "development";

import config from "../config/db-config.js";
const envConfig = config[env];

if (!envConfig) {
  throw new Error(`❌ No database config found for environment: ${env}`);
}

export const sequelize = new Sequelize(
  envConfig.database,
  envConfig.username,
  envConfig.password,
  {
    ...envConfig,
    // logging: env === "development" ? console.log : false,
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

try {
  await sequelize.authenticate();
  console.log("✅ Database connected successfully.");
} catch (err) {
  console.error("❌ Database connection failed:", err.message);
  process.exit(1);
}

const db = {};

const loadModelsRecursively = async (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip this index file
    if (fullPath === __filename) continue;

    if (entry.isDirectory()) {
      await loadModelsRecursively(fullPath);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".model.js")) {
      const modelPath = pathToFileURL(fullPath).href;
      const modelModule = await import(modelPath);

      if (typeof modelModule.default !== "function") {
        throw new Error(`❌ Model file ${entry.name} must export default function`);
      }

      const model = modelModule.default(sequelize, Sequelize.DataTypes);

      if (!model || !model.name) {
        throw new Error(`❌ Model file ${entry.name} returned invalid model`);
      }

      db[model.name] = model;
    }
  }
};

await loadModelsRecursively(__dirname);


Object.values(db).forEach((model) => {
  if (typeof model.associate === "function") {
    model.associate(db);
  }
});


db.sequelize = sequelize;

export default db;