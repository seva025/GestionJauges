import { useState } from "react";
import type { Jauge } from "../../models/jauge";
import {
  getJaugeEnCommande,
  getJaugeLabel,
  getJaugeStockTotal,
  isJaugeEnRupture,
} from "../../models/jauge";

type TabKey = "general" | "emprunts" | "commandes" | "historique";

type JaugeSheetProps = {
  jauge: Jauge | null;
  open: boolean;
  onClose: () => void;
};

export default function JaugeSheet({ jauge, open, onClose }: JaugeSheetProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("general");

  if (!open || !jauge) {
    return null;
  }

  const stockTotal = getJaugeStockTotal(jauge);
  const enCommande = getJaugeEnCommande(jauge);
  const rupture = isJaugeEnRupture(jauge);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <section style={styles.sheet} onClick={(event) => event.stopPropagation()}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>Fiche jauge</p>
            <h2 style={styles.title}>{getJaugeLabel(jauge)}</h2>
          </div>

          <button style={styles.closeButton} onClick={onClose}>
            Fermer
          </button>
        </header>

        <div style={styles.statusRow}>
          <Badge label={rupture ? "Rupture" : "Disponible"} tone={rupture ? "red" : "green"} />
          {enCommande > 0 && <Badge label="En commande" tone="orange" />}
        </div>

        <nav style={styles.tabs}>
          <Tab label="Général" value="general" active={activeTab} onClick={setActiveTab} />
          <Tab label="Emprunts" value="emprunts" active={activeTab} onClick={setActiveTab} />
          <Tab label="Commandes" value="commandes" active={activeTab} onClick={setActiveTab} />
          <Tab label="Historique" value="historique" active={activeTab} onClick={setActiveTab} />
        </nav>

        {activeTab === "general" && (
          <section style={styles.panel}>
            <h3 style={styles.sectionTitle}>Informations générales</h3>

            <div style={styles.grid}>
              <Item label="Identifiant" value={`#${jauge.id}`} />
              <Item label="Diamètre" value={jauge.diametre ?? "Non renseigné"} />
              <Item label="Type" value={jauge.type_code ?? "Non renseigné"} />
              <Item label="Stock total" value={stockTotal} />
              <Item label="En commande" value={enCommande} />
              <Item
                label="Créée le"
                value={
                  jauge.created_at
                    ? new Date(jauge.created_at).toLocaleDateString("fr-FR")
                    : "Non renseigné"
                }
              />
            </div>
          </section>
        )}

        {activeTab === "emprunts" && (
          <Placeholder
            title="Emprunts"
            text="Les emprunts liés à cette jauge seront connectés en V0.6."
          />
        )}

        {activeTab === "commandes" && (
          <Placeholder
            title="Commandes"
            text="Les commandes liées à cette jauge seront connectées en V0.7."
          />
        )}

        {activeTab === "historique" && (
          <Placeholder
            title="Historique"
            text="L’historique des mouvements sera connecté après les modules Emprunts et Commandes."
          />
        )}

        <section style={styles.panel}>
          <h3 style={styles.sectionTitle}>Actions</h3>

          <div style={styles.actions}>
            <button style={styles.actionButton}>Modifier la jauge</button>
            <button style={styles.actionButton}>Créer un emprunt</button>
            <button style={styles.actionButton}>Créer une commande</button>
            <button style={styles.actionButton}>Imprimer / QR Code</button>
          </div>
        </section>
      </section>
    </div>
  );
}

function Tab({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: TabKey;
  active: TabKey;
  onClick: (value: TabKey) => void;
}) {
  const isActive = value === active;

  return (
    <button
      type="button"
      style={{
        ...styles.tab,
        ...(isActive ? styles.tabActive : {}),
      }}
      onClick={() => onClick(value)}
    >
      {label}
    </button>
  );
}

function Placeholder({ title, text }: { title: string; text: string }) {
  return (
    <section style={styles.panel}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      <p style={styles.muted}>{text}</p>
    </section>
  );
}

function Item({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={styles.item}>
      <span style={styles.itemLabel}>{label}</span>
      <strong style={styles.itemValue}>{value}</strong>
    </div>
  );
}

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "orange" | "red";
}) {
  return (
    <span
      style={{
        ...styles.badge,
        ...(tone === "green" ? styles.green : {}),
        ...(tone === "orange" ? styles.orange : {}),
        ...(tone === "red" ? styles.red : {}),
      }}
    >
      {label}
    </span>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9998,
    background: "rgba(37, 17, 22, 0.45)",
    display: "flex",
    justifyContent: "flex-end",
  },
  sheet: {
    width: 720,
    maxWidth: "94vw",
    height: "100vh",
    overflow: "auto",
    background: "#fffafb",
    boxShadow: "-20px 0 50px rgba(37, 17, 22, 0.25)",
    padding: 28,
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
    paddingBottom: 18,
    borderBottom: "1px solid #eadde2",
  },
  eyebrow: {
    margin: "0 0 8px",
    color: "#8b1538",
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    color: "#251116",
    fontSize: 30,
  },
  closeButton: {
    border: "none",
    borderRadius: 14,
    padding: "11px 14px",
    background: "#8b1538",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
  statusRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  badge: {
    borderRadius: 999,
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 900,
  },
  green: {
    background: "#dcfce7",
    color: "#166534",
  },
  orange: {
    background: "#ffedd5",
    color: "#c2410c",
  },
  red: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  tabs: {
    display: "flex",
    gap: 8,
    borderBottom: "1px solid #eadde2",
    paddingBottom: 10,
  },
  tab: {
    border: "1px solid #eadde2",
    background: "white",
    borderRadius: 999,
    padding: "9px 14px",
    color: "#7b6670",
    fontWeight: 900,
    cursor: "pointer",
  },
  tabActive: {
    background: "#8b1538",
    color: "white",
    borderColor: "#8b1538",
  },
  panel: {
    background: "white",
    border: "1px solid #eadde2",
    borderRadius: 20,
    padding: 20,
    boxShadow: "0 12px 28px rgba(70, 20, 38, 0.08)",
  },
  sectionTitle: {
    margin: "0 0 16px",
    color: "#251116",
    fontSize: 18,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },
  item: {
    borderBottom: "1px solid #eadde2",
    paddingBottom: 12,
  },
  itemLabel: {
    display: "block",
    color: "#7b6670",
    fontWeight: 800,
    marginBottom: 6,
  },
  itemValue: {
    color: "#251116",
    fontSize: 17,
  },
  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  actionButton: {
    border: "1px solid #eadde2",
    borderRadius: 14,
    background: "#fbf7f8",
    padding: "12px 14px",
    color: "#251116",
    fontWeight: 900,
    cursor: "pointer",
  },
  muted: {
    color: "#7b6670",
    fontWeight: 700,
    lineHeight: 1.5,
    margin: 0,
  },
};