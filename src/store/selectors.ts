import { useEffect } from "react";
import { findUser } from "@/domain/users";
import type { RootState } from "./index";
import { useAppDispatch, useAppSelector } from "./hooks";
import { fetchMerchants } from "./merchantsSlice";
import { fetchTransactions } from "./transactionsSlice";

export const selectCurrentUser = (s: RootState) => findUser(s.session.userId);

export function useSession() {
  const session = useAppSelector((s) => s.session);
  return { ...session, user: findUser(session.userId) };
}

export function useMerchants() {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.merchants);
  useEffect(() => {
    if (state.status === "idle") dispatch(fetchMerchants());
  }, [state.status, dispatch]);
  return { ...state, retry: () => void dispatch(fetchMerchants()) };
}

export function useTransactions() {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.transactions);
  useEffect(() => {
    if (state.status === "idle") dispatch(fetchTransactions());
  }, [state.status, dispatch]);
  return { ...state, retry: () => void dispatch(fetchTransactions()) };
}
