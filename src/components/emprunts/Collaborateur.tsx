type JaugeType = "" | "MD" | "SPEC";

type StockItem = {
  id: number;
  diam: string | number | null;
  type: JaugeType;
  total: number;
  enCommande: number;
};

type CollaborateurProps = {
  stock: StockItem[];
  collabName: string;
  setCollabName: (value: string) => void;
  search: string;
  setSearch: (value: string) => void;
  basket: number[];
  setBasket: (value: number[]) => void;
  typeFilter: "all" | JaugeType;
  setTypeFilter: (value: "all" | JaugeType) => void;
  available: (jauge: StockItem) => number;
  borrowedInBasket: (jaugeId: number) => number;
  onAddBasket: (jaugeId: number) => void;
  onValidateBorrow: () => void;
  onLogout: () => void;
};

export default function Collaborateur({
  stock,
  collabName,
  setCollabName,
  search,
  setSearch,
  basket,
  setBasket,
  typeFilter,
  setTypeFilter,
  available,
  borrowedInBasket,
  onAddBasket,
  onValidateBorrow,
  onLogout,
}: CollaborateurProps) {
  const results = stock
    .filter((jauge) => {
      const matchesSearch = matchesDiam(jauge.diam, search);
      const matchesType = typeFilter === "all" || jauge.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .slice(0, 12);

  function getJaugeById(id: number) {
    return stock.find((jauge) => jauge.id === id) ?? null;
  }

  function removeBasketItem(index: number) {
    setBasket(basket.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div>
          <h1 style={styles.title}>Mode collaborateur</h1>
          <p style={styles.subtitle}>
            Consulter la disponibilité et emprunter des jauges
          </p>
        </div>

        <button style={styles.lightButton} onClick={onLogout}>
          ↩ Déconnexion
        </button>
      </div>

      <section style={styles.card}>
        <div style={styles.grid2}>
          <label style={styles.field}>
            <span style={styles.label}>1. Votre nom</span>
            <input
              style={styles.input}
              value={collabName}
              onChange={(event) =>
                setCollabName(event.target.value.toUpperCase())
              }
              autoComplete="off"
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>2. Rechercher une jauge</span>
            <input
              style={styles.input}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ex : 2.503"
            />
          </label>
        </div>
      </section>

      <section style={styles.card}>
        <div style={styles.panelHead}>
          <h2 style={styles.sectionTitle}>Disponibilité</h2>
        </div>

        <FilterButtons value={typeFilter} onChange={setTypeFilter} />

        {results.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Jauge</th>
                <th style={styles.th}>Disponible</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>

            <tbody>
              {results.map((jauge) => {
                const stockDisponible = available(jauge);
                const dejaDansPanier = borrowedInBasket(jauge.id);
                const restant = Math.max(0, stockDisponible - dejaDansPanier);

                return (
                  <tr key={jauge.id}>
                    <td style={styles.td}>{renderJaugeLabel(jauge)}</td>

                    <td style={styles.td}>
                      {restant > 0 ? (
                        <span style={{ ...styles.pill, ...styles.greenPill }}>
                          {restant} en stock
                        </span>
                      ) : jauge.enCommande > 0 ? (
                        <span style={{ ...styles.pill, ...styles.orangePill }}>
                          En commande : {jauge.enCommande}
                        </span>
                      ) : (
                        <span style={{ ...styles.pill, ...styles.redPill }}>
                          Non disponible
                        </span>
                      )}
                    </td>

                    <td style={styles.td}>
                      <button
                        style={{
                          ...styles.button,
                          ...(restant <= 0 ? styles.disabledButton : {}),
                        }}
                        disabled={restant <= 0}
                        onClick={() => onAddBasket(jauge.id)}
                      >
                        {restant > 0
                          ? "Ajouter"
                          : jauge.enCommande > 0
                          ? "En commande"
                          : "Indisponible"}
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

        {basket.length > 0 ? (
          <div style={styles.tags}>
            {basket.map((jaugeId, index) => {
              const jauge = getJaugeById(jaugeId);

              return (
                <span key={`${jaugeId}-${index}`} style={styles.tag}>
                  {jauge ? renderJaugeLabel(jauge) : "Jauge"}
                  <button
                    style={styles.smallButton}
                    onClick={() => removeBasketItem(index)}
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

        <button style={styles.validateButton} onClick={onValidateBorrow}>
          VALIDER L’EMPRUNT ({basket.length})
        </button>

        <div style={styles.info}>
          Merci de rendre les jauges au service Métrologie après utilisation.
        </div>
      </section>
    </div>
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
        style={{
          ...styles.filterChip,
          ...(value === "all" ? styles.filterActive : {}),
        }}
        onClick={() => onChange("all")}
      >
        Toutes
      </button>

      <button
        style={{
          ...styles.filterChip,
          ...(value === "" ? styles.filterActive : {}),
        }}
        onClick={() => onChange("")}
      >
        Classiques
      </button>

      <button
        style={{
          ...styles.filterChip,
          ...(value === "MD" ? styles.filterActive : {}),
        }}
        onClick={() => onChange("MD")}
      >
        MD
      </button>

      <button
        style={{
          ...styles.filterChip,
          ...(value === "SPEC" ? styles.filterActive : {}),
        }}
        onClick={() => onChange("SPEC")}
      >
        SPÉC
      </button>
    </div>
  );
}

function renderJaugeLabel(jauge: StockItem) {
  return (
    <span style={styles.labelDiam}>
      Ø {jauge.diam}
      {jauge.type === "MD" && <span style={styles.typeMd}>MD</span>}
      {jauge.type === "SPEC" && <span style={styles.typeSpec}>SPÉC</span>}
    </span>
  );
}

function normalizeDiam(value: string | number | null | undefined) {
  return String(value ?? "").trim().replace(",", ".");
}

function matchesDiam(diam: string | number | null | undefined, query: string) {
  const search = normalizeDiam(query);

  if (!search) {
    return true;
  }

  return normalizeDiam(diam).startsWith(search);
}

const styles: Record<string, React.CSSProperties> = {
  page: {
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
  title: {
    margin: 0,
    color: "#5f0f28",
    fontSize: 28,
  },
  subtitle: {
    margin: "4px 0 0",
    color: "#7a6670",
    fontWeight: 700,
  },
  lightButton: {
    border: "none",
    borderRadius: 13,
    padding: "13px 18px",
    fontWeight: 800,
    background: "#f5e9ee",
    color: "#251116",
    cursor: "pointer",
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
  label: {
    fontWeight: 800,
    color: "#251116",
  },
  input: {
    width: "100%",
    border: "1px solid #e3d3d8",
    borderRadius: 13,
    background: "white",
    padding: "14px 16px",
    outline: "none",
    fontSize: 15,
  },
  panelHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    margin: "0 0 18px",
    color: "#251116",
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
  labelDiam: {
    whiteSpace: "nowrap",
  },
  typeMd: {
    display: "inline-flex",
    alignItems: "center",
    marginLeft: 8,
    borderRadius: 999,
    padding: "3px 8px",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 0.4,
    verticalAlign: "middle",
    background: "#e8f1ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
  },
  typeSpec: {
    display: "inline-flex",
    alignItems: "center",
    marginLeft: 8,
    borderRadius: 999,
    padding: "3px 8px",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 0.4,
    verticalAlign: "middle",
    background: "#f3e8ff",
    color: "#7e22ce",
    border: "1px solid #e9d5ff",
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
  button: {
    border: "none",
    borderRadius: 13,
    padding: "13px 18px",
    fontWeight: 800,
    background: "#8a1538",
    color: "white",
    cursor: "pointer",
  },
  disabledButton: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
  empty: {
    color: "#7a6670",
    fontWeight: 500,
    padding: "20px 0",
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
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  smallButton: {
    border: "1px solid #d9a8b7",
    background: "white",
    color: "#8a1538",
    borderRadius: 10,
    padding: "4px 8px",
    fontWeight: 900,
    cursor: "pointer",
  },
  validateButton: {
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
    fontWeight: 700,
  },
};