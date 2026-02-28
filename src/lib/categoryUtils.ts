const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: [
    "grocery",
    "groceries",
    "restaurant",
    "food",
    "coffee",
    "lunch",
    "dinner",
    "breakfast",
    "uber eats",
    "doordash",
    "grubhub",
    "mcdonald",
    "starbucks",
    "pizza",
    "burger",
    "bakery",
    "cafe",
    "eat",
    "meal",
    "snack",
    "takeout",
    "sushi",
    "deli",
    "bar",
    "pub",
    "kitchen",
  ],
  transport: [
    "uber",
    "lyft",
    "gas",
    "fuel",
    "parking",
    "transit",
    "bus",
    "train",
    "flight",
    "airline",
    "taxi",
    "metro",
    "subway",
    "toll",
    "car wash",
    "auto",
    "vehicle",
    "oil change",
    "mechanic",
    "rental car",
  ],
  utilities: [
    "electric",
    "electricity",
    "water",
    "internet",
    "phone",
    "utility",
    "bill",
    "subscription",
    "cable",
    "wifi",
    "broadband",
    "mobile plan",
    "cell plan",
    "heating",
    "gas bill",
    "sewer",
    "trash",
    "waste",
  ],
  entertainment: [
    "netflix",
    "spotify",
    "hulu",
    "disney",
    "movie",
    "game",
    "gaming",
    "concert",
    "ticket",
    "theater",
    "theatre",
    "cinema",
    "music",
    "stream",
    "youtube",
    "twitch",
    "apple tv",
    "hbo",
    "amazon prime",
    "book",
  ],
  salary: [
    "salary",
    "payroll",
    "wage",
    "bonus",
    "commission",
    "freelance",
    "income",
    "payment received",
    "direct deposit",
    "pay",
    "earnings",
    "consulting",
    "contract",
  ],
  other: [],
};

/**
 * Suggests a category based on the transaction description.
 * Returns the best matching category or "other" if no match is found.
 */
export function suggestCategory(description: string): string {
  const lower = description.toLowerCase().trim();
  if (!lower) return "other";

  let bestMatch = "other";
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === "other") continue;
    for (const keyword of keywords) {
      if (lower.includes(keyword) && keyword.length > bestScore) {
        bestMatch = category;
        bestScore = keyword.length;
      }
    }
  }

  return bestMatch;
}

export const CATEGORIES = [
  { value: "food", label: "Food" },
  { value: "transport", label: "Transport" },
  { value: "utilities", label: "Utilities" },
  { value: "entertainment", label: "Entertainment" },
  { value: "salary", label: "Salary" },
  { value: "other", label: "Other" },
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  food: "#f97316",
  transport: "#3b82f6",
  utilities: "#a855f7",
  entertainment: "#ec4899",
  salary: "#22c55e",
  other: "#6b7280",
};
