import { useState } from "react";
import "./App.css";

type Screen = "home" | "collaborateur" | "metrologie";

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [collaborateur, setCollaborateur] = useState("");
  const [password, setPassword] = useState("");

  function loginMetrologie() {
    if (password === "Metrologie_2024") {
      setScreen("metrologie");
      setPassword("");
    } else {
      alert("Mot de passe incorrect");
    }
  }

  return (
    <main className="app">
      {screen === "home" && (
        <section className="home-card">
          <div className="app-logo">◎</div>

          <h1>Gestion des jauges</h1>

          <p className="home-subtitle">
            Application interne - Métrologie
          </p>

          <div className="home-actions">
            <button onClick={() => setScreen("collaborateur")}>
              👤 Collaborateur
            </button>

            <div className="metro-login">
              <input
                type="password"
                placeholder="Mot de passe métrologie"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button onClick={loginMetrologie}>
                🔒 Métrologie
              </button>
            </div>
          </div>

          <span className="version">
            Version 1.0
          </span>
        </section>
      )}

      {screen === "collaborateur" && (
        <section className="page-card">
          <button className="back-btn" onClick={() => setScreen("home")}>
            ← Retour
          </button>

          <h1>Espace Collaborateur</h1>

          <label>Nom du collaborateur</label>

          <input
            className="big-input"
            value={collaborateur}
            onChange={(e) =>
              setCollaborateur(e.target.value.toUpperCase())
            }
            placeholder="DUPONT JEAN"
          />

          <p className="info-text">
            Recherche des jauges à venir...
          </p>
        </section>
      )}

      {screen === "metrologie" && (
        <section className="page-card">
          <button className="back-btn" onClick={() => setScreen("home")}>
            ← Déconnexion
          </button>

          <h1>Espace Métrologie</h1>

          <p className="info-text">
            Tableau de bord en cours de développement...
          </p>
        </section>
      )}
    </main>
  );
}

export default App;