import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Role } from "@/domain/types";
import { MOCK_USERS, findUser } from "@/domain/users";
import type { NetworkMode } from "@/mock/api";

/** Mock session for the UI demo — NOT authentication. */
export interface SessionState {
  userId: string;
  activeRole: Role;
  networkMode: NetworkMode;
}

const initialState: SessionState = { userId: MOCK_USERS[0].id, activeRole: "maker", networkMode: "normal" };

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    switchUser(state, action: PayloadAction<string>) {
      const user = findUser(action.payload);
      if (!user) return;
      state.userId = user.id;
      if (!user.roles.includes(state.activeRole)) state.activeRole = user.roles[0];
    },
    setActiveRole(state, action: PayloadAction<Role>) {
      const user = findUser(state.userId);
      if (user?.roles.includes(action.payload)) state.activeRole = action.payload;
    },
    setNetworkMode(state, action: PayloadAction<NetworkMode>) {
      state.networkMode = action.payload;
    },
  },
});

export const { switchUser, setActiveRole, setNetworkMode } = sessionSlice.actions;
export default sessionSlice.reducer;
