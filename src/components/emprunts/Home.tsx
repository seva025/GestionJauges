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
    <div style={styles.home}>
      <section style={styles.homeCard}>
        <div style={styles.brand}>
          <div style={styles.logo}>JW</div>
          <div>
            <h1 style={styles.title}>Gestion des jauges</h1>
          </div>
        </div>

        <div style={styles.heroLogoWrap}>
          <img
            src="/gestion-jauges-logo.png"
            alt="Logo Gestion Jauges avec pied à coulisse"
            style={styles.heroLogo}
          />
        </div>

        <div style={styles.choiceGrid}>
          <button style={styles.choice} onClick={onCollaborateur}>
            <div style={styles.ico}>👤</div>
            <h2 style={styles.choiceTitle}>Collaborateur</h2>
          </button>

          <button style={styles.choice} onClick={() => document.getElementById("metro-password")?.focus()}>
            <div style={styles.ico}>🔒</div>
            <h2 style={styles.choiceTitle}>Métrologie</h2>
          </button>
        </div>

        <div style={styles.metroLogin}>
          <input
            id="metro-password"
            style={styles.input}
            type="password"
            placeholder="Mot de passe métrologie"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onMetroLogin();
              }
            }}
          />

          <button style={styles.button} onClick={onMetroLogin}>
            Connexion
          </button>
        </div>
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  home: {
    minHeight: "calc(100vh - 120px)",
    display: "grid",
    placeItems: "center",
    padding: 28,
  },
  homeCard: {
    width: "min(760px, 94vw)",
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
  title: {
    margin: 0,
    fontSize: 36,
    letterSpacing: -1,
    color: "#251116",
  },
  heroLogoWrap: {
    display: "flex",
    justifyContent: "center",
    margin: "-12px 0 28px",
  },
  heroLogo: {
    width: 190,
    height: 190,
    objectFit: "cover",
    borderRadius: 36,
    boxShadow: "0 18px 38px rgba(78,12,31,.22)",
    border: "1px solid #e3d3d8",
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
  choiceTitle: {
    margin: "14px 0 0",
    fontSize: 22,
    color: "#251116",
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
    fontSize: 15,
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