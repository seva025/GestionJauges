import type { ReactNode } from "react";

export type Page = "dashboard" | "stock" | "emprunts" | "commandes" | "parametres";

type SidebarProps = {
  page: Page;
  setPage: (page: Page) => void;
};

export default function Sidebar({ page, setPage }: SidebarProps) {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.brand}>
        <div style={styles.logo}>JW</div>
        <div>
          <h1 style={styles.brandTitle}>Gestion Jauges</h1>
          <p style={styles.brandText}>Métrologie</p>
        </div>
      </div>

      <nav style={styles.nav}>
        <NavButton active={page === "dashboard"} onClick={() => setPage("dashboard")}>🏠 Tableau de bord</NavButton>
        <NavButton active={page === "stock"} onClick={() => setPage("stock")}>📏 Stock</NavButton>
        <NavButton active={page === "emprunts"} onClick={() => setPage("emprunts")}>👤 Emprunts</NavButton>
        <NavButton active={page === "commandes"} onClick={() => setPage("commandes")}>🚚 Commandes</NavButton>
        <NavButton active={page === "parametres"} onClick={() => setPage("parametres")}>⚙️ Paramètres</NavButton>
      </nav>
    </aside>
  );
}

function NavButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.navButton,
        background: active ? "#8a1538" : "transparent",
      }}
    >
      {children}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    background: "linear-gradient(180deg,#3a0718,#21030d)",
    color: "white",
    padding: 24,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 32,
  },
  logo: {
    width: 58,
    height: 58,
    borderRadius: 18,
    background: "rgba(255,255,255,.14)",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    fontSize: 22,
  },
  brandTitle: {
    margin: 0,
    fontSize: 22,
  },
  brandText: {
    margin: 0,
    color: "#f0c7d3",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  navButton: {
    border: "none",
    borderRadius: 12,
    padding: "14px 16px",
    textAlign: "left",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 15,
    color: "white",
  },
};