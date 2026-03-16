import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/api/apiClient";
import { useAuth } from "@/lib/AuthContext";
import { Plus, Trash2, ShieldCheck, User, X, Eye, EyeOff, Ticket, Copy, Check, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const ROLE_LABELS = { admin: "Администратор", manager: "Менеджер" };
const ROLE_COLORS = {
  admin: "bg-gray-900 text-white",
  manager: "bg-gray-100 text-gray-700",
};

function CreateUserModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "manager" });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await apiClient.users.create(form);
      onCreate(user);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Новый пользователь</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <p className="text-[10px] text-gray-400 mb-1">ИМЯ</p>
            <Input placeholder="Иван Иванов" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-9 text-sm" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 mb-1">EMAIL</p>
            <Input type="email" placeholder="user@company.ru" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="h-9 text-sm" required />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 mb-1">ПАРОЛЬ</p>
            <div className="relative">
              <Input type={showPwd ? "text" : "password"} placeholder="Минимум 6 символов" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="h-9 text-sm pr-10" required />
              <button type="button" className="absolute right-3 top-2 text-gray-400" onClick={() => setShowPwd(v => !v)}>
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 mb-1">РОЛЬ</p>
            <div className="flex gap-2">
              {["manager", "admin"].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role: r }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${form.role === r ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full bg-gray-900 hover:bg-gray-700 text-white h-9">
            {loading ? "Создание..." : "Создать"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function InviteCodes() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newRole, setNewRole] = useState("manager");
  const [newNote, setNewNote] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    apiClient.invites.list().then(setInvites).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const invite = await apiClient.invites.create({ role: newRole, note: newNote });
      setInvites(prev => [invite, ...prev]);
      setNewNote("");
    } catch (e) {
      alert(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id) => {
    try {
      await apiClient.invites.delete(id);
      setInvites(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleCopy = (invite) => {
    const text = `Код для регистрации: ${invite.code}\nРоль: ${ROLE_LABELS[invite.role]}`;
    navigator.clipboard.writeText(text);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const unused = invites.filter(i => !i.used_at);
  const used = invites.filter(i => i.used_at);

  return (
    <div className="space-y-4">
      {/* Generate */}
      <div className="bg-white rounded-2xl border border-gray-200/60 p-5 space-y-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Выпустить инвайт</p>
        <div className="flex gap-2">
          {["manager", "admin"].map(r => (
            <button
              key={r}
              onClick={() => setNewRole(r)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${newRole === r ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
        <Input
          placeholder="Заметка (необязательно, для кого)"
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          className="h-9 text-sm"
        />
        <Button
          onClick={handleCreate}
          disabled={creating}
          className="w-full bg-gray-900 hover:bg-gray-700 text-white h-9 text-sm"
        >
          {creating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Ticket className="w-4 h-4 mr-2" />}
          Сгенерировать код
        </Button>
      </div>

      {/* Unused invites */}
      {loading ? (
        <div className="text-sm text-gray-400 text-center py-4">Загрузка...</div>
      ) : unused.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Активные коды ({unused.length})</p>
          </div>
          {unused.map(invite => (
            <div key={invite.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="font-mono font-bold text-gray-900 tracking-widest text-sm">{invite.code}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${invite.role === "admin" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}>
                    {ROLE_LABELS[invite.role]}
                  </span>
                  {invite.note && <span className="text-[10px] text-gray-400 truncate">{invite.note}</span>}
                  <span className="text-[10px] text-gray-300">
                    {format(new Date(invite.created_at), "d MMM", { locale: ru })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleCopy(invite)}
                className={`h-8 px-3 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${copiedId === invite.id ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900"}`}
              >
                {copiedId === invite.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedId === invite.id ? "Скопировано" : "Копировать"}
              </button>
              <button
                onClick={() => handleRevoke(invite.id)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Used invites */}
      {used.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden opacity-60">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Использованные ({used.length})</p>
          </div>
          {used.map(invite => (
            <div key={invite.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="font-mono text-gray-400 tracking-widest text-sm line-through">{invite.code}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  Использован: {invite.used_by_email}
                  {invite.used_at && ` · ${format(new Date(invite.used_at), "d MMM yyyy", { locale: ru })}`}
                </div>
              </div>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${invite.role === "admin" ? "bg-gray-200 text-gray-500" : "bg-gray-100 text-gray-400"}`}>
                {ROLE_LABELS[invite.role]}
              </span>
            </div>
          ))}
        </div>
      )}

      {!loading && invites.length === 0 && (
        <div className="text-center py-8 text-sm text-gray-400">
          <Ticket className="w-8 h-8 mx-auto mb-2 text-gray-200" />
          Нет инвайт-кодов. Сгенерируйте первый.
        </div>
      )}
    </div>
  );
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [changingRole, setChangingRole] = useState(null);
  const [tab, setTab] = useState("users");

  useEffect(() => {
    apiClient.users.list().then(setUsers).finally(() => setLoading(false));
  }, []);

  const handleCreate = (newUser) => {
    setUsers(u => [...u, newUser]);
    setShowCreate(false);
  };

  const handleRoleToggle = async (user) => {
    const newRole = user.role === "admin" ? "manager" : "admin";
    setChangingRole(user.id);
    try {
      const updated = await apiClient.users.update(user.id, { role: newRole });
      setUsers(u => u.map(x => x.id === user.id ? updated : x));
    } catch {}
    setChangingRole(null);
  };

  const handleDelete = async (userId) => {
    if (!confirm("Удалить пользователя? Все его данные будут удалены.")) return;
    try {
      await apiClient.users.delete(userId);
      setUsers(u => u.filter(x => x.id !== userId));
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Пользователи</h1>
        {tab === "users" && (
          <Button className="bg-gray-900 hover:bg-gray-700 text-white h-9 text-sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Добавить
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 w-fit gap-1">
        <button
          onClick={() => setTab("users")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === "users" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
        >
          Пользователи
        </button>
        <button
          onClick={() => setTab("invites")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === "invites" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
        >
          <Ticket className="w-3.5 h-3.5" /> Инвайты
        </button>
      </div>

      {tab === "users" && (
        <div className="bg-white rounded-2xl border border-gray-200/60 divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Загрузка...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">Нет пользователей</div>
          ) : users.map(u => (
            <div key={u.id} className="flex items-center gap-3 px-5 py-4">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${u.role === "admin" ? "bg-gray-900" : "bg-gray-100"}`}>
                {u.role === "admin"
                  ? <ShieldCheck className="w-4 h-4 text-white" />
                  : <User className="w-4 h-4 text-gray-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 truncate">{u.name || "—"}</div>
                <div className="text-xs text-gray-400 truncate">{u.email}</div>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${ROLE_COLORS[u.role]}`}>
                {ROLE_LABELS[u.role]}
              </span>
              {u.id !== currentUser?.id ? (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleRoleToggle(u)}
                    disabled={changingRole === u.id}
                    className="h-8 px-3 rounded-lg text-xs font-medium border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-900 transition-all disabled:opacity-40"
                  >
                    {changingRole === u.id ? "..." : u.role === "admin" ? "→ Менеджер" : "→ Админ"}
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span className="text-xs text-gray-400 flex-shrink-0">вы</span>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "invites" && <InviteCodes />}

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </div>
  );
}
