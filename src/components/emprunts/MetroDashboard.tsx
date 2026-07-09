type JaugeRow = {
  id: number;
  diametre: string | number | null;
  type_code: string | null;
  stock_total: number | null;
  en_commande: number | null;
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
    type: "" | "MD" | "SPEC";
    qty: number;
  }[];
};

type MetroDashboardProps = {
  jauges: JaugeRow[];
  emprunts: EmpruntItem[];
  onGoStock: () => void;
  onGoBorrowed: () => void;
  onGoHistory: () => void;
};

export default function MetroDashboard({
  jauges,
  emprunts,
  onGoStock,
  onGoBorrowed,
  onGoHistory,
}: MetroDashboardProps) {
  const empruntsEnCours = emprunts.filter((emprunt) => emprunt.status === "emprunte");

  const totalPhysique = jauges.reduce(
    (total, jauge) => total + Number(jauge.stock_total ?? 0),
    0
  );

  const totalEmprunte = empruntsEnCours
    .flatMap((emprunt) => emprunt.items)
    .reduce((total, item) => total + item.qty, 0);

  const referencesDisponibles = jauges.filter(
    (jauge) => Number(jauge.stock_total ?? 0) > 0
  ).length;

  const alertes = empruntsEnCours.filter((emprunt) => days(emprunt.date) >= 30);

  const commandes = jauges.filter((jauge) => Number(jauge.en_commande ?? 0) > 0);

  return (
    <>
      <div style={styles.statGrid}>
        <article style={styles.stat}>
          <small style={styles.statLabel}>Jauges en stock</small>

          <div style={styles.statSplit}>
            <div style={styles.statHalf}>
              <small style={styles.statSmall}>Physiques</small>
              <strong style={styles.green}>{totalPhysique}</strong>
            </div>

            <div style={styles.statHalf}>
              <small style={styles.statSmall}>Références Ø</small>
              <strong style={styles.blueSmall}>{referencesDisponibles}</strong>
            </div>
          </div>
        </article>

        <article style={styles.stat}>
          <small style={styles.statLabel}>Jauges empruntées</small>
          <strong style={styles.blue}>{totalEmprunte}</strong>
        </article>

        <article style={styles.stat}>
          <small style={styles.statLabel}>Alertes</small>
          <strong style={styles.red}>{alertes.length}</strong>
        </article>
      </div>

      <div style={styles.dashboardClean}>
        <section style={styles.panel}>
          <div style={styles.panelHead}>
            <h3 style={styles.panelTitle}>Derniers emprunts en cours</h3>
            <button style={styles.smallBtn} onClick={onGoBorrowed}>
              Voir les emprunts
            </button>
          </div>

          {empruntsEnCours.length === 0 ? (
            <div style={styles.empty}>Aucun emprunt en cours.</div>
          ) : (
            empruntsEnCours.slice(0, 8).map((emprunt) => (
              <div key={emprunt.id} style={styles.recentCard}>
                <div style={styles.recentTop}>
                  <div style={styles.recentPerson}>👤 {emprunt.collab}</div>

                  <div style={styles.recentMeta}>
                    <span
                      style={{
                        ...styles.dayPill,
                        ...getDayPillStyle(emprunt.date),
                      }}
                    >
                      {days(emprunt.date)} jour{days(emprunt.date) > 1 ? "s" : ""}
                    </span>

                    <button style={styles.smallBtn} onClick={onGoBorrowed}>
                      Ranger
                    </button>
                  </div>
                </div>

                <div style={styles.jaugeBadges}>
                  {emprunt.items.map((item) => (
                    <span key={item.rowId} style={getJaugeChipStyle(item.type)}>
                      Ø {item.diam}
                      {item.type === "MD" ? " MD" : ""}
                      {item.type === "SPEC" ? " SPÉC" : ""}
                      {item.qty > 1 ? ` x${item.qty}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>

        <div>
          <section style={styles.panel}>
            <div style={styles.panelHead}>
              <h3 style={styles.panelTitle}>Actions rapides</h3>
            </div>

            <div style={styles.quickGrid}>
              <button style={styles.btn} onClick={onGoStock}>
                📦 Stock
              </button>

              <button style={styles.greenBtn} onClick={onGoBorrowed}>
                ✅ Ranger
              </button>

              <button style={styles.orangeBtn} onClick={onGoStock}>
                🚚 Commandes
              </button>

              <button style={styles.outlineBtn} onClick={onGoHistory}>
                📜 Historique
              </button>
            </div>
          </section>

          <section style={styles.panel}>
            <div style={styles.panelHead}>
              <h3 style={styles.panelTitle}>Commandes en cours</h3>
              <button style={styles.smallBtn} onClick={onGoStock}>
                Voir
              </button>
            </div>

            {commandes.length === 0 ? (
              <div style={styles.empty}>Aucune commande en cours.</div>
            ) : (
              commandes.map((jauge) => (
                <div key={jauge.id} style={styles.stockLowRow}>
                  <strong>
                    Ø {jauge.diametre}
                    {jauge.type_code === "MD" ? " MD" : ""}
                    {jauge.type_code === "SPEC" ? " SPÉC" : ""}
                  </strong>

                  <span style={styles.orangePill}>
                    {jauge.en_commande} à recevoir
                  </span>
                </div>
              ))
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function days(timestamp: number) {
  return Math.floor((Date.now() - timestamp) / 86400000);
}

function getDayPillStyle(timestamp: number): React.CSSProperties {
  const value = days(timestamp);

  if (value >= 30) return styles.dayDanger;
  if (value >= 20) return styles.dayWarn;

  return styles.dayOk;
}

function getJaugeChipStyle(type: "" | "MD" | "SPEC"): React.CSSProperties {
  if (type === "MD") {
    return {
      ...styles.jaugeChip,
      background: "#e8f1ff",
      color: "#1d4ed8",
      borderColor: "#bfdbfe",
    };
  }

  if (type === "SPEC") {
    return {
      ...styles.jaugeChip,
      background: "#f3e8ff",
      color: "#7e22ce",
      borderColor: "#e9d5ff",
    };
  }

  return {
    ...styles.jaugeChip,
    background: "#e9f8ef",
    color: "#15803d",
    borderColor: "#c8efd5",
  };
}

const styles: Record<string, React.CSSProperties> = {
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
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
  statSplit: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginTop: 12,
  },
  statHalf: {
    borderRadius: 14,
    background: "#fff7fa",
    border: "1px solid #e3d3d8",
    padding: 12,
  },
  statSmall: {
    display: "block",
    color: "#667085",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontSize: 11,
  },
  green: {
    color: "#15803d",
    display: "block",
    fontSize: 32,
    marginTop: 4,
  },
  blueSmall: {
    color: "#8a1538",
    display: "block",
    fontSize: 32,
    marginTop: 4,
  },
  blue: {
    color: "#8a1538",
    display: "block",
    fontSize: 42,
    marginTop: 8,
  },
  red: {
    color: "#dc2626",
    display: "block",
    fontSize: 42,
    marginTop: 8,
  },
  dashboardClean: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr",
    gap: 18,
  },
  panel: {
    background: "white",
    border: "1px solid #e3d3d8",
    borderRadius: 18,
    boxShadow: "0 18px 50px rgba(78,12,31,.12)",
    padding: 20,
    marginBottom: 18,
  },
  panelHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  panelTitle: {
    margin: 0,
    fontSize: 22,
  },
  smallBtn: {
    border: "1px solid #d9a8b7",
    background: "white",
    color: "#8a1538",
    borderRadius: 10,
    padding: "8px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },
  empty: {
    color: "#7a6670",
    fontWeight: 500,
    padding: "20px 0",
  },
  recentCard: {
    borderTop: "1px solid #edf1f6",
    padding: "16px 0",
  },
  recentTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  recentPerson: {
    fontSize: 18,
    fontWeight: 900,
    color: "#251116",
  },
  recentMeta: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  dayPill: {
    borderRadius: 999,
    padding: "7px 12px",
    fontWeight: 900,
    fontSize: 13,
  },
  dayOk: {
    background: "#e9f8ef",
    color: "#15803d",
  },
  dayWarn: {
    background: "#fff1e6",
    color: "#f97316",
  },
  dayDanger: {
    background: "#feecec",
    color: "#dc2626",
  },
  jaugeBadges: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  jaugeChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    padding: "8px 11px",
    fontWeight: 900,
    fontSize: 14,
    border: "1px solid transparent",
  },
  quickGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  btn: {
    border: "none",
    borderRadius: 13,
    padding: "13px 18px",
    fontWeight: 800,
    background: "#8a1538",
    color: "white",
    cursor: "pointer",
  },
  greenBtn: {
    border: "none",
    borderRadius: 13,
    padding: "13px 18px",
    fontWeight: 800,
    background: "#16a34a",
    color: "white",
    cursor: "pointer",
  },
  orangeBtn: {
    border: "none",
    borderRadius: 13,
    padding: "13px 18px",
    fontWeight: 800,
    background: "#f97316",
    color: "white",
    cursor: "pointer",
  },
  outlineBtn: {
    border: "1px solid #9dbce8",
    borderRadius: 13,
    padding: "13px 18px",
    fontWeight: 800,
    background: "white",
    color: "#8a1538",
    cursor: "pointer",
  },
  stockLowRow: {
    display: "grid",
    gridTemplateColumns: "1fr 120px",
    alignItems: "center",
    borderTop: "1px solid #edf1f6",
    padding: "13px 0",
    fontWeight: 900,
  },
  orangePill: {
    color: "#f97316",
    background: "#fff1e6",
    borderRadius: 999,
    padding: "7px 11px",
    fontWeight: 900,
    fontSize: 13,
    textAlign: "center",
  },
};