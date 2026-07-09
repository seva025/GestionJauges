import { useState } from "react";
import StockStats from "../components/stock/StockStats";
import StockToolbar from "../components/stock/StockToolbar";
import StockTable from "../components/stock/StockTable";
import StockDetails from "../components/stock/StockDetails";
import JaugeSheet from "../components/stock/JaugeSheet";
import { useStock } from "../hooks/useStock";
import type { Jauge } from "../models/jauge";

export default function Stock() {
  const stock = useStock();
  const [sheetJauge, setSheetJauge] = useState<Jauge | null>(null);

  function openSheet(jauge: Jauge) {
    setSheetJauge(jauge);
    stock.setSelectedId(jauge.id);
  }

  function closeSheet() {
    setSheetJauge(null);
  }

  return (
    <div style={styles.page}>
      <section style={styles.header}>
        <div>
          <p style={styles.version}>V0.5</p>
          <h1 style={styles.title}>Stock des jauges</h1>
          <p style={styles.subtitle}>
            Recherche, filtres, tableau, sélection et fiche jauge.
          </p>
        </div>

        <button style={styles.button} onClick={stock.reload}>
          Actualiser
        </button>
      </section>

      <StockStats stats={stock.stats} />

      <StockToolbar
        search={stock.search}
        setSearch={stock.setSearch}
        typeFilter={stock.typeFilter}
        setTypeFilter={stock.setTypeFilter}
        stockFilter={stock.stockFilter}
        setStockFilter={stock.setStockFilter}
        types={stock.types}
      />

      {stock.error && <div style={styles.error}>Erreur : {stock.error}</div>}

      <section style={styles.content}>
        <StockTable
          jauges={stock.filteredJauges}
          selectedId={stock.selectedId}
          setSelectedId={stock.setSelectedId}
          loading={stock.loading}
          onOpenJauge={openSheet}
        />

        <StockDetails jauge={stock.selectedJauge} />
      </section>

      <JaugeSheet
        open={sheetJauge !== null}
        jauge={sheetJauge}
        onClose={closeSheet}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 22,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
  },
  version: {
    margin: "0 0 8px",
    color: "#8b1538",
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: 1,
  },
  title: {
    margin: 0,
    fontSize: 34,
    color: "#251116",
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#7b6670",
    fontWeight: 700,
  },
  button: {
    border: "none",
    borderRadius: 14,
    padding: "13px 18px",
    background: "#8b1538",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
  error: {
    padding: 16,
    borderRadius: 16,
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: 800,
  },
  content: {
    display: "grid",
    gridTemplateColumns: "1fr 360px",
    gap: 20,
    alignItems: "start",
  },
};