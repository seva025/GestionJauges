import { useState } from "react";
import Sidebar, { type Page } from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");

  return (
    <div style={styles.app}>
      <Sidebar page={page} setPage={setPage} />

      <main style={styles.main}>
        <TopBar title={title(page)} />

        {page === "dashboard" && <Dashboard />}
        {page === "stock" && <h1>Stock des jauges</h1>}
        {page === "emprunts" && <h1>Emprunts</h1>}
        {page === "commandes" && <h1>Commandes</h1>}
        {page === "parametres" && <h1>Paramètres</h1>}
      </main>
    </div>
  );
}

function title(page: Page) {
  return {
    dashboard: "Tableau de bord",
    stock: "Stock des jauges",
    emprunts: "Emprunts",
    commandes: "Commandes",
    parametres: "Paramètres",
  }[page];
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    background: "linear-gradient(135deg,#fffafb,#f0e6ea)",
    fontFamily: "Segoe UI, Arial, sans-serif",
    color: "#251116",
  },
  main: {
    padding: 32,
  },
};