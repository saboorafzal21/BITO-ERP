import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmployeesData, createEmployee } from "@/lib/actions/employees";
import { Card, CardContent, Input } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export default async function EmployeesPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");
  const { data: profile } = await supabase.from("users").select("branch_id").eq("id", authUser.id).single();
  if (!profile?.branch_id) return <p className="text-sm text-muted">No branch assigned.</p>;
  const branchId = profile.branch_id;

  const { employees, users } = await getEmployeesData(branchId);
  const nonEmployeeUsers = users.filter((u) => !employees.some((e) => (e.users as { email?: string } | null)?.email === u.email));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Employees</h1>
      <Card>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="pb-2">Name</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Designation</th>
                <th className="pb-2">Salary</th>
                <th className="pb-2">Code</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => {
                const u = e.users as { full_name?: string; role?: string } | null;
                return (
                  <tr key={e.id} className="border-b border-border/50">
                    <td className="py-2">{u?.full_name}</td>
                    <td className="py-2 capitalize">{u?.role}</td>
                    <td className="py-2">{e.designation ?? "—"}</td>
                    <td className="py-2">{e.salary ? `Rs ${e.salary}` : "—"}</td>
                    <td className="py-2">{e.employee_code}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {nonEmployeeUsers.length > 0 && (
            <form
              action={async (formData) => {
                "use server";
                await createEmployee(branchId, formData);
              }}
              className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4 sm:grid-cols-4"
            >
              <select name="user_id" required className="h-10 rounded-[var(--radius-card)] border border-border bg-card px-3 text-sm">
                <option value="">Select user</option>
                {nonEmployeeUsers.map((u) => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
              </select>
              <Input name="designation" placeholder="Designation" />
              <Input name="salary" type="number" step="0.01" placeholder="Salary" />
              <Button size="sm" type="submit">Add as Employee</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
