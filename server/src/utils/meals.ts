import { ISession } from "../models/sessionModel";

export const removeExpiredMeals = (session: ISession) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);

  const data = (session.data ?? {}) as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(data)) {
    const keyDate = new Date(key);

    if (keyDate >= twoDaysAgo && keyDate <= today) {
      result[key] = data[key];
    }
  }

  return result;
};
