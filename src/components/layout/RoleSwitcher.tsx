import { ChevronDown, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Role } from "@/domain/types";
import { MOCK_USERS, ROLE_LABEL } from "@/domain/users";
import { initials } from "@/lib/format";
import type { NetworkMode } from "@/mock/api";
import { useAppDispatch } from "@/store/hooks";
import { useSession } from "@/store/selectors";
import { setActiveRole, setNetworkMode, switchUser } from "@/store/sessionSlice";

export function RoleSwitcher() {
  const dispatch = useAppDispatch();
  const { user, activeRole, networkMode } = useSession();
  if (!user) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-10 gap-2 pl-1.5 pr-2.5" aria-label={`Demo user: ${user.name}, acting as ${ROLE_LABEL[activeRole]}. Change`}>
          <span className="grid size-7 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">{initials(user.name)}</span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-sm font-medium">{user.name}</span>
            <span className="block text-[11px] text-muted-foreground">Acting as {ROLE_LABEL[activeRole]}</span>
          </span>
          <ChevronDown className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-4">
        <div className="flex gap-2 rounded-md bg-warning/15 p-2.5 text-xs text-warning-ink">
          <FlaskConical className="mt-0.5 size-4 shrink-0" />
          <p>
            Mock role switcher for the UI demo. This is <strong>not</strong> real authentication or security.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="demo-user">Demo user</Label>
          <Select value={user.id} onValueChange={(v) => dispatch(switchUser(v))}>
            <SelectTrigger id="demo-user">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOCK_USERS.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} · {u.roles.map((r) => ROLE_LABEL[r]).join(" + ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{user.title}</p>
        </div>
        <div className="space-y-1.5">
          <Label id="role-label">Active role</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            aria-labelledby="role-label"
            value={activeRole}
            onValueChange={(v) => v && dispatch(setActiveRole(v as Role))}
            className="w-full"
          >
            {(["maker", "checker"] as Role[]).map((r) => (
              <ToggleGroupItem key={r} value={r} disabled={!user.roles.includes(r)} className="flex-1">
                {ROLE_LABEL[r]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="net-mode">Mock network</Label>
          <Select value={networkMode} onValueChange={(v) => dispatch(setNetworkMode(v as NetworkMode))}>
            <SelectTrigger id="net-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal (~400ms)</SelectItem>
              <SelectItem value="slow">Slow (~2s)</SelectItem>
              <SelectItem value="offline">Offline (requests fail)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Use this to preview loading and error states.</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
