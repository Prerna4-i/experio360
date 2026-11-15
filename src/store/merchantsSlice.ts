import { createSlice } from "@reduxjs/toolkit";
import type { Merchant, NewMerchantInput, TransitionAction } from "@/domain/types";
import { mockApi } from "@/mock/api";
import { createAppAsyncThunk, errorMessage } from "./hooks";

export type LoadStatus = "idle" | "loading" | "succeeded" | "failed";

export interface MerchantsState {
  items: Merchant[];
  status: LoadStatus;
  error: string | null;
  pendingAction: { merchantId: string; action: TransitionAction | "create" } | null;
}

const initialState: MerchantsState = { items: [], status: "idle", error: null, pendingAction: null };

export const fetchMerchants = createAppAsyncThunk(
  "merchants/fetch",
  async (_: void, { getState, rejectWithValue }) => {
    try {
      return await mockApi.listMerchants(getState().session.networkMode);
    } catch (e) {
      return rejectWithValue(errorMessage(e));
    }
  },
  { condition: (_, { getState }) => getState().merchants.status !== "loading" },
);

export const transitionMerchant = createAppAsyncThunk(
  "merchants/transition",
  async (arg: { merchantId: string; action: TransitionAction; reason?: string | undefined }, { getState, rejectWithValue }) => {
    const { session } = getState();
    try {
      return await mockApi.transitionMerchant(session.networkMode, {
        ...arg,
        actorId: session.userId,
        role: session.activeRole,
      });
    } catch (e) {
      return rejectWithValue(errorMessage(e));
    }
  },
);

export const createMerchant = createAppAsyncThunk(
  "merchants/create",
  async (input: NewMerchantInput, { getState, rejectWithValue }) => {
    const { session } = getState();
    try {
      return await mockApi.createMerchant(session.networkMode, input, session.userId, session.activeRole);
    } catch (e) {
      return rejectWithValue(errorMessage(e));
    }
  },
);

const merchantsSlice = createSlice({
  name: "merchants",
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchMerchants.pending, (s) => {
      s.status = "loading";
      s.error = null;
    })
      .addCase(fetchMerchants.fulfilled, (s, a) => {
        s.status = "succeeded";
        s.items = a.payload;
      })
      .addCase(fetchMerchants.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.payload ?? "Could not load merchants.";
      })
      .addCase(transitionMerchant.pending, (s, a) => {
        s.pendingAction = { merchantId: a.meta.arg.merchantId, action: a.meta.arg.action };
      })
      .addCase(transitionMerchant.fulfilled, (s, a) => {
        s.pendingAction = null;
        const i = s.items.findIndex((m) => m.id === a.payload.id);
        if (i >= 0) s.items[i] = a.payload;
      })
      .addCase(transitionMerchant.rejected, (s) => {
        s.pendingAction = null;
      })
      .addCase(createMerchant.pending, (s) => {
        s.pendingAction = { merchantId: "new", action: "create" };
      })
      .addCase(createMerchant.fulfilled, (s, a) => {
        s.pendingAction = null;
        s.items.unshift(a.payload);
      })
      .addCase(createMerchant.rejected, (s) => {
        s.pendingAction = null;
      });
  },
});

export default merchantsSlice.reducer;
