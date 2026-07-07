import Card from "../components/Card";

export default function Dashboard() {
  return (
    <>
      <h1 style={{ marginTop: 0 }}>Tableau de bord</h1>

      <div style={styles.grid}>
        <Card title="Jauges disponibles" value="—" />
        <Card title="Emprunts en cours" value="—" />
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