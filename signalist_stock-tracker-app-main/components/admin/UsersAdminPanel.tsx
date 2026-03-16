'use client';

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import countryList from "react-select-country-list";
import { INVESTMENT_GOALS, PREFERRED_INDUSTRIES, RISK_TOLERANCE_OPTIONS } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { AdminActiveSessionRow, AdminUserRow } from "@/lib/actions/admin.actions";
import { adminCreateUser, adminDeleteUser, adminRemoveUserSessions, adminUpdateUser } from "@/lib/actions/admin.actions";

type Props = {
  users: AdminUserRow[];
  activeSessions: AdminActiveSessionRow[];
};

const UsersAdminPanel = ({ users, activeSessions }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpenId, setEditOpenId] = useState<string | null>(null);
  const [deleteOpenId, setDeleteOpenId] = useState<string | null>(null);
  const [removeSessionUserId, setRemoveSessionUserId] = useState<string | null>(null);
  const [sessionsOpen, setSessionsOpen] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    country: "US",
    investmentGoals: "Growth",
    riskTolerance: "Medium",
    preferredIndustry: "Technology",
  });

  const [editForm, setEditForm] = useState<{
    id: string;
    name: string;
    email: string;
    country?: string;
    investmentGoals?: string;
    riskTolerance?: string;
    preferredIndustry?: string;
  } | null>(null);

  const sessionCountByUserId = useMemo(() => {
    const map = new Map<string, number>();
    activeSessions.forEach((s) => map.set(s.userId, s.sessionCount));
    return map;
  }, [activeSessions]);

  const refresh = () => startTransition(() => router.refresh());

  const onCreate = () => {
    startTransition(async () => {
      try {
        await adminCreateUser(createForm);
        toast.success("User created");
        setCreateForm({
          name: "",
          email: "",
          password: "",
          country: "US",
          investmentGoals: "Growth",
          riskTolerance: "Medium",
          preferredIndustry: "Technology",
        });
        setCreateOpen(false);
        router.refresh();
      } catch (e) {
        toast.error("Create failed", { description: e instanceof Error ? e.message : "Unknown error" });
      }
    });
  };

  const onEdit = () => {
    if (!editForm) return;
    startTransition(async () => {
      try {
        await adminUpdateUser(editForm);
        toast.success("User updated");
        setEditOpenId(null);
        setEditForm(null);
        router.refresh();
      } catch (e) {
        toast.error("Update failed", { description: e instanceof Error ? e.message : "Unknown error" });
      }
    });
  };

  const onDelete = (id: string) => {
    startTransition(async () => {
      try {
        await adminDeleteUser({ id });
        toast.success("User deleted");
        setDeleteOpenId(null);
        router.refresh();
      } catch (e) {
        toast.error("Delete failed", { description: e instanceof Error ? e.message : "Unknown error" });
      }
    });
  };

  const onRemoveSessions = (userId: string) => {
    startTransition(async () => {
      try {
        const { deletedCount } = await adminRemoveUserSessions({ userId });
        toast.success(
          deletedCount > 0
            ? `Removed ${deletedCount} session${deletedCount > 1 ? "s" : ""}`
            : "No sessions to remove"
        );
        setRemoveSessionUserId(null);
        router.refresh();
      } catch (e) {
        toast.error("Remove failed", { description: e instanceof Error ? e.message : "Unknown error" });
      }
    });
  };

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Admin</h1>
            <p className="text-sm text-gray-500">Manage users and view active sessions.</p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="yellow-btn" disabled={isPending}>
                Create user
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>Create user</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="create-name">Name</Label>
                  <Input
                    id="create-name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Full name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-email">Email</Label>
                  <Input
                    id="create-email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="user@email.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-password">Password</Label>
                  <Input
                    id="create-password"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="Password"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Country</Label>
                  <CountryCombobox
                    value={createForm.country}
                    onChange={(country) => setCreateForm((p) => ({ ...p, country }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Investment Goals</Label>
                  <Select
                    value={createForm.investmentGoals}
                    onValueChange={(investmentGoals) => setCreateForm((p) => ({ ...p, investmentGoals }))}
                  >
                    <SelectTrigger className="select-trigger">
                      <SelectValue placeholder="Select your investment goal" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600 text-white">
                      {INVESTMENT_GOALS.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="focus:bg-gray-600 focus:text-white">
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Risk Tolerance</Label>
                  <Select
                    value={createForm.riskTolerance}
                    onValueChange={(riskTolerance) => setCreateForm((p) => ({ ...p, riskTolerance }))}
                  >
                    <SelectTrigger className="select-trigger">
                      <SelectValue placeholder="Select your risk level" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600 text-white">
                      {RISK_TOLERANCE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="focus:bg-gray-600 focus:text-white">
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Preferred Industry</Label>
                  <Select
                    value={createForm.preferredIndustry}
                    onValueChange={(preferredIndustry) => setCreateForm((p) => ({ ...p, preferredIndustry }))}
                  >
                    <SelectTrigger className="select-trigger">
                      <SelectValue placeholder="Select your preferred industry" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600 text-white">
                      {PREFERRED_INDUSTRIES.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="focus:bg-gray-600 focus:text-white">
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={isPending}>
                  Cancel
                </Button>
                <Button className="yellow-btn" onClick={onCreate} disabled={isPending}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="flex items-center gap-2 text-left text-lg font-semibold text-gray-100"
            onClick={() => setSessionsOpen((o) => !o)}
          >
            {sessionsOpen ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
            <span>Active sessions</span>
          </button>
          <Button variant="secondary" onClick={refresh} disabled={isPending} size="sm">
            Refresh
          </Button>
        </div>

        {sessionsOpen && (
          <div className="rounded-md border border-gray-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead className="text-right">Sessions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      No active sessions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeSessions.map((s) => (
                    <TableRow key={s.userId}>
                      <TableCell className="font-medium text-gray-200">{s.name ?? s.userId}</TableCell>
                      <TableCell className="text-gray-400">{s.email ?? "-"}</TableCell>
                      <TableCell className="text-gray-400">
                        {s.lastLoginAt
                          ? new Date(s.lastLoginAt).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right text-gray-200">{s.sessionCount}</TableCell>
                      <TableCell className="text-right">
                        <Dialog
                          open={removeSessionUserId === s.userId}
                          onOpenChange={(open) => setRemoveSessionUserId(open ? s.userId : null)}
                        >
                          <DialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={isPending}>
                              Remove
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[400px]">
                            <DialogHeader>
                              <DialogTitle>Remove sessions</DialogTitle>
                            </DialogHeader>
                            <div className="text-sm text-gray-500">
                              This will log out <span className="text-gray-200 font-medium">{s.email ?? s.name ?? s.userId}</span> from all
                              {s.sessionCount > 1 ? ` ${s.sessionCount} devices` : " device"}. They will need to sign in again.
                            </div>
                            <DialogFooter>
                              <Button
                                variant="secondary"
                                onClick={() => setRemoveSessionUserId(null)}
                                disabled={isPending}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => onRemoveSessions(s.userId)}
                                disabled={isPending}
                              >
                                Remove sessions
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-100">Users</h2>
        <div className="rounded-md border border-gray-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden lg:table-cell">Country</TableHead>
                <TableHead className="hidden xl:table-cell">Investment</TableHead>
                <TableHead className="hidden xl:table-cell">Risk</TableHead>
                <TableHead className="hidden 2xl:table-cell">Industry</TableHead>
                <TableHead className="text-right">Sessions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const sessions = sessionCountByUserId.get(u.id) ?? 0;
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium text-gray-200">{u.name}</TableCell>
                      <TableCell className="text-gray-400">{u.email}</TableCell>
                      <TableCell className="hidden lg:table-cell text-gray-400">{u.country ?? "-"}</TableCell>
                      <TableCell className="hidden xl:table-cell text-gray-400">{u.investmentGoals ?? "-"}</TableCell>
                      <TableCell className="hidden xl:table-cell text-gray-400">{u.riskTolerance ?? "-"}</TableCell>
                      <TableCell className="hidden 2xl:table-cell text-gray-400">{u.preferredIndustry ?? "-"}</TableCell>
                      <TableCell className="text-right text-gray-200">{sessions}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <Dialog
                            open={editOpenId === u.id}
                            onOpenChange={(open) => {
                              setEditOpenId(open ? u.id : null);
                              setEditForm(
                                open
                                  ? {
                                      id: u.id,
                                      name: u.name,
                                      email: u.email,
                                      country: u.country,
                                      investmentGoals: u.investmentGoals,
                                      riskTolerance: u.riskTolerance,
                                      preferredIndustry: u.preferredIndustry,
                                    }
                                  : null
                              );
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="secondary" size="sm" disabled={isPending}>
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[520px]">
                              <DialogHeader>
                                <DialogTitle>Edit user</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 py-2">
                                <div className="grid gap-2">
                                  <Label htmlFor={`edit-name-${u.id}`}>Name</Label>
                                  <Input
                                    id={`edit-name-${u.id}`}
                                    value={editForm?.name ?? ""}
                                    onChange={(e) =>
                                      setEditForm((p) => (p ? { ...p, name: e.target.value } : p))
                                    }
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor={`edit-email-${u.id}`}>Email</Label>
                                  <Input
                                    id={`edit-email-${u.id}`}
                                    value={editForm?.email ?? ""}
                                    onChange={(e) =>
                                      setEditForm((p) => (p ? { ...p, email: e.target.value } : p))
                                    }
                                  />
                                </div>

                                <div className="grid gap-2">
                                  <Label>Country</Label>
                                  <CountryCombobox
                                    value={editForm?.country ?? "US"}
                                    onChange={(country) =>
                                      setEditForm((p) => (p ? { ...p, country } : p))
                                    }
                                  />
                                </div>

                                <div className="grid gap-2">
                                  <Label>Investment Goals</Label>
                                  <Select
                                    value={editForm?.investmentGoals ?? "Growth"}
                                    onValueChange={(investmentGoals) =>
                                      setEditForm((p) => (p ? { ...p, investmentGoals } : p))
                                    }
                                  >
                                    <SelectTrigger className="select-trigger">
                                      <SelectValue placeholder="Select your investment goal" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-600 text-white">
                                      {INVESTMENT_GOALS.map((o) => (
                                        <SelectItem
                                          key={o.value}
                                          value={o.value}
                                          className="focus:bg-gray-600 focus:text-white"
                                        >
                                          {o.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="grid gap-2">
                                  <Label>Risk Tolerance</Label>
                                  <Select
                                    value={editForm?.riskTolerance ?? "Medium"}
                                    onValueChange={(riskTolerance) =>
                                      setEditForm((p) => (p ? { ...p, riskTolerance } : p))
                                    }
                                  >
                                    <SelectTrigger className="select-trigger">
                                      <SelectValue placeholder="Select your risk level" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-600 text-white">
                                      {RISK_TOLERANCE_OPTIONS.map((o) => (
                                        <SelectItem
                                          key={o.value}
                                          value={o.value}
                                          className="focus:bg-gray-600 focus:text-white"
                                        >
                                          {o.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="grid gap-2">
                                  <Label>Preferred Industry</Label>
                                  <Select
                                    value={editForm?.preferredIndustry ?? "Technology"}
                                    onValueChange={(preferredIndustry) =>
                                      setEditForm((p) => (p ? { ...p, preferredIndustry } : p))
                                    }
                                  >
                                    <SelectTrigger className="select-trigger">
                                      <SelectValue placeholder="Select your preferred industry" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-600 text-white">
                                      {PREFERRED_INDUSTRIES.map((o) => (
                                        <SelectItem
                                          key={o.value}
                                          value={o.value}
                                          className="focus:bg-gray-600 focus:text-white"
                                        >
                                          {o.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="secondary" onClick={() => setEditOpenId(null)} disabled={isPending}>
                                  Cancel
                                </Button>
                                <Button className="yellow-btn" onClick={onEdit} disabled={isPending}>
                                  Save
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Dialog
                            open={deleteOpenId === u.id}
                            onOpenChange={(open) => setDeleteOpenId(open ? u.id : null)}
                          >
                            <DialogTrigger asChild>
                              <Button variant="destructive" size="sm" disabled={isPending}>
                                Delete
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[520px]">
                              <DialogHeader>
                                <DialogTitle>Delete user</DialogTitle>
                              </DialogHeader>
                              <div className="text-sm text-gray-500">
                                This will permanently delete <span className="text-gray-200 font-medium">{u.email}</span>.
                              </div>
                              <DialogFooter>
                                <Button variant="secondary" onClick={() => setDeleteOpenId(null)} disabled={isPending}>
                                  Cancel
                                </Button>
                                <Button variant="destructive" onClick={() => onDelete(u.id)} disabled={isPending}>
                                  Delete
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
};

export default UsersAdminPanel;

const CountryCombobox = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const countries = useMemo(() => countryList().getData(), []);

  const getFlagEmoji = (countryCode: string) => {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const label = countries.find((c) => c.value === value)?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="country-select-trigger w-full justify-between">
          {value ? (
            <span className="flex items-center gap-2">
              <span>{getFlagEmoji(value)}</span>
              <span className="truncate">{label}</span>
            </span>
          ) : (
            "Select country..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-gray-800 border-gray-600" align="start">
        <Command className="bg-gray-800 border-gray-600">
          <CommandInput placeholder="Search countries..." className="country-select-input" />
          <CommandEmpty className="country-select-empty">No country found.</CommandEmpty>
          <CommandList className="max-h-60 bg-gray-800 scrollbar-hide-default">
            <CommandGroup className="bg-gray-800">
              {countries.map((country) => (
                <CommandItem
                  key={country.value}
                  value={`${country.label} ${country.value}`}
                  onSelect={() => {
                    onChange(country.value);
                    setOpen(false);
                  }}
                  className="country-select-item"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 text-yellow-500",
                      value === country.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex items-center gap-2">
                    <span>{getFlagEmoji(country.value)}</span>
                    <span>{country.label}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

