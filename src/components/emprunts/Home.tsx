import type { CSSProperties } from "react";

type HomeProps = {
  password: string;
  setPassword: (value: string) => void;
  onCollaborateur: () => void;
  onMetroLogin: () => void;
};

export default function Home({
  password,
  setPassword,
  onCollaborateur,
  onMetroLogin,
}: HomeProps) {
  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <header style={styles.header}>
          <h1 style={styles.title}>Gestion des jauges</h1>

          <img
            src="/logo-entreprises.png"
            alt="Joray & Wyss S.A. et Pivodel SA"
            style={styles.companyLogo}
          />
        </header>

        <div style={styles.centralLogoWrap}>
          <img
            src="/jw-caliper-no-text.png"
            alt="Logo JW avec pied à coulisse"
            style={styles.centralLogo}
          />
        </div>

        <div style={styles.choiceGrid}>
          <button
            type="button"
            style={styles.choice}
            onClick={onCollaborateur}
          >
            <span style={styles.icon}>👤</span>
            <span style={styles.choiceLabel}>Collaborateur</span>
          </button>

          <button
            type="button"
            style={styles.choice}
            onClick={() => document.getElementById("metro-password")?.focus()}
          >
            <span style={styles.icon}>🔒</span>
            <span style={styles.choiceLabel}>Métrologie</span>
          </button>
        </div>

        <div style={styles.loginRow}>
          <input
            id="metro-password"
            style={styles.input}
            type="password"
            placeholder="Mot de passe métrologie"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onMetroLogin();
            }}
          />

          <button type="button" style={styles.loginButton} onClick={onMetroLogin}>
            Connexion
          </button>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 24,
    background: "linear-gradient(135deg,#fffafb 0%,#f1e7eb 100%)",
    fontFamily: "Segoe UI, Arial, sans-serif",
  },
  card: {
    width: "min(1180px, 96vw)",
    minHeight: "min(860px, 94vh)",
    background: "rgba(255,255,255,0.97)",
    border: "1px solid #ead4db",
    borderRadius: 30,
    boxShadow: "0 24px 70px rgba(78,12,31,.14)",
    padding: "42px 56px 48px",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 30,
  },
  title: {
    margin: 0,
    color: "#251116",
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: "clamp(34px,4vw,58px)",
    lineHeight: 1.05,
    letterSpacing: "-1.5px",
  },
  companyLogo: {
    width: "min(500px, 42vw)",
    maxHeight: 105,
    objectFit: "contain",
    objectPosition: "right top",
  },
  centralLogoWrap: {
    flex: 1,
    minHeight: 260,
    display: "grid",
    placeItems: "center",
    padding: "24px 0 30px",
  },
  centralLogo: {
    width: "clamp(210px, 26vw, 330px)",
    aspectRatio: "1 / 1",
    objectFit: "cover",
    borderRadius: 38,
    boxShadow: "0 20px 45px rgba(54,0,16,.24)",
  },
  choiceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 28,
    marginBottom: 26,
  },
  choice: {
    minHeight: 210,
    border: "1px solid #e7cdd5",
    background: "#fff",
    borderRadius: 24,
    boxShadow: "0 12px 30px rgba(78,12,31,.07)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    cursor: "pointer",
  },
  icon: {
    fontSize: 52,
    lineHeight: 1,
  },
  choiceLabel: {
    color: "#160b0e",
    fontSize: "clamp(25px,2vw,34px)",
    fontWeight: 850,
  },
  loginRow: {
    display: "grid",
    gridTemplateColumns: "1fr 270px",
    gap: 18,
  },
  input: {
    minWidth: 0,
    height: 72,
    border: "1px solid #e5cbd3",
    borderRadius: 18,
    background: "white",
    padding: "0 24px",
    outline: "none",
    fontSize: 21,
    color: "#251116",
    boxSizing: "border-box",
  },
  loginButton: {
    border: "none",
    borderRadius: 18,
    background: "linear-gradient(135deg,#7f102f,#a51640)",
    color: "white",
    fontSize: 21,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(138,21,56,.2)",
  },
};
