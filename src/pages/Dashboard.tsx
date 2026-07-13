import { useEffect, useState } from "react";
import MetroDashboard from "../components/emprunts/MetroDashboard";
import { supabase } from "../services/supabase";

type JaugeType = "" | "MD" | "SPEC";

type StockItem = {
  id: number;
  diam: string | number | null;
  type: JaugeType;
  total: number;
  enCommande: number;
};

type EmpruntItem = {
  id: number;
  collab: string;
  date: number;
  status: "emprunte" | "rendu";
  items: {
    rowId: number;
    jaugeId: number;
    diam: string | number | null;
    type: JaugeType;
    qty: number;
  }[];
};

type DashboardProps = {
  onGoStock?: () => void;
  onGoBorrowed?: () => void;
  onGoHistory?: () => void;
};

export default function Dashboard({
  onGoStock = () => undefined,
  onGoBorrowed = () => undefined,
  onGoHistory = () => undefined,
}: DashboardProps) {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [emprunts, setEmprunts] = useState<EmpruntItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const jaugesData = await fetchAllJauges();
      const empruntsData = await fetchAllEmprunts();

      setStock(
        jaugesData
          .map((jauge: any) => ({
            id: jauge.id,
            diam: jauge.diametre,
            type: (jauge.type_code ?? "") as JaugeType,
            total: Number(jauge.stock_total ?? 0),
            enCommande: Number(jauge.en_commande ?? 0),
          }))
          .sort(sortStock)
      );

      setEmprunts(
        empruntsData.map((emprunt: any) => {
          const items = (emprunt.emprunt_jauges ?? [])
            .map((item: any) => {
              const qty = Number(item.quantite ?? 0);
              const returnedQty = Number(item.quantite_retournee ?? 0);
              return {
                rowId: item.id,
                jaugeId: item.jauge_id,
                diam: item.jauges?.diametre ?? "",
                type: (item.jauges?.type_code ?? "") as JaugeType,
                qty: Math.max(0, qty - returnedQty),
              };
            })
            .filter((item: { diam: string | number | null; qty: number }) => item.diam && item.qty > 0);

          return {
            id: emprunt.id,
            collab: emprunt.collaborateur ?? "",
            date: new Date(emprunt.date_emprunt ?? new Date()).getTime(),
            status: items.length > 0 ? "emprunte" : "rendu",
            items,
          };
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <div style={styles.box}>Connexion à Supabase...</div>;
  }

  if (error) {
    return <div style={styles.error}>Erreur : {error}</div>;
  }

  return (
    <MetroDashboard
      jauges={stock.map((jauge) => ({
        id: jauge.id,
        diametre: jauge.diam,
        type_code: jauge.type,
        stock_total: jauge.total,
        en_commande: jauge.enCommande,
      }))}
      emprunts={emprunts}
      onGoStock={onGoStock}
      onGoBorrowed={onGoBorrowed}
      onGoHistory={onGoHistory}
    />
  );
}

async function fetchAllJauges() {
  const all: any[] = [];
  const step = 1000;

  for (let from = 0; ; from += step) {
    const { data, error } = await supabase
      .from("jauges")
      .select("id, diametre, type_code, stock_total, en_commande")
      .order("diametre", { ascending: true })
      .range(from, from + step - 1);

    if (error) throw new Error(error.message);

    all.push(...(data ?? []));

    if (!data || data.length < step) break;
  }

  return all;
}

async function fetchAllEmprunts() {
  const all: any[] = [];
  const step = 1000;

  for (let from = 0; ; from += step) {
    const { data, error } = await supabase
      .from("emprunts")
      .select(
        "id, collaborateur, date_emprunt, statut, emprunt_jauges(id, jauge_id, quantite, quantite_retournee, jauges(id, diametre, type_code))"
      )
      .order("date_emprunt", { ascending: false })
      .range(from, from + step - 1);

    if (error) throw new Error(error.message);

    all.push(...(data ?? []));

    if (!data || data.length < step) break;
  }

  return all;
}

function sortStock(a: StockItem, b: StockItem) {
  const na = Number.parseFloat(String(a.diam ?? ""));
  const nb = Number.parseFloat(String(b.diam ?? ""));

  if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) {
    return na - nb;
  }

  return String(a.type ?? "").localeCompare(String(b.type ?? ""));
}

const styles: Record<string, React.CSSProperties> = {
  box: {
    background: "white",
    border: "1px solid #e3d3d8",
    borderRadius: 18,
    padding: 24,
    fontWeight: 900,
    color: "#5f0f28",
  },
  error: {
    background: "#feecec",
    color: "#dc2626",
    borderRadius: 18,
    padding: 24,
    fontWeight: 900,
  },
};
