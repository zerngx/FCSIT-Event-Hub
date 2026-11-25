// Shared by the profile form (client) and the profile action (server).
// Keep it out of any "use server" file: those may only export async functions.
export const PROGRAMMES = [
  "Artificial Intelligence",
  "Computer System and Network",
  "Data Science",
  "Information Systems",
  "Multimedia Computing",
  "Software Engineering",
] as const;
