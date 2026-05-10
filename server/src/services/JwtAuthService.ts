import crypto from "crypto";
import { StatusCode } from "../enums/StatusCode";
import { IRefreshSessionData, ISession } from "../models/sessionModel";
import { SessionRepository } from "../repositories/Sessions/SessionRepository";
import UserRepository from "../repositories/User/UserRepository";
import { IUser } from "../interfaces/IUser";

const REFRESH_EXPIRES_IN_MS = Number(
  process.env.JWT_REFRESH_EXPIRES_IN_MS || 1000 * 60 * 60 * 24 * 30
);

export interface AccessClaims {
  userId: string;
  role: IUser["role"];
  sessionId: string;
  exp?: number;
  sub?: string;
  _id?: string;
  type?: string;
}

class JwtAuthService {
  private sessionRepository = new SessionRepository();
  private userRepository = new UserRepository();

  private unauthorizedError() {
    return { message: "Unauthorized", statusCode: StatusCode.UNAUTHORIZED };
  }

  private getAccessSecret() {
    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret || secret.length < 32) {
      throw { message: "Invalid JWT access secret", statusCode: StatusCode.INTERNAL_SERVER_ERROR };
    }
    return secret;
  }

  private getAccessExpiresIn() {
    return process.env.JWT_ACCESS_EXPIRES_IN || "15m";
  }

  private parseExpiresIn(value: string) {
    const match = /^(\d+)([mhd]?)$/.exec(value.trim());
    if (!match) {
      throw {
        message: "Invalid JWT_ACCESS_EXPIRES_IN value",
        statusCode: StatusCode.INTERNAL_SERVER_ERROR,
      };
    }
    const amount = Number(match[1]);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw {
        message: "Invalid JWT_ACCESS_EXPIRES_IN value",
        statusCode: StatusCode.INTERNAL_SERVER_ERROR,
      };
    }
    const unit = match[2] || "s";
    return unit === "m"
      ? amount * 60
      : unit === "h"
        ? amount * 3600
        : unit === "d"
          ? amount * 86400
          : amount;
  }

  signAccessToken(claims: AccessClaims) {
    if (!claims.sessionId) {
      throw {
        message: "Missing sessionId in claims",
        statusCode: StatusCode.INTERNAL_SERVER_ERROR,
      };
    }
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const exp = Math.floor(Date.now() / 1000) + this.parseExpiresIn(this.getAccessExpiresIn());
    const payload = Buffer.from(JSON.stringify({ ...claims, exp })).toString("base64url");
    const sig = crypto
      .createHmac("sha256", this.getAccessSecret())
      .update(`${header}.${payload}`)
      .digest("base64url");
    return `${header}.${payload}.${sig}`;
  }

  verifyAccessToken(token: string) {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) throw new Error("Malformed token");
      const [headerPart, payloadPart, signaturePart] = parts;

      let header: { alg?: string; typ?: string };
      let payload: AccessClaims;
      try {
        header = JSON.parse(Buffer.from(headerPart, "base64url").toString("utf8"));
        payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8"));
      } catch {
        throw new Error("Malformed token");
      }

      if (header.alg !== "HS256" || header.typ !== "JWT") throw new Error("Invalid header");

      const expectedSig = crypto
        .createHmac("sha256", this.getAccessSecret())
        .update(`${headerPart}.${payloadPart}`)
        .digest();
      const providedSig = Buffer.from(signaturePart, "base64url");
      if (
        expectedSig.length !== providedSig.length ||
        !crypto.timingSafeEqual(expectedSig, providedSig)
      ) {
        throw new Error("Invalid signature");
      }

      if (
        !payload.exp ||
        payload.exp <= Math.floor(Date.now() / 1000) ||
        !payload.sessionId ||
        (!payload.sub && !payload.userId && !payload._id) ||
        (payload.type && payload.type !== "access")
      ) {
        throw new Error("Invalid payload");
      }

      return payload;
    } catch {
      throw this.unauthorizedError();
    }
  }

  hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  async createRefreshSession(user: IUser, metadata: { ip?: string; device?: string } = {}) {
    const rawToken = crypto.randomBytes(48).toString("hex");
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_IN_MS);
    const refreshData: IRefreshSessionData = {
      tokenHash,
      ip: metadata.ip,
      device: metadata.device,
      expiresAt,
      revokedAt: null,
    };

    const now = new Date();
    const session = await this.sessionRepository.create({
      userId: String(user._id),
      type: "auth_refresh",
      data: refreshData,
      createdAt: now,
      updatedAt: now,
    });

    return { refreshToken: rawToken, session };
  }

  async validateRefreshToken(refreshToken: string): Promise<{ session: ISession; user: IUser }> {
    const tokenHash = this.hashToken(refreshToken);
    const session = await this.sessionRepository.findRefreshSessionByHash(tokenHash);
    if (!session) throw this.unauthorizedError();

    const refreshData = session.data as IRefreshSessionData | undefined;
    if (refreshData?.revokedAt) throw this.unauthorizedError();
    if (!refreshData?.expiresAt || new Date(refreshData.expiresAt).getTime() <= Date.now()) {
      throw this.unauthorizedError();
    }
    if (!session.userId || typeof session.userId !== "string") throw this.unauthorizedError();

    const user = await this.userRepository.findById(session.userId);
    if (!user || !user.hasAccess) throw this.unauthorizedError();

    return { session, user };
  }

  async revokeRefreshToken(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const session = await this.sessionRepository.findRefreshSessionByHash(tokenHash);
    if (!session) return;
    await this.sessionRepository.revokeRefreshSession(session);
  }

  async rotateRefreshToken(refreshToken: string) {
    const { session, user } = await this.validateRefreshToken(refreshToken);
    await this.sessionRepository.revokeRefreshSession(session);
    const { refreshToken: newRefreshToken, session: newSession } =
      await this.createRefreshSession(user);
    return { refreshToken: newRefreshToken, session: newSession, user };
  }
}

export default JwtAuthService;
