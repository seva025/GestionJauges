import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

type DashboardStats = {
  jauges: number;
  emprunts: number;
  alertes: number;
  commandes: number;
};

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    jauges: 0,
    emprunts: 0,
    alertes: 0,
    commandes: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);

      const { data: jaugesData } = await supabase
        .from("jauges")
        .select("stock_total, en_commande");

      const { count: empruntsCount } = await supabase
        .from("emprunts")
        .select("*", { count: "exact", head: true });

      const jauges = (jaugesData ?? []).reduce(
        (total, item) => total + Number(item.stock_total ?? 0),
        0
      );

      const commandes = (jaugesData ?? []).reduce(
        (total, item) => total + Number(item.en_commande ?? 0),
        0
      );

      const alertes = (jaugesData ?? []).filter(
        (item) => Number(item.stock_total ?? 0) <= 0
      ).length;

      setStats({
        jauges,
        emprunts: empruntsCount ?? 0,
        alertes,
        commandes,
      });

      setLoading(false);
    }

    loadStats();
  }, []);

  return {
    ...stats,
    loading,
  };
}