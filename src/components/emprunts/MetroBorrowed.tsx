type JaugeType = "" | "MD" | "SPEC";

type BorrowItem = {
  rowId: number;
  jaugeId: number;
  diam: string | number | null;
  type: JaugeType;
  qty: number;
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
  search: string;
  setSearch: (value: string) => void;
  onRangeOne: (empruntId: number, rowId: number, qty: number) => Promise<void>;
};

export default function MetroBorrowed({
  emprunts,
  search,
  setSearch,
  onRangeOne,
}: Props) {
  const rows = emprunts
    .filter((emprunt) => emprunt.status === "emprunte")
    .flatMap((emprunt) =>
      emprunt.items
        .filter((item) => matchesDiam(item.diam, search))
        .map((item) => ({ emprunt, item }))
    );

  return (
    <section style={styles.panel}>
      <h3 style={styles.title}>Rechercher une jauge empruntée</h3>
      <p style={styles.muted}>Recherche par Ø pour ranger après contrôle.</p>

      <div style={styles.searchRow}>
        <input
          style={styles.input}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="ex : 2.503"
        />

        <button style={styles.button}>Rechercher</button>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Jauge</th>
            <th style={styles.th}>Collaborateur</th>
            <th style={styles.th}>Date emprunt</th>
            <th style={styles.th}>Jours</th>
            <th style={styles.th}>Action</th>
          </tr>
        </thead>

        <tbody>
          {rows.map(({ emprunt, item }) => (
            <tr key={item.rowId}>
              <td style={styles.td}>
                Ø {item.diam}
                <TypeBadge type={item.type} /> x{item.qty}
              </td>

              <td style={styles.td}>{emprunt.collab}</td>

              <td style={styles.td}>{formatDate(emprunt.date)}</td>

              <td
                style={{
                  ...styles.td,
                  ...getDayStyle(emprunt.date),
                }}
              >
                {days(emprunt.date)}
              </td>

              <td style={styles.td}>
                <button
                  style={styles.smallButton}
                  onClick={() => onRangeOne(emprunt.id, item.rowId, item.qty)}
                >
                  ✅ Rangé
                </button>
              </td>
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td style={styles.emptyCell} colSpan={5}>
                Aucune jauge empruntée trouvée.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={styles.info}>
        Clique sur « Rangé » uniquement après contrôle physique par la
        Métrologie.
      </div>
    </section>
  );
}

function TypeBadge({ type }: { type: JaugeType }) {
  if (type === "MD") {
    return <span style={styles.typeMd}>MD</span>;
  }

  if (type === "SPEC") {
    return <span style={styles.typeSpec}>SPÉC</span>;
  }

  return null;
}

function normalizeDiam(value: string | number | null | undefined) {
  return String(value ?? "")
    .trim()
    .replace(",", ".")
    .replace(/\.$/, "");
}

function matchesDiam(diam: string | number | null | undefined, query: string) {
  const search = normalizeDiam(query);

  if (!search) return true;

  return normalizeDiam(diam).startsWith(search);
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

function getDayStyle(timestamp: number): React.CSSProperties {
  const value = days(timestamp);

  if (value >= 30) {
    return {
      color: "#dc2626",
      fontWeight: 900,
    };
  }

  if (value >= 20) {
    return {
      color: "#f97316",
      fontWeight: 900,
    };
  }

  return {
    color: "#7a6670",
  };
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
    margin: "0 0 8px",
    fontSize: 22,
    color: "#251116",
  },
  muted: {
    color: "#7a6670",
    fontWeight: 700,
    margin: "0 0 16px",
  },
  searchRow: {
    display: "grid",
    gridTemplateColumns: "1fr 150px",
    gap: 12,
    marginBottom: 18,
  },
  input: {
    width: "100%",
    border: "1px solid #e3d3d8",
    borderRadius: 13,
    background: "white",
    padding: "14px 16px",
    outline: "none",
    fontSize: 15,
  },
  button: {
    border: "none",
    borderRadius: 13,
    padding: "13px 18px",
    fontWeight: 800,
    background: "#8a1538",
    color: "white",
    cursor: "pointer",
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
  smallButton: {
    border: "1px solid #d9a8b7",
    background: "white",
    color: "#8a1538",
    borderRadius: 10,
    padding: "8px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },
  emptyCell: {
    color: "#7a6670",
    fontWeight: 500,
    padding: 20,
    textAlign: "center",
  },
  info: {
    background: "#fff2f6",
    border: "1px solid #efd0da",
    color: "#6d0f2a",
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
    fontWeight: 700,
  },
  typeMd: {
    display: "inline-flex",
    alignItems: "center",
    marginLeft: 8,
    borderRadius: 999,
    padding: "3px 8px",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 0.4,
    background: "#e8f1ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
  },
  typeSpec: {
    display: "inline-flex",
    alignItems: "center",
    marginLeft: 8,
    borderRadius: 999,
    padding: "3px 8px",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 0.4,
    background: "#f3e8ff",
    color: "#7e22ce",
    border: "1px solid #e9d5ff",
  },
};