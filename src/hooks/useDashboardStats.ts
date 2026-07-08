import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export function useDashboardStats() {
  const [jauges, setJauges] = useState(0);
  const [emprunts, setEmprunts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: jaugesData, error: jaugesError } = await supabase
        .from("jauges")
        .select("stock_total");

      const { data: empruntsData, error: empruntsError } = await supabase
        .from("emprunts")
        .select("id")
        .eq("statut", "emprunte");

      if (jaugesError) console.error("Erreur jauges:", jaugesError);
      if (empruntsError) console.error("Erreur emprunts:", empruntsError);

      const totalJauges =
        jaugesData?.reduce((sum, jauge) => {
          return sum + Number(jauge.stock_total || 0);
        }, 0) ?? 0;

      setJauges(totalJauges);
      setEmprunts(empruntsData?.length ?? 0);
      setLoading(false);
    }

    load();
  }, []);

  return { jauges, emprunts, loading };
}