import type { Jauge } from "../../models/jauge";

type StockDetailsProps = {
  jauge: Jauge | null;
};

export default function StockDetails({ jauge }: StockDetailsProps) {
  if (!jauge) {
    return (
      <aside style={styles.card}>
        <h2 style={styles.title}>Détails</h2>
        <p style={styles.muted}>
          Sélectionne une jauge dans le tableau pour afficher ses informations.
        </p>
      </aside>
    );
  }

  return (
    <aside style={styles.card}>
      <p style={styles.version}>Jauge sélectionnée</p>
      <h2 style={styles.title}>{jauge.diametre ?? "Diamètre non renseigné"}</h2>

      <div style={styles.list}>
        <Item label="Identifiant" value={`#${jauge.id}`} />
        <Item label="Type" value={jauge.type_code ?? "Non renseigné"} />
        <Item label="Stock total" value={Number(jauge.stock_total ?? 0)} />
        <Item label="En commande" value={Number(jauge.en_commande ?? 0)} />
        <Item
          label="Créée le"
          value={
            jauge.created_at
              ? new Date(jauge.created_at).toLocaleDateString("fr-FR")
              : "Non renseigné"
          }
        />
      </div>
    </aside>
  );
}

function Item({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={styles.item}>
      <span style={styles.label}>{label}</span>
      <strong style={styles.value}>{value}</strong>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "white",
    borderRadius: 22,
    padding: 22,
    border: "1px solid #eadde2",
    boxShadow: "0 12px 28px rgba(70, 20, 38, 0.08)",
    minHeight: 320,
  },
  version: {
    margin: "0 0 8px",
    color: "#8b1538",
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: 1,
  },
  title: {
    margin: 0,
    fontSize: 26,
    color: "#251116",
  },
  muted: {
    color: "#7b6670",
    fontWeight: 700,
    lineHeight: 1.5,
  },
  list: {
    marginTop: 22,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  item: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    paddingBottom: 12,
    borderBottom: "1px solid #eadde2",
  },
  label: {
    color: "#7b6670",
    fontWeight: 800,
  },
  value: {
    color: "#251116",
    textAlign: "right",
  },
};