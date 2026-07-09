import { useState } from "react";
import Sidebar, { type Page } from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Home from "./components/emprunts/Home";
import Dashboard from "./pages/Dashboard";
import Stock from "./pages/Stock";
import Emprunts from "./pages/Emprunts";
import Commandes from "./pages/Commandes";
import Parametres from "./pages/Parametres";

type AppMode = "home" | "collaborateur" | "metrologie";

const PASS = "Metrologie_2024";

export default function App() {
  const [mode, setMode] = useState<AppMode>("home");
  const [page, setPage] = useState<Page>("dashboard");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function loginMetrologie() {
    if (password === PASS) {
      setMode("metrologie");
      setPage("dashboard");
      setPassword("");
      setError("");
      return;
    }

    setError("Mot de passe incorrect");
    window.setTimeout(() => setError(""), 3000);
  }

  function openCollaborateur() {
    setMode("collaborateur");
    setPassword("");
    setError("");
  }

  function retourAccueil() {
    setMode("home");
    setPage("dashboard");
    setPassword("");
    setError("");
  }

  if (mode === "home") {
    return (
      <>
        <Home
          password={password}
          setPassword={setPassword}
          onCollaborateur={openCollaborateur}
          onMetroLogin={loginMetrologie}
        />

        {error && <div style={styles.toast}>{error}</div>}
      </>
    );
  }

  if (mode === "collaborateur") {
    return (
      <Emprunts
        mode="collaborateur"
        onRetourAccueil={retourAccueil}
      />
    );
  }

  return (
    <div style={styles.app}>
      <Sidebar page={page} setPage={setPage} />

      <main style={styles.main}>
        <TopBar title={title(page)} />

        {page === "dashboard" && <Dashboard />}
        {page === "stock" && <Stock />}
        {page === "emprunts" && (
          <Emprunts
            mode="metrologie"
            onRetourAccueil={retourAccueil}
          />
        )}
        {page === "commandes" && <Commandes />}
        {page === "parametres" && <Parametres />}
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
  toast: {
    position: "fixed",
    right: 24,
    bottom: 24,
    background: "#111827",
    color: "white",
    padding: "13px 18px",
    borderRadius: 14,
    boxShadow: "0 18px 50px rgba(78,12,31,.12)",
    zIndex: 9999,
    fontWeight: 800,
  },
};