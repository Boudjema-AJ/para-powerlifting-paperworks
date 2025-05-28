export const weightCategories = {
  Male: ["49kg", "54kg", "59kg", "65kg", "72kg", "80kg", "88kg", "97kg", "107kg", "+107kg"],
  Female: ["41kg", "45kg", "50kg", "55kg", "61kg", "67kg", "73kg", "79kg", "86kg", "+86kg"],
};

export function getWeightCategory(bodyWeight, gender) {
  if (!bodyWeight || !gender) return "";
  const weight = parseFloat(bodyWeight);
  if (isNaN(weight)) return "";

  const categories = weightCategories[gender] || [];
  for (let i = 0; i < categories.length; i++) {
    const catWeight = parseFloat(categories[i].replace("+", ""));
    if (categories[i].includes("+")) {
      if (weight > categories[i - 1].replace("kg", "")) return categories[i];
    } else if (weight <= catWeight) {
      return categories[i];
    }
  }
  return "";
}