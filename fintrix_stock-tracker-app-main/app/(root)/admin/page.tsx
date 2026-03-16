import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { adminGetActiveSessions, adminListUsers } from "@/lib/actions/admin.actions";
import UsersAdminPanel from "@/components/admin/UsersAdminPanel";

export const dynamic = "force-dynamic";

const AdminPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");
  if (!isAdminEmail(session.user.email)) redirect("/");

  const [users, activeSessions] = await Promise.all([adminListUsers(), adminGetActiveSessions()]);

  return (
    <div className="space-y-6">
      <UsersAdminPanel users={users} activeSessions={activeSessions} />
    </div>
  );
};

export default AdminPage;

