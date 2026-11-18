"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { db } from "./supabase";

type AuthValue = {
  ready: boolean;
  user: User | null;
  session: Session | null;
};

const AuthContext = createContext<AuthValue>({ ready: false, user: null, session: null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const client = db();
    const apply = (next: Session | null) => {
      setSession((current) => {
        if (current?.access_token === next?.access_token && current?.user.id === next?.user.id) return current;
        return next;
      });
      setReady(true);
    };
    client.auth.getSession().then(({ data }) => apply(data.session));
    const { data } = client.auth.onAuthStateChange((_event, next) => apply(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo(
    () => ({ ready, session, user: session?.user ?? null }),
    [ready, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
