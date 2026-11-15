import { combineReducers, configureStore } from "@reduxjs/toolkit";
import session from "./sessionSlice";
import merchants from "./merchantsSlice";
import transactions from "./transactionsSlice";
import dashboard from "./dashboardSlice";

export const rootReducer = combineReducers({ session, merchants, transactions, dashboard });
export type RootState = ReturnType<typeof rootReducer>;

/** One store per app instance (and per test) — never a module-level singleton, for SSR safety. */
export function makeStore(preloadedState?: Partial<RootState>) {
  return configureStore({ reducer: rootReducer, ...(preloadedState ? { preloadedState } : {}) });
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];
