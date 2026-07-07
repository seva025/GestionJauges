import Card from "../components/Card";

export default function Dashboard() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gap: 20
      }}
    >
      <Card title="Jauges disponibles" value="2376" />
      <Card title="Emprunts" value="18" />
      <Card title="Alertes" value="2" />
    </div>
  );
}