import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/api/apiClient";
import { useAuth } from "@/lib/AuthContext";
import { User, Lock, CheckCircle, AlertCircle } from "lucide-react";

const ROLE_LABELS = { admin: "Администратор", manager: "Менеджер" };
const ROLE_COLORS = { admin: "bg-gray-900 text-white", manager: "bg-gray-100 text-gray-700" };

export default function Account() {
  const { user, checkAppState } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState(null);

  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState(null);

  const handleSaveName = async () => {
    setSavingName(true);
    setNameMsg(null);
    try {
      await apiClient.auth.updateMe({ name });
      await checkAppState();
      setNameMsg({ ok: true, text: "Имя сохранено" });
    } catch (e) {
      setNameMsg({ ok: false, text: e.message });
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setPwdMsg({ ok: false, text: "Пароли не совпадают" });
      return;
    }
    setSavingPwd(true);
    setPwdMsg(null);
    try {
      await apiClient.auth.changePassword(curPwd, newPwd);
      setCurPwd(""); setNewPwd(""); setConfirmPwd("");
      setPwdMsg({ ok: true, text: "Пароль изменён" });
    } catch (e) {
      setPwdMsg({ ok: false, text: e.message });
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Личный кабинет</h1>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-200/60 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">{user?.name || user?.email}</div>
            <div className="text-xs text-gray-400">{user?.email}</div>
          </div>
          <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLORS[user?.role] || "bg-gray-100 text-gray-600"}`}>
            {ROLE_LABELS[user?.role] || user?.role}
          </span>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Имя</p>
          <div className="flex gap-2">
            <Input
              placeholder="Ваше имя"
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-9 text-sm"
            />
            <Button
              size="sm"
              className="bg-gray-900 hover:bg-gray-700 text-white h-9 px-4"
              onClick={handleSaveName}
              disabled={savingName}
            >
              {savingName ? "..." : "Сохранить"}
            </Button>
          </div>
          {nameMsg && (
            <div className={`flex items-center gap-1.5 text-xs ${nameMsg.ok ? "text-green-600" : "text-red-500"}`}>
              {nameMsg.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {nameMsg.text}
            </div>
          )}
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-200/60 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-gray-400" />
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Сменить пароль</p>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <p className="text-[10px] text-gray-400 mb-1">ТЕКУЩИЙ ПАРОЛЬ</p>
            <Input type="password" value={curPwd} onChange={e => setCurPwd(e.target.value)} className="h-9 text-sm" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 mb-1">НОВЫЙ ПАРОЛЬ</p>
            <Input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} className="h-9 text-sm" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 mb-1">ПОДТВЕРДИТЬ ПАРОЛЬ</p>
            <Input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} className="h-9 text-sm" />
          </div>
          {pwdMsg && (
            <div className={`flex items-center gap-1.5 text-xs ${pwdMsg.ok ? "text-green-600" : "text-red-500"}`}>
              {pwdMsg.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {pwdMsg.text}
            </div>
          )}
          <Button type="submit" disabled={savingPwd} className="w-full bg-gray-900 hover:bg-gray-700 text-white h-9">
            {savingPwd ? "Сохранение..." : "Изменить пароль"}
          </Button>
        </form>
      </div>
    </div>
  );
}
