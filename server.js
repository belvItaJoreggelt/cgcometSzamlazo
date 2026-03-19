/**
 * Stripe webhook szerver – sikeres fizetés után NAV számla
 * 
 * Futtatás: npm start
 * 
 * Lokális teszt: stripe listen --forward-to localhost:4242/api/stripe-webhook
 */
import 'dotenv/config';
import express from 'express';
import Stripe from 'stripe';
import { issueInvoiceFromStripe } from './lib/issue-from-stripe.js';

const app = express();
const PORT = process.env.PORT || 4242;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-11-20.acacia' });

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'nav-invoice-stripe' });
});

app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET hiányzik a .env-ből');
    return res.status(500).json({ error: 'Webhook nincs konfigurálva' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook aláírás hiba:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type !== 'checkout.session.completed') {
    return res.json({ received: true });
  }

  const session = event.data.object;
  console.log('Stripe fizetés sikeres:', session.id);

  const result = await issueInvoiceFromStripe(session);

  if (result.success) {
    console.log('NAV számla elküldve:', result.invoiceNumber, result.transactionId);
    return res.json({ received: true, invoiceNumber: result.invoiceNumber });
  }

  console.error('NAV számla hiba:', result.error);
  return res.status(500).json({ error: result.error, received: true });
});

app.listen(PORT, () => {
  console.log(`Stripe webhook szerver: http://localhost:${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/api/stripe-webhook`);
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('FIGYELEM: STRIPE_SECRET_KEY hiányzik!');
  }
});
