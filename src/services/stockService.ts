import { supabase } from "./supabase";
import type { Jauge } from "../models/jauge";

const PAGE_SIZE = 1000;

export async function getAllJauges(): Promise<Jauge[]> {
  const allJauges: Jauge[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("jauges")
      .select("id, diametre, type_code, stock_total, en_commande, created_at")
      .order("diametre", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(error.message);
    }

    const batch = (data ?? []) as Jauge[];
    allJauges.push(...batch);

    hasMore = batch.length === PAGE_SIZE;
    from += PAGE_SIZE;
  }

  return allJauges;
}