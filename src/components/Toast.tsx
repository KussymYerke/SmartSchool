import React, { createContext, useContext, useState } from "react";

type Toast = {
  id: number;
  message: string;
};

const ToastContext = createContext<{
  showToast: (msg: string) => void;
}>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500); // toast disappears after 2.5s
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast stack */}
      <div className="fixed bottom-6 right-6 space-y-2 z-[9999]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="px-4 py-2 rounded-2xl bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-lg backdrop-blur-md animate-fade-in-up"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
