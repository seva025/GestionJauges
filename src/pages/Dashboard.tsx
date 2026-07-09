import Card from "../components/Card";
import { useDashboardStats } from "../hooks/useDashboardStats";

export default function Dashboard() {
  const { jauges, emprunts, alertes, commandes, loading } = useDashboardStats();

  return (
    <>
      <div style={styles.grid}>
        <Card title="Jauges en stock" value={loading ? "..." : jauges} />
        <Card title="Emprunts en cours" value={loading ? "..." : emprunts} />
        <Card title="Alertes" value={loading ? "..." : alertes} />
        <Card title="Commandes" value={loading ? "..." : commandes} />
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: 20,
  },
};