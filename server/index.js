const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const { Client, Environment } = require('square');

dotenv.config();

const requiredEnvVars = ['SQUARE_APPLICATION_ID', 'SQUARE_LOCATION_ID', 'SQUARE_ACCESS_TOKEN'];
const missingEnv = requiredEnvVars.filter((name) => !process.env[name]);

if (missingEnv.length) {
  console.warn(
    `⚠️  Missing required Square environment variables: ${missingEnv.join(', ')}.\n` +
      '    The server will still start so you can work on the UI,\n' +
      '    but API requests to Square will fail until these values are provided.'
  );
}

const app = express();
const port = process.env.PORT || 3000;
const currency = process.env.SQUARE_CURRENCY || 'USD';
const baseDir = path.join(__dirname, '..');

app.use(express.json());
app.use(express.static(path.join(baseDir, 'public')));

function buildSquareClient() {
  if (!process.env.SQUARE_ACCESS_TOKEN) {
    throw new Error('Square access token is not configured.');
  }

  const environment =
    process.env.SQUARE_ENVIRONMENT && process.env.SQUARE_ENVIRONMENT.toLowerCase() === 'production'
      ? Environment.Production
      : Environment.Sandbox;

  return new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    environment
  });
}

app.get('/config', (_req, res) => {
  res.json({
    applicationId: process.env.SQUARE_APPLICATION_ID || '',
    locationId: process.env.SQUARE_LOCATION_ID || '',
    currency
  });
});

app.post('/api/payments', async (req, res) => {
  const { sourceId, amount, currency: bodyCurrency, buyerEmail, note } = req.body;

  if (!sourceId) {
    return res.status(400).json({ error: 'Missing card token from Square Web Payments SDK.' });
  }

  if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Payment amount must be provided as a positive integer of the lowest currency denomination (for USD, cents).' });
  }

  try {
    const client = buildSquareClient();
    const paymentsApi = client.paymentsApi;

    const requestBody = {
      sourceId,
      idempotencyKey: uuidv4(),
      amountMoney: {
        amount: BigInt(amount),
        currency: (bodyCurrency || currency || 'USD').toUpperCase()
      },
      autocomplete: true,
      buyerEmailAddress: buyerEmail,
      note
    };

    const { result } = await paymentsApi.createPayment(requestBody);

    res.status(200).json({
      payment: result.payment,
      message: 'Payment completed successfully!'
    });
  } catch (error) {
    console.error('Error creating payment with Square:', error);

    const { errors = [] } = error;
    const [squareError] = errors;

    res.status(500).json({
      error: squareError?.detail || error.message || 'Failed to process payment.'
    });
  }
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(baseDir, 'public', '404.html'), (err) => {
    if (err) {
      res.status(404).json({ error: 'Route not found.' });
    }
  });
});

app.listen(port, () => {
  console.log(`KK Beauty checkout server listening on http://localhost:${port}`);
});
