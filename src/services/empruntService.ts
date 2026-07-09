import { supabase } from "./supabase";
import type { Emprunt, TypeEmprunt } from "../models/emprunt";

const PAGE_SIZE = 1000;

export async function getAllEmprunts(): Promise<Emprunt[]> {
  const allEmprunts: Emprunt[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("emprunts")
      .select("*")
      .order("date_emprunt", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(error.message);
    }

    const batch = (data ?? []) as Emprunt[];
    allEmprunts.push(...batch);

    hasMore = batch.length === PAGE_SIZE;
    from += PAGE_SIZE;
  }

  return allEmprunts;
}

export async function createJaugeEmprunt(values: {
  jaugeId: number;
  collaborateur: string;
  quantite: number;
  stockActuel: number;
  typeEmprunt: TypeEmprunt;
  commentaire?: string;
}) {
  const nouveauStock = values.stockActuel - values.quantite;

  if (nouveauStock < 0) {
    throw new Error("Stock insuffisant.");
  }

  const { data: emprunt, error: empruntError } = await supabase
    .from("emprunts")
    .insert({
      collaborateur: values.collaborateur.trim().toUpperCase(),
      date_emprunt: new Date().toISOString(),
      date_retour: null,
      statut: "EN_COURS",
      type_emprunt: values.typeEmprunt,
      commentaire: values.commentaire?.trim() || null,
    })
    .select()
    .single();

  if (empruntError) {
    throw new Error(empruntError.message);
  }

  const { error: ligneError } = await supabase.from("emprunt_jauges").insert({
    emprunt_id: emprunt.id,
    jauge_id: values.jaugeId,
    quantite: values.quantite,
  });

  if (ligneError) {
    throw new Error(ligneError.message);
  }

  const { error: stockError } = await supabase
    .from("jauges")
    .update({
      stock_total: nouveauStock,
    })
    .eq("id", values.jaugeId);

  if (stockError) {
    throw new Error(stockError.message);
  }

  return emprunt as Emprunt;
}

export async function getEmpruntsByType(typeEmprunt: TypeEmprunt): Promise<Emprunt[]> {
  const { data, error } = await supabase
    .from("emprunts")
    .select("*")
    .eq("type_emprunt", typeEmprunt)
    .order("date_emprunt", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Emprunt[];
}