"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Work } from "@/lib/types";

interface FavoritesContextType {
  ids: Set<number>;
  loaded: boolean;
  isFav: (id: number) => boolean;
  toggle: (id: number) => Promise<void>;
  reload: () => void;
}

const FavoritesContext = createContext<FavoritesContextType>({
  ids: new Set(),
  loaded: false,
  isFav: () => false,
  toggle: async () => {},
  reload: () => {},
});

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<number>>(new Set());
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(() => {
    if (!user) {
      setIds(new Set());
      setLoaded(false);
      return;
    }
    api<Work[]>("/api/favorites")
      .then((list) => {
        setIds(new Set(list.map((w) => w.id)));
        setLoaded(true);
      })
      .catch(console.error);
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function toggle(id: number) {
    const was = ids.has(id);
    const change = (add: boolean) =>
      setIds((prev) => {
        const next = new Set(prev);
        if (add) next.add(id);
        else next.delete(id);
        return next;
      });

    change(!was); // atualiza na hora
    try {
      await api(`/api/favorites/${id}`, { method: was ? "DELETE" : "POST" });
    } catch (err) {
      console.error(err);
      change(was); // deu erro: desfaz
    }
  }

  return (
    <FavoritesContext.Provider value={{ ids, loaded, isFav: (id) => ids.has(id), toggle, reload }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);