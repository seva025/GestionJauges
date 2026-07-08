import Card from "../components/Card";
import { useDashboardStats } from "../hooks/useDashboardStats";

export default function Dashboard() {
  const { jauges, emprunts, loading } = useDashboardStats();
console.log("Dashboard chargé");
  return (
    <>
      <h1 style={{ marginTop: 0 }}>Tableau de bord</h1>

      <div style={styles.grid}>
        <Card title="Jauges en stock" value={loading ? "..." : jauges} />
        <Card title="Emprunts en cours" value={loading ? "..." : emprunts} />
        <Card title="Alertes" value="—" />
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 20,
  },
};