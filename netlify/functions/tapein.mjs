import { createHash } from "node:crypto";
import { connectLambda, getStore } from "@netlify/blobs";

const TZ = "America/Chicago";
const MAX_VISITS = 400;
const MAX_PHOTO = 350_000;

function hashPassword(password) {
  return createHash("sha256").update(String(password)).digest("hex");
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function chicagoDate(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function weekStartMonday(d = new Date()) {
  const ymd = chicagoDate(d);
  const [y, m, day] = ymd.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, day, 12));
  const dow = utc.getUTCDay();
  utc.setUTCDate(utc.getUTCDate() + (dow === 0 ? -6 : 1 - dow));
  return utc.toISOString().slice(0, 10);
}

function publicState(state) {
  return {
    users: (state.users || []).map((u) => ({ id: u.id, name: u.name })),
    visits: state.visits || [],
  };
}

async function load(store) {
  const data = await store.get("state", { type: "json" });
  if (!data || typeof data !== "object") return { users: [], visits: [] };
  return {
    users: Array.isArray(data.users) ? data.users : [],
    visits: Array.isArray(data.visits) ? data.visits : [],
  };
}

function applyOp(state, body) {
  const op = body?.op;
  if (op === "signup") {
    const name = String(body.name || "").trim();
    const password = String(body.password || "");
    if (name.length < 2) return { error: "Enter your name." };
    if (password.length < 4) return { error: "Password must be at least 4 characters." };
    if (state.users.some((u) => u.name.toLowerCase() === name.toLowerCase())) {
      return { error: "That name is already taken." };
    }
    const user = { id: uid(), name, passwordHash: hashPassword(password) };
    state.users.push(user);
    return { state, sessionId: user.id };
  }
  if (op === "signin") {
    const name = String(body.name || "").trim();
    const password = String(body.password || "");
    const user = state.users.find((u) => u.name.toLowerCase() === name.toLowerCase());
    if (!user || user.passwordHash !== hashPassword(password)) {
      return { error: "Name or password is wrong." };
    }
    return { state, sessionId: user.id };
  }
  if (op === "checkin") {
    const user = state.users.find((u) => u.id === body.userId);
    if (!user) return { error: "Sign in again." };
    const note = String(body.note || "").trim().slice(0, 280);
    const photo = body.photo ? String(body.photo) : "";
    if (photo && (photo.length > MAX_PHOTO || !photo.startsWith("data:image/"))) {
      return { error: "That photo is too large or not supported." };
    }
    state.visits.unshift({
      id: uid(),
      userId: user.id,
      name: user.name,
      note,
      photo: photo || null,
      createdAt: new Date().toISOString(),
      weekStart: weekStartMonday(),
      yes: [],
      no: [],
      status: "pending",
    });
    if (state.visits.length > MAX_VISITS) state.visits.length = MAX_VISITS;
    return { state, sessionId: user.id };
  }
  if (op === "vote") {
    const user = state.users.find((u) => u.id === body.userId);
    const visit = state.visits.find((v) => v.id === body.visitId);
    const choice = body.choice === "no" ? "no" : body.choice === "yes" ? "yes" : null;
    if (!user) return { error: "Sign in again." };
    if (!visit) return { error: "Visit not found." };
    if (!choice) return { error: "Choose yes or no." };
    if (visit.userId === user.id) return { error: "You can't confirm your own visit." };
    if (visit.yes.includes(user.id) || visit.no.includes(user.id)) {
      return { error: "You already confirmed this visit." };
    }
    visit[choice].push(user.id);
    if (visit.yes.length >= 2) visit.status = "approved";
    return { state, sessionId: user.id, approved: visit.status === "approved", yesCount: visit.yes.length, choice };
  }
  return { error: "Unknown action." };
}

const cors = {
  "content-type": "application/json",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type",
};

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors };
  }

  let store;
  try {
    try {
      connectLambda(event);
    } catch {
      // already configured (non-Lambda runtime)
    }
    store = getStore({ name: "atr-tracker", consistency: "strong" });
  } catch (err) {
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({
        error: "Shared board is starting up. Wait a minute, refresh, then try again.",
      }),
    };
  }

  try {
    if (event.httpMethod === "GET") {
      const state = await load(store);
      return { statusCode: 200, headers: cors, body: JSON.stringify(publicState(state)) };
    }
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, headers: cors, body: JSON.stringify({ error: "Method not allowed." }) };
    }
    const body = JSON.parse(event.body || "{}");
    const state = await load(store);
    const result = applyOp(state, body);
    if (result.error) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: result.error }) };
    }
    await store.setJSON("state", result.state);
    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({
        ...publicState(result.state),
        sessionId: result.sessionId || null,
        approved: result.approved || false,
        yesCount: result.yesCount || 0,
        choice: result.choice || null,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: err instanceof Error ? err.message : "Could not update the board." }),
    };
  }
}
