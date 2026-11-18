import { randomUUID } from "node:crypto";
import { getSupabase, usesSupabase } from "@/lib/supabase";
import { getStore } from "@/models/store";
import type { FoodExpiration } from "@/models/food-expiration";

export const expirationRepository = {
  async save(data: Omit<FoodExpiration, "id" | "registeredAt">, userId: string): Promise<FoodExpiration> {
    const item = { ...data, id: randomUUID(), registeredAt: new Date().toISOString() };
    if (usesSupabase()) {
      const { error } = await getSupabase().from("food_expirations").insert({
        id: item.id, user_id: userId, name: item.name, product_id: item.productId,
        expiration_date: item.expirationDate, registered_at: item.registeredAt,
      });
      if (error) throw error;
    } else getStore().expirations.push({ ...item, userId });
    return item;
  },
  async list(userId: string): Promise<FoodExpiration[]> {
    if (!usesSupabase()) return getStore().expirations.filter(item => item.userId === userId);
    const { data, error } = await getSupabase().from("food_expirations")
      .select("id,name,productId:product_id,expirationDate:expiration_date,registeredAt:registered_at").eq("user_id", userId);
    if (error) throw error;
    return data;
  },
};
