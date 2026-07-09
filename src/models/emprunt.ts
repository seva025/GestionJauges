export type Emprunt = {
  id: number;
  numero: string;
  demandeur: string;
  service: string | null;
  date_emprunt: string;
  date_retour_prevue: string | null;
  date_retour: string | null;
  commentaire: string | null;
  statut: "EN_COURS" | "RETOURNE";
  created_at: string | null;
};

export type EmpruntJauge = {
  id: number;
  emprunt_id: number;
  jauge_id: number;
  quantite: number;
};

export function isEmpruntActif(emprunt: Emprunt) {
  return emprunt.statut === "EN_COURS";
}

export function isEmpruntRetourne(emprunt: Emprunt) {
  return emprunt.statut === "RETOURNE";
}

export function formatDate(date: string | null) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("fr-FR");
}

export function formatEmpruntTitle(emprunt: Emprunt) {
  return `${emprunt.numero} - ${emprunt.demandeur}`;
}