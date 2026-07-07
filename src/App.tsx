import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Sidebar, { type Page } from "./components/Sidebar";



export default function App() {
  const [page, setPage] = useState<Page>("dashboard");

  return (
<Sidebar page={page} setPage={setPage} />

      <main style={styles.main}>
        <h2 style={styles.pageTitle}>{title(page)}</h2>
        <Dashboard />
      </main>
    </div>
  );
}

function NavButton(props: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={props.onClick} style={{
      ...styles.navButton,
      background: props.active ? "#8a1538" : "transparent",
      color: "#fff"
    }}>
      {props.children}
    </button>
  );
}

function title(page: Page) {
  return {
    dashboard: "Tableau de bord",
    stock: "Stock des jauges",
    emprunts: "Emprunts",
    commandes: "Commandes",
    parametres: "Paramètres"
  }[page];
}



const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    background: "linear-gradient(135deg, #fffafb, #f0e6ea)",
    fontFamily: "Segoe UI, Arial, sans-serif",
    color: "#251116"
  },
  sidebar: {
    background: "linear-gradient(180deg, #3a0718, #21030d)",
    color: "white",
    padding: 24
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 32
  },
  logo: {
    width: 58,
    height: 58,
    borderRadius: 18,
    background: "rgba(255,255,255,.14)",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    fontSize: 22
  },
  brandTitle: {
    margin: 0,
    fontSize: 22
  },
  brandText: {
    margin: 0,
    color: "#f0c7d3"
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  navButton: {
    border: "none",
    borderRadius: 12,
    padding: "14px 16px",
    textAlign: "left",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 15
  },
  main: {
    padding: 32
  },
  pageTitle: {
    marginTop: 0,
    marginBottom: 24,
    fontSize: 30
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 18
  },
  card: {
    background: "white",
    border: "1px solid #e3d3d8",
    borderRadius: 18,
    padding: 24,
    boxShadow: "0 18px 50px rgba(78,12,31,.12)"
  },
  cardTitle: {
    color: "#667085",
    fontWeight: 900,
    textTransform: "uppercase",
    fontSize: 13
  },
  cardValue: {
    fontSize: 42,
    fontWeight: 900,
    marginTop: 8,
    color: "#8a1538"
  }
};