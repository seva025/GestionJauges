import type { ReactNode } from "react";
import { colors } from "../theme/colors";

export type Page = "dashboard" | "stock" | "emprunts" | "historique";

type SidebarProps = {
  page: Page;
  setPage: (page: Page) => void;
  onLogout?: () => void;
};

export default function Sidebar({ page, setPage, onLogout }: SidebarProps) {
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
        <NavButton active={page === "dashboard"} onClick={() => setPage("dashboard")}>
          🏠 Tableau de bord
        </NavButton>
        <NavButton active={page === "stock"} onClick={() => setPage("stock")}>
          📏 Stock des jauges
        </NavButton>
        <NavButton active={page === "emprunts"} onClick={() => setPage("emprunts")}>
          👤 Jauges empruntées
        </NavButton>
        <NavButton active={page === "historique"} onClick={() => setPage("historique")}>
          📜 Historique
        </NavButton>
      </nav>

      <div style={styles.spacer} />

      <div style={styles.modeBox}>
        Mode actif
        <br />
        <strong>MÉTROLOGIE</strong>
      </div>

      {onLogout && (
        <button style={styles.logout} onClick={onLogout}>
          ↩ Déconnexion
        </button>
      )}
    </aside>
  );
}

function NavButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.navButton,
        background: active ? colors.primary : "transparent",
      }}
    >
      {children}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    background: `linear-gradient(180deg, ${colors.nav}, ${colors.navDark})`,
    color: "white",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
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
    background: "rgba(255,255,255,.15)",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    fontSize: 22,
    flex: "0 0 auto",
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
  spacer: {
    flex: 1,
  },
  modeBox: {
    border: "1px solid rgba(255,255,255,.18)",
    borderRadius: 15,
    padding: 16,
    color: "#f9dce7",
    marginBottom: 20,
  },
  logout: {
    border: "none",
    background: "transparent",
    color: "#f8e8ee",
    textAlign: "left",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 15,
    padding: "10px 0",
  },
};
