import { supabase } from "./supabase";
import type { Emprunt } from "../models/emprunt";

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

export async function getEmprunt(id: number): Promise<Emprunt | null> {
  const { data, error } = await supabase
    .from("emprunts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Emprunt;
}

export async function createEmprunt(
  emprunt: Omit<Emprunt, "id" | "created_at">
): Promise<Emprunt> {
  const { data, error } = await supabase
    .from("emprunts")
    .insert(emprunt)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Emprunt;
}

export async function updateEmprunt(
  id: number,
  values: Partial<Emprunt>
): Promise<void> {
  const { error } = await supabase
    .from("emprunts")
    .update(values)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteEmprunt(id: number): Promise<void> {
  const { error } = await supabase
    .from("emprunts")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}