import RagRateLimitModel, { IRagRateLimit } from "../../models/ragRateLimitModel";
import { BaseRepository } from "../BaseRepository";

export class RagRateLimitRepository extends BaseRepository<IRagRateLimit> {
  constructor() {
    super(RagRateLimitModel);
  }
}
