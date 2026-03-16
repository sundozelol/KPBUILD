import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, Package, Settings, LayoutTemplate, Users, UserCircle, LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const ADMIN_NAV = [
  { label: "КП", icon: FileText, page: "Proposals" },
  { label: "Товары", icon: Package, page: "Products" },
  { label: "Пользователи", icon: Users, page: "Users" },
  { label: "Настройки", icon: Settings, page: "Settings" },
];

const MANAGER_NAV = [
  { label: "КП", icon: FileText, page: "Proposals" },
];

const ROLE_LABELS = { admin: "Администратор", manager: "Менеджер" };

export default function Layout({ children, currentPageName }) {
  const isEditor = currentPageName === "ProposalEditor";
  const { user, logout } = useAuth();
  const role = user?.role;

  if (isEditor) {
    return <>{children}</>;
  }

  const nav = role === "admin" ? ADMIN_NAV : MANAGER_NAV;

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-6 py-0 flex items-center h-12">
        <div className="flex items-center gap-2 mr-8">
          <div className="w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center">
            <LayoutTemplate className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-gray-900 text-sm tracking-tight">КП Генератор</span>
        </div>

        {/* Main nav */}
        <div className="flex items-center gap-1 flex-1">
          {nav.map(({ label, icon: Icon, page }) => (
            <Link
              key={page}
              to={createPageUrl(page)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentPageName === page
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
        </div>

        {/* Right: account + logout */}
        <div className="flex items-center gap-1">
          <Link
            to={createPageUrl("Account")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentPageName === "Account"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <UserCircle className="w-3.5 h-3.5" />
            <span className="max-w-[100px] truncate">{user?.name || user?.email?.split("@")[0]}</span>
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
            title="Выйти"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>
      <div className="px-6 py-8">
        {children}
      </div>
    </div>
  );
}
