/**
 * NAV számla kiállítás Stripe checkout session adataiból
 */
import NavConnector from '@angro/nav-connector';
import { technicalUser, softwareData, baseURL } from '../config.js';
import { buildSimplifiedDonationInvoice } from '../invoice-builder.js';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nextInvoiceNumber() {
  const y = new Date().getFullYear();
  const n = Math.floor(Math.random() * 99999) + 1;
  return `STRIPE-${y}-${String(n).padStart(5, '0')}`;
}

/**
 * Stripe Checkout Session → NAV számla
 * @param {Object} session - Stripe checkout.session object
 * @returns {{ success: boolean, transactionId?: string, invoiceNumber?: string, error?: string }}
 */
export async function issueInvoiceFromStripe(session) {
  const amountTotal = session.amount_total ?? 0;
  const currency = (session.currency || '').toUpperCase();
  const customer = session.customer_details || {};
  const customerName = customer.name?.trim() || 'Vevő';
  const customerAddress = customer.address;

  if (currency !== 'HUF') {
    return { success: false, error: `Csak HUF pénznem támogatott, kapott: ${currency}` };
  }

  const amountHuf = Math.round(amountTotal);
  if (amountHuf <= 0) {
    return { success: false, error: 'Érvénytelen összeg' };
  }

  const address = customerAddress ? {
    postalCode: customerAddress.postal_code || '1011',
    city: customerAddress.city || 'Budapest',
    addressLine1: [customerAddress.line1, customerAddress.line2].filter(Boolean).join(' ') || 'Nem megadva',
    addressLine2: '',
  } : null;

  const invoiceNumber = nextInvoiceNumber();
  const issueDate = today();

  const xml = buildSimplifiedDonationInvoice({
    invoiceNumber,
    issueDate,
    amount: amountHuf,
    customerName,
    customerEmail: customer.email,
    customerAddress: address,
    stripePaymentId: session.payment_intent || session.id,
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

    return { success: true, transactionId, invoiceNumber };
  } catch (err) {
    console.error('NAV számla hiba:', err.message);
    return {
      success: false,
      error: err.message,
      detail: err.response?.data,
    };
  }
}

/**
 * Stripe Invoice (invoice.paid) → NAV számla
 * Előfizetés havi díja vagy bármely fizetett számla
 * @param {Object} invoice - Stripe invoice object
 * @returns {{ success: boolean, transactionId?: string, invoiceNumber?: string, error?: string }}
 */
export async function issueInvoiceFromStripeInvoice(invoice) {
  const amountPaid = invoice.amount_paid ?? 0;
  const currency = (invoice.currency || '').toUpperCase();

  if (currency !== 'HUF') {
    return { success: false, error: `Csak HUF pénznem támogatott, kapott: ${currency}` };
  }

  const amountHuf = Math.round(amountPaid);
  if (amountHuf <= 0) {
    return { success: false, error: 'Érvénytelen összeg' };
  }

  const customerName =
    invoice.customer_name ||
    invoice.customer_address?.name ||
    'Vevő';
  const customerAddress = invoice.customer_address;

  const address = customerAddress
    ? {
        postalCode: customerAddress.postal_code || '1011',
        city: customerAddress.city || 'Budapest',
        addressLine1:
          [customerAddress.line1, customerAddress.line2].filter(Boolean).join(' ') || 'Nem megadva',
        addressLine2: customerAddress.line2 || '',
      }
    : null;

  const invoiceNumber = nextInvoiceNumber();
  const issueDate = today();

  const xml = buildSimplifiedDonationInvoice({
    invoiceNumber,
    issueDate,
    amount: amountHuf,
    customerName,
    customerEmail: invoice.customer_email,
    customerAddress: address,
    stripePaymentId: invoice.payment_intent || invoice.id,
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

    return { success: true, transactionId, invoiceNumber };
  } catch (err) {
    console.error('NAV számla hiba:', err.message);
    return {
      success: false,
      error: err.message,
      detail: err.response?.data,
    };
  }
}
