import { useEffect, useState } from "react";
import Collaborateur from "../components/emprunts/Collaborateur";
import MetroDashboard from "../components/emprunts/MetroDashboard";
import { supabase } from "../services/supabase";

type AppMode = "collaborateur" | "metrologie";
type MetroTab = "dashboard" | "stock" | "borrowed" | "history";
type JaugeType = "" | "MD" | "SPEC";

type EmpruntsProps = {
  mode: AppMode;
  onRetourAccueil: () => void;
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

export default function Emprunts({ mode, onRetourAccueil }: EmpruntsProps) {
  const [metroTab, setMetroTab] = useState<MetroTab>("dashboard");
  const [stock, setStock] = useState<StockItem[]>([]);
  const [emprunts, setEmprunts] = useState<EmpruntItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const [collabName, setCollabName] = useState("");
  const [search, setSearch] = useState("");
  const [basket, setBasket] = useState<number[]>([]);
  const [typeFilter, setTypeFilter] = useState<"all" | JaugeType>("all");

  async function loadData() {
    setLoading(true);

    try {
      const { data: jaugesData, error: jaugesError } = await supabase
        .from("jauges")
        .select("id, diametre, type_code, stock_total, en_commande")
        .order("diametre", { ascending: true });

      if (jaugesError) throw jaugesError;

      const { data: empruntsData, error: empruntsError } = await supabase
        .from("emprunts")
        .select(
          "id, collaborateur, date_emprunt, statut, emprunt_jauges(id, jauge_id, quantite, jauges(id, diametre, type_code))"
        )
        .order("date_emprunt", { ascending: false });

      if (empruntsError) throw empruntsError;

      setStock(
        (jaugesData ?? []).map((jauge: any) => ({
          id: jauge.id,
          diam: jauge.diametre,
          type: (jauge.type_code ?? "") as JaugeType,
          total: Number(jauge.stock_total ?? 0),
          enCommande: Number(jauge.en_commande ?? 0),
        }))
      );

      setEmprunts(
        (empruntsData ?? []).map((emprunt: any) => ({
          id: emprunt.id,
          collab: emprunt.collaborateur ?? "",
          date: new Date(emprunt.date_emprunt ?? new Date()).getTime(),
          status:
            emprunt.statut === "RETOURNE" || emprunt.statut === "rendu"
              ? "rendu"
              : "emprunte",
          items: (emprunt.emprunt_jauges ?? []).map((item: any) => ({
            rowId: item.id,
            jaugeId: item.jauge_id,
            diam: item.jauges?.diametre ?? "",
            type: (item.jauges?.type_code ?? "") as JaugeType,
            qty: Number(item.quantite ?? 0),
          })),
        }))
      );
    } catch (error) {
      showToast(
        "Erreur Supabase : " +
          (error instanceof Error ? error.message : "Erreur inconnue")
      );
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

      const { error: lignesError } = await supabase
        .from("emprunt_jauges")
        .insert(lignes);

      if (lignesError) throw lignesError;

      setBasket([]);
      setSearch("");
      setCollabName("");
      await loadData();
      showToast("Emprunt enregistré");
    } catch (error) {
      showToast(
        "Erreur emprunt : " +
          (error instanceof Error ? error.message : "Erreur inconnue")
      );
    }
  }

  if (loading) {
    return <div style={styles.loading}>Connexion à Supabase...</div>;
  }

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
    <div style={styles.page}>
      <div style={styles.metroNav}>
        <button
          style={navStyle(metroTab === "dashboard")}
          onClick={() => setMetroTab("dashboard")}
        >
          Tableau de bord
        </button>

        <button
          style={navStyle(metroTab === "stock")}
          onClick={() => setMetroTab("stock")}
        >
          Stock
        </button>

        <button
          style={navStyle(metroTab === "borrowed")}
          onClick={() => setMetroTab("borrowed")}
        >
          Jauges empruntées
        </button>

        <button
          style={navStyle(metroTab === "history")}
          onClick={() => setMetroTab("history")}
        >
          Historique
        </button>

        <button style={styles.logout} onClick={onRetourAccueil}>
          Déconnexion
        </button>
      </div>

      {metroTab === "dashboard" && (
        <MetroDashboard
          jauges={stock.map((jauge) => ({
            id: jauge.id,
            diametre: jauge.diam,
            type_code: jauge.type,
            stock_total: jauge.total,
            en_commande: jauge.enCommande,
          }))}
          emprunts={emprunts}
          onGoStock={() => setMetroTab("stock")}
          onGoBorrowed={() => setMetroTab("borrowed")}
          onGoHistory={() => setMetroTab("history")}
        />
      )}

      {metroTab !== "dashboard" && (
        <section style={styles.placeholder}>
          <h2>{getMetroTitle(metroTab)}</h2>
          <p>Écran en cours de reconstruction.</p>
        </section>
      )}

      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}

function getMetroTitle(tab: MetroTab) {
  return {
    dashboard: "Tableau de bord",
    stock: "Stock",
    borrowed: "Jauges empruntées",
    history: "Historique",
  }[tab];
}

function navStyle(active: boolean): React.CSSProperties {
  return {
    border: "none",
    borderRadius: 12,
    padding: "12px 14px",
    fontWeight: 900,
    cursor: "pointer",
    background: active ? "#8a1538" : "white",
    color: active ? "white" : "#251116",
  };
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "calc(100vh - 120px)",
  },
  loading: {
    background: "white",
    border: "1px solid #e3d3d8",
    borderRadius: 18,
    padding: 24,
    fontWeight: 900,
    color: "#5f0f28",
  },
  metroNav: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 20,
  },
  logout: {
    marginLeft: "auto",
    border: "none",
    borderRadius: 12,
    padding: "12px 14px",
    fontWeight: 900,
    cursor: "pointer",
    background: "#f5e9ee",
    color: "#251116",
  },
  placeholder: {
    background: "white",
    border: "1px solid #e3d3d8",
    borderRadius: 18,
    padding: 24,
    boxShadow: "0 18px 50px rgba(78,12,31,.12)",
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
    zIndex: 20,
  },
};