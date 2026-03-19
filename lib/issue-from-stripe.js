/**
 * CGCOMET NAV Online Számla konfiguráció
 * 
 * A NAV Online Számla rendszerhez regisztráció szükséges:
 * https://onlineszamla.nav.gov.hu
 * 
 * Technikai felhasználó: Bejelentkezés → Technikai felhasználó kezelése
 * Software adatok: Szoftver adatai menüpont
 */

/** Adószám: NAV csak 8 számjegyet fogad (59877527-1-33 → 59877527) */
function toTaxNumber(val) {
  if (!val) return '';
  const digits = String(val).replace(/\D/g, '');
  return digits.slice(0, 8);
}

/** Szoftver ID: NAV pontosan 18 karaktert vár [0-9A-Z-] */
function toSoftwareId(val) {
  if (!val) return '123456789012345678';
  const s = String(val).replace(/[^0-9A-Z\-]/gi, '').toUpperCase();
  return s.padEnd(18, '0').slice(0, 18);
}

export const companyConfig = {
  /** Eladó / Kiállító adatai (CGCOMET) */
  supplier: {
    taxpayerId: toTaxNumber(process.env.NAV_SUPPLIER_TAX_ID) || '12345678',      // Adószám (8 karakter)
    incorporation: process.env.NAV_SUPPLIER_INCORP || '2',          // 2 = Kft, 5 = Egyéni, stb.
    countyCode: process.env.NAV_SUPPLIER_COUNTY || '01',             // Megye kód (01 = Budapest)
    name: process.env.NAV_SUPPLIER_NAME || 'CGCOMET',
    countryCode: 'HU',
    postalCode: process.env.NAV_SUPPLIER_POSTAL || '1234',
    city: process.env.NAV_SUPPLIER_CITY || 'Budapest',
    addressLine1: process.env.NAV_SUPPLIER_ADDRESS1 || 'Utca',
    addressLine2: process.env.NAV_SUPPLIER_ADDRESS2 || '1',
    bankAccountNumber: process.env.NAV_SUPPLIER_IBAN || 'HU00 0000 0000 0000 0000 0000 0000',
  },
};

/** NAV API technikai felhasználó (a regisztráció során kapod) */
export const technicalUser = {
  login: process.env.NAV_TECH_USER_LOGIN || '',
  password: process.env.NAV_TECH_USER_PASSWORD || '',
  taxNumber: toTaxNumber(process.env.NAV_TECH_TAX_NUMBER) || '',
  signatureKey: process.env.NAV_SIGNATURE_KEY || '',
  exchangeKey: process.env.NAV_EXCHANGE_KEY || '',
};

/** Szoftver adatok (regisztrációnál megadott) */
export const softwareData = {
  softwareId: toSoftwareId(process.env.NAV_SOFTWARE_ID || '123456789012345678'),
  softwareName: process.env.NAV_SOFTWARE_NAME || 'CGCOMET Web',
  softwareOperation: 'LOCAL_SOFTWARE',
  softwareMainVersion: '1.0',
  softwareDevName: process.env.NAV_SOFTWARE_DEV_NAME || 'CGCOMET',
  softwareDevContact: process.env.NAV_SOFTWARE_DEV_CONTACT || 'officialcgcomet@gmail.com',
  softwareDevCountryCode: 'HU',
  softwareDevTaxNumber: toTaxNumber(process.env.NAV_SOFTWARE_DEV_TAX) || '',
};

/** API URL – alapértelmezetten ÉLES. Teszt csak ha NAV_USE_TEST=true */
const useTest = String(process.env.NAV_USE_TEST || '').toLowerCase().trim() === 'true';
export const baseURL = useTest
  ? 'https://api-test.onlineszamla.nav.gov.hu/invoiceService/v3/'
  : 'https://api.onlineszamla.nav.gov.hu/invoiceService/v3/';
