type StockStatsProps = {
  stats: {
    references: number;
    stockTotal: number;
    enCommande: number;
    ruptures: number;
  };
};

export default function StockStats({ stats }: StockStatsProps) {
  return (
    <section style={styles.grid}>
      <Card label="Références" value={stats.references} />
      <Card label="Stock total" value={stats.stockTotal} />
      <Card label="En commande" value={stats.enCommande} />
      <Card label="Ruptures" value={stats.ruptures} />
    </section>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <article style={styles.card}>
      <span style={styles.label}>{label}</span>
      <strong style={styles.value}>{value}</strong>
    </article>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 16,
  },
  card: {
    background: "white",
    borderRadius: 20,
    padding: 20,
    border: "1px solid #eadde2",
    boxShadow: "0 12px 28px rgba(70, 20, 38, 0.08)",
  },
  label: {
    display: "block",
    color: "#7b6670",
    fontWeight: 800,
    marginBottom: 10,
  },
  value: {
    fontSize: 30,
    color: "#251116",
  },
};