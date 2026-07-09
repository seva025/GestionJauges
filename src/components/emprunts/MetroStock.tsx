import { useMemo, useState } from "react";
import StockModal from "./StockModal";

export type StockItem = {
  id: number;
  diam: string | number | null;
  type: "" | "MD" | "SPEC";
  total: number;
  enCommande: number;
};

type Props = {
  stock: StockItem[];
  available: (item: StockItem) => number;
  onAddStock: (diam: string, type: "" | "MD" | "SPEC", qty: number) => Promise<void>;
  onRemoveQty: (item: StockItem, qty: number) => Promise<void>;
  onRemoveAll: (item: StockItem) => Promise<void>;
  onOrder: (item: StockItem, qty: number) => Promise<void>;
  onReceive: (item: StockItem, qty: number) => Promise<void>;
};

type ModalMode = "add" | "removeQty" | "removeAll" | "order" | "receive" | null;

export default function MetroStock({
  stock,
  available,
  onAddStock,
  onRemoveQty,
  onRemoveAll,
  onOrder,
  onReceive,
}: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "" | "MD" | "SPEC">("all");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<StockItem | null>(null);

  const [diam, setDiam] = useState("");
  const [newType, setNewType] = useState<"" | "MD" | "SPEC">("");
  const [qty, setQty] = useState(1);

  const data = useMemo(() => {
    return stock.filter((item) => {
      const okType = filter === "all" || item.type === filter;
      const okSearch = normalizeDiam(item.diam).startsWith(normalizeDiam(search));
      return okType && okSearch;
    });
  }, [stock, search, filter]);

  function closeModal() {
    setModalMode(null);
    setSelected(null);
    setDiam("");
    setNewType("");
    setQty(1);
  }

  async function confirmModal() {
    if (modalMode === "add") {
      await onAddStock(normalizeDiam(diam), newType, qty);
    }

    if (selected && modalMode === "removeQty") {
      await onRemoveQty(selected, qty);
    }

    if (selected && modalMode === "removeAll") {
      await onRemoveAll(selected);
    }

    if (selected && modalMode === "order") {
      await onOrder(selected, qty);
    }

    if (selected && modalMode === "receive") {
      await onReceive(selected, qty);
    }

    closeModal();
  }

  return (
    <>
      <section style={styles.panel}>
        <div style={styles.panelHead}>
          <h3 style={styles.title}>Stock</h3>

          <button
            style={styles.button}
            onClick={() => {
              setModalMode("add");
              setQty(1);
            }}
          >
            + Ajouter une jauge
          </button>
        </div>

        <div style={styles.toolbar}>
          <input
            style={styles.input}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un Ø dans le stock, ex : 2.503"
          />
        </div>

        <div style={styles.filterRow}>
          <FilterButton label="Toutes" active={filter === "all"} onClick={() => setFilter("all")} />
          <FilterButton label="Classiques" active={filter === ""} onClick={() => setFilter("")} />
          <FilterButton label="MD" active={filter === "MD"} onClick={() => setFilter("MD")} />
          <FilterButton label="SPÉC" active={filter === "SPEC"} onClick={() => setFilter("SPEC")} />
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Jauge</th>
              <th style={styles.th}>Total</th>
              <th style={styles.th}>Disponible</th>
              <th style={styles.th}>En commande</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item) => {
              const dispo = available(item);

              return (
                <tr key={item.id}>
                  <td style={styles.td}>
                    Ø {item.diam}
                    <TypeBadge type={item.type} />
                  </td>

                  <td style={styles.td}>{item.total}</td>

                  <td style={styles.td}>
                    <span style={{ ...styles.pill, ...(dispo > 0 ? styles.greenPill : styles.redPill) }}>
                      {dispo}
                    </span>
                  </td>

                  <td style={styles.td}>
                    {item.enCommande > 0 ? (
                      <span style={{ ...styles.pill, ...styles.orangePill }}>
                        {item.enCommande}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        style={styles.smallBtn}
                        onClick={() => {
                          setSelected(item);
                          setQty(1);
                          setModalMode("removeQty");
                        }}
                      >
                        Retirer quantité
                      </button>

                      <button
                        style={styles.smallBtn}
                        onClick={() => {
                          setSelected(item);
                          setModalMode("removeAll");
                        }}
                      >
                        Retirer tout
                      </button>

                      <button
                        style={styles.smallBtn}
                        onClick={() => {
                          setSelected(item);
                          setQty(1);
                          setModalMode("order");
                        }}
                      >
                        Mettre en commande
                      </button>

                      {item.enCommande > 0 && (
                        <button
                          style={styles.smallBtn}
                          onClick={() => {
                            setSelected(item);
                            setQty(1);
                            setModalMode("receive");
                          }}
                        >
                          Réceptionner
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {data.length === 0 && (
              <tr>
                <td style={styles.emptyCell} colSpan={5}>
                  Aucune jauge trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <StockModal
        open={modalMode !== null}
        title={getModalTitle(modalMode)}
        text={getModalText(modalMode, selected)}
        onCancel={closeModal}
        onConfirm={confirmModal}
      >
        {modalMode === "add" && (
          <>
            <input
              style={styles.input}
              value={diam}
              onChange={(event) => setDiam(event.target.value)}
              placeholder="Diamètre ex : 2.503"
            />

            <div style={styles.space} />

            <select
              style={styles.input}
              value={newType}
              onChange={(event) => setNewType(event.target.value as "" | "MD" | "SPEC")}
            >
              <option value="">Classique</option>
              <option value="MD">Métal dur (MD)</option>
              <option value="SPEC">Spéciale (SPÉC)</option>
            </select>

            <div style={styles.space} />

            <QtyInput qty={qty} setQty={setQty} />
          </>
        )}

        {(modalMode === "removeQty" || modalMode === "order" || modalMode === "receive") && (
          <QtyInput qty={qty} setQty={setQty} />
        )}
      </StockModal>
    </>
  );
}

function QtyInput({
  qty,
  setQty,
}: {
  qty: number;
  setQty: (value: number) => void;
}) {
  return (
    <input
      style={styles.input}
      type="number"
      min={1}
      value={qty}
      onChange={(event) => setQty(Number(event.target.value))}
    />
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
        ...styles.filterChip,
        ...(active ? styles.filterActive : {}),
      }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function TypeBadge({ type }: { type: "" | "MD" | "SPEC" }) {
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

function getModalTitle(mode: ModalMode) {
  if (mode === "add") return "Ajouter des jauges";
  if (mode === "removeQty") return "Retirer une quantité";
  if (mode === "removeAll") return "Retirer tout le disponible";
  if (mode === "order") return "Mettre en commande";
  if (mode === "receive") return "Réceptionner la commande";
  return "";
}

function getModalText(mode: ModalMode, item: StockItem | null) {
  if (mode === "add") return "Ajouter une quantité au stock.";

  if (!item) return "";

  const label = `Diamètre Ø ${item.diam}${item.type ? ` ${item.type}` : ""}`;

  if (mode === "removeQty") return label;
  if (mode === "removeAll") return `Retirer toutes les jauges disponibles ${label} ?`;
  if (mode === "order") return label;
  if (mode === "receive") {
    return `Commande ${label} — reste à recevoir : ${item.enCommande}`;
  }

  return "";
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
  panelHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    margin: 0,
    fontSize: 22,
    color: "#251116",
  },
  toolbar: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 12,
    alignItems: "center",
    marginBottom: 14,
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
  filterRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  filterChip: {
    border: "1px solid #e3d3d8",
    background: "white",
    color: "#251116",
    borderRadius: 999,
    padding: "8px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },
  filterActive: {
    background: "#8a1538",
    color: "white",
    borderColor: "#8a1538",
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
  redPill: {
    color: "#dc2626",
    background: "#feecec",
  },
  actions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
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
  button: {
    border: "none",
    borderRadius: 13,
    padding: "13px 18px",
    fontWeight: 800,
    background: "#8a1538",
    color: "white",
    cursor: "pointer",
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
  emptyCell: {
    color: "#7a6670",
    fontWeight: 500,
    padding: 20,
    textAlign: "center",
  },
  space: {
    height: 14,
  },
};