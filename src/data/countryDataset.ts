const regionCodes = [
  "AF", "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW", "AU", "AT", "AZ",
  "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BQ", "BA", "BW", "BV", "BR",
  "IO", "BN", "BG", "BF", "BI", "CV", "KH", "CM", "CA", "KY", "CF", "TD", "CL", "CN", "CX", "CC",
  "CO", "KM", "CG", "CD", "CK", "CR", "CI", "HR", "CU", "CW", "CY", "CZ", "DK", "DJ", "DM", "DO",
  "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF",
  "GA", "GM", "GE", "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY",
  "HT", "HM", "VA", "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM",
  "JP", "JE", "JO", "KZ", "KE", "KI", "KP", "KR", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY",
  "LI", "LT", "LU", "MO", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "YT", "MX",
  "FM", "MD", "MC", "MN", "ME", "MS", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "NC", "NZ", "NI",
  "NE", "NG", "NU", "NF", "MK", "MP", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH",
  "PN", "PL", "PT", "PR", "QA", "RE", "RO", "RU", "RW", "BL", "SH", "KN", "LC", "MF", "PM", "VC",
  "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SX", "SK", "SI", "SB", "SO", "ZA", "GS",
  "SS", "ES", "LK", "SD", "SR", "SJ", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TK",
  "TO", "TT", "TN", "TR", "TM", "TC", "TV", "UG", "UA", "AE", "GB", "US", "UM", "UY", "UZ", "VU",
  "VE", "VN", "VG", "VI", "WF", "EH", "YE", "ZM", "ZW",
];

const callingCodeByRegion: Record<string, string> = {
  AF: "+93", AL: "+355", DZ: "+213", AS: "+1", AD: "+376", AO: "+244", AI: "+1", AG: "+1", AR: "+54", AM: "+374",
  AW: "+297", AU: "+61", AT: "+43", AZ: "+994", BS: "+1", BH: "+973", BD: "+880", BB: "+1", BY: "+375",
  BE: "+32", BZ: "+501", BJ: "+229", BM: "+1", BT: "+975", BO: "+591", BA: "+387", BW: "+267", BR: "+55",
  BN: "+673", BG: "+359", BF: "+226", BI: "+257", CV: "+238", KH: "+855", CM: "+237", CA: "+1", KY: "+1",
  CF: "+236", TD: "+235", CL: "+56", CN: "+86", CO: "+57", KM: "+269", CG: "+242", CD: "+243", CK: "+682",
  CR: "+506", CI: "+225", HR: "+385", CU: "+53", CW: "+599", CY: "+357", CZ: "+420", DK: "+45", DJ: "+253",
  DM: "+1", DO: "+1", EC: "+593", EG: "+20", SV: "+503", GQ: "+240", ER: "+291", EE: "+372", SZ: "+268",
  ET: "+251", FJ: "+679", FI: "+358", FR: "+33", GA: "+241", GM: "+220", GE: "+995", DE: "+49", GH: "+233",
  GI: "+350", GR: "+30", GL: "+299", GD: "+1", GU: "+1", GT: "+502", GN: "+224", GW: "+245", GY: "+592",
  HT: "+509", HN: "+504", HK: "+852", HU: "+36", IS: "+354", IN: "+91", ID: "+62", IR: "+98", IQ: "+964",
  IE: "+353", IL: "+972", IT: "+39", JM: "+1", JP: "+81", JO: "+962", KZ: "+7", KE: "+254", KI: "+686",
  KP: "+850", KR: "+82", KW: "+965", KG: "+996", LA: "+856", LV: "+371", LB: "+961", LS: "+266", LR: "+231",
  LY: "+218", LI: "+423", LT: "+370", LU: "+352", MO: "+853", MG: "+261", MW: "+265", MY: "+60", MV: "+960",
  ML: "+223", MT: "+356", MH: "+692", MR: "+222", MU: "+230", MX: "+52", FM: "+691", MD: "+373", MC: "+377",
  MN: "+976", ME: "+382", MS: "+1", MA: "+212", MZ: "+258", MM: "+95", NA: "+264", NR: "+674", NP: "+977",
  NL: "+31", NZ: "+64", NI: "+505", NE: "+227", NG: "+234", NO: "+47", OM: "+968", PK: "+92", PW: "+680",
  PS: "+970", PA: "+507", PG: "+675", PY: "+595", PE: "+51", PH: "+63", PL: "+48", PT: "+351", PR: "+1",
  QA: "+974", RO: "+40", RU: "+7", RW: "+250", KN: "+1", LC: "+1", VC: "+1", WS: "+685", SM: "+378",
  ST: "+239", SA: "+966", SN: "+221", RS: "+381", SC: "+248", SL: "+232", SG: "+65", SK: "+421", SI: "+386",
  SB: "+677", SO: "+252", ZA: "+27", SS: "+211", ES: "+34", LK: "+94", SD: "+249", SR: "+597", SE: "+46",
  CH: "+41", SY: "+963", TW: "+886", TJ: "+992", TZ: "+255", TH: "+66", TL: "+670", TG: "+228", TO: "+676",
  TT: "+1", TN: "+216", TR: "+90", TM: "+993", TC: "+1", TV: "+688", UG: "+256", UA: "+380", AE: "+971",
  GB: "+44", US: "+1", UY: "+598", UZ: "+998", VU: "+678", VE: "+58", VN: "+84", VG: "+1", VI: "+1",
  YE: "+967", ZM: "+260", ZW: "+263",
};

const nationalityByRegion: Record<string, string> = {
  CA: "Canadian", CN: "Chinese", DE: "German", EG: "Egyptian", FR: "French", GH: "Ghanaian", IN: "Indian",
  IR: "Iranian", IT: "Italian", KE: "Kenyan", NG: "Nigerian", PK: "Pakistani", RU: "Russian", SA: "Saudi",
  TR: "Turkish", UG: "Ugandan", GB: "British", US: "American", ZA: "South African",
};

const displayNames = new Intl.DisplayNames(["en"], { type: "region" });

export type CountryOption = {
  code: string;
  name: string;
  callingCode: string;
  nationality: string;
};

export const countryOptions: CountryOption[] = regionCodes
  .map((code) => {
    const name = displayNames.of(code) ?? code;
    return {
      code,
      name,
      callingCode: callingCodeByRegion[code] ?? "",
      nationality: nationalityByRegion[code] ?? name,
    };
  })
  .sort((left, right) => left.name.localeCompare(right.name));

export const nationalityOptions = Array.from(
  new Set(countryOptions.map((country) => country.nationality).filter(Boolean)),
).sort((left, right) => left.localeCompare(right));

export const callingCodeOptions = countryOptions
  .filter((country) => country.callingCode)
  .map((country) => ({
    label: `${country.name} (${country.callingCode})`,
    value: country.callingCode,
  }));

export function getCountryOptionByName(name: string) {
  const normalized = name.trim().toLowerCase();
  return countryOptions.find((country) => country.name.toLowerCase() === normalized);
}
