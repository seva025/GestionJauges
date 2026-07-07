type TopBarProps = {
  title: string;
};

export default function TopBar({ title }: TopBarProps) {
  const date = new Date().toLocaleDateString("fr-FR");
  const time = new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <header style={styles.topbar}>
      <div>
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.subtitle}>{date} · {time}</p>
      </div>

      <div style={styles.actions}>
        <button style={styles.bell}>🔔</button>
        <div style={styles.mode}>MÉTROLOGIE</div>
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  title: {
    margin: 0,
    fontSize: 30,
  },
  subtitle: {
    margin: "4px 0 0",
    color: "#7a6670",
    fontWeight: 700,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  bell: {
    width: 48,
    height: 48,
    borderRadius: "999px",
    border: "1px solid #e3d3d8",
    background: "white",
    fontSize: 22,
    cursor: "pointer",
  },
  mode: {
    color: "#7a6670",
    fontWeight: 900,
  },
};