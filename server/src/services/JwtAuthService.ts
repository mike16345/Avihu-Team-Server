import crypto from "crypto";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
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
  trainerId?: string;
  role: IUser["role"];
  sessionId: string;
  exp?: number;
  sub?: string;
  _id?: string;
  type?: string;
}

type VerifiedAccessPayload = JwtPayload & Partial<AccessClaims>;

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

  private invalidAccessExpiresInError() {
    return {
      message: "Invalid JWT_ACCESS_EXPIRES_IN value",
      statusCode: StatusCode.INTERNAL_SERVER_ERROR,
    };
  }

  private getAccessTokenExpiresIn(): NonNullable<SignOptions["expiresIn"]> {
    const value = this.getAccessExpiresIn().trim();

    if (!value) {
      throw this.invalidAccessExpiresInError();
    }

    if (/^\d+$/.test(value)) {
      const seconds = Number(value);

      if (!Number.isFinite(seconds) || seconds <= 0) {
        throw this.invalidAccessExpiresInError();
      }

      return seconds;
    }

    return value as NonNullable<SignOptions["expiresIn"]>;
  }

  private isAccessPayload(payload: JwtPayload | string): payload is VerifiedAccessPayload {
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
      return false;
    }

    const identity = payload.sub || payload.userId || payload._id;

    if (
      typeof payload.exp !== "number" ||
      typeof payload.sessionId !== "string" ||
      !payload.sessionId ||
      !identity ||
      (payload.type && payload.type !== "access")
    ) {
      return false;
    }

    return true;
  }

  signAccessToken(claims: AccessClaims) {
    if (!claims.sessionId) {
      throw {
        message: "Missing sessionId in claims",
        statusCode: StatusCode.INTERNAL_SERVER_ERROR,
      };
    }

    const { exp: _ignoredExp, ...payloadClaims } = claims;
    const secret = this.getAccessSecret();
    const expiresIn = this.getAccessTokenExpiresIn();

    try {
      return jwt.sign(payloadClaims, secret, {
        algorithm: "HS256",
        expiresIn,
        noTimestamp: true,
      });
    } catch {
      throw this.invalidAccessExpiresInError();
    }
  }

  verifyAccessToken(token: string) {
    try {
      const payload = jwt.verify(token, this.getAccessSecret(), {
        algorithms: ["HS256"],
      });

      if (!this.isAccessPayload(payload)) {
        throw new Error("Invalid payload");
      }

      return payload as AccessClaims;
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

    const user = (await this.userRepository.findById(session.userId)) as unknown as IUser | null;
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
