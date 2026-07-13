type JaugeType = "" | "MD" | "SPEC";

type BorrowItem = {
  rowId: number;
  diam: string | number | null;
  type: JaugeType;
  qty: number;
  returnedQty?: number;
  remainingQty?: number;
};

type EmpruntItem = {
  id: number;
  collab: string;
  date: number;
  status: "emprunte" | "rendu";
  items: BorrowItem[];
};

type Props = {
  emprunts: EmpruntItem[];
};

export default function MetroHistory({ emprunts }: Props) {
  return (
    <section style={styles.panel}>
      <h3 style={styles.title}>Historique</h3>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Collaborateur</th>
            <th style={styles.th}>Jauges empruntées</th>
            <th style={styles.th}>Date emprunt</th>
            <th style={styles.th}>Jours</th>
            <th style={styles.th}>Statut</th>
          </tr>
        </thead>

        <tbody>
          {emprunts.map((emprunt) => (
            <tr key={emprunt.id}>
              <td style={styles.td}>{emprunt.collab || "Sans nom"}</td>

              <td style={styles.td}>
                {emprunt.items.length > 0 ? (
                  <div style={styles.tags}>
                    {emprunt.items.map((item) => (
                      <span key={item.rowId} style={styles.tag}>
                        Ø {item.diam}
                        <TypeBadge type={item.type} /> x{item.qty}
                        {Number(item.returnedQty ?? 0) > 0 && (
                          <small style={styles.returnInfo}>
                            {Number(item.remainingQty ?? item.qty) > 0
                              ? ` · rendu ${item.returnedQty}/${item.qty}`
                              : " · rendu"}
                          </small>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={styles.muted}>Aucune jauge associée</span>
                )}
              </td>

              <td style={styles.td}>{formatDate(emprunt.date)}</td>
              <td style={styles.td}>{days(emprunt.date)}</td>

              <td style={styles.td}>
                {emprunt.status === "rendu" ? (
                  <span style={{ ...styles.pill, ...styles.greenPill }}>Rendu</span>
                ) : (
                  <span style={{ ...styles.pill, ...styles.orangePill }}>En cours</span>
                )}
              </td>
            </tr>
          ))}

          {emprunts.length === 0 && (
            <tr>
              <td style={styles.emptyCell} colSpan={5}>
                Aucun historique.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

function TypeBadge({ type }: { type: JaugeType }) {
  if (type === "MD") return <span style={styles.typeMd}>MD</span>;
  if (type === "SPEC") return <span style={styles.typeSpec}>SPÉC</span>;
  return null;
}

function days(timestamp: number) {
  return Math.floor((Date.now() - timestamp) / 86400000);
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    background: "white",
    border: "1px solid #e3d3d8",
    borderRadius: 18,
    boxShadow: "0 18px 50px rgba(78,12,31,.12)",
    padding: 20,
    marginBottom: 18,
  },
  title: {
    margin: "0 0 18px",
    fontSize: 22,
    color: "#251116",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    fontSize: 13,
    textTransform: "uppercase",
    color: "#667085",
    textAlign: "left",
    borderBottom: "1px solid #e3d3d8",
    padding: 12,
  },
  td: {
    padding: "14px 12px",
    borderBottom: "1px solid #edf1f6",
    fontWeight: 600,
    verticalAlign: "top",
  },
  tags: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  tag: {
    background: "#f5e9ee",
    borderRadius: 999,
    padding: "7px 10px",
    fontWeight: 900,
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    padding: "7px 11px",
    fontWeight: 900,
    fontSize: 13,
  },
  greenPill: {
    color: "#15803d",
    background: "#e9f8ef",
  },
  orangePill: {
    color: "#f97316",
    background: "#fff1e6",
  },
  muted: {
    color: "#7a6670",
    fontWeight: 700,
  },
  returnInfo: {
    marginLeft: 6,
    color: "#15803d",
    fontWeight: 900,
  },
  emptyCell: {
    color: "#7a6670",
    fontWeight: 500,
    padding: 20,
    textAlign: "center",
  },
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
};
