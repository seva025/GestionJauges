import { useEffect, useState } from "react";
import Collaborateur from "../components/emprunts/Collaborateur";
import MetroBorrowed from "../components/emprunts/MetroBorrowed";
import MetroDashboard from "../components/emprunts/MetroDashboard";
import MetroHistory from "../components/emprunts/MetroHistory";
import MetroStock from "../components/emprunts/MetroStock";
import { supabase } from "../services/supabase";

type AppMode = "collaborateur" | "metrologie";
type MetroTab = "dashboard" | "stock" | "borrowed" | "history";
type JaugeType = "" | "MD" | "SPEC";

type EmpruntsProps = {
  mode: AppMode;
  onRetourAccueil: () => void;
  initialTab?: MetroTab;
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

export default function Emprunts({
  mode,
  onRetourAccueil,
  initialTab = "dashboard",
}: EmpruntsProps) {
  const [metroTab, setMetroTab] = useState<MetroTab>(initialTab);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [emprunts, setEmprunts] = useState<EmpruntItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const [collabName, setCollabName] = useState("");
  const [search, setSearch] = useState("");
  const [basket, setBasket] = useState<number[]>([]);
  const [typeFilter, setTypeFilter] = useState<"all" | JaugeType>("all");
  const [borrowedSearch, setBorrowedSearch] = useState("");

  useEffect(() => {
    setMetroTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    loadData();
  }, []);

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
        (jaugesData ?? [])
          .map((jauge: any) => ({
            id: Number(jauge.id),
            diam: jauge.diametre,
            type: (jauge.type_code ?? "") as JaugeType,
            total: Number(jauge.stock_total ?? 0),
            enCommande: Number(jauge.en_commande ?? 0),
          }))
          .sort(sortStock)
      );

      setEmprunts(
        (empruntsData ?? []).map((emprunt: any) => ({
          id: Number(emprunt.id),
          collab: emprunt.collaborateur ?? "",
          date: new Date(emprunt.date_emprunt ?? new Date()).getTime(),
          status:
            emprunt.statut === "RETOURNE" || emprunt.statut === "rendu"
              ? "rendu"
              : "emprunte",
          items: (emprunt.emprunt_jauges ?? [])
            .map((item: any) => ({
              rowId: Number(item.id),
              jaugeId: Number(item.jauge_id),
              diam: item.jauges?.diametre ?? "",
              type: (item.jauges?.type_code ?? "") as JaugeType,
              qty: Number(item.quantite ?? 0),
            }))
            .filter((item: EmpruntItem["items"][number]) => item.qty > 0),
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

        if (existing) existing.quantite += 1;
        else acc.push({ jaugeId, quantite: 1 });

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

  async function addStock(diam: string, type: JaugeType, qty: number) {
    if (!diam || qty < 1) {
      showToast("Valeur incorrecte");
      return;
    }

    const existing = stock.find(
      (item) => normalizeDiam(item.diam) === normalizeDiam(diam) && item.type === type
    );

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
    } catch (error) {
      showToast(
        "Erreur stock : " +
          (error instanceof Error ? error.message : "Erreur inconnue")
      );
    }
  }

  async function removeQty(item: StockItem, qty: number) {
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
    } catch (error) {
      showToast(
        "Erreur retrait : " +
          (error instanceof Error ? error.message : "Erreur inconnue")
      );
    }
  }

  async function removeAll(item: StockItem) {
    const qty = available(item);

    if (qty <= 0) {
      showToast("Aucune jauge disponible à retirer");
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
    } catch (error) {
      showToast(
        "Erreur retrait : " +
          (error instanceof Error ? error.message : "Erreur inconnue")
      );
    }
  }

  async function orderStock(item: StockItem, qty: number) {
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
    } catch (error) {
      showToast(
        "Erreur commande : " +
          (error instanceof Error ? error.message : "Erreur inconnue")
      );
    }
  }

  async function receiveStock(item: StockItem, qty: number) {
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
    } catch (error) {
      showToast(
        "Erreur réception : " +
          (error instanceof Error ? error.message : "Erreur inconnue")
      );
    }
  }

  async function rangeOne(empruntId: number, rowId: number, qty: number) {
    if (qty < 1) {
      showToast("Quantité incorrecte");
      return;
    }

    try {
      if (qty <= 1) {
        const { error } = await supabase
          .from("emprunt_jauges")
          .delete()
          .eq("id", rowId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("emprunt_jauges")
          .update({ quantite: qty - 1 })
          .eq("id", rowId);

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
      showToast("Jauge rangée");
    } catch (error) {
      showToast(
        "Erreur rangement : " +
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

      {metroTab === "stock" && (
        <MetroStock
          stock={stock}
          available={available}
          onAddStock={addStock}
          onRemoveQty={removeQty}
          onRemoveAll={removeAll}
          onOrder={orderStock}
          onReceive={receiveStock}
        />
      )}

      {metroTab === "borrowed" && (
        <MetroBorrowed
          emprunts={emprunts}
          search={borrowedSearch}
          setSearch={setBorrowedSearch}
          onRangeOne={rangeOne}
        />
      )}

      {metroTab === "history" && <MetroHistory emprunts={emprunts} />}

      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}

function normalizeDiam(value: string | number | null | undefined) {
  return String(value ?? "")
    .trim()
    .replace(",", ".")
    .replace(/\.$/, "");
}

function sortStock(a: StockItem, b: StockItem) {
  const na = Number.parseFloat(String(a.diam ?? ""));
  const nb = Number.parseFloat(String(b.diam ?? ""));

  if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;

  return String(a.type ?? "").localeCompare(String(b.type ?? ""));
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
