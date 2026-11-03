export type FoodItem = {
  name: string;
  price: number;
};

export type DietaryPreference = "VEG" | "NON-VEG" | "ANY";

export type NutrixPayload = {
  menu: FoodItem[];
  budget: number;
  proteinTarget: number;
  dietaryPreference?: DietaryPreference;
  language?: string;
};

const STORAGE_KEY = "nutrix:optimize-payload";

export function saveNutrixPayload(payload: NutrixPayload) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota errors */
  }
}

export function loadNutrixPayload(): NutrixPayload | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as NutrixPayload) : null;
  } catch {
    return null;
  }
}
