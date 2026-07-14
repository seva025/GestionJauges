import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";

type JaugeType = "" | "MD" | "SPEC";
type Filter = "ouvertes" | "terminees" | "toutes";

type Commande = {
  id: number;
  jaugeId: number;
  diam: string | number | null;
  type: JaugeType;
  quantite: number;
  recue: number;
  dateCommande: string;
  dateFin: string | null;
  statut: "ouverte" | "terminee";
  commentaire: string | null;
};

type Reception = {
  id: number;
  commandeId: number;
  quantite: number;
  dateReception: string;
};

export default function Commandes() {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [receptions, setReceptions] = useState<Reception[]>([]);
  const [filter, setFilter] = useState<Filter>("ouvertes");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Commande | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  async function loadData(showLoader = false) {
    if (showLoader) setLoading(true);
    setError("");

    try {
      const [commandesData, receptionsData] = await Promise.all([
        fetchAllCommandes(),
        fetchAllReceptions(),
      ]);

      setCommandes(
        commandesData.map((row: any) => ({
          id: Number(row.id),
          jaugeId: Number(row.jauge_id),
          diam: row.jauges?.diametre ?? row.jauge_id,
          type: (row.jauges?.type_code ?? "") as JaugeType,
          quantite: Number(row.quantite ?? 0),
          recue: Number(row.quantite_recue ?? 0),
          dateCommande: row.date_commande,
          dateFin: row.date_fin ?? null,
          statut: row.statut === "terminee" ? "terminee" : "ouverte",
          commentaire: row.commentaire ?? null,
        }))
      );

      setReceptions(
        receptionsData.map((row: any) => ({
          id: Number(row.id),
          commandeId: Number(row.commande_id),
          quantite: Number(row.quantite ?? 0),
          dateReception: row.date_reception,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData(true);

    const timer = window.setInterval(() => {
      void loadData(false);
    }, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  const visible = useMemo(() => {
    const q = normalizeDiam(search);

    return commandes.filter((commande) => {
      const statutOk =
        filter === "toutes" ||
        (filter === "ouvertes" && commande.statut === "ouverte") ||
        (filter === "terminees" && commande.statut === "terminee");

      const searchOk = !q || normalizeDiam(commande.diam).startsWith(q);
      return statutOk && searchOk;
    });
  }, [commandes, filter, search]);

  const ouvertes = commandes.filter((commande) => commande.statut === "ouverte");
  const totalRestant = ouvertes.reduce(
    (total, commande) => total + Math.max(0, commande.quantite - commande.recue),
    0
  );

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  }

  function openReceive(commande: Commande) {
    setSelected(commande);
    setQty(1);
  }

  function closeReceive() {
    setSelected(null);
    setQty(1);
  }

  async function receive() {
    if (!selected) return;

    const restant = Math.max(0, selected.quantite - selected.recue);

    if (!Number.isInteger(qty) || qty < 1) {
      showToast("Quantité incorrecte");
      return;
    }

    if (qty > restant) {
      showToast("Quantité supérieure au restant à recevoir");
      return;
    }

    setSaving(true);

    try {
      const nouvelleQuantiteRecue = selected.recue + qty;
      const terminee = nouvelleQuantiteRecue >= selected.quantite;

      const { data: jauge, error: jaugeReadError } = await supabase
        .from("jauges")
        .select("stock_total, en_commande")
        .eq("id", selected.jaugeId)
        .single();

      if (jaugeReadError) throw jaugeReadError;

      const { error: receptionError } = await supabase
        .from("commande_receptions")
        .insert({
          commande_id: selected.id,
          quantite: qty,
          date_reception: new Date().toISOString(),
        });

      if (receptionError) throw receptionError;

      const { error: commandeError } = await supabase
        .from("commandes")
        .update({
          quantite_recue: nouvelleQuantiteRecue,
          statut: terminee ? "terminee" : "ouverte",
          date_fin: terminee ? new Date().toISOString() : null,
        })
        .eq("id", selected.id);

      if (commandeError) throw commandeError;

      const { error: jaugeError } = await supabase
        .from("jauges")
        .update({
          stock_total: Number(jauge.stock_total ?? 0) + qty,
          en_commande: Math.max(0, Number(jauge.en_commande ?? 0) - qty),
        })
        .eq("id", selected.jaugeId);

      if (jaugeError) throw jaugeError;

      closeReceive();
      await loadData();
      showToast(terminee ? "Commande terminée" : "Réception enregistrée");
    } catch (err) {
      showToast(
        "Erreur réception : " +
          (err instanceof Error ? err.message : "Erreur inconnue")
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={styles.message}>Connexion à Supabase...</div>;
  if (error) {
    return (
      <div style={styles.error}>
        Erreur : {error}
        <br />
        Exécute d’abord le fichier SQL du patch dans Supabase.
      </div>
    );
  }

  return (
    <>
      <div style={styles.statGrid}>
        <article style={styles.stat}>
          <small style={styles.statLabel}>Commandes ouvertes</small>
          <strong style={styles.orangeValue}>{ouvertes.length}</strong>
        </article>

        <article style={styles.stat}>
          <small style={styles.statLabel}>Jauges à recevoir</small>
          <strong style={styles.blueValue}>{totalRestant}</strong>
        </article>

        <article style={styles.stat}>
          <small style={styles.statLabel}>Commandes terminées</small>
          <strong style={styles.greenValue}>
            {commandes.filter((commande) => commande.statut === "terminee").length}
          </strong>
        </article>
      </div>

      <section style={styles.panel}>
        <div style={styles.panelHead}>
          <div>
            <h2 style={styles.title}>Gestion des commandes</h2>
            <p style={styles.subtitle}>
              Réception partielle ou totale avec mise à jour automatique du stock.
            </p>
          </div>
        </div>

        <div style={styles.toolbar}>
          <input
            style={styles.input}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un Ø, ex : 2.503"
          />

          <div style={styles.filters}>
            <FilterButton
              label="Ouvertes"
              active={filter === "ouvertes"}
              onClick={() => setFilter("ouvertes")}
            />
            <FilterButton
              label="Terminées"
              active={filter === "terminees"}
              onClick={() => setFilter("terminees")}
            />
            <FilterButton
              label="Toutes"
              active={filter === "toutes"}
              onClick={() => setFilter("toutes")}
            />
          </div>
        </div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Jauge</th>
                <th style={styles.th}>Date commande</th>
                <th style={styles.th}>Commandé</th>
                <th style={styles.th}>Reçu</th>
                <th style={styles.th}>Reste</th>
                <th style={styles.th}>Statut</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>

            <tbody>
              {visible.map((commande) => {
                const restant = Math.max(0, commande.quantite - commande.recue);

                return (
                  <tr key={commande.id}>
                    <td style={styles.td}>
                      <strong>Ø {commande.diam}</strong>
                      <TypeBadge type={commande.type} />
                    </td>
                    <td style={styles.td}>{formatDate(commande.dateCommande)}</td>
                    <td style={styles.td}>{commande.quantite}</td>
                    <td style={styles.td}>{commande.recue}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.pill,
                          ...(restant > 0 ? styles.orangePill : styles.greenPill),
                        }}
                      >
                        {restant}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.pill,
                          ...(commande.statut === "ouverte"
                            ? styles.orangePill
                            : styles.greenPill),
                        }}
                      >
                        {commande.statut === "ouverte" ? "Ouverte" : "Terminée"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {commande.statut === "ouverte" ? (
                        <button
                          style={styles.smallButton}
                          onClick={() => openReceive(commande)}
                        >
                          Réceptionner
                        </button>
                      ) : (
                        <span style={styles.muted}>Terminée</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {visible.length === 0 && (
                <tr>
                  <td style={styles.empty} colSpan={7}>
                    Aucune commande trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={styles.panel}>
        <h2 style={styles.title}>Historique des réceptions</h2>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Commande</th>
                <th style={styles.th}>Jauge</th>
                <th style={styles.th}>Quantité reçue</th>
              </tr>
            </thead>
            <tbody>
              {receptions.map((reception) => {
                const commande = commandes.find(
                  (item) => item.id === reception.commandeId
                );

                return (
                  <tr key={reception.id}>
                    <td style={styles.td}>{formatDate(reception.dateReception)}</td>
                    <td style={styles.td}>#{reception.commandeId}</td>
                    <td style={styles.td}>
                      {commande ? (
                        <>
                          Ø {commande.diam}
                          <TypeBadge type={commande.type} />
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={styles.td}>+{reception.quantite}</td>
                  </tr>
                );
              })}

              {receptions.length === 0 && (
                <tr>
                  <td style={styles.empty} colSpan={4}>
                    Aucune réception enregistrée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <div style={styles.overlay} onClick={closeReceive}>
          <section style={styles.modal} onClick={(event) => event.stopPropagation()}>
            <h3 style={styles.modalTitle}>Réceptionner la commande</h3>
            <p style={styles.subtitle}>
              Ø {selected.diam}
              {selected.type ? ` ${selected.type}` : ""} — reste à recevoir :{" "}
              {Math.max(0, selected.quantite - selected.recue)}
            </p>

            <label style={styles.field}>
              <span style={styles.label}>Quantité reçue</span>
              <input
                style={styles.input}
                type="number"
                min={1}
                max={Math.max(0, selected.quantite - selected.recue)}
                value={qty}
                onChange={(event) => setQty(Number(event.target.value))}
                autoFocus
              />
            </label>

            <div style={styles.modalActions}>
              <button style={styles.cancelButton} onClick={closeReceive} disabled={saving}>
                Annuler
              </button>
              <button style={styles.confirmButton} onClick={receive} disabled={saving}>
                {saving ? "Validation..." : "Valider la réception"}
              </button>
            </div>
          </section>
        </div>
      )}

      {toast && <div style={styles.toast}>{toast}</div>}
    </>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      style={{
        ...styles.filterButton,
        ...(active ? styles.filterActive : {}),
      }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function TypeBadge({ type }: { type: JaugeType }) {
  if (!type) return null;

  return (
    <span style={type === "MD" ? styles.typeMd : styles.typeSpec}>
      {type === "MD" ? "MD" : "SPÉC"}
    </span>
  );
}

async function fetchAllCommandes() {
  const all: any[] = [];
  const step = 1000;

  for (let from = 0; ; from += step) {
    const { data, error } = await supabase
      .from("commandes")
      .select(
        "id, jauge_id, quantite, quantite_recue, date_commande, date_fin, statut, commentaire, jauges(id, diametre, type_code)"
      )
      .order("date_commande", { ascending: false })
      .range(from, from + step - 1);

    if (error) throw new Error(error.message);
    all.push(...(data ?? []));
    if (!data || data.length < step) break;
  }

  return all;
}

async function fetchAllReceptions() {
  const all: any[] = [];
  const step = 1000;

  for (let from = 0; ; from += step) {
    const { data, error } = await supabase
      .from("commande_receptions")
      .select("id, commande_id, quantite, date_reception")
      .order("date_reception", { ascending: false })
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

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const styles: Record<string, React.CSSProperties> = {
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
    marginBottom: 18,
  },
  stat: {
    background: "white",
    border: "1px solid #e3d3d8",
    borderRadius: 17,
    boxShadow: "0 18px 50px rgba(78,12,31,.12)",
    padding: 22,
  },
  statLabel: {
    display: "block",
    color: "#667085",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  orangeValue: { display: "block", color: "#f97316", fontSize: 42, marginTop: 8 },
  blueValue: { display: "block", color: "#8a1538", fontSize: 42, marginTop: 8 },
  greenValue: { display: "block", color: "#15803d", fontSize: 42, marginTop: 8 },
  panel: {
    background: "white",
    border: "1px solid #e3d3d8",
    borderRadius: 18,
    boxShadow: "0 18px 50px rgba(78,12,31,.12)",
    padding: 20,
    marginBottom: 18,
  },
  panelHead: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  title: { margin: "0 0 8px", fontSize: 22, color: "#251116" },
  subtitle: { margin: 0, color: "#7a6670", fontWeight: 700 },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    margin: "20px 0 14px",
  },
  input: {
    width: "100%",
    maxWidth: 520,
    border: "1px solid #e3d3d8",
    borderRadius: 13,
    background: "white",
    padding: "14px 16px",
    outline: "none",
    fontSize: 15,
  },
  filters: { display: "flex", gap: 8, flexWrap: "wrap" },
  filterButton: {
    border: "1px solid #e3d3d8",
    background: "white",
    color: "#251116",
    borderRadius: 999,
    padding: "8px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },
  filterActive: { background: "#8a1538", color: "white", borderColor: "#8a1538" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    fontSize: 13,
    textTransform: "uppercase",
    color: "#667085",
    textAlign: "left",
    borderBottom: "1px solid #e3d3d8",
    padding: 12,
    whiteSpace: "nowrap",
  },
  td: {
    padding: "14px 12px",
    borderBottom: "1px solid #edf1f6",
    fontWeight: 600,
    verticalAlign: "middle",
  },
  pill: { borderRadius: 999, padding: "7px 11px", fontWeight: 900, fontSize: 13 },
  orangePill: { color: "#f97316", background: "#fff1e6" },
  greenPill: { color: "#15803d", background: "#e9f8ef" },
  smallButton: {
    border: "1px solid #d9a8b7",
    background: "white",
    color: "#8a1538",
    borderRadius: 10,
    padding: "8px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },
  muted: { color: "#7a6670", fontWeight: 700 },
  empty: { color: "#7a6670", padding: 24, textAlign: "center", fontWeight: 700 },
  typeMd: {
    display: "inline-flex",
    marginLeft: 8,
    borderRadius: 999,
    padding: "3px 8px",
    fontSize: 11,
    fontWeight: 900,
    background: "#e8f1ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
  },
  typeSpec: {
    display: "inline-flex",
    marginLeft: 8,
    borderRadius: 999,
    padding: "3px 8px",
    fontSize: 11,
    fontWeight: 900,
    background: "#f3e8ff",
    color: "#7e22ce",
    border: "1px solid #e9d5ff",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
    padding: 20,
  },
  modal: {
    width: "min(440px, 96vw)",
    background: "white",
    borderRadius: 20,
    padding: 24,
    boxShadow: "0 24px 70px rgba(78,12,31,.22)",
  },
  modalTitle: { margin: "0 0 10px", color: "#251116" },
  field: { display: "flex", flexDirection: "column", gap: 8, marginTop: 18 },
  label: { color: "#251116", fontWeight: 900 },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 },
  cancelButton: {
    border: "none",
    borderRadius: 13,
    padding: "12px 16px",
    background: "#f5e9ee",
    color: "#251116",
    fontWeight: 900,
    cursor: "pointer",
  },
  confirmButton: {
    border: "none",
    borderRadius: 13,
    padding: "12px 16px",
    background: "#8a1538",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
  message: {
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
    zIndex: 10001,
    fontWeight: 800,
  },
};
