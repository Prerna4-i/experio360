import { createSlice } from "@reduxjs/toolkit";
import type { Transaction } from "@/domain/types";
import { mockApi } from "@/mock/api";
import { createAppAsyncThunk, errorMessage } from "./hooks";
import type { LoadStatus } from "./merchantsSlice";

export interface TransactionsState {
  items: Transaction[];
  status: LoadStatus;
  error: string | null;
}

const initialState: TransactionsState = { items: [], status: "idle", error: null };

export const fetchTransactions = createAppAsyncThunk(
  "transactions/fetch",
  async (_: void, { getState, rejectWithValue }) => {
    try {
      return await mockApi.listTransactions(getState().session.networkMode);
    } catch (e) {
      return rejectWithValue(errorMessage(e));
    }
  },
  { condition: (_, { getState }) => getState().transactions.status !== "loading" },
);

const transactionsSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchTransactions.pending, (s) => {
      s.status = "loading";
      s.error = null;
    })
      .addCase(fetchTransactions.fulfilled, (s, a) => {
        s.status = "succeeded";
        s.items = a.payload;
      })
      .addCase(fetchTransactions.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.payload ?? "Could not load transactions.";
      });
  },
});

export default transactionsSlice.reducer;
