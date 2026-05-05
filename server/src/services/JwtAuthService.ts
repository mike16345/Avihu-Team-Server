import crypto from "crypto";
import { StatusCode } from "../enums/StatusCode";
import { SessionRepository } from "../repositories/Sessions/SessionRepository";
import UserRepository from "../repositories/User/UserRepository";
import { IUser } from "../interfaces/IUser";

const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_EXPIRES_IN_MS = Number(
  process.env.JWT_REFRESH_EXPIRES_IN_MS || 1000 * 60 * 60 * 24 * 30
);
interface AccessClaims {
  userId: string;
  role: IUser["role"];
  sessionId?: string;
  exp?: number;
}

class JwtAuthService {
  private sessionRepository = new SessionRepository();
  private userRepository = new UserRepository();
  private getAccessSecret() {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret)
      throw { message: "Missing JWT access secret", statusCode: StatusCode.INTERNAL_SERVER_ERROR };
    return secret;
  }
  private parseExpiresIn(value: string) {
    if (value.endsWith("m")) return Number(value.slice(0, -1)) * 60;
    if (value.endsWith("h")) return Number(value.slice(0, -1)) * 3600;
    if (value.endsWith("d")) return Number(value.slice(0, -1)) * 86400;
    return Number(value);
  }
  signAccessToken(claims: AccessClaims) {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const exp = Math.floor(Date.now() / 1000) + this.parseExpiresIn(ACCESS_EXPIRES_IN);
    const payload = Buffer.from(JSON.stringify({ ...claims, exp })).toString("base64url");
    const sig = crypto
      .createHmac("sha256", this.getAccessSecret())
      .update(`${header}.${payload}`)
      .digest("base64url");
    return `${header}.${payload}.${sig}`;
  }
  verifyAccessToken(token: string) {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Malformed token");
    const [header, payload, signature] = parts;
    const expected = crypto
      .createHmac("sha256", this.getAccessSecret())
      .update(`${header}.${payload}`)
      .digest("base64url");
    if (expected !== signature) throw new Error("Invalid token");
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) throw new Error("Expired token");
    return parsed as AccessClaims;
  }
  hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
  async createRefreshSession(user: IUser, metadata: { ip?: string; device?: string } = {}) {
    const rawToken = crypto.randomBytes(48).toString("hex");
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_IN_MS);
    const session = await this.sessionRepository.create({
      userId: user._id.toString(),
      type: "auth_refresh",
      data: { tokenHash, ip: metadata.ip, device: metadata.device, expiresAt, revokedAt: null },
    } as any);
    return { refreshToken: rawToken, session };
  }
  async validateRefreshToken(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const session = await this.sessionRepository.findOne({
      query: { type: "auth_refresh", "data.tokenHash": tokenHash } as any,
    });
    if (!session) throw { message: "Invalid refresh token", statusCode: StatusCode.UNAUTHORIZED };
    if (session.data?.revokedAt)
      throw { message: "Refresh token revoked", statusCode: StatusCode.UNAUTHORIZED };
    if (!session.data?.expiresAt || new Date(session.data.expiresAt).getTime() <= Date.now())
      throw { message: "Refresh token expired", statusCode: StatusCode.UNAUTHORIZED };
    const user = await this.userRepository.findById(session.userId);
    if (!user) throw { message: "User not found", statusCode: StatusCode.UNAUTHORIZED };
    if (!user.hasAccess) throw { message: "User inactive", statusCode: StatusCode.FORBIDDEN };
    return { session, user };
  }
  async revokeRefreshToken(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const session = await this.sessionRepository.findOne({
      query: { type: "auth_refresh", "data.tokenHash": tokenHash } as any,
    });
    if (!session) return;
    await this.sessionRepository.updateById(session._id!.toString(), {
      update: { data: { ...session.data, revokedAt: new Date() }, updatedAt: new Date() } as any,
      options: { new: true },
    });
  }
}

export default JwtAuthService;
