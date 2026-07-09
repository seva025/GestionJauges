import type { StockFilter } from "../../models/jauge";
type StockToolbarProps = {
  search: string;
  setSearch: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  stockFilter: StockFilter;
  setStockFilter: (value: StockFilter) => void;
  types: string[];
};

export default function StockToolbar({
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  stockFilter,
  setStockFilter,
  types,
}: StockToolbarProps) {
  return (
    <section style={styles.toolbar}>
      <input
        style={styles.input}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Rechercher par diamètre, type ou identifiant..."
      />

      <select
        style={styles.select}
        value={typeFilter}
        onChange={(event) => setTypeFilter(event.target.value)}
      >
        <option value="tous">Tous les types</option>
        {types.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      <select
        style={styles.select}
        value={stockFilter}
        onChange={(event) => setStockFilter(event.target.value as StockFilter)}
      >
        <option value="toutes">Tous les stocks</option>
        <option value="disponibles">Disponibles</option>
        <option value="commande">En commande</option>
        <option value="rupture">Rupture</option>
      </select>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    display: "grid",
    gridTemplateColumns: "1fr 220px 220px",
    gap: 14,
  },
  input: {
    border: "1px solid #eadde2",
    borderRadius: 16,
    padding: "14px 16px",
    fontSize: 15,
    outline: "none",
  },
  select: {
    border: "1px solid #eadde2",
    borderRadius: 16,
    padding: "14px 16px",
    fontSize: 15,
    outline: "none",
    background: "white",
    fontWeight: 800,
  },
};