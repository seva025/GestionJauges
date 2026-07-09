import { useEffect, useMemo, useState } from "react";
import type { Emprunt } from "../models/emprunt";
import {
  createEmprunt,
  deleteEmprunt,
  getAllEmprunts,
  updateEmprunt,
} from "../services/empruntService";

export function useEmprunts() {
  const [emprunts, setEmprunts] = useState<Emprunt[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    setError(null);

    try {
      const data = await getAllEmprunts();
      setEmprunts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  const selectedEmprunt = useMemo(() => {
    return emprunts.find((e) => e.id === selectedId) ?? null;
  }, [emprunts, selectedId]);

  async function add(
    emprunt: Omit<Emprunt, "id" | "created_at">
  ) {
    await createEmprunt(emprunt);
    await reload();
  }

  async function update(
    id: number,
    values: Partial<Emprunt>
  ) {
    await updateEmprunt(id, values);
    await reload();
  }

  async function remove(id: number) {
    await deleteEmprunt(id);
    await reload();
  }

  const stats = useMemo(() => {
    return {
      total: emprunts.length,
      enCours: emprunts.filter(e => e.statut === "EN_COURS").length,
      retournes: emprunts.filter(e => e.statut === "RETOURNE").length,
    };
  }, [emprunts]);

  return {
    emprunts,
    selectedEmprunt,
    selectedId,
    setSelectedId,

    stats,

    loading,
    error,

    reload,

    add,
    update,
    remove,
  };
}