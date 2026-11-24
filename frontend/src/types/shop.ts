export type ShopItemState = "ok" | "full" | "max_owned" | "not_enough_gems";

export interface ShopItem {
  id: "heart_refill" | "streak_freeze";
  cost: number;
  state: ShopItemState;
  owned: number;
  max: number;
}

export interface ShopResponse {
  gems: number;
  hearts: number;
  max_hearts: number;
  items: ShopItem[];
}
