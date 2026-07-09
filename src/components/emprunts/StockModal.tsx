type StockModalProps = {
  open: boolean;
  title: string;
  text: string;
  children?: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function StockModal({
  open,
  title,
  text,
  children,
  onCancel,
  onConfirm,
}: StockModalProps) {
  if (!open) return null;

  return (
    <div style={styles.back}>
      <div style={styles.modal}>
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.text}>{text}</p>

        <div>{children}</div>

        <div style={styles.actions}>
          <button style={styles.lightButton} onClick={onCancel}>
            Annuler
          </button>

          <button style={styles.button} onClick={onConfirm}>
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  back: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
  },
  modal: {
    background: "white",
    borderRadius: 20,
    padding: 24,
    width: "min(420px,94vw)",
    boxShadow: "0 18px 50px rgba(78,12,31,.12)",
  },
  title: {
    margin: "0 0 12px",
    color: "#251116",
  },
  text: {
    color: "#7a6670",
    fontWeight: 700,
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
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
  button: {
    border: "none",
    borderRadius: 13,
    padding: "13px 18px",
    fontWeight: 800,
    background: "#8a1538",
    color: "white",
    cursor: "pointer",
  },
};