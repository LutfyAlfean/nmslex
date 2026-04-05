import { useState, useEffect, useCallback } from "react";
import { Users, Shield, Trash2, CheckCircle, XCircle, Search, UserPlus, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserAccount {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  last_login: string | null;
  created_at: string;
}

const roleColors: Record<string, string> = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  operator: "bg-primary/10 text-primary border-primary/20",
  viewer: "bg-info/10 text-info border-info/20",
};

const statusColors: Record<string, string> = {
  active: "text-success",
  inactive: "text-muted-foreground",
  suspended: "text-destructive",
};

export default function UserManagement() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", name: "", role: "operator", password: "" });

  const invokeManageUsers = useCallback(async (body: Record<string, any>) => {
    const { data, error } = await supabase.functions.invoke("manage-users", { body });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await invokeManageUsers({ action: "list_users" });
      setUsers(data.users || []);
    } catch (err: any) {
      toast.error("Gagal memuat data user: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [invokeManageUsers]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.name || !newUser.password) {
      toast.error("Semua field harus diisi");
      return;
    }
    if (newUser.password.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }
    setActionLoading(true);
    try {
      await invokeManageUsers({ action: "create_user", ...newUser });
      toast.success(`User ${newUser.name} berhasil ditambahkan`);
      setNewUser({ email: "", name: "", role: "operator", password: "" });
      setShowAddModal(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    if (!confirm(`Hapus user ${user?.name}?`)) return;
    setActionLoading(true);
    try {
      await invokeManageUsers({ action: "delete_user", user_id: userId });
      toast.success("User berhasil dihapus");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    if (!user) return;
    const newStatus = user.status === "active" ? "suspended" : "active";
    setActionLoading(true);
    try {
      await invokeManageUsers({ action: "update_status", user_id: userId, status: newStatus });
      toast.success(`User ${user.name} ${newStatus === "active" ? "diaktifkan" : "disuspend"}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === "active").length,
    admins: users.filter(u => u.role === "admin").length,
    operators: users.filter(u => u.role === "operator").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" /> User Management
            </h2>
            <p className="text-muted-foreground text-sm">Kelola akun admin dan operator NMSLEX</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <UserPlus className="w-3.5 h-3.5" /> Tambah User
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: stats.total, icon: Users },
            { label: "Active", value: stats.active, icon: CheckCircle },
            { label: "Admins", value: stats.admins, icon: Shield },
            { label: "Operators", value: stats.operators, icon: Users },
          ].map(s => (
            <div key={s.label} className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <s.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari user berdasarkan nama atau email..."
            className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground border border-border/30 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        <div className="glass rounded-xl p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground text-sm">Memuat data user...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-2 px-3 text-[11px] text-muted-foreground uppercase">User</th>
                    <th className="text-left py-2 px-3 text-[11px] text-muted-foreground uppercase">Role</th>
                    <th className="text-left py-2 px-3 text-[11px] text-muted-foreground uppercase">Status</th>
                    <th className="text-left py-2 px-3 text-[11px] text-muted-foreground uppercase">Last Login</th>
                    <th className="text-left py-2 px-3 text-[11px] text-muted-foreground uppercase">Created</th>
                    <th className="text-right py-2 px-3 text-[11px] text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Belum ada user terdaftar</td></tr>
                  ) : filteredUsers.map(user => (
                    <tr key={user.id} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-primary">{user.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-foreground text-xs font-medium">{user.name}</p>
                            <p className="text-muted-foreground text-[10px]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${roleColors[user.role] || roleColors.viewer}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`flex items-center gap-1 text-[11px] font-medium ${statusColors[user.status] || ""}`}>
                          {user.status === "active" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-muted-foreground font-mono">
                        {user.last_login ? new Date(user.last_login).toLocaleString("id-ID") : "-"}
                      </td>
                      <td className="py-3 px-3 text-xs text-muted-foreground font-mono">
                        {new Date(user.created_at).toLocaleDateString("id-ID")}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggleStatus(user.user_id)}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-warning hover:bg-warning/10 transition-colors disabled:opacity-50"
                            title={user.status === "active" ? "Suspend" : "Activate"}
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.user_id)}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="glass rounded-2xl p-6 w-full max-w-md mx-4 animate-slide-up">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                <UserPlus className="w-5 h-5 text-primary" /> Tambah User Baru
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Nama</label>
                  <input type="text" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="Nama lengkap"
                    className="w-full px-3 py-2.5 bg-secondary/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground border border-border/30 focus:outline-none focus:ring-1 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Email</label>
                  <input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="user@nmslex.com"
                    className="w-full px-3 py-2.5 bg-secondary/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground border border-border/30 focus:outline-none focus:ring-1 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Password</label>
                  <input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="Min. 8 karakter"
                    className="w-full px-3 py-2.5 bg-secondary/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground border border-border/30 focus:outline-none focus:ring-1 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Role</label>
                  <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2.5 bg-secondary/50 rounded-lg text-sm text-foreground border border-border/30 focus:outline-none focus:ring-1 focus:ring-primary/50">
                    <option value="operator">Operator</option>
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowAddModal(false)} disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50">
                  Batal
                </button>
                <button onClick={handleAddUser} disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Tambah User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
