import { useEffect, useState } from "react";
import Collaborateur from "../components/emprunts/Collaborateur";
import MetroBorrowed from "../components/emprunts/MetroBorrowed";
import MetroHistory from "../components/emprunts/MetroHistory";
import { supabase } from "../services/supabase";

type AppMode = "collaborateur" | "metrologie";
type MetrologieView = "borrowed" | "history";
type JaugeType = "" | "MD" | "SPEC";

type EmpruntsProps = {
  mode: AppMode;
  onRetourAccueil: () => void;
  view?: MetrologieView;
};

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

export default function Emprunts({ mode, onRetourAccueil, view = "borrowed" }: EmpruntsProps) {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [emprunts, setEmprunts] = useState<EmpruntItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const [collabName, setCollabName] = useState("");
  const [search, setSearch] = useState("");
  const [basket, setBasket] = useState<number[]>([]);
  const [typeFilter, setTypeFilter] = useState<"all" | JaugeType>("all");
  const [borrowedSearch, setBorrowedSearch] = useState("");

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
          id: emprunt.id,
          collab: emprunt.collaborateur ?? "",
          date: new Date(emprunt.date_emprunt ?? new Date()).getTime(),
          status:
            emprunt.statut === "RETOURNE" || emprunt.statut === "rendu"
              ? "rendu"
              : "emprunte",
          items: (emprunt.emprunt_jauges ?? [])
            .map((item: any) => ({
              rowId: item.id,
              jaugeId: item.jauge_id,
              diam: item.jauges?.diametre ?? "",
              type: (item.jauges?.type_code ?? "") as JaugeType,
              qty: Number(item.quantite ?? 0),
            }))
            .filter((item: { diam: string | number | null; qty: number }) => item.diam && item.qty > 0),
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

  function available(jauge: StockItem) {
    return Math.max(0, jauge.total - borrowedByJaugeId(jauge.id));
  }

  function borrowedInBasket(jaugeId: number) {
    return basket.filter((id) => id === jaugeId).length;
  }

  function addBasket(jaugeId: number) {
    const jauge = stock.find((item) => item.id === jaugeId);

    if (!jauge) return;

    if (available(jauge) - borrowedInBasket(jaugeId) <= 0) {
      showToast("Stock insuffisant");
      return;
    }

    setBasket([...basket, jaugeId]);
  }

  async function validateBorrow() {
    const name = collabName.trim().toUpperCase();

    if (!name) {
      showToast("Saisir le nom du collaborateur");
      return;
    }

    if (basket.length === 0) {
      showToast("Ajouter au moins une jauge");
      return;
    }

    const rows = basket.reduce<{ jaugeId: number; quantite: number }[]>(
      (acc, jaugeId) => {
        const existing = acc.find((row) => row.jaugeId === jaugeId);

        if (existing) {
          existing.quantite += 1;
        } else {
          acc.push({ jaugeId, quantite: 1 });
        }

        return acc;
      },
      []
    );

    for (const row of rows) {
      const jauge = stock.find((item) => item.id === row.jaugeId);

      if (!jauge || available(jauge) < row.quantite) {
        showToast("Stock insuffisant");
        return;
      }
    }

    try {
      const { data: emprunt, error: empruntError } = await supabase
        .from("emprunts")
        .insert({
          collaborateur: name,
          date_emprunt: new Date().toISOString(),
          statut: "EN_COURS",
          type_emprunt: "COLLABORATEUR",
          date_retour: null,
          commentaire: null,
        })
        .select("id")
        .single();

      if (empruntError) throw empruntError;

      const lignes = rows.map((row) => ({
        emprunt_id: emprunt.id,
        jauge_id: row.jaugeId,
        quantite: row.quantite,
      }));

      const { error: lignesError } = await supabase.from("emprunt_jauges").insert(lignes);

      if (lignesError) throw lignesError;

      setBasket([]);
      setSearch("");
      setCollabName("");
      await loadData();
      showToast("Emprunt enregistré");
    } catch (err) {
      showToast("Erreur emprunt : " + (err instanceof Error ? err.message : "Erreur inconnue"));
    }
  }

  async function rangeOne(empruntId: number, rowId: number, qty: number) {
    const quantityText = window.prompt("Quantité à ranger", "1");
    const quantity = Number(quantityText ?? "0");

    if (!quantityText) return;

    if (!Number.isFinite(quantity) || quantity < 1) {
      showToast("Quantité incorrecte");
      return;
    }

    if (quantity > qty) {
      showToast("Quantité supérieure à l'emprunt");
      return;
    }

    try {
      if (quantity < qty) {
        const { error } = await supabase
          .from("emprunt_jauges")
          .update({ quantite: qty - quantity })
          .eq("id", rowId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("emprunt_jauges").delete().eq("id", rowId);

        if (error) throw error;
      }

      const { data: rest, error: restError } = await supabase
        .from("emprunt_jauges")
        .select("id")
        .eq("emprunt_id", empruntId);

      if (restError) throw restError;

      if (!rest || rest.length === 0) {
        const { error } = await supabase
          .from("emprunts")
          .update({
            statut: "RETOURNE",
            date_retour: new Date().toISOString(),
          })
          .eq("id", empruntId);

        if (error) throw error;
      }

      await loadData();
      showToast("Jauge(s) rangée(s)");
    } catch (err) {
      showToast("Erreur rangement : " + (err instanceof Error ? err.message : "Erreur inconnue"));
    }
  }

  if (loading) return <div style={styles.loading}>Connexion à Supabase...</div>;
  if (error) return <div style={styles.error}>Erreur : {error}</div>;

  if (mode === "collaborateur") {
    return (
      <>
        <Collaborateur
          stock={stock}
          collabName={collabName}
          setCollabName={setCollabName}
          search={search}
          setSearch={setSearch}
          basket={basket}
          setBasket={setBasket}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          available={available}
          borrowedInBasket={borrowedInBasket}
          onAddBasket={addBasket}
          onValidateBorrow={validateBorrow}
          onLogout={onRetourAccueil}
        />

        {toast && <div style={styles.toast}>{toast}</div>}
      </>
    );
  }

  return (
    <>
      {view === "borrowed" && (
        <MetroBorrowed
          emprunts={emprunts}
          search={borrowedSearch}
          setSearch={setBorrowedSearch}
          onRangeOne={rangeOne}
        />
      )}

      {view === "history" && <MetroHistory emprunts={emprunts} />}

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
      .select(
        "id, collaborateur, date_emprunt, statut, emprunt_jauges(id, jauge_id, quantite, jauges(id, diametre, type_code))"
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

  if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;

  return String(a.type ?? "").localeCompare(String(b.type ?? ""));
}

const styles: Record<string, React.CSSProperties> = {
  loading: {
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
