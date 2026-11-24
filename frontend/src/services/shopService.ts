import api from "./api";
import type { ShopResponse } from "../types/shop";

export async function getShop(): Promise<ShopResponse> {
  const res = await api.get<ShopResponse>("/shop");
  return res.data;
}

export async function purchase(item: "heart_refill" | "streak_freeze"): Promise<ShopResponse> {
  const res = await api.post<ShopResponse>("/shop/purchase", { item });
  return res.data;
}
