import { useEffect, useState } from "react";
import type { Jauge } from "../../models/jauge";
import { getJaugeLabel, getJaugeStockTotal } from "../../models/jauge";
import type { TypeEmprunt } from "../../models/emprunt";
import { normalizeCollaborateurName } from "../../models/emprunt";

type EmpruntDialogProps = {
  open: boolean;
  jauge: Jauge | null;
  onClose: () => void;
  onConfirm: (values: {
    collaborateur: string;
    quantite: number;
    typeEmprunt: TypeEmprunt;
    commentaire?: string;
  }) => Promise<void>;
};

export default function EmpruntDialog({
  open,
  jauge,
  onClose,
  onConfirm,
}: EmpruntDialogProps) {
  const [typeEmprunt, setTypeEmprunt] =
    useState<TypeEmprunt>("COLLABORATEUR");
  const [collaborateur, setCollaborateur] = useState("");
  const [quantite, setQuantite] = useState(1);
  const [commentaire, setCommentaire] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTypeEmprunt("COLLABORATEUR");
      setCollaborateur("");
      setQuantite(1);
      setCommentaire("");
      setError(null);
      setSaving(false);
    }
  }, [open]);

  if (!open || !jauge) {
    return null;
  }

  const stockDisponible = getJaugeStockTotal(jauge);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const nom = normalizeCollaborateurName(collaborateur);

    if (!nom) {
      setError(
        typeEmprunt === "COLLABORATEUR"
          ? "Le nom du collaborateur est obligatoire."
          : "Le nom de la métrologie est obligatoire."
      );
      return;
    }

    if (quantite <= 0) {
      setError("La quantité doit être supérieure à 0.");
      return;
    }

    if (quantite > stockDisponible) {
      setError("La quantité demandée dépasse le stock disponible.");
      return;
    }

    setSaving(true);

    try {
      await onConfirm({
        collaborateur: nom,
        quantite,
        typeEmprunt,
        commentaire: commentaire.trim() || undefined,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <form
        style={styles.dialog}
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
      >
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>Nouvel emprunt</p>
            <h2 style={styles.title}>{getJaugeLabel(jauge)}</h2>
          </div>

          <button type="button" style={styles.closeButton} onClick={onClose}>
            Fermer
          </button>
        </header>

        <section style={styles.typeBox}>
          <button
            type="button"
            style={{
              ...styles.typeButton,
              ...(typeEmprunt === "COLLABORATEUR"
                ? styles.typeButtonActive
                : {}),
            }}
            onClick={() => setTypeEmprunt("COLLABORATEUR")}
          >
            Collaborateur
          </button>

          <button
            type="button"
            style={{
              ...styles.typeButton,
              ...(typeEmprunt === "METROLOGIE" ? styles.typeButtonActive : {}),
            }}
            onClick={() => setTypeEmprunt("METROLOGIE")}
          >
            Métrologie
          </button>
        </section>

        <section style={styles.info}>
          <div>
            <span style={styles.infoLabel}>Stock disponible</span>
            <strong style={styles.infoValue}>{stockDisponible}</strong>
          </div>

          <div>
            <span style={styles.infoLabel}>Type d'emprunt</span>
            <strong style={styles.infoValue}>
              {typeEmprunt === "COLLABORATEUR"
                ? "Collaborateur"
                : "Métrologie"}
            </strong>
          </div>
        </section>

        <label style={styles.field}>
          <span style={styles.label}>
            {typeEmprunt === "COLLABORATEUR"
              ? "Nom collaborateur"
              : "Nom métrologie / contrôle"}
          </span>
          <input
            style={styles.input}
            value={collaborateur}
            onChange={(event) =>
              setCollaborateur(event.target.value.toUpperCase())
            }
            placeholder={
              typeEmprunt === "COLLABORATEUR"
                ? "Ex : JEAN DUPONT"
                : "Ex : CONTROLE CN12"
            }
            autoFocus
          />
        </label>

        <label style={styles.field}>
          <span style={styles.label}>Quantité</span>
          <input
            style={styles.input}
            type="number"
            min={1}
            max={stockDisponible}
            value={quantite}
            onChange={(event) => setQuantite(Number(event.target.value))}
          />
        </label>

        {typeEmprunt === "METROLOGIE" && (
          <div style={styles.warning}>
            Alerte prévue : toute jauge métrologie non restituée après 30 jours
            sera signalée.
          </div>
        )}

        <label style={styles.field}>
          <span style={styles.label}>Commentaire</span>
          <textarea
            style={styles.textarea}
            value={commentaire}
            onChange={(event) => setCommentaire(event.target.value)}
            placeholder="Optionnel"
          />
        </label>

        {error && <div style={styles.error}>{error}</div>}

        <footer style={styles.footer}>
          <button type="button" style={styles.secondaryButton} onClick={onClose}>
            Annuler
          </button>

          <button type="submit" style={styles.primaryButton} disabled={saving}>
            {saving ? "Validation..." : "Valider l'emprunt"}
          </button>
        </footer>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 10000,
    background: "rgba(37, 17, 22, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  dialog: {
    width: 560,
    maxWidth: "96vw",
    background: "#fffafb",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 24px 70px rgba(37, 17, 22, 0.28)",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    alignItems: "flex-start",
    paddingBottom: 16,
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
    fontSize: 26,
  },
  closeButton: {
    border: "none",
    borderRadius: 14,
    padding: "10px 13px",
    background: "#eadde2",
    color: "#251116",
    fontWeight: 900,
    cursor: "pointer",
  },
  typeBox: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  typeButton: {
    border: "1px solid #eadde2",
    borderRadius: 14,
    padding: "12px 14px",
    background: "white",
    color: "#251116",
    fontWeight: 900,
    cursor: "pointer",
  },
  typeButtonActive: {
    background: "#8b1538",
    borderColor: "#8b1538",
    color: "white",
  },
  info: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  infoLabel: {
    display: "block",
    color: "#7b6670",
    fontWeight: 800,
    marginBottom: 6,
  },
  infoValue: {
    color: "#251116",
    fontSize: 18,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: {
    color: "#7b6670",
    fontWeight: 900,
  },
  input: {
    border: "1px solid #eadde2",
    borderRadius: 14,
    padding: "13px 14px",
    fontSize: 15,
    outline: "none",
    color: "#251116",
    background: "white",
  },
  textarea: {
    border: "1px solid #eadde2",
    borderRadius: 14,
    padding: "13px 14px",
    fontSize: 15,
    outline: "none",
    color: "#251116",
    background: "white",
    minHeight: 86,
    resize: "vertical",
    fontFamily: "inherit",
  },
  warning: {
    background: "#ffedd5",
    color: "#c2410c",
    borderRadius: 14,
    padding: 12,
    fontWeight: 800,
  },
  error: {
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: 14,
    padding: 12,
    fontWeight: 800,
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    paddingTop: 8,
  },
  secondaryButton: {
    border: "1px solid #eadde2",
    borderRadius: 14,
    padding: "12px 16px",
    background: "white",
    color: "#251116",
    fontWeight: 900,
    cursor: "pointer",
  },
  primaryButton: {
    border: "none",
    borderRadius: 14,
    padding: "12px 16px",
    background: "#8b1538",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
};