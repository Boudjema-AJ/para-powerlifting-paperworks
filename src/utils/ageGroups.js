export function calculateAgeGroups(dob, referenceDateStr = "2025-12-31") {
  if (!dob) return [];
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return []; // Return empty if invalid date

  const referenceDate = new Date(referenceDateStr);
  const age = referenceDate.getFullYear() - birthDate.getFullYear() -
    (referenceDate.getMonth() < birthDate.getMonth() ||
      (referenceDate.getMonth() === birthDate.getMonth() && referenceDate.getDate() < birthDate.getDate()) ? 1 : 0);

  const ageGroups = [];
  if (age >= 14 && age <= 17) ageGroups.push("Rookie");
  if (age >= 18 && age <= 20) ageGroups.push("Next Gen");
  if (age >= 15) ageGroups.push("Elite");
  if (age >= 45) ageGroups.push("Legend");

  return ageGroups;
}