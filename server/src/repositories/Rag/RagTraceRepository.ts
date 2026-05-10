import RagTraceModel, { IRagTrace } from "../../models/ragTraceModel";
import { BaseRepository } from "../BaseRepository";

export class RagTraceRepository extends BaseRepository<IRagTrace> {
  constructor() {
    super(RagTraceModel, { type: "global" });
  }
}
