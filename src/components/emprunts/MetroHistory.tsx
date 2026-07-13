type JaugeType = "" | "MD" | "SPEC";

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

type Props = {
  retours: ReturnHistoryItem[];
};

export default function MetroHistory({ retours }: Props) {
  return (
    <section style={styles.panel}>
      <h3 style={styles.title}>Historique des rangements</h3>
      <p style={styles.subtitle}>
        Chaque rangement apparaît immédiatement sur une ligne séparée.
      </p>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Collaborateur</th>
            <th style={styles.th}>Jauge rangée</th>
            <th style={styles.th}>Quantité</th>
            <th style={styles.th}>Date de rangement</th>
            <th style={styles.th}>Emprunt</th>
          </tr>
        </thead>

        <tbody>
          {retours.map((retour) => (
            <tr key={retour.id}>
              <td style={styles.td}>{retour.collab || "Sans nom"}</td>
              <td style={styles.td}>
                <span style={styles.tag}>
                  Ø {retour.diam}
                  <TypeBadge type={retour.type} />
                </span>
              </td>
              <td style={styles.td}>
                <span style={{ ...styles.pill, ...styles.greenPill }}>
                  x{retour.qty}
                </span>
              </td>
              <td style={styles.td}>{formatDate(retour.dateRetour)}</td>
              <td style={styles.td}>#{retour.empruntId}</td>
            </tr>
          ))}

          {retours.length === 0 && (
            <tr>
              <td style={styles.emptyCell} colSpan={5}>
                Aucun rangement enregistré.
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

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
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
    margin: "0 0 6px",
    fontSize: 22,
    color: "#251116",
  },
  subtitle: {
    margin: "0 0 18px",
    color: "#7a6670",
    fontWeight: 700,
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
    verticalAlign: "middle",
  },
  tag: {
    display: "inline-flex",
    alignItems: "center",
    background: "#f5e9ee",
    borderRadius: 999,
    padding: "7px 10px",
    fontWeight: 900,
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "7px 11px",
    fontWeight: 900,
    fontSize: 13,
  },
  greenPill: {
    color: "#15803d",
    background: "#e9f8ef",
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
