import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "../services/supabase";

type Screen = "home" | "collab" | "metro";
type MetroTab = "dashboard" | "stock" | "borrowed" | "history";
type JaugeType = "" | "MD" | "SPEC";

type StockItem = {
  id: number;
  diam: string | number | null;
  type: JaugeType;
  total: number;
  enCommande: number;
};

type BorrowItem = {
  rowId: number;
  jaugeId: number;
  diam: string | number | null;
  type: JaugeType;
  qty: number;
};

type EmpruntItem = {
  id: number;
  collab: string;
  date: number;
  status: "emprunte" | "rendu";
  items: BorrowItem[];
};

const PASS = "Metrologie_2024";

export default function Emprunts() {
  const [screen, setScreen] = useState<Screen>("home");
  const [metroTab, setMetroTab] = useState<MetroTab>("dashboard");
  const [stock, setStock] = useState<StockItem[]>([]);
  const [emprunts, setEmprunts] = useState<EmpruntItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const [password, setPassword] = useState("");
  const [collabName, setCollabName] = useState("");
  const [q, setQ] = useState("");
  const [basket, setBasket] = useState<number[]>([]);
  const [collabTypeFilter, setCollabTypeFilter] = useState<"all" | JaugeType>("all");

  const [stockSearch, setStockSearch] = useState("");
  const [stockListSearch, setStockListSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | JaugeType>("all");

  async function loadRemote() {
    setLoading(true);

    try {
      const jauges = await fetchAllJauges();
      const empruntsData = await fetchAllEmprunts();

      setStock(
        jauges
          .map((jauge) => ({
            id: jauge.id,
            diam: jauge.diametre,
            type: (jauge.type_code ?? "") as JaugeType,
            total: Number(jauge.stock_total ?? 0),
            enCommande: Number(jauge.en_commande ?? 0),
          }))
          .sort(sortStock)
      );

      setEmprunts(
        empruntsData.map((emprunt) => ({
          id: emprunt.id,
          collab: String(emprunt.collaborateur ?? ""),
          date: new Date(emprunt.date_emprunt ?? new Date()).getTime(),
          status: normalizeStatus(emprunt.statut),
          items: (emprunt.emprunt_jauges ?? [])
            .map((item: any) => ({
              rowId: item.id,
              jaugeId: item.jauge_id,
              diam: item.jauges?.diametre ?? "",
              type: (item.jauges?.type_code ?? "") as JaugeType,
              qty: Number(item.quantite ?? 0),
            }))
            .filter((item: BorrowItem) => item.diam && item.qty > 0),
        }))
      );
    } catch (error) {
      showToast(
        "Erreur Supabase : " +
          (error instanceof Error ? error.message : "Erreur inconnue")
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRemote();
  }, []);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  }

  function goHome() {
    setScreen("home");
    setBasket([]);
    setQ("");
    setCollabName("");
    setPassword("");
    setMetroTab("dashboard");
  }

  function loginMetro() {
    if (password === PASS) {
      setScreen("metro");
      setPassword("");
      return;
    }

    showToast("Mot de passe incorrect");
  }

  function stockById(id: number) {
    return stock.find((item) => item.id === id) ?? null;
  }

  function borrowedById(id: number) {
    return emprunts
      .filter((emprunt) => emprunt.status === "emprunte")
      .flatMap((emprunt) => emprunt.items)
      .filter((item) => item.jaugeId === id)
      .reduce((total, item) => total + item.qty, 0);
  }

  function available(item: StockItem) {
    return Math.max(0, item.total - borrowedById(item.id));
  }

  function addBasket(id: number) {
    const item = stockById(id);
    if (!item) return;

    const already = basket.filter((basketId) => basketId === id).length;

    if (available(item) - already <= 0) {
      showToast("Stock insuffisant");
      return;
    }

    setBasket([...basket, id]);
  }

  async function validateBorrow() {
    const name = collabName.trim().toUpperCase();

    if (!name) {
      showToast("Saisir le nom du collaborateur");
      return;
    }

    if (!basket.length) {
      showToast("Ajouter au moins une jauge");
      return;
    }

    const grouped = basket.reduce<{ id: number; qty: number }[]>((acc, id) => {
      const found = acc.find((item) => item.id === id);

      if (found) {
        found.qty += 1;
      } else {
        acc.push({ id, qty: 1 });
      }

      return acc;
    }, []);

    for (const item of grouped) {
      const stockItem = stockById(item.id);

      if (!stockItem || available(stockItem) < item.qty) {
        showToast("Stock insuffisant");
        return;
      }
    }

    try {
      const { data: emprunt, error: empruntError } = await supabase
        .from("emprunts")
        .insert({
          collaborateur: name,
          date_emprunt: new Date().toISOString(),
          statut: "EN_COURS",
          type_emprunt: "COLLABORATEUR",
          date_retour: null,
          commentaire: null,
        })
        .select("id")
        .single();

      if (empruntError) throw empruntError;

      const rows = grouped.map((item) => ({
        emprunt_id: emprunt.id,
        jauge_id: item.id,
        quantite: item.qty,
      }));

      const { error: lineError } = await supabase.from("emprunt_jauges").insert(rows);
      if (lineError) throw lineError;

      setBasket([]);
      setQ("");
      setCollabName("");
      await loadRemote();
      showToast("Emprunt enregistré");
    } catch (error) {
      showToast(
        "Erreur emprunt : " +
          (error instanceof Error ? error.message : "Erreur inconnue")
      );
    }
  }

  async function rangeOne(empruntId: number, rowId: number, qty: number) {
    try {
      if (qty <= 1) {
        const { error } = await supabase.from("emprunt_jauges").delete().eq("id", rowId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("emprunt_jauges")
          .update({ quantite: qty - 1 })
          .eq("id", rowId);

        if (error) throw error;
      }

      const { data: rest, error: restError } = await supabase
        .from("emprunt_jauges")
        .select("id")
        .eq("emprunt_id", empruntId);

      if (restError) throw restError;

      if (!rest || rest.length === 0) {
        const { error } = await supabase
          .from("emprunts")
          .update({
            statut: "RETOURNE",
            date_retour: new Date().toISOString(),
          })
          .eq("id", empruntId);

        if (error) throw error;
      }

      await loadRemote();
      showToast("Jauge rangée");
    } catch (error) {
      showToast(
        "Erreur rangement : " +
          (error instanceof Error ? error.message : "Erreur inconnue")
      );
    }
  }

  const stats = useMemo(() => {
    const total = stock.reduce((sum, item) => sum + item.total, 0);
    const borrowed = emprunts
      .filter((emprunt) => emprunt.status === "emprunte")
      .flatMap((emprunt) => emprunt.items)
      .reduce((sum, item) => sum + item.qty, 0);

    return {
      total,
      borrowed,
      available: total - borrowed,
      refs: stock.filter((item) => available(item) > 0).length,
      alerts: alertList(emprunts).length,
    };
  }, [stock, emprunts]);

  if (loading) {
    return (
      <div style={styles.home}>
        <section style={styles.homeCard}>
          <div style={styles.brand}>
            <div style={styles.logo}>JW</div>
            <div>
              <h1 style={styles.homeTitle}>Gestion des jauges</h1>
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
        <Home
          password={password}
          setPassword={setPassword}
          onCollab={() => setScreen("collab")}
          onLogin={loginMetro}
        />
      )}

      {screen === "collab" && (
        <Collaborateur
          stock={stock}
          q={q}
          setQ={setQ}
          collabName={collabName}
          setCollabName={setCollabName}
          basket={basket}
          setBasket={setBasket}
          typeFilter={collabTypeFilter}
          setTypeFilter={setCollabTypeFilter}
          stockById={stockById}
          available={available}
          addBasket={addBasket}
          validateBorrow={validateBorrow}
          onLogout={goHome}
        />
      )}

      {screen === "metro" && (
        <Metro
          metroTab={metroTab}
          setMetroTab={setMetroTab}
          stock={stock}
          emprunts={emprunts}
          stats={stats}
          stockSearch={stockSearch}
          setStockSearch={setStockSearch}
          stockListSearch={stockListSearch}
          setStockListSearch={setStockListSearch}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          available={available}
          rangeOne={rangeOne}
          onLogout={goHome}
        />
      )}

      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}

function Home({
  password,
  setPassword,
  onCollab,
  onLogin,
}: {
  password: string;
  setPassword: (value: string) => void;
  onCollab: () => void;
  onLogin: () => void;
}) {
  return (
    <div style={styles.home}>
      <section style={styles.homeCard}>
        <div style={styles.brand}>
          <div style={styles.logo}>JW</div>
          <div>
            <h1 style={styles.homeTitle}>Gestion des jauges</h1>
          </div>
        </div>

        <div style={styles.choiceGrid}>
          <button style={styles.choice} onClick={onCollab}>
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
              if (event.key === "Enter") onLogin();
            }}
          />

          <button style={styles.btn} onClick={onLogin}>
            Connexion
          </button>
        </div>
      </section>
    </div>
  );
}

function Collaborateur({
  stock,
  q,
  setQ,
  collabName,
  setCollabName,
  basket,
  setBasket,
  typeFilter,
  setTypeFilter,
  stockById,
  available,
  addBasket,
  validateBorrow,
  onLogout,
}: {
  stock: StockItem[];
  q: string;
  setQ: (value: string) => void;
  collabName: string;
  setCollabName: (value: string) => void;
  basket: number[];
  setBasket: (value: number[]) => void;
  typeFilter: "all" | JaugeType;
  setTypeFilter: (value: "all" | JaugeType) => void;
  stockById: (id: number) => StockItem | null;
  available: (item: StockItem) => number;
  addBasket: (id: number) => void;
  validateBorrow: () => void;
  onLogout: () => void;
}) {
  const results = stock
    .filter(
      (item) =>
        matchesDiam(item.diam, q) &&
        (typeFilter === "all" || item.type === typeFilter)
    )
    .slice(0, 12);

  return (
    <div style={styles.collab}>
      <div style={styles.topbar}>
        <div>
          <h1 style={styles.pageTitle}>Mode collaborateur</h1>
          <p style={styles.muted}>Consulter la disponibilité et emprunter des jauges</p>
        </div>

        <button style={styles.lightBtn} onClick={onLogout}>
          ↩ Déconnexion
        </button>
      </div>

      <section style={styles.card}>
        <div style={styles.grid2}>
          <label style={styles.field}>
            <strong>1. Votre nom</strong>
            <input
              style={styles.input}
              value={collabName}
              onChange={(event) => setCollabName(event.target.value.toUpperCase())}
            />
          </label>

          <label style={styles.field}>
            <strong>2. Rechercher une jauge</strong>
            <input
              style={styles.input}
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="ex : 2.503"
            />
          </label>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Disponibilité</h2>

        <FilterButtons value={typeFilter} onChange={setTypeFilter} />

        {results.length ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Jauge</th>
                <th style={styles.th}>Disponible</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>

            <tbody>
              {results.map((item) => {
                const disponible = available(item);

                return (
                  <tr key={item.id}>
                    <td style={styles.td}>{stockLabel(item)}</td>
                    <td style={styles.td}>
                      {disponible > 0 ? (
                        <span style={{ ...styles.pill, ...styles.greenPill }}>
                          {disponible} en stock
                        </span>
                      ) : (
                        <span style={{ ...styles.pill, ...styles.redPill }}>
                          Non disponible
                        </span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <button
                        style={styles.btn}
                        disabled={disponible <= 0}
                        onClick={() => addBasket(item.id)}
                      >
                        {disponible > 0 ? "Ajouter" : "Indisponible"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={styles.empty}>Aucune jauge trouvée.</div>
        )}
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Emprunt à valider</h2>

        {basket.length ? (
          <div style={styles.tags}>
            {basket.map((id, index) => {
              const item = stockById(id);

              return (
                <span key={`${id}-${index}`} style={styles.tag}>
                  {item ? stockLabel(item) : "Jauge"}
                  <button
                    style={styles.smallBtn}
                    onClick={() => setBasket(basket.filter((_, i) => i !== index))}
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        ) : (
          <div style={styles.empty}>Aucune jauge sélectionnée.</div>
        )}

        <button style={styles.validate} onClick={validateBorrow}>
          VALIDER L’EMPRUNT ({basket.length})
        </button>

        <div style={styles.info}>
          Merci de rendre les jauges au service Métrologie après utilisation.
        </div>
      </section>
    </div>
  );
}

function Metro({
  metroTab,
  setMetroTab,
  stock,
  emprunts,
  stats,
  stockSearch,
  setStockSearch,
  stockListSearch,
  setStockListSearch,
  typeFilter,
  setTypeFilter,
  available,
  rangeOne,
  onLogout,
}: {
  metroTab: MetroTab;
  setMetroTab: (value: MetroTab) => void;
  stock: StockItem[];
  emprunts: EmpruntItem[];
  stats: {
    total: number;
    borrowed: number;
    available: number;
    refs: number;
    alerts: number;
  };
  stockSearch: string;
  setStockSearch: (value: string) => void;
  stockListSearch: string;
  setStockListSearch: (value: string) => void;
  typeFilter: "all" | JaugeType;
  setTypeFilter: (value: "all" | JaugeType) => void;
  available: (item: StockItem) => number;
  rangeOne: (empruntId: number, rowId: number, qty: number) => void;
  onLogout: () => void;
}) {
  return (
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
          <NavButton active={metroTab === "dashboard"} onClick={() => setMetroTab("dashboard")}>
            🏠 Tableau de bord
          </NavButton>
          <NavButton active={metroTab === "stock"} onClick={() => setMetroTab("stock")}>
            📦 Stock des jauges
          </NavButton>
          <NavButton active={metroTab === "borrowed"} onClick={() => setMetroTab("borrowed")}>
            📤 Jauges empruntées
          </NavButton>
          <NavButton active={metroTab === "history"} onClick={() => setMetroTab("history")}>
            📜 Historique
          </NavButton>
        </nav>

        <div style={styles.spacer} />

        <div style={styles.modeBox}>
          Mode actif
          <br />
          <strong>MÉTROLOGIE</strong>
        </div>

        <button style={styles.navBtn} onClick={onLogout}>
          ↩ Déconnexion
        </button>
      </aside>

      <main style={styles.main}>
        <div style={styles.metroHead}>
          <div>
            <h2 style={styles.metroTitle}>{tabTitle(metroTab)}</h2>
            <small style={styles.muted}>
              {new Date().toLocaleDateString("fr-FR")} ·{" "}
              {new Date().toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </small>
          </div>

          <div style={styles.clock}>MÉTROLOGIE</div>
        </div>

        {metroTab === "dashboard" && (
          <DashboardTab
            stats={stats}
            emprunts={emprunts}
            stock={stock}
            setMetroTab={setMetroTab}
          />
        )}

        {metroTab === "stock" && (
          <StockTab
            stock={stock}
            stockListSearch={stockListSearch}
            setStockListSearch={setStockListSearch}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            available={available}
          />
        )}

        {metroTab === "borrowed" && (
          <BorrowedTab
            emprunts={emprunts}
            stockSearch={stockSearch}
            setStockSearch={setStockSearch}
            rangeOne={rangeOne}
          />
        )}

        {metroTab === "history" && <HistoryTab emprunts={emprunts} />}
      </main>
    </div>
  );
}

function DashboardTab({
  stats,
  emprunts,
  stock,
  setMetroTab,
}: {
  stats: {
    total: number;
    borrowed: number;
    available: number;
    refs: number;
    alerts: number;
  };
  emprunts: EmpruntItem[];
  stock: StockItem[];
  setMetroTab: (value: MetroTab) => void;
}) {
  const active = emprunts.filter((emprunt) => emprunt.status === "emprunte").slice(0, 8);

  return (
    <>
      <div style={styles.statGrid}>
        <StatCard label="Jauges en stock" value={stats.available} tone="green" />
        <StatCard label="Jauges empruntées" value={stats.borrowed} tone="blue" />
        <StatCard label="Alertes" value={stats.alerts} tone="red" />
      </div>

      <div style={styles.dashboardGrid}>
        <section style={styles.panel}>
          <div style={styles.panelHead}>
            <h3>Derniers emprunts en cours</h3>
            <button style={styles.smallBtn} onClick={() => setMetroTab("borrowed")}>
              Voir les emprunts
            </button>
          </div>

          {active.length ? (
            active.map((emprunt) => (
              <div key={emprunt.id} style={styles.recentCard}>
                <div style={styles.recentTop}>
                  <strong>👤 {emprunt.collab}</strong>
                  <span style={{ ...styles.dayPill, ...dayPillStyle(emprunt.date, emprunt.status) }}>
                    {days(emprunt.date)} jour(s)
                  </span>
                </div>

                <div style={styles.tags}>
                  {emprunt.items.map((item) => (
                    <span key={item.rowId} style={styles.tag}>
                      {itemLabel(item)}
                      {item.qty > 1 ? ` x${item.qty}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div style={styles.empty}>Aucun emprunt en cours.</div>
          )}
        </section>

        <section style={styles.panel}>
          <h3>Commandes en cours</h3>
          {stock.filter((item) => item.enCommande > 0).length ? (
            stock
              .filter((item) => item.enCommande > 0)
              .map((item) => (
                <div key={item.id} style={styles.stockLowRow}>
                  <strong>{stockLabel(item)}</strong>
                  <span style={{ ...styles.pill, ...styles.orangePill }}>
                    {item.enCommande} à recevoir
                  </span>
                </div>
              ))
          ) : (
            <div style={styles.empty}>Aucune commande en cours.</div>
          )}
        </section>
      </div>
    </>
  );
}

function StockTab({
  stock,
  stockListSearch,
  setStockListSearch,
  typeFilter,
  setTypeFilter,
  available,
}: {
  stock: StockItem[];
  stockListSearch: string;
  setStockListSearch: (value: string) => void;
  typeFilter: "all" | JaugeType;
  setTypeFilter: (value: "all" | JaugeType) => void;
  available: (item: StockItem) => number;
}) {
  const data = stock.filter(
    (item) =>
      matchesDiam(item.diam, stockListSearch) &&
      (typeFilter === "all" || item.type === typeFilter)
  );

  return (
    <section style={styles.panel}>
      <div style={styles.panelHead}>
        <h3>Stock</h3>
      </div>

      <input
        style={styles.input}
        value={stockListSearch}
        onChange={(event) => setStockListSearch(event.target.value)}
        placeholder="Rechercher un Ø dans le stock, ex : 2.503"
      />

      <FilterButtons value={typeFilter} onChange={setTypeFilter} />

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Jauge</th>
            <th style={styles.th}>Total</th>
            <th style={styles.th}>Disponible</th>
            <th style={styles.th}>En commande</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td style={styles.td}>{stockLabel(item)}</td>
              <td style={styles.td}>{item.total}</td>
              <td style={styles.td}>
                <span style={{ ...styles.pill, ...(available(item) > 0 ? styles.greenPill : styles.redPill) }}>
                  {available(item)}
                </span>
              </td>
              <td style={styles.td}>
                {item.enCommande > 0 ? (
                  <span style={{ ...styles.pill, ...styles.orangePill }}>
                    {item.enCommande}
                  </span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function BorrowedTab({
  emprunts,
  stockSearch,
  setStockSearch,
  rangeOne,
}: {
  emprunts: EmpruntItem[];
  stockSearch: string;
  setStockSearch: (value: string) => void;
  rangeOne: (empruntId: number, rowId: number, qty: number) => void;
}) {
  const rows = emprunts
    .filter((emprunt) => emprunt.status === "emprunte")
    .flatMap((emprunt) =>
      emprunt.items
        .filter((item) => matchesDiam(item.diam, stockSearch))
        .map((item) => ({ emprunt, item }))
    );

  return (
    <section style={styles.panel}>
      <h3>Rechercher une jauge empruntée</h3>
      <p style={styles.muted}>Recherche par Ø pour ranger après contrôle.</p>

      <div style={styles.searchRow}>
        <input
          style={styles.input}
          value={stockSearch}
          onChange={(event) => setStockSearch(event.target.value)}
          placeholder="ex : 2.503"
        />
        <button style={styles.btn}>Rechercher</button>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Jauge</th>
            <th style={styles.th}>Collaborateur</th>
            <th style={styles.th}>Date emprunt</th>
            <th style={styles.th}>Jours</th>
            <th style={styles.th}>Action</th>
          </tr>
        </thead>

        <tbody>
          {rows.map(({ emprunt, item }) => (
            <tr key={item.rowId}>
              <td style={styles.td}>
                {itemLabel(item)} x{item.qty}
              </td>
              <td style={styles.td}>{emprunt.collab}</td>
              <td style={styles.td}>{formatDateTime(emprunt.date)}</td>
              <td style={{ ...styles.td, ...dayTextStyle(emprunt.date, emprunt.status) }}>
                {days(emprunt.date)}
              </td>
              <td style={styles.td}>
                <button
                  style={styles.smallBtn}
                  onClick={() => rangeOne(emprunt.id, item.rowId, item.qty)}
                >
                  ✅ Rangé
                </button>
              </td>
            </tr>
          ))}

          {!rows.length && (
            <tr>
              <td style={styles.emptyCell} colSpan={5}>
                Aucune jauge empruntée trouvée.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={styles.info}>
        Clique sur « Rangé » uniquement après contrôle physique par la Métrologie.
      </div>
    </section>
  );
}

function HistoryTab({ emprunts }: { emprunts: EmpruntItem[] }) {
  return (
    <section style={styles.panel}>
      <h3>Historique</h3>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Collaborateur</th>
            <th style={styles.th}>Jauges</th>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Jours</th>
            <th style={styles.th}>Statut</th>
          </tr>
        </thead>

        <tbody>
          {emprunts.map((emprunt) => (
            <tr key={emprunt.id}>
              <td style={styles.td}>{emprunt.collab}</td>
              <td style={styles.td}>
                <div style={styles.tags}>
                  {emprunt.items.map((item) => (
                    <span key={item.rowId} style={styles.tag}>
                      {itemLabel(item)} x{item.qty}
                    </span>
                  ))}
                </div>
              </td>
              <td style={styles.td}>{formatDateTime(emprunt.date)}</td>
              <td style={styles.td}>{days(emprunt.date)}</td>
              <td style={styles.td}>
                {emprunt.status === "rendu" ? (
                  <span style={{ ...styles.pill, ...styles.greenPill }}>Rendu</span>
                ) : (
                  <span style={{ ...styles.pill, ...styles.orangePill }}>En cours</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function FilterButtons({
  value,
  onChange,
}: {
  value: "all" | JaugeType;
  onChange: (value: "all" | JaugeType) => void;
}) {
  return (
    <div style={styles.filterRow}>
      <button
        style={{ ...styles.filterChip, ...(value === "all" ? styles.filterActive : {}) }}
        onClick={() => onChange("all")}
      >
        Toutes
      </button>
      <button
        style={{ ...styles.filterChip, ...(value === "" ? styles.filterActive : {}) }}
        onClick={() => onChange("")}
      >
        Classiques
      </button>
      <button
        style={{ ...styles.filterChip, ...(value === "MD" ? styles.filterActive : {}) }}
        onClick={() => onChange("MD")}
      >
        MD
      </button>
      <button
        style={{ ...styles.filterChip, ...(value === "SPEC" ? styles.filterActive : {}) }}
        onClick={() => onChange("SPEC")}
      >
        SPÉC
      </button>
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

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "blue" | "red";
}) {
  return (
    <article style={styles.stat}>
      <small>{label}</small>
      <strong
        style={{
          color: tone === "green" ? "#15803d" : tone === "red" ? "#dc2626" : "#8a1538",
        }}
      >
        {value}
      </strong>
    </article>
  );
}

function tabTitle(tab: MetroTab) {
  switch (tab) {
    case "dashboard":
      return "Tableau de bord";
    case "stock":
      return "Stock des jauges";
    case "borrowed":
      return "Jauges empruntées";
    case "history":
      return "Historique";
    default:
      return "";
  }
}

async function fetchAllJauges(): Promise<any[]> {
  const all: any[] = [];
  const step = 1000;

  for (let from = 0; ; from += step) {
    const { data, error } = await supabase
      .from("jauges")
      .select("id, diametre, type_code, stock_total, en_commande")
      .order("diametre", { ascending: true })
      .range(from, from + step - 1);

    if (error) throw error;

    all.push(...(data ?? []));

    if (!data || data.length < step) break;
  }

  return all;
}

async function fetchAllEmprunts(): Promise<any[]> {
  const all: any[] = [];
  const step = 1000;

  for (let from = 0; ; from += step) {
    const { data, error } = await supabase
      .from("emprunts")
      .select(
        "id, collaborateur, date_emprunt, statut, type_emprunt, emprunt_jauges(id, jauge_id, quantite, jauges(id, diametre, type_code))"
      )
      .order("date_emprunt", { ascending: false })
      .range(from, from + step - 1);

    if (error) throw error;

    all.push(...(data ?? []));

    if (!data || data.length < step) break;
  }

  return all;
}

function normalizeStatus(value: string | null | undefined): "emprunte" | "rendu" {
  if (value === "RETOURNE" || value === "rendu") return "rendu";
  return "emprunte";
}

function normalizeDiam(value: string | number | null | undefined) {
  return String(value ?? "").trim().replace(",", ".");
}

function matchesDiam(diam: string | number | null | undefined, query: string) {
  const search = normalizeDiam(query);
  if (!search) return true;
  return normalizeDiam(diam).startsWith(search);
}

function sortStock(a: StockItem, b: StockItem) {
  const na = Number.parseFloat(String(a.diam ?? ""));
  const nb = Number.parseFloat(String(b.diam ?? ""));

  if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;

  return String(a.type ?? "").localeCompare(String(b.type ?? ""));
}

function days(timestamp: number) {
  return Math.floor((Date.now() - timestamp) / 86400000);
}

function formatDateTime(timestamp: number) {
  return new Date(timestamp).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function typeText(type: JaugeType) {
  if (type === "MD") return " MD";
  if (type === "SPEC") return " SPÉC";
  return "";
}

function stockLabel(item: StockItem) {
  return `Ø ${item.diam ?? ""}${typeText(item.type)}`;
}

function itemLabel(item: BorrowItem) {
  return `Ø ${item.diam ?? ""}${typeText(item.type)}`;
}

function alertList(emprunts: EmpruntItem[]) {
  return emprunts
    .filter((emprunt) => emprunt.status === "emprunte")
    .filter((emprunt) => days(emprunt.date) >= 30)
    .flatMap((emprunt) => emprunt.items);
}

function dayTextStyle(timestamp: number, status: string): CSSProperties {
  if (status !== "emprunte") return { color: "#15803d" };

  const d = days(timestamp);

  if (d >= 30) return { color: "#dc2626", fontWeight: 900 };
  if (d >= 20) return { color: "#f97316", fontWeight: 900 };

  return { color: "#7a6670" };
}

function dayPillStyle(timestamp: number, status: string): CSSProperties {
  if (status !== "emprunte") return styles.greenPill;

  const d = days(timestamp);

  if (d >= 30) return styles.redPill;
  if (d >= 20) return styles.orangePill;

  return styles.greenPill;
}

const styles: Record<string, CSSProperties> = {
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
  lightBtn: {
    border: "none",
    borderRadius: 13,
    padding: "13px 18px",
    fontWeight: 800,
    background: "#f5e9ee",
    color: "#251116",
    cursor: "pointer",
  },
  collab: {
    maxWidth: 1040,
    margin: "0 auto",
    padding: 26,
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  pageTitle: {
    margin: 0,
    color: "#5f0f28",
    fontSize: 28,
  },
  muted: {
    color: "#7a6670",
    fontWeight: 700,
  },
  card: {
    background: "white",
    border: "1px solid #e3d3d8",
    borderRadius: 18,
    boxShadow: "0 18px 50px rgba(78,12,31,.12)",
    padding: 22,
    marginBottom: 18,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 22,
    margin: "0 0 18px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    fontSize: 13,
    textTransform: "uppercase",
    color: "#667085",
    textAlign: "left",
    borderBottom: "1px solid #e3d3d8",
    padding: 12,
  },
  td: {
    padding: "14px 12px",
    borderBottom: "1px solid #edf1f6",
    fontWeight: 600,
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    padding: "7px 11px",
    fontWeight: 900,
    fontSize: 13,
  },
  greenPill: {
    color: "#15803d",
    background: "#e9f8ef",
  },
  orangePill: {
    color: "#f97316",
    background: "#fff1e6",
  },
  redPill: {
    color: "#dc2626",
    background: "#feecec",
  },
  filterRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  filterChip: {
    border: "1px solid #e3d3d8",
    background: "white",
    color: "#251116",
    borderRadius: 999,
    padding: "8px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },
  filterActive: {
    background: "#8a1538",
    color: "white",
    borderColor: "#8a1538",
  },
  empty: {
    color: "#7a6670",
    fontWeight: 500,
    padding: "20px 0",
  },
  emptyCell: {
    color: "#7a6670",
    fontWeight: 500,
    padding: 20,
    textAlign: "center",
  },
  tags: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  tag: {
    background: "#f5e9ee",
    borderRadius: 999,
    padding: "7px 10px",
    fontWeight: 900,
  },
  smallBtn: {
    border: "1px solid #d9a8b7",
    background: "white",
    color: "#8a1538",
    borderRadius: 10,
    padding: "8px 12px",
    fontWeight: 900,
    cursor: "pointer",
    marginLeft: 6,
  },
  validate: {
    width: "100%",
    padding: 17,
    fontSize: 18,
    marginTop: 16,
    border: "none",
    borderRadius: 13,
    fontWeight: 800,
    background: "#8a1538",
    color: "white",
    cursor: "pointer",
  },
  info: {
    background: "#fff2f6",
    border: "1px solid #efd0da",
    color: "#6d0f2a",
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
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
  clock: {
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
  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
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
  recentCard: {
    borderTop: "1px solid #edf1f6",
    padding: "16px 0",
  },
  recentTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  dayPill: {
    borderRadius: 999,
    padding: "7px 12px",
    fontWeight: 900,
    fontSize: 13,
  },
  stockLowRow: {
    display: "grid",
    gridTemplateColumns: "1fr 120px",
    alignItems: "center",
    borderTop: "1px solid #edf1f6",
    padding: "13px 0",
    fontWeight: 900,
  },
  searchRow: {
    display: "grid",
    gridTemplateColumns: "1fr 150px",
    gap: 12,
    marginBottom: 16,
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