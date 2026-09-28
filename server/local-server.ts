/**
 * LOCAL DEV SERVER — for on-machine end-to-end testing only.
 *
 * Boots an in-memory MongoDB (`mongodb-memory-server`), seeds a fake
 * admin user, generates a real JWT for it, then wraps every function
 * in `src/functions/<name>/index.ts` in an Express endpoint so the
 * Admin panel can point `VITE_SERVER=http://localhost:5000/api`.
 *
 * NOT for production. NOT committed to devel. Kept out of `deploy.js`
 * and `Dockerfile` on purpose.
 */
import express, { Request, Response } from "express";
import { readdirSync, readFileSync, mkdirSync, writeFileSync, existsSync, createReadStream } from "fs";
import { join, dirname, extname } from "path";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

const PORT = Number(process.env.PORT) || 5555;
const DB_NAME = "avihu_local";
const JWT_SECRET = "local-dev-secret-do-not-use-in-prod-abcdef123456";
const FAKE_USER_ID = "6774eb1c730c4c44354db2d0";
const FAKE_SESSION_ID = "6774eb1c730c4c44354db2e0";

process.env.JWT_ACCESS_SECRET = JWT_SECRET;
process.env.JWT_ACCESS_EXPIRES_IN = "30d";
process.env.DB_NAME_PROD = DB_NAME;
process.env.DB_NAME_DEV = DB_NAME;
process.env.AVIHU_TRAINER_ID = FAKE_USER_ID;

type LambdaHandler = (
  event: APIGatewayProxyEvent,
  context: Context
) => Promise<APIGatewayProxyResult>;

interface RouteMount {
  basePath: string;
  handler: LambdaHandler;
  functionDir: string;
}

const FUNCTIONS_DIR = join(__dirname, "src/functions");

const extractBasePath = (indexFilePath: string): string | null => {
  try {
    const content = readFileSync(indexFilePath, "utf8");
    const match = content.match(/BASE_PATH\s*=\s*["'`]([^"'`]+)["'`]/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

const patchSelfAccessGuard = () => {
  const guardPath = join(FUNCTIONS_DIR, "../guards/AdminAccessGuard.ts");
  const guardMod = require(guardPath);
  const jwtServicePath = join(FUNCTIONS_DIR, "../services/JwtAuthService.ts");
  const JwtSvc = require(jwtServicePath).default;
  const jwt = new JwtSvc();
  const original = guardMod.enforceRequestUserAccess;
  const selfAccessRoutes = [
    "/userImageUrls/user",
    "/weighIns/weights",
    "/steps/",
    "/presets/forms",
  ];
  guardMod.enforceRequestUserAccess = async (event: any, access: any) => {
    try {
      return await original(event, access);
    } catch (err) {
      const path = event?.path || "";
      const matches = selfAccessRoutes.some((r) => path.includes(r));
      if (!matches) throw err;
      const token = (event?.headers?.authorization || "").replace(/^Bearer /i, "");
      const claims = jwt.verifyAccessToken(token) as any;
      const jwtUserId = claims?.userId || claims?.sub;
      const qUserId = event?.queryStringParameters?.userId;
      if (jwtUserId && qUserId && jwtUserId === qUserId) {
        return await original(event, "authenticated");
      }
      throw err;
    }
  };
};

const loadFunctionHandlers = (): RouteMount[] => {
  const dirs = readdirSync(FUNCTIONS_DIR, { withFileTypes: true }).filter((d) =>
    d.isDirectory()
  );
  const mounts: RouteMount[] = [];

  for (const dir of dirs) {
    const indexPath = join(FUNCTIONS_DIR, dir.name, "index.ts");
    const basePath = extractBasePath(indexPath);
    if (!basePath) continue;

    try {
      const mod = require(indexPath);
      const handler: LambdaHandler | undefined = mod.handler;
      if (typeof handler === "function") {
        mounts.push({ basePath, handler, functionDir: dir.name });
      }
    } catch (err: any) {
      console.warn(`⚠️  skipping ${dir.name}: ${err?.message || err}`);
    }
  }

  return mounts;
};

const buildLambdaEvent = (
  req: Request,
  token: string
): APIGatewayProxyEvent => {
  const query = req.query || {};
  const queryStringParameters =
    Object.keys(query).length > 0
      ? Object.fromEntries(
          Object.entries(query).map(([k, v]) => [k, Array.isArray(v) ? String(v[0]) : String(v)])
        )
      : null;

  const incomingAuth = (req.headers.authorization as string | undefined) || undefined;
  const headers: Record<string, string> = {
    "content-type": (req.headers["content-type"] as string) || "application/json",
    authorization: incomingAuth || `Bearer ${token}`,
  };

  return {
    httpMethod: req.method,
    path: req.path,
    body: req.body ? JSON.stringify(req.body) : null,
    headers,
    multiValueHeaders: {},
    queryStringParameters,
    multiValueQueryStringParameters: null,
    pathParameters: (req.params as any) || null,
    stageVariables: null,
    requestContext: {
      requestId: `local-${Date.now()}`,
      accountId: "local",
      apiId: "local",
      authorizer: {},
      httpMethod: req.method,
      identity: {} as any,
      path: req.path,
      protocol: "HTTP/1.1",
      requestTime: new Date().toISOString(),
      requestTimeEpoch: Date.now(),
      resourceId: "local",
      resourcePath: req.path,
      stage: "dev",
    } as any,
    resource: req.path,
    isBase64Encoded: false,
  } as APIGatewayProxyEvent;
};

const buildLambdaContext = (): Context =>
  ({
    callbackWaitsForEmptyEventLoop: false,
    functionName: "local-dev",
    functionVersion: "$LATEST",
    invokedFunctionArn: "arn:local",
    memoryLimitInMB: "128",
    awsRequestId: `local-${Date.now()}`,
    logGroupName: "/local",
    logStreamName: "local",
    getRemainingTimeInMillis: () => 30_000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  } as unknown as Context);

const seedFakeUser = async () => {
  const { User } = await import("./src/models/userModel");
  const existing = await (User as any).findById(FAKE_USER_ID).lean();
  if (!existing) {
    await (User as any).create({
      _id: FAKE_USER_ID,
      firstName: "Local",
      lastName: "Admin",
      email: "local@dev.local",
      phone: "0500000000",
      role: "admin",
      hasAccess: true,
      isDeleted: false,
      accountStatus: "active",
      setInputType: "table",
      profileImage: `local-${FAKE_USER_ID}.jpg`,
      onboardingStep: "completed",
    });
    console.log("✅ seeded fake admin user:", FAKE_USER_ID);
  }

  const Session = (await import("./src/models/sessionModel")).default;
  const existingSession = await (Session as any).findById(FAKE_SESSION_ID).lean();
  if (!existingSession) {
    await (Session as any).create({
      _id: FAKE_SESSION_ID,
      userId: FAKE_USER_ID,
      type: "auth_refresh",
      data: {},
    });
    console.log("✅ seeded fake session:", FAKE_SESSION_ID);
  }

  const { TrainerModel } = await import("./src/models/trainerModel");
  const existingTrainer = await (TrainerModel as any).findById(FAKE_USER_ID).lean();
  if (!existingTrainer) {
    await (TrainerModel as any).create({
      _id: FAKE_USER_ID,
      fullName: "Local Admin",
      email: "local@dev.local",
      phone: "0500000000",
      subscriptionPlan: "Pro",
      clientLimit: 100,
      subTrainerLimit: 10,
      status: "active",
      source: "פה לאוזן",
      videoLibraryAccess: true,
      userId: FAKE_USER_ID,
      blockBackgrounds: [],
    });
    console.log("✅ seeded fake trainer:", FAKE_USER_ID);
  }

  return { _id: FAKE_USER_ID, role: "admin" };
};

const DUMP_DIR = "/tmp/avihu-live-dump";

const loadDump = (name: string): any[] => {
  const path = join(DUMP_DIR, `${name}.json`);
  try {
    const content = readFileSync(path, "utf8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : parsed?.data ?? [];
  } catch {
    return [];
  }
};

const stripSensitiveFields = (doc: any) => {
  const { __v, updatedAt, createdAt, ...rest } = doc || {};
  return rest;
};

const seedCatalog = async () => {
  const muscleGroupsMod = await import("./src/models/muscleGroupModel");
  const exerciseMod = await import("./src/models/exercisePresetModel");
  const methodMod = await import("./src/models/excerciseMethodModel");
  const menuMod = await import("./src/models/menuItemModel");
  const workoutPresetMod = await import("./src/models/workoutPlanPresetModel");
  const dietPresetMod = await import("./src/models/dietPlanPresetModel");

  const exercises = loadDump("presets_exercises");
  const methods = loadDump("presets_exerciseMethods");
  const workoutPresets = loadDump("presets_workoutPlans");
  const dietPresets = loadDump("presets_dietPlans");

  const derivedGroups = new Set<string>();
  for (const ex of exercises) if (ex?.muscleGroup) derivedGroups.add(ex.muscleGroup);
  for (const name of derivedGroups) {
    await ((muscleGroupsMod as any).muscleGroupPresets as any).findOneAndUpdate(
      { name, trainerId: FAKE_USER_ID },
      { name, trainerId: FAKE_USER_ID },
      { upsert: true }
    );
  }

  for (const m of methods) {
    const clean = stripSensitiveFields(m);
    await ((methodMod as any).exerciseMethods as any).findOneAndUpdate(
      { _id: clean._id },
      { ...clean, trainerId: FAKE_USER_ID },
      { upsert: true }
    );
  }

  for (const ex of exercises) {
    const clean = stripSensitiveFields(ex);
    await ((exerciseMod as any).exercisePresets as any).findOneAndUpdate(
      { _id: clean._id },
      { ...clean, trainerId: FAKE_USER_ID },
      { upsert: true }
    );
  }

  for (const wp of workoutPresets) {
    const clean = stripSensitiveFields(wp);
    await ((workoutPresetMod as any).WorkoutPlanPreset as any).findOneAndUpdate(
      { _id: clean._id },
      { ...clean, trainerId: FAKE_USER_ID },
      { upsert: true }
    );
  }

  for (const dp of dietPresets) {
    const clean = stripSensitiveFields(dp);
    try {
      await ((dietPresetMod as any).DietPlanPresetsModel).findOneAndUpdate(
        { _id: clean._id },
        { ...clean, trainerId: FAKE_USER_ID },
        { upsert: true }
      );
    } catch {}
  }

  try {
    const menuRaw = JSON.parse(readFileSync(join(DUMP_DIR, "menuItems.json"), "utf8"));
    const items = menuRaw?.data ?? menuRaw ?? {};
    const flat: any[] = [];
    if (Array.isArray(items)) flat.push(...items);
    else {
      for (const [group, arr] of Object.entries(items)) {
        if (Array.isArray(arr)) {
          for (const it of arr) flat.push({ ...it, foodGroup: group });
        }
      }
    }
    for (const it of flat) {
      const clean = stripSensitiveFields(it);
      await ((menuMod as any).fullMenuItemPresets).findOneAndUpdate(
        { _id: clean._id },
        { ...clean, trainerId: FAKE_USER_ID },
        { upsert: true }
      );
    }
    console.log(
      `✅ seeded catalog: ${derivedGroups.size} groups, ${methods.length} methods, ${exercises.length} exercises, ${flat.length} menu items, ${workoutPresets.length} workout presets, ${dietPresets.length} diet presets`
    );
  } catch (e: any) {
    console.log(
      `✅ seeded catalog: ${derivedGroups.size} groups, ${methods.length} methods, ${exercises.length} exercises, ${workoutPresets.length} workout presets, ${dietPresets.length} diet presets (menu items skipped: ${e?.message})`
    );
  }
};

const seedFakeTrainees = async () => {
  const { User } = await import("./src/models/userModel");
  const trainees = [
    { _id: "6800000000000000000000a1", firstName: "אביהו", lastName: "בושרי", email: "avihu@dev.local", phone: "0500000001" },
    { _id: "6800000000000000000000a2", firstName: "יוסי", lastName: "כהן", email: "yosi@dev.local", phone: "0500000002" },
    { _id: "6800000000000000000000a3", firstName: "מיכל", lastName: "לוי", email: "michal@dev.local", phone: "0500000003" },
  ];
  for (const t of trainees) {
    const existing = await (User as any).findById(t._id).lean();
    if (existing) continue;
    await (User as any).create({
      ...t,
      role: "user",
      hasAccess: true,
      isDeleted: false,
      accountStatus: "active",
      setInputType: "table",
      trainerId: FAKE_USER_ID,
      profileImage: `local-${t._id}.jpg`,
      onboardingStep: "completed",
    });
  }
  console.log(`✅ seeded ${trainees.length} fake trainees`);
};

const generateToken = async (userId: string, role: string): Promise<string> => {
  const { default: JwtAuthService } = await import("./src/services/JwtAuthService");
  const svc = new JwtAuthService();
  const token = await (svc as any).signAccessToken({
    userId,
    role,
    sessionId: FAKE_SESSION_ID,
    trainerId: userId,
  });
  return token;
};

const startMongo = async () => {
  const persistentPath = "/tmp/avihu-local-mongo";
  const { existsSync, mkdirSync } = await import("fs");
  if (!existsSync(persistentPath)) mkdirSync(persistentPath, { recursive: true });
  const mongo = await MongoMemoryServer.create({
    instance: {
      dbName: DB_NAME,
      dbPath: persistentPath,
      storageEngine: "wiredTiger",
      port: 27777,
    },
  });
  const uri = mongo.getUri();
  process.env.MONGO_URI = uri;
  await mongoose.connect(uri, { dbName: DB_NAME, serverSelectionTimeoutMS: 5000 });
  console.log(`✅ mongo up @ ${uri} (db=${DB_NAME}, persistent=${persistentPath})`);
  return mongo;
};

const main = async () => {
  console.log("🚀 booting local dev server…");
  await startMongo();
  const user = await seedFakeUser();
  await seedCatalog();
  await seedFakeTrainees();
  const token = await generateToken(user._id.toString(), user.role);
  console.log(`🔑 auth token (auto-injected into every request): ${token.slice(0, 20)}…`);

  patchSelfAccessGuard();
  const mounts = loadFunctionHandlers();
  console.log(`📦 loaded ${mounts.length} function handlers`);
  for (const m of mounts) {
    console.log(`   ${m.functionDir.padEnd(24)} → ${m.basePath}`);
  }

  const app = express();
  app.use(express.json({ limit: "10mb" }));
  app.use((req, _res, next) => {
    console.log(`→ ${req.method} ${req.path}`);
    next();
  });

  // CORS — for the Admin panel on :3000
  app.use((_req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS,PATCH"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization,x-api-key,x-auth-token"
    );
    if (_req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  const authBypassRoutes = new Set([
    "POST /users/auth/login",
    "POST /users/auth/refresh",
    "POST /users/auth/logout",
  ]);

  const { User } = await import("./src/models/userModel");

  const TRAINEE_ID = "68aae139b7b5b35bc7113d21";

  const buildSessionForUser = async (
    email: string | undefined,
    kind: "login" | "refresh",
    userAgent?: string
  ) => {
    const isMobile = !!userAgent && /(Expo|okhttp|CFNetwork|Darwin\/|Android|iPhone|iOS)/i.test(userAgent);
    let doc: any = null;
    if (email) {
      doc = await (User as any).findOne({ email }).lean();
    }
    if (!doc && isMobile) {
      doc = await (User as any).findById(TRAINEE_ID).lean();
    }
    if (!doc) {
      doc = await (User as any).findById(FAKE_USER_ID).lean();
    }
    const userToken = await generateToken(doc._id.toString(), doc.role);
    return {
      accessToken: userToken,
      refreshToken: userToken,
      sessionId: FAKE_SESSION_ID,
      user: {
        _id: doc._id.toString(),
        firstName: doc.firstName || "User",
        lastName: doc.lastName || "",
        email: doc.email,
        phone: doc.phone,
        role: doc.role,
        hasAccess: doc.hasAccess ?? true,
        setInputType: doc.setInputType || "table",
        profileImage: doc.profileImage || null,
        trainerId: doc.trainerId || FAKE_USER_ID,
        favoriteWorkoutPresetIds: [],
        favoriteDietPresetIds: [],
        sharesFavorites: false,
        onboardingStep: doc.onboardingStep || "completed",
        status: doc.status || "active",
        accountStatus: doc.accountStatus || "active",
        isAdmin: doc.isAdmin ?? doc.role === "admin",
        isSuperAdmin: doc.isSuperAdmin ?? false,
        isTrainer: doc.isTrainer ?? false,
        dietPlanVersion: doc.dietPlanVersion ?? 1,
      },
      kind,
    };
  };

  const routeHandler = async (req: Request, res: Response) => {
    const bypassKey = `${req.method} ${req.path}`;
    if (authBypassRoutes.has(bypassKey)) {
      if (req.path.endsWith("/logout")) return res.status(200).json({ ok: true });
      const email = req.body?.email;
      const session = await buildSessionForUser(
        email,
        req.path.endsWith("/refresh") ? "refresh" : "login",
        req.headers["user-agent"] as string | undefined
      );
      return res.status(200).json(session);
    }
    const requestPath = req.path;
    const mount = mounts.find(
      (m) =>
        requestPath === m.basePath ||
        requestPath.startsWith(m.basePath + "/") ||
        requestPath === m.basePath + "/"
    );

    if (!mount) {
      return res.status(404).json({ message: `No handler for ${requestPath}` });
    }

    try {
      const event = buildLambdaEvent(req, token);
      const context = buildLambdaContext();
      const result = await mount.handler(event, context);

      Object.entries(result.headers || {}).forEach(([k, v]) => {
        if (typeof v === "string" || typeof v === "number") {
          res.setHeader(k, String(v));
        }
      });

      const body = result.body ? JSON.parse(result.body) : undefined;
      res.status(result.statusCode).json(body);
    } catch (err: any) {
      console.error("💥 handler crashed:", err);
      res.status(500).json({ message: err?.message || "Internal server error" });
    }
  };

  const S3_DIR = "/tmp/avihu-local-s3";
  mkdirSync(S3_DIR, { recursive: true });
  const S3_HOST = process.env.LOCAL_S3_HOST || "10.100.102.2";
  const S3_BASE = `http://${S3_HOST}:${PORT}/__local_s3`;
  const MIME: Record<string, string> = {
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
    ".gif": "image/gif", ".webp": "image/webp", ".heic": "image/heic",
  };

  const signedUrlMock = (req: Request, res: Response) => {
    const q = req.query || {};
    const userId = String(q.userId || "");
    const date = String(q.date || "today");
    const imageName = String(q.imageName || "");
    const folderName = String(q.folderName || "images");
    if (!userId || !imageName) {
      return res.status(400).json({ message: "userId and imageName required" });
    }
    const key = `${folderName}/${userId}/${date}/${imageName}`;
    const url = `${S3_BASE}/${key}`;
    console.log(`🔗 signedUrl → ${url}`);
    return res.status(200).json({ data: url });
  };
  app.post(/^\/+signedUrl\/?$/, signedUrlMock);
  app.get(/^\/+signedUrl\/?$/, signedUrlMock);

  app.delete("/s3/photos/one", async (req, res) => {
    try {
      const { userId, photoId, imageUrl } = req.body || {};
      if (!photoId) return res.status(400).json({ message: "Missing photoId" });
      const localPath = join(S3_DIR, String(photoId));
      try { require("fs").unlinkSync(localPath); } catch {}
      if (userId && imageUrl) {
        const { UserImageUrlsModel } = require("./src/models/urlModel");
        const doc = await UserImageUrlsModel.findOneAndUpdate(
          { userId },
          { $pull: { imageUrls: imageUrl } },
          { new: true, lean: true }
        );
        console.log(`🗑️  local-s3 DELETE ${photoId}`);
        return res.status(200).json({ data: doc?.imageUrls || [] });
      }
      return res.status(200).json({ data: [] });
    } catch (err: any) {
      console.error("local-s3 DELETE failed:", err);
      return res.status(500).json({ message: err?.message || "delete failed" });
    }
  });

  app.get("/agreements/current", async (_req, res) => {
    try {
      const PROD_API = "https://11c0iu2i43.execute-api.il-central-1.amazonaws.com/test";
      const prodTokenPath = "/tmp/prod-snapshot/_token.txt";
      const prodToken = readFileSync(prodTokenPath, "utf8").trim();
      const r = await fetch(`${PROD_API}/agreements/current`, {
        headers: {
          Authorization: `Bearer ${prodToken}`,
          "X-Api-Key": "GgenNYxdpD8gwDpn66MeP1u8O80lTfzw254BdeuQ",
        },
      });
      const body = await r.json();
      return res.status(r.status).json(body);
    } catch (err: any) {
      console.error("agreements/current proxy failed:", err?.message);
      return res.status(500).json({ message: "proxy failed" });
    }
  });

  app.put("/__local_s3/*", express.raw({ type: () => true, limit: "20mb" }), (req, res) => {
    const key = req.path.replace(/^\/__local_s3\//, "");
    const filePath = join(S3_DIR, key);
    mkdirSync(dirname(filePath), { recursive: true });
    const body = req.body as Buffer;
    writeFileSync(filePath, body);
    console.log(`💾 s3 PUT ${key} (${body?.length ?? 0} bytes)`);
    return res.status(200).send("OK");
  });

  app.get("/__local_s3/*", (req, res) => {
    const key = req.path.replace(/^\/__local_s3\//, "");
    const filePath = join(S3_DIR, key);
    if (!existsSync(filePath)) return res.status(404).send("not found");
    const ct = MIME[extname(filePath).toLowerCase()] || "application/octet-stream";
    res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "no-cache");
    createReadStream(filePath).pipe(res);
  });

  app.all("*", routeHandler);

  app.listen(PORT, () => {
    console.log(`\n🎉 local server on http://localhost:${PORT}`);
    console.log(`   point admin: VITE_SERVER="http://localhost:${PORT}/api"\n`);
  });
};

main().catch((err) => {
  console.error("failed to boot:", err);
  process.exit(1);
});
