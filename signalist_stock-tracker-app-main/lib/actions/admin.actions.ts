'use server';

import { auth } from "@/lib/better-auth/auth";
import { ADMIN_EMAIL, ADMIN_PASSWORD, isAdminEmail } from "@/lib/admin";
import { connectToDatabase } from "@/database/mongoose";
import { headers } from "next/headers";

export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  country?: string;
  investmentGoals?: string;
  riskTolerance?: string;
  preferredIndustry?: string;
  createdAt?: string;
};

export type AdminActiveSessionRow = {
  userId: string;
  email?: string;
  name?: string;
  lastLoginAt?: string;
  sessionCount: number;
};

const requireAdmin = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!isAdminEmail(session?.user?.email)) {
    throw new Error("Forbidden");
  }
  return session;
};

const getDb = async () => {
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection not found");
  return db;
};

const findFirstExistingCollection = async (candidates: string[]) => {
  const db = await getDb();
  const existing = await db.listCollections({}, { nameOnly: true }).toArray();
  const names = new Set(existing.map((c) => c.name));
  return candidates.find((c) => names.has(c)) ?? null;
};

export const adminListUsers = async (): Promise<AdminUserRow[]> => {
  await requireAdmin();
  const db = await getDb();

  const users = await db
    .collection("user")
    .find(
      {},
      {
        projection: {
          _id: 1,
          id: 1,
          email: 1,
          name: 1,
          country: 1,
          investmentGoals: 1,
          riskTolerance: 1,
          preferredIndustry: 1,
          createdAt: 1,
        },
      }
    )
    .sort({ createdAt: -1 })
    .toArray();

  return users
    .filter((u) => u.email && u.name)
    .map((u) => ({
      id: (u.id || u._id?.toString() || "").toString(),
      email: String(u.email),
      name: String(u.name),
      country: u.country ? String(u.country) : undefined,
      investmentGoals: u.investmentGoals ? String(u.investmentGoals) : undefined,
      riskTolerance: u.riskTolerance ? String(u.riskTolerance) : undefined,
      preferredIndustry: u.preferredIndustry ? String(u.preferredIndustry) : undefined,
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : undefined,
    }));
};

export const adminGetActiveSessions = async (): Promise<AdminActiveSessionRow[]> => {
  await requireAdmin();
  const db = await getDb();

  const sessionsCollection =
    (await findFirstExistingCollection(["session", "sessions"])) ?? "session";

  const hasSessions = await db
    .listCollections({ name: sessionsCollection }, { nameOnly: true })
    .hasNext();

  if (!hasSessions) return [];

  const sessions = await db
    .collection(sessionsCollection)
    .find(
      {},
      { projection: { userId: 1, user: 1, user_id: 1, expiresAt: 1, createdAt: 1, updatedAt: 1 } }
    )
    .toArray();

  const now = Date.now();
  const getSessionUserId = (s: unknown) => {
    const doc = s as { userId?: unknown; user?: unknown; user_id?: unknown };
    return doc?.userId ?? doc?.user ?? doc?.user_id;
  };

  const activeSessions = sessions.filter((s) => {
    const uid = getSessionUserId(s);
    if (!uid) return false;
    if (!s?.expiresAt) return true;
    const exp = new Date(s.expiresAt).getTime();
    return Number.isFinite(exp) ? exp > now : true;
  });

  if (activeSessions.length === 0) return [];

  // Aggregate by userId: count sessions and find latest login
  const byUserId = new Map<
    string,
    { count: number; latestLogin: number | null }
  >();
  for (const s of activeSessions) {
    const userId = String(getSessionUserId(s)!);
    const loginDate = s.createdAt ?? s.updatedAt;
    const loginTime = loginDate ? new Date(loginDate).getTime() : null;
    const existing = byUserId.get(userId);
    if (!existing) {
      byUserId.set(userId, {
        count: 1,
        latestLogin: loginTime,
      });
    } else {
      existing.count += 1;
      if (loginTime && (existing.latestLogin === null || loginTime > existing.latestLogin)) {
        existing.latestLogin = loginTime;
      }
    }
  }

  const userIds = [...byUserId.keys()];

  const { ObjectId } = await import("mongodb");
  const idsAsObjectIds = userIds
    .filter((id) => /^[a-fA-F0-9]{24}$/.test(id))
    .map((id) => new ObjectId(id));

  const userCollection =
    (await findFirstExistingCollection(["user", "users"])) ?? "user";

  const userQuery =
    idsAsObjectIds.length > 0
      ? { $or: [{ id: { $in: userIds } }, { _id: { $in: idsAsObjectIds } }] }
      : { id: { $in: userIds } };

  const users = await db
    .collection(userCollection)
    .find(userQuery, { projection: { id: 1, _id: 1, email: 1, name: 1 } })
    .toArray();

  const byId = new Map<string, { email?: string; name?: string }>();
  users.forEach((u) => {
    const entry = { email: u.email ? String(u.email) : undefined, name: u.name ? String(u.name) : undefined };
    byId.set(String(u.id ?? u._id), entry);
    if (u._id) byId.set(String(u._id), entry);
  });

  return userIds
    .map((userId) => {
      const agg = byUserId.get(userId)!;
      const u = byId.get(userId);
      return {
        userId,
        email: u?.email,
        name: u?.name,
        lastLoginAt: agg.latestLogin ? new Date(agg.latestLogin).toISOString() : undefined,
        sessionCount: agg.count,
      };
    })
    .sort((a, b) => (b.sessionCount - a.sessionCount) || ((b.lastLoginAt ?? "").localeCompare(a.lastLoginAt ?? "")));
};

export const adminCreateUser = async (input: {
  email: string;
  password: string;
  name: string;
  country: string;
  investmentGoals: string;
  riskTolerance: string;
  preferredIndustry: string;
}) => {
  await requireAdmin();
  const db = await getDb();

  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const password = input.password;
  const country = input.country;
  const investmentGoals = input.investmentGoals;
  const riskTolerance = input.riskTolerance;
  const preferredIndustry = input.preferredIndustry;

  if (!email || !name || !password) throw new Error("Missing fields");
  if (isAdminEmail(email)) throw new Error("Cannot create another admin user");

  // This will set auth cookies for the newly created user due to nextCookies plugin + autoSignIn.
  // Immediately restore the admin session afterwards.
  await auth.api.signUpEmail({ body: { email, password, name } });

  await db.collection("user").updateOne(
    { email },
    { $set: { country, investmentGoals, riskTolerance, preferredIndustry } }
  );

  await auth.api.signInEmail({ body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });

  return { success: true };
};

export const adminUpdateUser = async (input: {
  id: string;
  email: string;
  name: string;
  country?: string;
  investmentGoals?: string;
  riskTolerance?: string;
  preferredIndustry?: string;
}) => {
  await requireAdmin();
  const db = await getDb();

  const id = input.id.trim();
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();

  if (!id || !email || !name) throw new Error("Missing fields");
  if (isAdminEmail(email)) throw new Error("Reserved email");

  const { ObjectId } = await import("mongodb");
  const isObjectId = /^[a-fA-F0-9]{24}$/.test(id);
  const filter = isObjectId
    ? { $or: [{ id }, { _id: new ObjectId(id) }] }
    : { id };

  const result = await db.collection("user").updateOne(filter, {
    $set: {
      email,
      name,
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(input.investmentGoals !== undefined ? { investmentGoals: input.investmentGoals } : {}),
      ...(input.riskTolerance !== undefined ? { riskTolerance: input.riskTolerance } : {}),
      ...(input.preferredIndustry !== undefined ? { preferredIndustry: input.preferredIndustry } : {}),
    },
  });

  if (result.matchedCount === 0) throw new Error("User not found");
  return { success: true };
};

export const adminRemoveUserSessions = async (input: { userId: string }) => {
  await requireAdmin();
  const db = await getDb();
  const userId = input.userId.trim();
  if (!userId) throw new Error("Missing userId");

  const sessionsCollection =
    (await findFirstExistingCollection(["session", "sessions"])) ?? "session";

  const hasSessions = await db
    .listCollections({ name: sessionsCollection }, { nameOnly: true })
    .hasNext();

  if (!hasSessions) return { deletedCount: 0 };

  const { ObjectId } = await import("mongodb");
  const isObjectId = /^[a-fA-F0-9]{24}$/.test(userId);
  const orConditions: Record<string, unknown>[] = [
    { userId },
    { user: userId },
    { user_id: userId },
  ];
  if (isObjectId) {
    const oid = new ObjectId(userId);
    orConditions.push({ userId: oid }, { user: oid }, { user_id: oid });
  }
  const filter = { $or: orConditions };

  const result = await db.collection(sessionsCollection).deleteMany(filter);
  return { deletedCount: result.deletedCount };
};

export const adminDeleteUser = async (input: { id: string }) => {
  await requireAdmin();
  const db = await getDb();
  const id = input.id.trim();
  if (!id) throw new Error("Missing id");

  const { ObjectId } = await import("mongodb");
  const isObjectId = /^[a-fA-F0-9]{24}$/.test(id);
  const filter = isObjectId
    ? { $or: [{ id }, { _id: new ObjectId(id) }] }
    : { id };

  const deleteResult = await db.collection("user").deleteOne(filter);
  if (deleteResult.deletedCount === 0) throw new Error("User not found");

  // Best-effort cleanup for related Better Auth collections, if present.
  const cleanupCollections = ["account", "accounts", "session", "sessions", "verification", "verifications"];
  const existing = await db.listCollections({}, { nameOnly: true }).toArray();
  const names = new Set(existing.map((c) => c.name));

  await Promise.all(
    cleanupCollections
      .filter((c) => names.has(c))
      .map((c) =>
        db
          .collection(c)
          .deleteMany({ $or: [{ userId: id }, { user: id }, { user_id: id }, { id }] } as any)
      )
  );

  return { success: true };
};

