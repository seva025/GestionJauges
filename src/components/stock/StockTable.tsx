import { useMemo, useState } from "react";
import type { Jauge } from "../../models/jauge";

type SortKey = "id" | "diametre" | "type_code" | "stock_total" | "en_commande";
type SortDirection = "asc" | "desc";
type PageSize = 50 | 100 | 250 | "all";

type StockTableProps = {
  jauges: Jauge[];
  selectedId: number | null;
  setSelectedId: (id: number) => void;
  loading: boolean;
  onOpenJauge: (jauge: Jauge) => void;
};

export default function StockTable({
  jauges,
  selectedId,
  setSelectedId,
  loading,
  onOpenJauge,
}: StockTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("diametre");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [pageSize, setPageSize] = useState<PageSize>(100);
  const [page, setPage] = useState(1);
  const [menu, setMenu] = useState<{ x: number; y: number; jauge: Jauge } | null>(null);

  function handleSort(key: SortKey) {
    setPage(1);
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  }

  const sortedJauges = useMemo(() => {
    return [...jauges].sort((a, b) => {
      const valueA = getSortValue(a, sortKey);
      const valueB = getSortValue(b, sortKey);

      if (typeof valueA === "number" && typeof valueB === "number") {
        return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
      }

      return sortDirection === "asc"
        ? String(valueA).localeCompare(String(valueB), "fr", { numeric: true })
        : String(valueB).localeCompare(String(valueA), "fr", { numeric: true });
    });
  }, [jauges, sortKey, sortDirection]);

  const totalPages =
    pageSize === "all"
      ? 1
      : Math.max(1, Math.ceil(sortedJauges.length / pageSize));

  const safePage = Math.min(page, totalPages);

  const visibleJauges = useMemo(() => {
    if (pageSize === "all") return sortedJauges;
    const start = (safePage - 1) * pageSize;
    return sortedJauges.slice(start, start + pageSize);
  }, [sortedJauges, pageSize, safePage]);

  const totals = useMemo(() => {
    return {
      references: sortedJauges.length,
      stockTotal: sortedJauges.reduce(
        (total, jauge) => total + Number(jauge.stock_total ?? 0),
        0
      ),
      enCommande: sortedJauges.reduce(
        (total, jauge) => total + Number(jauge.en_commande ?? 0),
        0
      ),
      ruptures: sortedJauges.filter((jauge) => Number(jauge.stock_total ?? 0) <= 0)
        .length,
    };
  }, [sortedJauges]);

  function closeMenu() {
    setMenu(null);
  }

  function copyJauge(jauge: Jauge) {
    const text = `Jauge #${jauge.id} - Ø ${jauge.diametre ?? "-"} - Type ${
      jauge.type_code ?? "-"
    } - Stock ${jauge.stock_total ?? 0} - En commande ${jauge.en_commande ?? 0}`;

    navigator.clipboard.writeText(text);
    closeMenu();
  }

  return (
    <div style={styles.card} onClick={closeMenu}>
      <div style={styles.header}>
        <strong>{sortedJauges.length} résultat(s)</strong>

        <div style={styles.headerRight}>
          {loading && <span style={styles.loading}>Chargement...</span>}

          <select
            style={styles.pageSize}
            value={String(pageSize)}
            onChange={(event) => {
              const value = event.target.value;
              setPage(1);
              setPageSize(value === "all" ? "all" : (Number(value) as PageSize));
            }}
          >
            <option value="50">50 lignes</option>
            <option value="100">100 lignes</option>
            <option value="250">250 lignes</option>
            <option value="all">Toutes</option>
          </select>
        </div>
      </div>

      <div style={styles.wrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <SortableHeader label="ID" sortKey="id" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
              <SortableHeader label="Diamètre" sortKey="diametre" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
              <SortableHeader label="Type" sortKey="type_code" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
              <SortableHeader label="Stock" sortKey="stock_total" activeKey={sortKey} direction={sortDirection} onSort={handleSort} align="right" />
              <SortableHeader label="Commande" sortKey="en_commande" activeKey={sortKey} direction={sortDirection} onSort={handleSort} align="right" />
              <th style={styles.th}>État</th>
            </tr>
          </thead>

          <tbody>
            {visibleJauges.map((jauge) => {
              const stockTotal = Number(jauge.stock_total ?? 0);
              const enCommande = Number(jauge.en_commande ?? 0);

              return (
                <tr
                  key={jauge.id}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedId(jauge.id);
                    closeMenu();
                  }}
                  onDoubleClick={() => onOpenJauge(jauge)}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setSelectedId(jauge.id);
                    setMenu({ x: event.clientX, y: event.clientY, jauge });
                  }}
                  style={{
                    ...styles.row,
                    ...getRowStyle(stockTotal, enCommande),
                    ...(selectedId === jauge.id ? styles.selected : {}),
                  }}
                >
                  <td style={styles.td}>#{jauge.id}</td>
                  <td style={styles.tdStrong}>{jauge.diametre ?? "—"}</td>
                  <td style={styles.td}>{jauge.type_code ?? "—"}</td>
                  <td style={styles.tdRight}>{stockTotal}</td>
                  <td style={styles.tdRight}>{enCommande}</td>
                  <td style={styles.td}>
                    <Status stockTotal={stockTotal} enCommande={enCommande} />
                  </td>
                </tr>
              );
            })}

            {!loading && visibleJauges.length === 0 && (
              <tr>
                <td style={styles.empty} colSpan={6}>
                  Aucune jauge trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.footer}>
        <div style={styles.footerStats}>
          <span>{totals.references} référence(s)</span>
          <span>{totals.stockTotal} en stock</span>
          <span>{totals.enCommande} en commande</span>
          <span>{totals.ruptures} rupture(s)</span>
        </div>

        {pageSize !== "all" && (
          <div style={styles.pagination}>
            <button
              style={styles.pageButton}
              disabled={safePage <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Précédent
            </button>

            <span style={styles.pageText}>
              Page {safePage} / {totalPages}
            </span>

            <button
              style={styles.pageButton}
              disabled={safePage >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            >
              Suivant
            </button>
          </div>
        )}
      </div>

      {menu && (
        <div
          style={{
            ...styles.contextMenu,
            left: menu.x,
            top: menu.y,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <button style={styles.menuItem} onClick={() => onOpenJauge(menu.jauge)}>
            Ouvrir la fiche
          </button>
          <button style={styles.menuItem} onClick={() => alert("Modification prévue ensuite")}>
            Modifier
          </button>
          <button style={styles.menuItem} onClick={() => alert("Emprunt prévu en V0.6")}>
            Emprunter
          </button>
          <button style={styles.menuItem} onClick={() => alert("Commande prévue en V0.7")}>
            Commander
          </button>
          <button style={styles.menuItem} onClick={() => copyJauge(menu.jauge)}>
            Copier les informations
          </button>
        </div>
      )}
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sortKey === activeKey;
  const arrow = active ? (direction === "asc" ? "↑" : "↓") : "";

  return (
    <th style={{ ...styles.th, ...(align === "right" ? styles.thRight : {}) }}>
      <button
        type="button"
        style={{
          ...styles.sortButton,
          justifyContent: align === "right" ? "flex-end" : "flex-start",
        }}
        onClick={() => onSort(sortKey)}
      >
        <span>{label}</span>
        <span style={styles.arrow}>{arrow}</span>
      </button>
    </th>
  );
}

function getSortValue(jauge: Jauge, key: SortKey): string | number {
  if (key === "id") return Number(jauge.id ?? 0);
  if (key === "stock_total") return Number(jauge.stock_total ?? 0);
  if (key === "en_commande") return Number(jauge.en_commande ?? 0);
  if (key === "diametre") return String(jauge.diametre ?? "");
  return String(jauge.type_code ?? "");
}

function getRowStyle(stockTotal: number, enCommande: number): React.CSSProperties {
  if (stockTotal <= 0) return { background: "#fff7f7" };
  if (enCommande > 0) return { background: "#fffaf0" };
  return {};
}

function Status({
  stockTotal,
  enCommande,
}: {
  stockTotal: number;
  enCommande: number;
}) {
  if (stockTotal <= 0) {
    return <span style={{ ...styles.badge, ...styles.red }}>Rupture</span>;
  }

  if (enCommande > 0) {
    return <span style={{ ...styles.badge, ...styles.orange }}>Commande</span>;
  }

  return <span style={{ ...styles.badge, ...styles.green }}>Disponible</span>;
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    position: "relative",
    background: "white",
    borderRadius: 22,
    border: "1px solid #eadde2",
    overflow: "hidden",
    boxShadow: "0 12px 28px rgba(70, 20, 38, 0.08)",
  },
  header: {
    padding: "18px 20px",
    borderBottom: "1px solid #eadde2",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  loading: {
    color: "#7b6670",
    fontWeight: 700,
  },
  pageSize: {
    border: "1px solid #eadde2",
    borderRadius: 12,
    padding: "8px 10px",
    background: "white",
    fontWeight: 800,
    color: "#251116",
  },
  wrapper: {
    overflow: "auto",
    maxHeight: "calc(100vh - 480px)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  th: {
    position: "sticky",
    top: 0,
    zIndex: 2,
    textAlign: "left",
    padding: "0",
    color: "#7b6670",
    fontSize: 12,
    textTransform: "uppercase",
    borderBottom: "1px solid #eadde2",
    background: "#fbf7f8",
  },
  thRight: {
    textAlign: "right",
  },
  sortButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#7b6670",
    fontSize: 12,
    fontWeight: 900,
    textTransform: "uppercase",
    cursor: "pointer",
  },
  arrow: {
    minWidth: 12,
    color: "#8b1538",
    fontWeight: 900,
  },
  row: {
    cursor: "pointer",
    borderBottom: "1px solid #eadde2",
  },
  selected: {
    outline: "2px solid #8b1538",
    outlineOffset: -2,
    background: "#fff1f5",
  },
  td: {
    padding: "14px 16px",
    color: "#251116",
  },
  tdStrong: {
    padding: "14px 16px",
    color: "#251116",
    fontWeight: 900,
  },
  tdRight: {
    padding: "14px 16px",
    textAlign: "right",
    fontWeight: 900,
  },
  empty: {
    padding: 28,
    textAlign: "center",
    color: "#7b6670",
    fontWeight: 800,
  },
  badge: {
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 900,
  },
  green: {
    background: "#dcfce7",
    color: "#166534",
  },
  orange: {
    background: "#ffedd5",
    color: "#c2410c",
  },
  red: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  footer: {
    padding: "14px 20px",
    borderTop: "1px solid #eadde2",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    background: "#fbf7f8",
  },
  footerStats: {
    display: "flex",
    flexWrap: "wrap",
    gap: 14,
    color: "#7b6670",
    fontWeight: 800,
    fontSize: 13,
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  pageButton: {
    border: "1px solid #eadde2",
    borderRadius: 12,
    background: "white",
    padding: "8px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },
  pageText: {
    color: "#251116",
    fontWeight: 900,
    fontSize: 13,
  },
  contextMenu: {
    position: "fixed",
    zIndex: 9999,
    width: 220,
    background: "white",
    border: "1px solid #eadde2",
    borderRadius: 14,
    boxShadow: "0 18px 40px rgba(70, 20, 38, 0.18)",
    padding: 8,
  },
  menuItem: {
    width: "100%",
    border: "none",
    background: "transparent",
    textAlign: "left",
    padding: "10px 12px",
    borderRadius: 10,
    cursor: "pointer",
    color: "#251116",
    fontWeight: 800,
  },
};