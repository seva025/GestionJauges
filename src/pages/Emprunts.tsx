import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";

type Screen = "home" | "metro";
type MetroTab = "dashboard" | "stock" | "borrowed" | "history";

type JaugeRow = {
  id: number;
  diametre: string | number | null;
  type_code: string | null;
  stock_total: number | null;
  en_commande: number | null;
};

type EmpruntRow = {
  id: number;
  collaborateur: string | null;
  date_emprunt: string | null;
  statut: string | null;
};

const PASS = "Metrologie_2024";

export default function Emprunts() {
  const [screen, setScreen] = useState<Screen>("home");
  const [metroTab, setMetroTab] = useState<MetroTab>("dashboard");
  const [password, setPassword] = useState("");
  const [jauges, setJauges] = useState<JaugeRow[]>([]);
  const [emprunts, setEmprunts] = useState<EmpruntRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  async function loadData() {
    setLoading(true);

    const { data: jaugesData } = await supabase
      .from("jauges")
      .select("id, diametre, type_code, stock_total, en_commande");

    const { data: empruntsData } = await supabase
      .from("emprunts")
      .select("id, collaborateur, date_emprunt, statut")
      .order("date_emprunt", { ascending: false });

    setJauges((jaugesData ?? []) as JaugeRow[]);
    setEmprunts((empruntsData ?? []) as EmpruntRow[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  }

  function login() {
    if (password === PASS) {
      setScreen("metro");
      setPassword("");
    } else {
      showToast("Mot de passe incorrect");
    }
  }

  const stats = useMemo(() => {
    const totalStock = jauges.reduce(
      (sum, jauge) => sum + Number(jauge.stock_total ?? 0),
      0
    );

    const refs = jauges.filter((jauge) => Number(jauge.stock_total ?? 0) > 0)
      .length;

    const enCours = emprunts.filter(
      (emprunt) =>
        emprunt.statut === "EN_COURS" || emprunt.statut === "emprunte"
    );

    const alertes = enCours.filter((emprunt) => {
      if (!emprunt.date_emprunt) return false;
      const days =
        (Date.now() - new Date(emprunt.date_emprunt).getTime()) / 86400000;
      return days >= 30;
    }).length;

    return {
      totalStock,
      refs,
      emprunts: enCours.length,
      alertes,
    };
  }, [jauges, emprunts]);

  if (loading) {
    return (
      <div style={styles.home}>
        <section style={styles.homeCard}>
          <div style={styles.brand}>
            <div style={styles.logo}>JW</div>
            <div>
              <h1>Gestion des jauges</h1>
              <p style={styles.muted}>Connexion à Supabase...</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      {screen === "home" && (
        <div style={styles.home}>
          <section style={styles.homeCard}>
            <div style={styles.brand}>
              <div style={styles.logo}>JW</div>
              <div>
                <h1 style={styles.homeTitle}>Gestion des jauges</h1>
              </div>
            </div>

            <div style={styles.choiceGrid}>
              <button style={styles.choice} onClick={() => showToast("Mode collaborateur bientôt connecté")}>
                <div style={styles.ico}>👤</div>
                <h2>Collaborateur</h2>
              </button>

              <button style={styles.choice}>
                <div style={styles.ico}>🔒</div>
                <h2>Métrologie</h2>
              </button>
            </div>

            <div style={styles.metroLogin}>
              <input
                style={styles.input}
                type="password"
                placeholder="Mot de passe métrologie"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") login();
                }}
              />

              <button style={styles.btn} onClick={login}>
                Connexion
              </button>
            </div>
          </section>
        </div>
      )}

      {screen === "metro" && (
        <div style={styles.metro}>
          <aside style={styles.side}>
            <div style={styles.sideBrand}>
              <div style={styles.sideLogo}>JW</div>
              <div>
                <h1 style={styles.sideTitle}>Gestion Jauges</h1>
                <p style={styles.sideText}>Métrologie</p>
              </div>
            </div>

            <nav>
              <NavButton
                active={metroTab === "dashboard"}
                onClick={() => setMetroTab("dashboard")}
              >
                🏠 Tableau de bord
              </NavButton>

              <NavButton
                active={metroTab === "stock"}
                onClick={() => setMetroTab("stock")}
              >
                📦 Stock des jauges
              </NavButton>

              <NavButton
                active={metroTab === "borrowed"}
                onClick={() => setMetroTab("borrowed")}
              >
                📤 Jauges empruntées
              </NavButton>

              <NavButton
                active={metroTab === "history"}
                onClick={() => setMetroTab("history")}
              >
                📜 Historique
              </NavButton>
            </nav>

            <div style={styles.spacer} />

            <div style={styles.modeBox}>
              Mode actif
              <br />
              <strong>MÉTROLOGIE</strong>
            </div>

            <button style={styles.navBtn} onClick={() => setScreen("home")}>
              ↩ Déconnexion
            </button>
          </aside>

          <main style={styles.main}>
            <div style={styles.metroHead}>
              <div>
                <h2 style={styles.metroTitle}>{getTabTitle(metroTab)}</h2>
                <small style={styles.muted}>
                  {new Date().toLocaleDateString("fr-FR")} ·{" "}
                  {new Date().toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </small>
              </div>

              <div style={styles.headActions}>
                <button style={styles.bell}>🔔</button>
                <div style={styles.clock}>MÉTROLOGIE</div>
              </div>
            </div>

            {metroTab === "dashboard" && (
              <>
                <div style={styles.statGrid}>
                  <article style={styles.stat}>
                    <small>Jauges en stock</small>
                    <div style={styles.statSplit}>
                      <div style={styles.statHalf}>
                        <small>Physiques</small>
                        <strong style={styles.green}>{stats.totalStock}</strong>
                      </div>

                      <div style={styles.statHalf}>
                        <small>Références Ø</small>
                        <strong style={styles.blue}>{stats.refs}</strong>
                      </div>
                    </div>
                  </article>

                  <article style={styles.stat}>
                    <small>Jauges empruntées</small>
                    <strong style={styles.blue}>{stats.emprunts}</strong>
                  </article>

                  <article style={styles.stat}>
                    <small>Alertes</small>
                    <strong style={styles.red}>{stats.alertes}</strong>
                  </article>
                </div>

                <div style={styles.dashboardClean}>
                  <section style={styles.panel}>
                    <div style={styles.panelHead}>
                      <h3>Derniers emprunts en cours</h3>
                      <button
                        style={styles.smallBtn}
                        onClick={() => setMetroTab("borrowed")}
                      >
                        Voir les emprunts
                      </button>
                    </div>

                    {emprunts.length === 0 ? (
                      <div style={styles.empty}>Aucun emprunt en cours.</div>
                    ) : (
                      emprunts.slice(0, 8).map((emprunt) => (
                        <div key={emprunt.id} style={styles.recentCard}>
                          <strong>👤 {emprunt.collaborateur ?? "Sans nom"}</strong>
                          <p style={styles.muted}>
                            {emprunt.date_emprunt
                              ? new Date(emprunt.date_emprunt).toLocaleString("fr-FR")
                              : "Date inconnue"}
                          </p>
                        </div>
                      ))
                    )}
                  </section>

                  <div>
                    <section style={styles.panel}>
                      <h3>Actions rapides</h3>
                      <div style={styles.quickGrid}>
                        <button
                          style={styles.btn}
                          onClick={() => setMetroTab("stock")}
                        >
                          📦 Stock
                        </button>
                        <button
                          style={styles.greenBtn}
                          onClick={() => setMetroTab("borrowed")}
                        >
                          ✅ Ranger
                        </button>
                        <button style={styles.orangeBtn}>🚚 Commandes</button>
                        <button
                          style={styles.outlineBtn}
                          onClick={() => setMetroTab("history")}
                        >
                          📜 Historique
                        </button>
                      </div>
                    </section>

                    <section style={styles.panel}>
                      <div style={styles.panelHead}>
                        <h3>Commandes en cours</h3>
                        <button style={styles.smallBtn}>Voir</button>
                      </div>

                      {jauges.filter((jauge) => Number(jauge.en_commande ?? 0) > 0)
                        .length === 0 ? (
                        <div style={styles.empty}>Aucune commande en cours.</div>
                      ) : (
                        jauges
                          .filter((jauge) => Number(jauge.en_commande ?? 0) > 0)
                          .map((jauge) => (
                            <div key={jauge.id} style={styles.stockLowRow}>
                              <strong>Ø {jauge.diametre}</strong>
                              <span style={styles.orangePill}>
                                {jauge.en_commande} à recevoir
                              </span>
                            </div>
                          ))
                      )}
                    </section>
                  </div>
                </div>
              </>
            )}

            {metroTab !== "dashboard" && (
              <section style={styles.panel}>
                <h3>{getTabTitle(metroTab)}</h3>
                <p style={styles.muted}>Écran en cours de reconstruction React.</p>
              </section>
            )}
          </main>
        </div>
      )}

      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}

function NavButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      style={{
        ...styles.navBtn,
        ...(active ? styles.navBtnActive : {}),
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function getTabTitle(tab: MetroTab) {
  if (tab === "dashboard") return "Tableau de bord";
  if (tab === "stock") return "Stock des jauges";
  if (tab === "borrowed") return "Jauges empruntées";
  return "Historique";
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#fffafb,#f0e6ea)",
    color: "#251116",
    fontFamily: "Segoe UI, Arial, sans-serif",
  },
  home: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 28,
  },
  homeCard: {
    width: "min(760px,94vw)",
    background: "white",
    border: "1px solid #e3d3d8",
    borderRadius: 28,
    boxShadow: "0 18px 50px rgba(78,12,31,.12)",
    padding: 42,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 36,
  },
  logo: {
    width: 62,
    height: 62,
    borderRadius: 18,
    background: "linear-gradient(145deg,#3a0718,#8a1538)",
    color: "white",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    fontSize: 24,
  },
  homeTitle: {
    margin: 0,
    fontSize: 36,
  },
  choiceGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 18,
  },
  choice: {
    border: "1px solid #e3d3d8",
    background: "white",
    borderRadius: 20,
    padding: 28,
    textAlign: "left",
    boxShadow: "0 10px 24px rgba(78,12,31,.06)",
    cursor: "pointer",
  },
  ico: {
    fontSize: 36,
  },
  metroLogin: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "1fr 180px",
    gap: 12,
  },
  input: {
    width: "100%",
    border: "1px solid #e3d3d8",
    borderRadius: 13,
    background: "white",
    padding: "14px 16px",
    outline: "none",
  },
  btn: {
    border: "none",
    borderRadius: 13,
    padding: "13px 18px",
    fontWeight: 800,
    background: "#8a1538",
    color: "white",
    cursor: "pointer",
  },
  greenBtn: {
    border: "none",
    borderRadius: 13,
    padding: "13px 18px",
    fontWeight: 800,
    background: "#16a34a",
    color: "white",
    cursor: "pointer",
  },
  orangeBtn: {
    border: "none",
    borderRadius: 13,
    padding: "13px 18px",
    fontWeight: 800,
    background: "#f97316",
    color: "white",
    cursor: "pointer",
  },
  outlineBtn: {
    border: "1px solid #9dbce8",
    borderRadius: 13,
    padding: "13px 18px",
    fontWeight: 800,
    background: "white",
    color: "#8a1538",
    cursor: "pointer",
  },
  metro: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "250px 1fr",
  },
  side: {
    background: "linear-gradient(180deg,#3a0718,#21030d)",
    color: "white",
    padding: 22,
    display: "flex",
    flexDirection: "column",
    gap: 22,
  },
  sideBrand: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  sideLogo: {
    width: 62,
    height: 62,
    borderRadius: 18,
    background: "rgba(255,255,255,.14)",
    border: "1px solid rgba(255,255,255,.24)",
    color: "white",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    fontSize: 24,
  },
  sideTitle: {
    margin: 0,
    fontSize: 23,
  },
  sideText: {
    margin: 0,
    color: "#f0c7d3",
  },
  navBtn: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    border: "none",
    background: "transparent",
    color: "#f8e8ee",
    borderRadius: 12,
    padding: "13px 14px",
    textAlign: "left",
    fontWeight: 800,
    width: "100%",
    cursor: "pointer",
  },
  navBtnActive: {
    background: "#8a1538",
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
  },
  main: {
    padding: "24px 28px",
  },
  metroHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  metroTitle: {
    margin: 0,
    fontSize: 28,
  },
  headActions: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  bell: {
    border: "1px solid #e3d3d8",
    background: "white",
    borderRadius: 999,
    width: 48,
    height: 48,
    display: "grid",
    placeItems: "center",
    fontSize: 21,
  },
  clock: {
    color: "#7a6670",
    fontWeight: 700,
  },
  muted: {
    color: "#7a6670",
    fontWeight: 700,
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 16,
    marginBottom: 18,
  },
  stat: {
    background: "white",
    border: "1px solid #e3d3d8",
    borderRadius: 17,
    boxShadow: "0 18px 50px rgba(78,12,31,.12)",
    padding: 22,
  },
  statSplit: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginTop: 12,
  },
  statHalf: {
    borderRadius: 14,
    background: "#fff7fa",
    border: "1px solid #e3d3d8",
    padding: 12,
  },
  green: {
    color: "#15803d",
    fontSize: 34,
    display: "block",
  },
  blue: {
    color: "#8a1538",
    fontSize: 42,
    display: "block",
  },
  red: {
    color: "#dc2626",
    fontSize: 42,
    display: "block",
  },
  dashboardClean: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr",
    gap: 18,
  },
  panel: {
    background: "white",
    border: "1px solid #e3d3d8",
    borderRadius: 18,
    boxShadow: "0 18px 50px rgba(78,12,31,.12)",
    padding: 20,
    marginBottom: 18,
  },
  panelHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  smallBtn: {
    border: "1px solid #d9a8b7",
    background: "white",
    color: "#8a1538",
    borderRadius: 10,
    padding: "8px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },
  recentCard: {
    borderTop: "1px solid #edf1f6",
    padding: "16px 0",
  },
  quickGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  empty: {
    color: "#7a6670",
    fontWeight: 500,
    padding: "20px 0",
  },
  stockLowRow: {
    display: "grid",
    gridTemplateColumns: "1fr 120px",
    alignItems: "center",
    borderTop: "1px solid #edf1f6",
    padding: "13px 0",
    fontWeight: 900,
  },
  orangePill: {
    color: "#f97316",
    background: "#fff1e6",
    borderRadius: 999,
    padding: "7px 11px",
    fontWeight: 900,
    fontSize: 13,
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
    zIndex: 20,
  },
};