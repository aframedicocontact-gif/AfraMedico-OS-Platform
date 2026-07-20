export const preferredLanguages = [
  "English",
  "French",
  "Spanish",
  "Arabic",
  "Persian (Farsi)",
  "Turkish",
  "Hindi",
  "Urdu",
  "Russian",
  "Chinese",
  "German",
  "Italian",
  "Portuguese",
];

export const commonTreatments = [
  "Brain Surgery",
  "Cancer Treatment",
  "Oncology",
  "Cardiac Surgery",
  "IVF",
  "Orthopedics",
  "Robotic Surgery",
  "Neurosurgery",
  "Neurology",
  "Transplant",
  "Dental",
  "Hair Transplant",
  "Bariatric Surgery",
  "Plastic Surgery",
  "Ophthalmology",
  "Rehabilitation",
  "Diagnostics",
];

export function buildInternationalNumber(countryCode: string, localNumber: string) {
  const cleanLocal = localNumber.replace(/\D/g, "");
  return countryCode && cleanLocal ? `${countryCode} ${cleanLocal}` : "";
}
