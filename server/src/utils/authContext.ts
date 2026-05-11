import { AsyncLocalStorage } from "node:async_hooks";
import { StatusCode } from "../enums/StatusCode";

export type AuthContext = {
  userId?: string;
  trainerId?: string;
  role?: string;
};

const authContextStorage = new AsyncLocalStorage<AuthContext>();

export const runWithAuthContext = async <T>(
  authContext: AuthContext,
  callback: () => Promise<T>
): Promise<T> => authContextStorage.run(authContext, callback);

export const getAuthContext = (): AuthContext | undefined => authContextStorage.getStore();

export const requireAuthContext = (): AuthContext => {
  const authContext = getAuthContext();

  if (!authContext) {
    throw {
      statusCode: StatusCode.UNAUTHORIZED,
      message: "Auth context missing",
    };
  }

  return authContext;
};

export const updateAuthContext = (partialAuthContext: AuthContext): AuthContext => {
  const currentContext = getAuthContext() ?? {};
  const nextContext = { ...currentContext, ...partialAuthContext };

  authContextStorage.enterWith(nextContext);

  return nextContext;
};

export const requireTrainerAuthContext = (): AuthContext & { trainerId: string } => {
  const authContext = requireAuthContext();
  const isAdmin = authContext.role === "admin";

  console.log("Current auth userId in requireTrainerAuthContext:", authContext.userId);
  console.log("Current auth trainerId in requireTrainerAuthContext:", authContext.trainerId);
  console.log("Current auth role in requireTrainerAuthContext:", authContext.role);

  if (isAdmin && !authContext.trainerId) {
    const updatedContext = { ...authContext, trainerId: authContext.userId };
    authContextStorage.enterWith(updatedContext);

    return updatedContext as AuthContext & { trainerId: string };
  }

  if (!authContext.trainerId) {
    throw {
      statusCode: StatusCode.UNAUTHORIZED,
      message: "Trainer auth context missing",
    };
  }

  return authContext as AuthContext & { trainerId: string };
};
