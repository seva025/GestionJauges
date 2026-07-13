import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../services/supabase";

type TopBarProps = {
  title: string;
  onOpenBorrowed?: () => void;
};

type AlertItem = {
  id: string;
  empruntId: number;
  collaborateur: string;
  diametre: string | number | null;
  typeCode: string;
  jours: number;
  quantiteRestante: number;
};

export default function TopBar({ title, onOpenBorrowed }: TopBarProps) {
  const [now, setNow] = useState(() => new Date());
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const clockTimer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAlerts() {
      try {
        const [emprunts, lignes, jauges] = await Promise.all([
          fetchAll(
            "emprunts",
            "id, collaborateur, date_emprunt, statut",
            "date_emprunt",
            false
          ),
          fetchAll(
            "emprunt_jauges",
            "id, emprunt_id, jauge_id, quantite, quantite_retournee"
          ),
          fetchAll("jauges", "id, diametre, type_code"),
        ]);

        const jaugesById = new Map<number, any>();
        jauges.forEach((jauge: any) => jaugesById.set(Number(jauge.id), jauge));

        const empruntsById = new Map<number, any>();
        emprunts.forEach((emprunt: any) => empruntsById.set(Number(emprunt.id), emprunt));

        const nextAlerts: AlertItem[] = lignes
          .map((ligne: any) => {
            const emprunt = empruntsById.get(Number(ligne.emprunt_id));
            if (!emprunt) return null;

            const statut = String(emprunt.statut ?? "").toLowerCase();
            if (statut === "rendu" || statut === "retourne") return null;

            const quantite = Number(ligne.quantite ?? 0);
            const quantiteRetournee = Number(ligne.quantite_retournee ?? 0);
            const quantiteRestante = Math.max(0, quantite - quantiteRetournee);
            if (quantiteRestante <= 0) return null;

            const dateEmprunt = new Date(emprunt.date_emprunt ?? Date.now()).getTime();
            const jours = Math.max(0, Math.floor((Date.now() - dateEmprunt) / 86_400_000));
            if (jours < 20) return null;

            const jauge = jaugesById.get(Number(ligne.jauge_id));

            return {
              id: `${ligne.emprunt_id}-${ligne.id}`,
              empruntId: Number(ligne.emprunt_id),
              collaborateur: String(emprunt.collaborateur ?? "Sans nom"),
              diametre: jauge?.diametre ?? ligne.jauge_id,
              typeCode: String(jauge?.type_code ?? ""),
              jours,
              quantiteRestante,
            } satisfies AlertItem;
          })
          .filter((item: AlertItem | null): item is AlertItem => item !== null)
          .sort((a: AlertItem, b: AlertItem) => b.jours - a.jours);

        if (!cancelled) setAlerts(nextAlerts);
      } catch (error) {
        console.error("Erreur chargement alertes", error);
      }
    }

    loadAlerts();
    const timer = window.setInterval(loadAlerts, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const date = now.toLocaleDateString("fr-FR");
  const time = now.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const lateCount = useMemo(
    () => alerts.filter((alert) => alert.jours >= 30).length,
    [alerts]
  );

  function openBorrowed() {
    setOpen(false);
    onOpenBorrowed?.();
  }

  return (
    <header style={styles.topbar}>
      <div>
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.subtitle}>
          {date} · {time}
        </p>
      </div>

      <div style={styles.actions}>
        <div ref={wrapRef} style={styles.notifWrap}>
          <button
            style={styles.bell}
            type="button"
            aria-label="Afficher les alertes"
            onClick={() => setOpen((value) => !value)}
          >
            🔔
            {alerts.length > 0 && (
              <span style={styles.badge}>{alerts.length}</span>
            )}
          </button>

          {open && (
            <div style={styles.popup}>
              <div style={styles.popupHead}>
                <div>
                  <strong style={styles.popupTitle}>Alertes emprunts</strong>
                  <div style={styles.popupSummary}>
                    {lateCount} en retard · {alerts.length - lateCount} à surveiller
                  </div>
                </div>
                <button style={styles.closeButton} onClick={() => setOpen(false)}>
                  Fermer
                </button>
              </div>

              {alerts.length === 0 ? (
                <div style={styles.emptyAlert}>
                  <span style={styles.emptyIcon}>✅</span>
                  <div>
                    <strong>Aucune alerte</strong>
                    <div style={styles.popupSummary}>Tout est à jour.</div>
                  </div>
                </div>
              ) : (
                <div style={styles.alertList}>
                  {alerts.map((alert) => {
                    const late = alert.jours >= 30;
                    return (
                      <button
                        key={alert.id}
                        style={styles.alertItem}
                        type="button"
                        onClick={openBorrowed}
                      >
                        <span style={styles.alertIcon}>{late ? "🔴" : "🟠"}</span>
                        <span style={styles.alertBody}>
                          <strong style={styles.alertName}>{alert.collaborateur}</strong>
                          <span style={styles.alertDetail}>
                            Ø {alert.diametre}
                            {alert.typeCode === "MD" ? " MD" : ""}
                            {alert.typeCode === "SPEC" ? " SPÉC" : ""}
                            {alert.quantiteRestante > 1
                              ? ` ×${alert.quantiteRestante}`
                              : ""}
                          </span>
                          <span
                            style={{
                              ...styles.alertAge,
                              ...(late ? styles.alertAgeLate : styles.alertAgeWarn),
                            }}
                          >
                            {alert.jours} jours — {late ? "En retard" : "À surveiller"}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={styles.mode}>MÉTROLOGIE</div>
      </div>
    </header>
  );
}

async function fetchAll(
  table: string,
  select: string,
  orderBy?: string,
  ascending = true
) {
  const all: any[] = [];
  const step = 1000;

  for (let from = 0; ; from += step) {
    let query = supabase
      .from(table)
      .select(select)
      .range(from, from + step - 1);

    if (orderBy) query = query.order(orderBy, { ascending });

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    all.push(...(data ?? []));
    if (!data || data.length < step) break;
  }

  return all;
}

const styles: Record<string, React.CSSProperties> = {
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
    position: "relative",
    zIndex: 40,
  },
  title: { margin: 0, fontSize: 30 },
  subtitle: { margin: "4px 0 0", color: "#7a6670", fontWeight: 700 },
  actions: { display: "flex", alignItems: "center", gap: 14 },
  notifWrap: { position: "relative" },
  bell: {
    position: "relative",
    width: 48,
    height: 48,
    borderRadius: "999px",
    border: "1px solid #e3d3d8",
    background: "white",
    fontSize: 22,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(78,12,31,.08)",
  },
  badge: {
    position: "absolute",
    right: -5,
    top: -5,
    minWidth: 22,
    height: 22,
    padding: "0 5px",
    borderRadius: 999,
    background: "#dc2626",
    color: "white",
    border: "2px solid white",
    display: "grid",
    placeItems: "center",
    fontSize: 11,
    fontWeight: 900,
  },
  popup: {
    position: "absolute",
    right: 0,
    top: 58,
    width: 430,
    maxWidth: "calc(100vw - 40px)",
    maxHeight: "70vh",
    overflow: "hidden",
    background: "white",
    border: "1px solid #e3d3d8",
    borderRadius: 18,
    boxShadow: "0 24px 70px rgba(78,12,31,.22)",
  },
  popupHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "16px 18px",
    borderBottom: "1px solid #edf1f6",
  },
  popupTitle: { display: "block", fontSize: 18 },
  popupSummary: { color: "#7a6670", fontSize: 12, fontWeight: 700, marginTop: 3 },
  closeButton: {
    border: "1px solid #d9a8b7",
    background: "white",
    color: "#8a1538",
    borderRadius: 10,
    padding: "7px 10px",
    fontWeight: 900,
    cursor: "pointer",
  },
  alertList: { maxHeight: "55vh", overflowY: "auto" },
  alertItem: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "36px 1fr",
    gap: 10,
    padding: "14px 18px",
    border: "none",
    borderBottom: "1px solid #edf1f6",
    background: "white",
    textAlign: "left",
    cursor: "pointer",
  },
  alertIcon: { fontSize: 18, paddingTop: 2 },
  alertBody: { display: "flex", flexDirection: "column", gap: 3 },
  alertName: { color: "#251116" },
  alertDetail: { color: "#4b3540", fontWeight: 800 },
  alertAge: { fontSize: 12, fontWeight: 900 },
  alertAgeLate: { color: "#dc2626" },
  alertAgeWarn: { color: "#f97316" },
  emptyAlert: {
    display: "grid",
    gridTemplateColumns: "36px 1fr",
    gap: 10,
    padding: 20,
  },
  emptyIcon: { fontSize: 20 },
  mode: { color: "#7a6670", fontWeight: 900 },
};
