import { useMemo, useState } from "react";

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
  onAddBasket: (jaugeId: number, quantite: number) => void;
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
  const [selectedJauge, setSelectedJauge] = useState<StockItem | null>(null);
  const [quantity, setQuantity] = useState(1);

  const results = stock
    .filter((jauge) => {
      const matchesSearch = matchesDiam(jauge.diam, search);
      const matchesType = typeFilter === "all" || jauge.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .slice(0, 12);

  const basketSummary = useMemo(() => {
    const counts = new Map<number, number>();

    basket.forEach((jaugeId) => {
      counts.set(jaugeId, (counts.get(jaugeId) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([jaugeId, qty]) => ({
        jauge: stock.find((item) => item.id === jaugeId) ?? null,
        qty,
      }))
      .filter((item) => item.jauge !== null);
  }, [basket, stock]);

  const totalBasket = basket.length;
  const modalMaximum = selectedJauge
    ? Math.max(
        0,
        available(selectedJauge) - borrowedInBasket(selectedJauge.id)
      )
    : 0;

  function openQuantityModal(jauge: StockItem) {
    const maximum = Math.max(
      0,
      available(jauge) - borrowedInBasket(jauge.id)
    );

    if (maximum <= 0) return;

    setSelectedJauge(jauge);
    setQuantity(1);
  }

  function closeQuantityModal() {
    setSelectedJauge(null);
    setQuantity(1);
  }

  function confirmQuantity() {
    if (!selectedJauge) return;

    const safeQuantity = Math.min(
      Math.max(1, Math.trunc(quantity || 1)),
      modalMaximum
    );

    onAddBasket(selectedJauge.id, safeQuantity);
    closeQuantityModal();
  }

  function removeOne(jaugeId: number) {
    const index = basket.lastIndexOf(jaugeId);
    if (index < 0) return;

    setBasket(basket.filter((_, itemIndex) => itemIndex !== index));
  }

  function removeAll(jaugeId: number) {
    setBasket(basket.filter((id) => id !== jaugeId));
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
          <span style={styles.basketCounter}>Sélection : {totalBasket}</span>
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
                        onClick={() => openQuantityModal(jauge)}
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

        {basketSummary.length > 0 ? (
          <div style={styles.tags}>
            {basketSummary.map(({ jauge, qty }) =>
              jauge ? (
                <span key={jauge.id} style={styles.tag}>
                  {renderJaugeLabel(jauge)} ×{qty}
                  <button
                    type="button"
                    title="Retirer une unité"
                    style={styles.smallButton}
                    onClick={() => removeOne(jauge.id)}
                  >
                    −1
                  </button>
                  <button
                    type="button"
                    title="Supprimer cette jauge du panier"
                    style={styles.removeButton}
                    onClick={() => removeAll(jauge.id)}
                  >
                    ×
                  </button>
                </span>
              ) : null
            )}
          </div>
        ) : (
          <div style={styles.empty}>Aucune jauge sélectionnée.</div>
        )}

        <button
          style={{
            ...styles.validateButton,
            ...(totalBasket === 0 ? styles.disabledButton : {}),
          }}
          disabled={totalBasket === 0}
          onClick={onValidateBorrow}
        >
          VALIDER L’EMPRUNT ({totalBasket})
        </button>

        <div style={styles.info}>
          Merci de rendre les jauges au service Métrologie après utilisation.
        </div>
      </section>

      {selectedJauge && (
        <div
          style={styles.modalBackdrop}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) closeQuantityModal();
          }}
        >
          <section style={styles.modal} role="dialog" aria-modal="true">
            <div style={styles.modalHeader}>
              <div>
                <p style={styles.modalEyebrow}>Ajouter à l’emprunt</p>
                <h3 style={styles.modalTitle}>
                  {renderJaugeLabel(selectedJauge)}
                </h3>
              </div>

              <button style={styles.closeButton} onClick={closeQuantityModal}>
                ×
              </button>
            </div>

            <div style={styles.availableBox}>
              <span>Disponible pour cet ajout</span>
              <strong>{modalMaximum}</strong>
            </div>

            <div style={styles.quantityBlock}>
              <span style={styles.quantityLabel}>Quantité</span>

              <div style={styles.stepper}>
                <button
                  style={styles.stepButton}
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                >
                  −
                </button>

                <input
                  style={styles.quantityInput}
                  type="number"
                  min={1}
                  max={modalMaximum}
                  value={quantity}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setQuantity(
                      Number.isFinite(value)
                        ? Math.min(modalMaximum, Math.max(1, Math.trunc(value)))
                        : 1
                    );
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") confirmQuantity();
                  }}
                  autoFocus
                />

                <button
                  style={styles.stepButton}
                  disabled={quantity >= modalMaximum}
                  onClick={() =>
                    setQuantity((value) => Math.min(modalMaximum, value + 1))
                  }
                >
                  +
                </button>
              </div>

              <small style={styles.maximumText}>
                Maximum autorisé : {modalMaximum}
              </small>
            </div>

            <div style={styles.modalActions}>
              <button style={styles.cancelButton} onClick={closeQuantityModal}>
                Annuler
              </button>
              <button style={styles.confirmButton} onClick={confirmQuantity}>
                Ajouter {quantity} au panier
              </button>
            </div>
          </section>
        </div>
      )}
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
      {[
        ["all", "Toutes"],
        ["", "Classiques"],
        ["MD", "MD"],
        ["SPEC", "SPÉC"],
      ].map(([filterValue, label]) => (
        <button
          key={filterValue || "classic"}
          style={{
            ...styles.filterChip,
            ...(value === filterValue ? styles.filterActive : {}),
          }}
          onClick={() => onChange(filterValue as "all" | JaugeType)}
        >
          {label}
        </button>
      ))}
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
  return String(value ?? "")
    .trim()
    .replace(",", ".")
    .replace(/\.$/, "");
}

function matchesDiam(diam: string | number | null | undefined, query: string) {
  const search = normalizeDiam(query);
  if (!search) return true;
  return normalizeDiam(diam).startsWith(search);
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1040, margin: "0 auto", padding: 26 },
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: { margin: 0, color: "#5f0f28", fontSize: 28 },
  subtitle: { margin: "4px 0 0", color: "#7a6670", fontWeight: 700 },
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
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontWeight: 800, color: "#251116" },
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
    gap: 12,
    marginBottom: 12,
  },
  basketCounter: {
    borderRadius: 999,
    padding: "7px 12px",
    background: "#f5e9ee",
    color: "#8a1538",
    fontWeight: 900,
    fontSize: 13,
  },
  sectionTitle: { fontSize: 22, margin: "0 0 18px", color: "#251116" },
  filterRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 },
  filterChip: {
    border: "1px solid #e3d3d8",
    background: "white",
    color: "#251116",
    borderRadius: 999,
    padding: "8px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },
  filterActive: { background: "#8a1538", color: "white", borderColor: "#8a1538" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    fontSize: 13,
    textTransform: "uppercase",
    color: "#667085",
    textAlign: "left",
    borderBottom: "1px solid #e3d3d8",
    padding: 12,
  },
  td: { padding: "14px 12px", borderBottom: "1px solid #edf1f6", fontWeight: 600 },
  labelDiam: { whiteSpace: "nowrap" },
  typeMd: {
    display: "inline-flex",
    marginLeft: 8,
    borderRadius: 999,
    padding: "3px 8px",
    fontSize: 11,
    fontWeight: 900,
    background: "#e8f1ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
  },
  typeSpec: {
    display: "inline-flex",
    marginLeft: 8,
    borderRadius: 999,
    padding: "3px 8px",
    fontSize: 11,
    fontWeight: 900,
    background: "#f3e8ff",
    color: "#7e22ce",
    border: "1px solid #e9d5ff",
  },
  pill: {
    display: "inline-flex",
    borderRadius: 999,
    padding: "7px 11px",
    fontWeight: 900,
    fontSize: 13,
  },
  greenPill: { color: "#15803d", background: "#e9f8ef" },
  orangePill: { color: "#f97316", background: "#fff1e6" },
  redPill: { color: "#dc2626", background: "#feecec" },
  button: {
    border: "none",
    borderRadius: 13,
    padding: "13px 18px",
    fontWeight: 800,
    background: "#8a1538",
    color: "white",
    cursor: "pointer",
  },
  disabledButton: { opacity: 0.45, cursor: "not-allowed" },
  empty: { color: "#7a6670", fontWeight: 500, padding: "20px 0" },
  tags: { display: "flex", gap: 8, flexWrap: "wrap" },
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
  removeButton: {
    border: "none",
    background: "#8a1538",
    color: "white",
    width: 25,
    height: 25,
    borderRadius: 999,
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
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(37,17,22,.52)",
    display: "grid",
    placeItems: "center",
    padding: 20,
  },
  modal: {
    width: "min(440px, 96vw)",
    borderRadius: 24,
    background: "white",
    border: "1px solid #eadde2",
    boxShadow: "0 30px 80px rgba(37,17,22,.32)",
    padding: 24,
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    paddingBottom: 16,
    borderBottom: "1px solid #eadde2",
  },
  modalEyebrow: {
    margin: "0 0 6px",
    color: "#8a1538",
    fontSize: 12,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  modalTitle: { margin: 0, color: "#251116", fontSize: 25 },
  closeButton: {
    border: "none",
    background: "#f5e9ee",
    color: "#8a1538",
    width: 38,
    height: 38,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 900,
    cursor: "pointer",
  },
  availableBox: {
    marginTop: 18,
    borderRadius: 15,
    background: "#e9f8ef",
    color: "#15803d",
    padding: "13px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontWeight: 800,
  },
  quantityBlock: {
    marginTop: 22,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 13,
  },
  quantityLabel: { color: "#251116", fontWeight: 900, fontSize: 17 },
  stepper: { display: "flex", alignItems: "center", gap: 12 },
  stepButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    border: "1px solid #d9a8b7",
    background: "#fff7fa",
    color: "#8a1538",
    fontSize: 25,
    fontWeight: 900,
    cursor: "pointer",
  },
  quantityInput: {
    width: 86,
    height: 52,
    border: "2px solid #8a1538",
    borderRadius: 14,
    textAlign: "center",
    fontSize: 22,
    fontWeight: 900,
    color: "#251116",
    outline: "none",
  },
  maximumText: { color: "#7a6670", fontWeight: 700 },
  modalActions: { display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 10, marginTop: 24 },
  cancelButton: {
    border: "none",
    borderRadius: 13,
    padding: "13px 16px",
    background: "#f5e9ee",
    color: "#251116",
    fontWeight: 900,
    cursor: "pointer",
  },
  confirmButton: {
    border: "none",
    borderRadius: 13,
    padding: "13px 16px",
    background: "#8a1538",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
};
