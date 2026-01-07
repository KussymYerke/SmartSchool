// src/pages/RoleSelectPage.tsx
import React, { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/auth";
import { ROLE_LABELS } from "../types/auth";
import { VISIBLE_SUBJECTS } from "../data/subjects";
import {
  CLASS_TEACHER_ACCOUNTS,
  TEACHER_ACCOUNTS,
  type DemoAccount,
} from "../data/accounts";

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  deputy:
    "Полная школьная аналитика, контроль рисков, действия и постановка на сопровождение.",
  teacher: "Видит только свои предметы и свои классы. Оценки и риски — по предмету.",
  class_teacher:
    "Видит свой класс целиком. Дополнительно может смотреть свой предмет по всем классам, где преподаёт.",
  psychologist: "Психологические сигналы, наблюдения и направления от завуча.",
};

type Step = "role" | "account";

export const RoleSelectPage: React.FC = () => {
  const { setAuth } = useAuth();

  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<UserRole | null>(null);
  const [account, setAccount] = useState<DemoAccount | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [chosenHomeroom, setChosenHomeroom] = useState<string | null>(null);
  const [accountQuery, setAccountQuery] = useState<string>("");
  const [accountSubjectFilter, setAccountSubjectFilter] = useState<string>("all");

  const accounts = useMemo(() => {
    if (role === "teacher") return TEACHER_ACCOUNTS;
    if (role === "class_teacher") return CLASS_TEACHER_ACCOUNTS;
    return [];
  }, [role]);

  const filteredAccounts = useMemo(() => {
    const q = accountQuery.trim().toLowerCase();
    return accounts.filter((a) => {
      if (accountSubjectFilter !== "all") {
        if (!a.subjects?.includes(accountSubjectFilter)) return false;
      }
      if (!q) return true;
      const name = String(a.fullName ?? "").toLowerCase();
      const email = String(a.email ?? "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [accounts, accountQuery, accountSubjectFilter]);

  const startRole = (r: UserRole) => {
    setError(null);
    setPassword("");
    setAccount(null);
    setChosenHomeroom(null);
    setAccountQuery("");
    setAccountSubjectFilter("all");
    setRole(r);

    // Roles without accounts in demo
    if (r === "deputy") {
      setAuth({
        role: "deputy",
        className: null,
        selectedSubject: null,
        accountId: "deputy",
        displayName: "Завуч",
        email: null,
        teachingClasses: [],
        homeroomClasses: [],
      });
      return;
    }

    if (r === "psychologist") {
      setAuth({
        role: "psychologist",
        className: null,
        selectedSubject: null,
        accountId: "psychologist",
        displayName: "Психолог",
        email: null,
        teachingClasses: [],
        homeroomClasses: [],
      });
      return;
    }

    // teacher / class_teacher
    setStep("account");
  };

  const pickAccount = (a: DemoAccount) => {
    setAccount(a);
    setPassword("");
    setError(null);
    if (role === "class_teacher") setChosenHomeroom(a.homeroomClasses[0] ?? null);
  };

  const doLogin = () => {
    if (!role) return;
    if (!account) {
      setError("Выберите учителя.");
      return;
    }

    if (password.trim() !== account.password) {
      setError("Неверный пароль.");
      return;
    }

    const defaultSubject = account.subjects[0] ?? VISIBLE_SUBJECTS[0]?.code ?? null;
    const className = role === "class_teacher" ? chosenHomeroom ?? account.homeroomClasses[0] ?? null : null;

    setAuth({
      role,
      className,
      selectedSubject: defaultSubject,
      subjects: account.subjects,
      accountId: account.id,
      displayName: account.fullName,
      email: account.email,
      teachingClasses: account.teachingClasses,
      homeroomClasses: account.homeroomClasses,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
      <div className="max-w-5xl w-full px-4 py-10">
        <div className="ui-panel p-6 md:p-8">
          {step === "role" ? (
            <>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-center">
                Вход
              </h1>
              <p className="text-sm text-slate-400 text-center mt-2 mb-8">
                Выберите роль и аккаунт. (Демо-логины, без сервера)
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {(
                  ["deputy", "class_teacher", "teacher", "psychologist"] as UserRole[]
                ).map((r) => (
                  <button
                    key={r}
                    onClick={() => startRole(r)}
                    className="group ui-panel-hover p-4 text-left hover:-translate-y-1 transition transform"
                  >
                    <h2 className="text-base font-semibold text-slate-50 mb-1">{ROLE_LABELS[r]}</h2>
                    <p className="text-xs text-slate-400">{ROLE_DESCRIPTIONS[r]}</p>
                    <div className="mt-4 text-xs text-primary-300 group-hover:text-primary-200">
                      Продолжить →
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3 mb-6">
                <div>
                  <h1 className="text-xl md:text-2xl font-semibold">{role ? ROLE_LABELS[role] : "Аккаунт"}</h1>
                  <p className="text-sm text-slate-400">
                    Выберите преподавателя и введите пароль.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setStep("role");
                    setRole(null);
                    setAccount(null);
                    setPassword("");
                    setError(null);
                    setChosenHomeroom(null);
                    setAccountQuery("");
                    setAccountSubjectFilter("all");
                  }}
                  className="ui-btn-secondary rounded-full px-3 py-1.5 text-xs"
                >
                  Назад
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="ui-panel p-4">
                  <div className="text-xs text-slate-400 mb-3">Выбор учителя</div>
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
                    <input
                      value={accountQuery}
                      onChange={(e) => setAccountQuery(e.target.value)}
                      placeholder="Поиск по имени или email…"
                      className="ui-input w-full md:flex-1"
                    />
                    <select
                      value={accountSubjectFilter}
                      onChange={(e) => setAccountSubjectFilter(e.target.value)}
                      className="ui-select w-full md:w-56"
                    >
                      <option value="all">Все предметы</option>
                      {VISIBLE_SUBJECTS.map((s) => (
                        <option key={String(s.code)} value={String(s.code)}>
                          {s.nameRu}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-[11px] text-slate-500 mb-2">
                    Найдено: {filteredAccounts.length}
                  </div>
                  <div className="flex flex-col gap-2">
                    {filteredAccounts.length === 0 && (
                    <div className="px-4 py-6 text-sm text-slate-400 text-center">
                      Ничего не найдено. Попробуйте изменить поиск или фильтр.
                    </div>
                  )}

                  {filteredAccounts.map((a) => {
                      const active = account?.id === a.id;
                      return (
                        <button
                          key={a.id}
                          onClick={() => pickAccount(a)}
                          className={
                            "text-left px-4 py-3 rounded-2xl border transition " +
                            (active
                              ? "bg-slate-900/70 border-primary-500/60"
                              : "bg-slate-950/20 border-slate-800 hover:bg-slate-900/50")
                          }
                        >
                          <div className="text-sm font-semibold text-slate-50">{a.fullName}</div>
                          <div className="text-xs text-slate-400">{a.email}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="ui-panel p-4">
                  <div className="text-xs text-slate-400 mb-3">Пароль</div>

                  {role === "class_teacher" && account && account.homeroomClasses.length > 1 && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-400 mb-2">Класс руководства</p>
                      <div className="flex flex-wrap gap-2">
                        {account.homeroomClasses.map((cls) => (
                          <button
                            key={cls}
                            onClick={() => setChosenHomeroom(cls)}
                            className={
                              "ui-btn-secondary rounded-full px-4 py-2 text-sm " +
                              (chosenHomeroom === cls ? "ui-btn-primary" : "")
                            }
                          >
                            {cls}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    className="ui-input w-full"
                    placeholder="Введите пароль"
                  />

                  {error && <div className="mt-3 text-sm text-red-300">{error}</div>}

                  <button
                    onClick={doLogin}
                    className="mt-4 ui-btn-primary rounded-2xl w-full py-3 font-semibold"
                  >
                    Войти
                  </button>

                  <div className="mt-4 text-xs text-slate-500">
                    Подсказка: это демо-проект. Пароли хранятся на клиенте.
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
