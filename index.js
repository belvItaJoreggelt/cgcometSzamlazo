/**
 * NAV Online Számla – számla kiállítás
 * 
 * Használat:
 *   node index.js                    – példa számla (5000 Ft adomány)
 *   node index.js 10000 "Kovács József"  – egyedi összeg és név
 */
import 'dotenv/config';
import NavConnector from '@angro/nav-connector';
import { technicalUser, softwareData, baseURL } from './config.js';
import { buildSimplifiedDonationInvoice } from './invoice-builder.js';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nextInvoiceNumber() {
  const y = new Date().getFullYear();
  const n = Math.floor(Math.random() * 9999) + 1;
  return `DOM-${y}-${String(n).padStart(4, '0')}`;
}

async function main() {
  const amount = parseInt(process.argv[2], 10) || 5000;
  const customerName = process.argv[3] || 'Adományozó';
  const invoiceNumber = nextInvoiceNumber();
  const issueDate = today();

  console.log('NAV Online Számla – számla kiállítás\n');
  console.log(`  Számlaszám: ${invoiceNumber}`);
  console.log(`  Összeg:     ${amount} Ft`);
  console.log(`  Vevő:       ${customerName}\n`);

  if (!technicalUser.login || !technicalUser.password) {
    console.error('❌ Hiányzó .env! Lásd .env.example');
    process.exit(1);
  }

  const xml = buildSimplifiedDonationInvoice({
    invoiceNumber,
    issueDate,
    amount,
    customerName,
  });

  const invoiceBase64 = Buffer.from(xml, 'utf-8').toString('base64');

  const nav = new NavConnector({ technicalUser, softwareData, baseURL });

  try {
    const transactionId = await nav.manageInvoice({
      compressedContent: false,
      invoiceOperation: [
        {
          index: 1,
          operation: 'CREATE',
          invoice: invoiceBase64,
        },
      ],
    });

    console.log('✅ Számla elküldve a NAV-nak!');
    console.log(`   Tranzakció ID: ${transactionId}\n`);

    // Státusz lekérdezése (opcionális)
    const results = await nav.queryTransactionStatus({ transactionId });
    if (results?.length > 0) {
      const r = results[0];
      console.log('   Státusz:', r.invoiceStatus || '(feldolgozás alatt)');
    }
  } catch (err) {
    console.error('❌ Hiba:', err.message);
    if (err.response?.data) {
      console.error('   Részlet:', JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }
}

main();
