import React, { useState, useEffect } from "react";
import { base44, apiClient } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Save, Upload, RefreshCw, CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronRight, History } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const INTERVAL_OPTIONS = [
  { value: 60,   label: "Каждый час" },
  { value: 120,  label: "Каждые 2 часа" },
  { value: 240,  label: "Каждые 4 часа" },
  { value: 480,  label: "Каждые 8 часов" },
  { value: 720,  label: "Каждые 12 часов" },
  { value: 1440, label: "Раз в сутки" },
];

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    company_name: "", logo_url: "", address: "", phone: "", email: "", website: "", inn: "", bank_details: ""
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncSettings, setSyncSettings] = useState({ auto_sync_enabled: false, auto_sync_interval: 120, last_auto_sync: null });
  const [syncSaving, setSyncSaving] = useState(false);
  const [syncLogs, setSyncLogs] = useState([]);
  const [expandedLog, setExpandedLog] = useState(null);

  useEffect(() => {
    loadProfile();
    apiClient.settings.getSync().then(setSyncSettings).catch(() => {});
    apiClient.settings.getSyncLogs().then(setSyncLogs).catch(() => {});
  }, []);

  const loadProfile = async () => {
    const data = await base44.entities.CompanyProfile.list();
    if (data.length > 0) {
      setProfile(data[0]);
      setForm(data[0]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    if (profile) {
      await base44.entities.CompanyProfile.update(profile.id, form);
    } else {
      await base44.entities.CompanyProfile.create(form);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    loadProfile();
  };

  const handleSyncToggle = async (enabled) => {
    setSyncSaving(true);
    const updated = await apiClient.settings.updateSync({ auto_sync_enabled: enabled });
    setSyncSettings(updated);
    setSyncSaving(false);
  };

  const handleSyncInterval = async (interval) => {
    setSyncSaving(true);
    const updated = await apiClient.settings.updateSync({ auto_sync_interval: interval });
    setSyncSettings(updated);
    setSyncSaving(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm({ ...form, logo_url: file_url });
  };

  return (
    <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Профиль компании</h1>
            <p className="text-gray-400 text-sm">Эти данные отображаются в ваших КП</p>
          </div>
        </div>

        <Card className="rounded-2xl border-gray-200/60 shadow-sm">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden bg-gray-50">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Логотип" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-6 h-6 text-gray-300" />
                )}
              </div>
              <div>
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span><Upload className="w-3 h-3 mr-2" /> Загрузить логотип</span>
                  </Button>
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG до 2MB</p>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <Label>Название компании *</Label>
                <Input value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} placeholder="ООО «Ваша компания»" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Телефон</Label>
                  <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+7 (999) 000-00-00" className="mt-1" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="info@company.ru" className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Сайт</Label>
                  <Input value={form.website} onChange={e => setForm({...form, website: e.target.value})} placeholder="www.company.ru" className="mt-1" />
                </div>
                <div>
                  <Label>ИНН</Label>
                  <Input value={form.inn} onChange={e => setForm({...form, inn: e.target.value})} placeholder="1234567890" className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Адрес</Label>
                <Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="г. Москва, ул. Примерная, 1" className="mt-1" />
              </div>
              <div>
                <Label>Банковские реквизиты</Label>
                <Textarea value={form.bank_details} onChange={e => setForm({...form, bank_details: e.target.value})} placeholder="Р/с, К/с, БИК, Банк..." className="mt-1" rows={3} />
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl bg-gray-900 hover:bg-black text-sm h-10">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Сохранение..." : saved ? "Сохранено!" : "Сохранить"}
            </Button>
          </CardContent>
        </Card>

        {/* Sync history */}
        {syncLogs.length > 0 && (
          <Card className="rounded-2xl border-gray-200/60 shadow-sm">
            <CardContent className="p-6 space-y-3">
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <History className="w-4 h-4 text-gray-500" />
                История синхронизаций
              </p>
              <div className="space-y-1.5">
                {syncLogs.map(log => {
                  const isExpanded = expandedLog === log.id;
                  const feeds = log.detail?.feeds || [];
                  const feedResults = log.detail?.feedResults || {};
                  return (
                    <div key={log.id} className="rounded-xl border border-gray-100 overflow-hidden">
                      <button
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                      >
                        {log.status === 'ok'
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          : <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                        }
                        <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md flex-shrink-0"
                          style={{ background: log.type === 'auto' ? '#f0f0f0' : '#e8f0ff', color: log.type === 'auto' ? '#666' : '#3366cc' }}>
                          {log.type === 'auto' ? 'Авто' : 'Ручной'}
                        </span>
                        <span className="text-xs text-gray-500 flex-1">
                          {format(new Date(log.created_at), "d MMM yyyy, HH:mm", { locale: ru })}
                        </span>
                        <span className={`text-xs font-semibold ${log.updated > 0 ? 'text-gray-800' : 'text-gray-400'}`}>
                          {log.updated > 0 ? `↑ ${log.updated} цен` : 'без изменений'}
                        </span>
                        <span className="text-xs text-gray-300 ml-1">{log.feeds_count} фид{log.feeds_count === 1 ? '' : 'ов'}</span>
                        {isExpanded
                          ? <ChevronDown className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                          : <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        }
                      </button>
                      {isExpanded && feeds.length > 0 && (
                        <div className="border-t border-gray-100 px-3 py-2 space-y-1 bg-gray-50">
                          {feeds.map(f => {
                            const fr = feedResults[f.id];
                            return (
                              <div key={f.id} className="flex items-center justify-between text-xs">
                                <span className="text-gray-500 truncate max-w-[60%]">{f.name}</span>
                                {fr?.error
                                  ? <span className="text-red-400 text-[11px]">{fr.error}</span>
                                  : <span className="text-gray-600">обновлено {fr?.updated ?? 0} цен</span>
                                }
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Auto price sync */}
        <Card className="rounded-2xl border-gray-200/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-gray-500" />
                  Автообновление цен из XML-фидов
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Цены в товарах обновляются автоматически по расписанию</p>
              </div>
              <button
                onClick={() => handleSyncToggle(!syncSettings.auto_sync_enabled)}
                disabled={syncSaving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${syncSettings.auto_sync_enabled ? "bg-gray-900" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${syncSettings.auto_sync_enabled ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            {syncSettings.auto_sync_enabled && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Интервал синхронизации</p>
                <div className="grid grid-cols-3 gap-2">
                  {INTERVAL_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleSyncInterval(opt.value)}
                      disabled={syncSaving}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${syncSettings.auto_sync_interval === opt.value ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {syncSettings.last_auto_sync ? (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
                    Последняя синхронизация: {format(new Date(syncSettings.last_auto_sync), "d MMM yyyy, HH:mm", { locale: ru })}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    Синхронизация ещё не запускалась
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}