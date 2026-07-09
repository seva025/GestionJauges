export type TypeEmprunt = "COLLABORATEUR" | "METROLOGIE";

export type StatutEmprunt = "EN_COURS" | "RETOURNE";

export type Emprunt = {
  id: number;
  collaborateur: string;
  date_emprunt: string;
  date_retour: string | null;
  statut: StatutEmprunt;
  type_emprunt: TypeEmprunt;
  commentaire: string | null;
};

export type EmpruntJauge = {
  id: number;
  emprunt_id: number;
  jauge_id: number;
  quantite: number;
};

export function formatDate(date: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("fr-FR");
}

export function normalizeCollaborateurName(value: string) {
  return value.trim().toUpperCase();
}

export function isEmpruntEnCours(emprunt: Emprunt) {
  return emprunt.statut === "EN_COURS";
}

export function isEmpruntRetourne(emprunt: Emprunt) {
  return emprunt.statut === "RETOURNE";
}

export function isEmpruntMetrologie(emprunt: Emprunt) {
  return emprunt.type_emprunt === "METROLOGIE";
}

export function isEmpruntCollaborateur(emprunt: Emprunt) {
  return emprunt.type_emprunt === "COLLABORATEUR";
}

export function getDaysSinceEmprunt(emprunt: Emprunt) {
  const start = new Date(emprunt.date_emprunt).getTime();
  const now = new Date().getTime();
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}

export function isMetrologieLate(emprunt: Emprunt) {
  return (
    emprunt.type_emprunt === "METROLOGIE" &&
    emprunt.statut === "EN_COURS" &&
    getDaysSinceEmprunt(emprunt) >= 30
  );
}