export function calculateAge(dateOfBirth: string, today = new Date()): number | null {
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  if (!year || !month || !day) return null;

  let age = today.getFullYear() - year;
  const birthdayHasPassed =
    today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!birthdayHasPassed) age -= 1;
  return age >= 0 ? age : null;
}

export function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
