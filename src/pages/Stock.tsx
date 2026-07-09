import { useEffect, useState } from "react";
import MetroStock, { type StockItem } from "../components/emprunts/MetroStock";
import { supabase } from "../services/supabase";

type JaugeType = "" | "MD" | "SPEC";

type EmpruntItem = {
  status: "emprunte" | "rendu";
  items: {
    jaugeId: number;
    qty: number;
  }[];
};

export default function Stock() {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [emprunts, setEmprunts] = useState<EmpruntItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
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
        empruntsData.map((emprunt: any) => ({
          status:
            emprunt.statut === "RETOURNE" || emprunt.statut === "rendu"
              ? "rendu"
              : "emprunte",
          items: (emprunt.emprunt_jauges ?? []).map((item: any) => ({
            jaugeId: item.jauge_id,
            qty: Number(item.quantite ?? 0),
          })),
        }))
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

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  }

  function borrowedByJaugeId(jaugeId: number) {
    return emprunts
      .filter((emprunt) => emprunt.status === "emprunte")
      .flatMap((emprunt) => emprunt.items)
      .filter((item) => item.jaugeId === jaugeId)
      .reduce((total, item) => total + item.qty, 0);
  }

  function available(item: StockItem) {
    return Math.max(0, item.total - borrowedByJaugeId(item.id));
  }

  async function handleAddStock(diam: string, type: JaugeType, qty: number) {
    if (!diam || qty < 1) {
      showToast("Valeur incorrecte");
      return;
    }

    const existing = stock.find((item) => normalizeDiam(item.diam) === normalizeDiam(diam) && item.type === type);

    try {
      if (existing) {
        const { error } = await supabase
          .from("jauges")
          .update({ stock_total: existing.total + qty })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("jauges").insert({
          diametre: normalizeDiam(diam),
          type_code: type,
          stock_total: qty,
          en_commande: 0,
        });

        if (error) throw error;
      }

      await loadData();
      showToast("Stock mis à jour");
    } catch (err) {
      showToast("Erreur stock : " + (err instanceof Error ? err.message : "Erreur inconnue"));
    }
  }

  async function handleRemoveQty(item: StockItem, qty: number) {
    if (qty < 1) {
      showToast("Quantité incorrecte");
      return;
    }

    if (qty > available(item)) {
      showToast("Impossible : quantité empruntée ou stock insuffisant");
      return;
    }

    try {
      const { error } = await supabase
        .from("jauges")
        .update({ stock_total: item.total - qty })
        .eq("id", item.id);

      if (error) throw error;

      await loadData();
      showToast("Stock mis à jour");
    } catch (err) {
      showToast("Erreur retrait : " + (err instanceof Error ? err.message : "Erreur inconnue"));
    }
  }

  async function handleRemoveAll(item: StockItem) {
    const qty = available(item);

    if (qty <= 0) {
      showToast("Aucune jauge disponible à retirer");
      return;
    }

    await handleRemoveQty(item, qty);
  }

  async function handleOrder(item: StockItem, qty: number) {
    if (qty < 1) {
      showToast("Quantité incorrecte");
      return;
    }

    try {
      const { error } = await supabase
        .from("jauges")
        .update({ en_commande: item.enCommande + qty })
        .eq("id", item.id);

      if (error) throw error;

      await loadData();
      showToast("Commande enregistrée");
    } catch (err) {
      showToast("Erreur commande : " + (err instanceof Error ? err.message : "Erreur inconnue"));
    }
  }

  async function handleReceive(item: StockItem, qty: number) {
    if (qty < 1) {
      showToast("Quantité incorrecte");
      return;
    }

    if (qty > item.enCommande) {
      showToast("Impossible : quantité supérieure au restant");
      return;
    }

    try {
      const { error } = await supabase
        .from("jauges")
        .update({
          stock_total: item.total + qty,
          en_commande: item.enCommande - qty,
        })
        .eq("id", item.id);

      if (error) throw error;

      await loadData();
      showToast("Commande réceptionnée");
    } catch (err) {
      showToast("Erreur réception : " + (err instanceof Error ? err.message : "Erreur inconnue"));
    }
  }

  if (loading) return <div style={styles.box}>Connexion à Supabase...</div>;
  if (error) return <div style={styles.error}>Erreur : {error}</div>;

  return (
    <>
      <MetroStock
        stock={stock}
        available={available}
        onAddStock={handleAddStock}
        onRemoveQty={handleRemoveQty}
        onRemoveAll={handleRemoveAll}
        onOrder={handleOrder}
        onReceive={handleReceive}
      />

      {toast && <div style={styles.toast}>{toast}</div>}
    </>
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
      .select("id, statut, emprunt_jauges(id, jauge_id, quantite)")
      .range(from, from + step - 1);

    if (error) throw new Error(error.message);

    all.push(...(data ?? []));

    if (!data || data.length < step) break;
  }

  return all;
}

function normalizeDiam(value: string | number | null | undefined) {
  return String(value ?? "").trim().replace(",", ".").replace(/\.$/, "");
}

function sortStock(a: StockItem, b: StockItem) {
  const na = Number.parseFloat(String(a.diam ?? ""));
  const nb = Number.parseFloat(String(b.diam ?? ""));

  if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;

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
  toast: {
    position: "fixed",
    right: 24,
    bottom: 24,
    background: "#111827",
    color: "white",
    padding: "13px 18px",
    borderRadius: 14,
    boxShadow: "0 18px 50px rgba(78,12,31,.12)",
    zIndex: 9999,
    fontWeight: 800,
  },
};
