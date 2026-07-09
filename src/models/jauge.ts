export type Jauge = {
  id: number;
  diametre: string | number | null;
  type_code: string | null;
  stock_total: number | null;
  en_commande: number | null;
  created_at: string | null;
};

export type StockFilter = "toutes" | "disponibles" | "commande" | "rupture";

export type StockStats = {
  references: number;
  stockTotal: number;
  enCommande: number;
  ruptures: number;
};

export function getJaugeStockTotal(jauge: Jauge) {
  return Number(jauge.stock_total ?? 0);
}

export function getJaugeEnCommande(jauge: Jauge) {
  return Number(jauge.en_commande ?? 0);
}

export function isJaugeEnRupture(jauge: Jauge) {
  return getJaugeStockTotal(jauge) <= 0;
}

export function getJaugeLabel(jauge: Jauge) {
  const diametre = jauge.diametre ?? "Ø ?";
  const type = jauge.type_code ?? "Type ?";
  return `Ø ${diametre} ${type}`;
}