import { useEffect, useMemo, useState } from "react";
import type { Jauge, StockFilter, StockStats } from "../models/jauge";
import { getAllJauges } from "../services/stockService";

export function useStock() {
  const [jauges, setJauges] = useState<Jauge[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("tous");
  const [stockFilter, setStockFilter] = useState<StockFilter>("toutes");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    setError(null);

    try {
      const data = await getAllJauges();
      setJauges(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
      setJauges([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  const types = useMemo(() => {
    return Array.from(
      new Set(jauges.map((jauge) => jauge.type_code).filter(Boolean))
    ).sort() as string[];
  }, [jauges]);

  const filteredJauges = useMemo(() => {
    const query = normalize(search);

    return jauges.filter((jauge) => {
      const stockTotal = Number(jauge.stock_total ?? 0);
      const enCommande = Number(jauge.en_commande ?? 0);

      const matchesSearch = matchesBusinessSearch(jauge, query);

      const matchesType =
        typeFilter === "tous" || jauge.type_code === typeFilter;

      const matchesStock =
        stockFilter === "toutes" ||
        (stockFilter === "disponibles" && stockTotal > 0) ||
        (stockFilter === "commande" && enCommande > 0) ||
        (stockFilter === "rupture" && stockTotal <= 0);

      return matchesSearch && matchesType && matchesStock;
    });
  }, [jauges, search, typeFilter, stockFilter]);

  const selectedJauge = useMemo(() => {
    return filteredJauges.find((jauge) => jauge.id === selectedId) ?? null;
  }, [filteredJauges, selectedId]);

  const stats: StockStats = useMemo(() => {
    return {
      references: jauges.length,
      stockTotal: jauges.reduce(
        (total, jauge) => total + Number(jauge.stock_total ?? 0),
        0
      ),
      enCommande: jauges.reduce(
        (total, jauge) => total + Number(jauge.en_commande ?? 0),
        0
      ),
      ruptures: jauges.filter((jauge) => Number(jauge.stock_total ?? 0) <= 0)
        .length,
    };
  }, [jauges]);

  return {
    jauges,
    filteredJauges,
    selectedJauge,
    selectedId,
    setSelectedId,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    stockFilter,
    setStockFilter,
    types,
    stats,
    loading,
    error,
    reload,
  };
}

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(",", ".")
    .replace("ø", "")
    .replace("Ø", "")
    .replace(/\s+/g, " ");
}

function matchesBusinessSearch(jauge: Jauge, query: string) {
  if (query.length === 0) return true;

  const id = String(jauge.id);
  const diametre = normalize(String(jauge.diametre ?? ""));
  const typeCode = normalize(String(jauge.type_code ?? ""));

  if (query.startsWith("#")) {
    return id === query.replace("#", "");
  }

  const parts = query.split(" ").filter(Boolean);

  return parts.every((part) => {
    const numeric = /^[0-9]+(\.[0-9]+)?$/.test(part);

    if (numeric) {
      return diametre.startsWith(part);
    }

    return typeCode.includes(part);
  });
}