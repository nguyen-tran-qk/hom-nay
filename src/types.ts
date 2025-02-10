// From https://date.nager.at/swagger/index.html
export type PublicHolidayType =
  | 'Public'
  | 'Bank'
  | 'School'
  | 'Authorities'
  | 'Optional'
  | 'Observance';

// https://date.nager.at/swagger/index.html
export type PublicHoliday = {
  /** The date */
  date: string;
  /** Holiday name in local language */
  localName: string | null;
  /** Holiday name in English */
  name: string | null;
  /** ISO 3166-1 alpha-2 */
  countryCode: string | null;
  /** A list of types of the public holiday */
  types: PublicHolidayType[];
};
