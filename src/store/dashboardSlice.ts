import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { TxnStatus } from "@/domain/types";
import type { RangePreset } from "@/domain/filters";

export interface DashboardState {
  preset: RangePreset;
  customFrom?: string;
  customTo?: string;
  status: TxnStatus | "all";
}

const initialState: DashboardState = { preset: "30d", status: "all" };

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setPreset(s, a: PayloadAction<RangePreset>) {
      s.preset = a.payload;
    },
    setCustomRange(s, a: PayloadAction<{ from?: string; to?: string }>) {
      s.customFrom = a.payload.from;
      s.customTo = a.payload.to;
    },
    setDashboardStatus(s, a: PayloadAction<TxnStatus | "all">) {
      s.status = a.payload;
    },
    resetDashboard: () => initialState,
  },
});

export const { setPreset, setCustomRange, setDashboardStatus, resetDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
