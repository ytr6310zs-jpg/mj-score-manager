"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ActionFeedback } from "@/components/action-feedback";

type Feedback = {
  success: boolean;
  message: string;
};

type AdminFeedbackContextValue = {
  setFeedback: (feedback: Feedback | null) => void;
};

const AdminFeedbackContext = createContext<AdminFeedbackContextValue | null>(null);

export function useAdminFeedback(): AdminFeedbackContextValue {
  const ctx = useContext(AdminFeedbackContext);
  if (!ctx) {
    return {
      setFeedback: () => {
        /* Provider 外では no-op（対局削除など） */
      },
    };
  }
  return ctx;
}

export function AdminFeedbackRegion({ children }: { children: ReactNode }) {
  const [feedback, setFeedbackState] = useState<Feedback | null>(null);

  const setFeedback = useCallback((next: Feedback | null) => {
    setFeedbackState(next);
  }, []);

  const value = useMemo(() => ({ setFeedback }), [setFeedback]);

  return (
    <AdminFeedbackContext.Provider value={value}>
      {feedback?.message ? (
        <div className="mb-4">
          <ActionFeedback
            success={feedback.success}
            message={feedback.message}
            className="text-sm"
          />
        </div>
      ) : null}
      {children}
    </AdminFeedbackContext.Provider>
  );
}
