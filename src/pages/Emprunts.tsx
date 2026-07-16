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

type ReturnHistoryItem = {
  id: number;
  empruntId: number;
  lineId: number;
  collab: string;
  dateRetour: number;
  diam: string | number | null;
  type: JaugeType;
  qty: number;
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
    returnedQty?: number;
    remainingQty?: number;
  }[];
};

export default function Emprunts({ mode, onRetourAccueil, view = "borrowed" }: EmpruntsProps) {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [emprunts, setEmprunts] = useState<EmpruntItem[]>([]);
  const [returnHistory, setReturnHistory] = useState<ReturnHistoryItem[]>([]);
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
      const lignesData = await fetchAllEmpruntJauges();
      const retoursData = await fetchAllRetoursJauges();

      const stockItems: StockItem[] = jaugesData
        .map((jauge: any) => ({
          id: jauge.id,
          diam: jauge.diametre,
          type: (jauge.type_code ?? "") as JaugeType,
          total: Number(jauge.stock_total ?? 0),
          enCommande: Number(jauge.en_commande ?? 0),
        }))
        .sort(sortStock);

      const jaugesById = new Map<number, StockItem>();
      stockItems.forEach((jauge) => jaugesById.set(Number(jauge.id), jauge));

      setStock(stockItems);

      const mapEmprunts = (lineRows: any[], useSnapshot: boolean): EmpruntItem[] =>
        empruntsData.map((emprunt: any) => {
          const lignes = lineRows.filter(
            (ligne: any) => Number(ligne.emprunt_id) === Number(emprunt.id)
          );

          const items = lignes
            .map((ligne: any) => {
              const jauge = jaugesById.get(Number(ligne.jauge_id));
              const qty = Number(ligne.quantite ?? 0);
              const returnedQty = Number(ligne.quantite_retournee ?? 0);

              return {
                rowId: Number(ligne.ligne_id ?? ligne.id),
                jaugeId: Number(ligne.jauge_id),
                diam: useSnapshot
                  ? ligne.diametre ?? jauge?.diam ?? ligne.jauge_id
                  : jauge?.diam ?? ligne.jauge_id,
                type: (useSnapshot
                  ? ligne.type_code ?? jauge?.type ?? ""
                  : jauge?.type ?? "") as JaugeType,
                qty,
                returnedQty,
                remainingQty: Math.max(0, qty - returnedQty),
              };
            })
            .filter((item: { qty: number }) => item.qty > 0);

          const hasItems = items.length > 0;
          const hasRemaining = items.some(
            (item) => (item.remainingQty ?? item.qty) > 0
          );

          return {
            id: emprunt.id,
            collab: emprunt.collaborateur ?? "",
            date: new Date(emprunt.date_emprunt ?? new Date()).getTime(),
            status: hasItems
              ? hasRemaining
                ? "emprunte"
                : "rendu"
              : emprunt.statut === "rendu" || emprunt.statut === "RETOURNE"
                ? "rendu"
                : "emprunte",
            items,
          };
        });

      setEmprunts(mapEmprunts(lignesData, false));
      setReturnHistory(
        retoursData.map((retour: any) => ({
          id: Number(retour.id),
          empruntId: Number(retour.emprunt_id),
          lineId: Number(retour.ligne_id),
          collab: retour.collaborateur ?? "",
          dateRetour: new Date(retour.date_retour ?? new Date()).getTime(),
          diam: retour.diametre ?? retour.jauge_id,
          type: (retour.type_code ?? "") as JaugeType,
          qty: Number(retour.quantite ?? 0),
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
      .reduce((total, item) => total + (item.remainingQty ?? item.qty), 0);
  }

  function available(jauge: StockItem) {
    return Math.max(0, jauge.total - borrowedByJaugeId(jauge.id));
  }

  function borrowedInBasket(jaugeId: number) {
    return basket.filter((id) => id === jaugeId).length;
  }

  function addBasket(jaugeId: number, quantite: number) {
    const jauge = stock.find((item) => item.id === jaugeId);

    if (!jauge) return;

    const restant = available(jauge) - borrowedInBasket(jaugeId);

    if (!Number.isInteger(quantite) || quantite < 1) {
      showToast("Quantité incorrecte");
      return;
    }

    if (quantite > restant) {
      showToast(`Stock insuffisant : maximum ${restant}`);
      return;
    }

    setBasket((current) => [
      ...current,
      ...Array.from({ length: quantite }, () => jaugeId),
    ]);
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
          statut: "emprunte",
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

    if (quantityText === null) return;

    const quantity = Number(quantityText);

    if (!Number.isInteger(quantity) || quantity < 1) {
      showToast("Quantité incorrecte");
      return;
    }

    try {
      const { data: ligne, error: ligneError } = await supabase
        .from("emprunt_jauges")
        .select("id, emprunt_id, quantite, quantite_retournee")
        .eq("id", rowId)
        .eq("emprunt_id", empruntId)
        .single();

      if (ligneError) throw ligneError;

      const quantiteInitiale = Number(ligne.quantite ?? 0);
      const dejaRetournee = Number(ligne.quantite_retournee ?? 0);
      const quantiteRestante = Math.max(0, quantiteInitiale - dejaRetournee);

      if (quantiteRestante <= 0) {
        showToast("Cette jauge est déjà entièrement rangée");
        await loadData();
        return;
      }

      if (quantity > quantiteRestante || quantity > qty) {
        showToast("Quantité supérieure au restant à ranger");
        return;
      }

      const { error: updateLineError } = await supabase
        .from("emprunt_jauges")
        .update({ quantite_retournee: dejaRetournee + quantity })
        .eq("id", rowId)
        .eq("emprunt_id", empruntId);

      if (updateLineError) throw updateLineError;

      const { data: lignes, error: lignesError } = await supabase
        .from("emprunt_jauges")
        .select("quantite, quantite_retournee")
        .eq("emprunt_id", empruntId);

      if (lignesError) throw lignesError;

      const toutRendu =
        (lignes ?? []).length > 0 &&
        (lignes ?? []).every(
          (item: any) =>
            Number(item.quantite_retournee ?? 0) >= Number(item.quantite ?? 0)
        );

      const { error: empruntError } = await supabase
        .from("emprunts")
        .update({
          statut: toutRendu ? "rendu" : "emprunte",
          date_retour: toutRendu ? new Date().toISOString() : null,
        })
        .eq("id", empruntId);

      if (empruntError) throw empruntError;

      await loadData();
      showToast(
        toutRendu
          ? "Emprunt entièrement rendu"
          : "Jauge rangée, l'emprunt reste en cours"
      );
    } catch (err) {
      showToast(
        "Erreur rangement : " +
          (err instanceof Error ? err.message : "Erreur inconnue")
      );
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

      {view === "history" && <MetroHistory retours={returnHistory} />}

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
      .select("id, collaborateur, date_emprunt, date_retour, statut, type_emprunt, commentaire")
      .order("date_emprunt", { ascending: false })
      .range(from, from + step - 1);

    if (error) throw new Error(error.message);

    all.push(...(data ?? []));

    if (!data || data.length < step) break;
  }

  return all;
}

async function fetchAllEmpruntJauges() {
  const all: any[] = [];
  const step = 1000;

  for (let from = 0; ; from += step) {
    const { data, error } = await supabase
      .from("emprunt_jauges")
      .select("id, emprunt_id, jauge_id, quantite, quantite_retournee")
      .range(from, from + step - 1);

    if (error) throw new Error(error.message);

    all.push(...(data ?? []));

    if (!data || data.length < step) break;
  }

  return all;
}

async function fetchAllRetoursJauges() {
  const all: any[] = [];
  const step = 1000;

  for (let from = 0; ; from += step) {
    const { data, error } = await supabase
      .from("retours_jauges")
      .select(
        "id, emprunt_id, ligne_id, jauge_id, collaborateur, diametre, type_code, quantite, date_retour"
      )
      .order("date_retour", { ascending: false })
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
