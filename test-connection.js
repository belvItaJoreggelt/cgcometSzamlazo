/**
 * NAV API kapcsolat tesztelése
 * Futtatás: node test-connection.js
 */
import 'dotenv/config';
import NavConnector from '@angro/nav-connector';
import { technicalUser, softwareData, baseURL } from './config.js';

async function main() {
  console.log('NAV Online Számla – kapcsolat tesztelése...\n');

  if (!technicalUser.login || !technicalUser.password) {
    console.error('❌ Hiányzó adatok! Másold át a .env.example fájlt .env-ra és töltsd ki a NAV adataiddal.');
    process.exit(1);
  }

  console.log('Használt beállítások:');
  console.log('  Login:', technicalUser.login);
  console.log('  Adószám:', technicalUser.taxNumber);
  console.log('  API URL:', baseURL);
  console.log('  Jelszó hossz:', technicalUser.password?.length || 0, 'karakter');
  console.log('');

  const nav = new NavConnector({ technicalUser, softwareData, baseURL });

  try {
    await nav.testConnection();
    console.log('✅ Sikeres kapcsolat a NAV API-val!');
  } catch (err) {
    console.error('❌ Hibás kapcsolat:', err.message);
    if (err.response?.data) {
      console.error('   Részlet:', JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }
}

main();
