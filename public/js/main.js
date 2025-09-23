const orderForm = document.getElementById('order-form');
const paymentForm = document.getElementById('payment-form');
const subtotalEl = document.getElementById('subtotal');
const totalEl = document.getElementById('order-total');
const buttonTotalEl = document.getElementById('button-total');
const statusEl = document.getElementById('payment-status');

let currency = 'USD';
let currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency
});

let squareAppId = '';
let squareLocationId = '';
let card;

async function fetchSquareConfig() {
  const response = await fetch('/config');
  if (!response.ok) {
    throw new Error('Unable to load Square configuration.');
  }

  const config = await response.json();
  squareAppId = config.applicationId;
  squareLocationId = config.locationId;
  currency = (config.currency || 'USD').toUpperCase();
  currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  });

  if (!squareAppId || !squareLocationId) {
    throw new Error(
      'Square application ID and location ID must be configured. Update your .env file and restart the server.'
    );
  }
}

function calculateTotals() {
  const quantityInputs = [...orderForm.querySelectorAll('input[data-price]')];
  const subtotalCents = quantityInputs.reduce((sum, input) => {
    const quantity = Number.parseInt(input.value, 10) || 0;
    const price = Number.parseInt(input.dataset.price, 10) || 0;
    return sum + quantity * price;
  }, 0);

  const subtotalDisplay = currencyFormatter.format(subtotalCents / 100);
  subtotalEl.textContent = subtotalDisplay;
  totalEl.textContent = subtotalDisplay;
  buttonTotalEl.textContent = subtotalDisplay;

  return subtotalCents;
}

function setStatus(message, type = 'info') {
  statusEl.textContent = message;
  statusEl.className = `status status--${type}`;
}

async function initializeSquare() {
  await fetchSquareConfig();

  if (!window.Square) {
    throw new Error('Square Web Payments SDK failed to load.');
  }

  const payments = window.Square.payments(squareAppId, squareLocationId);
  card = await payments.card();
  await card.attach('#card-container');
}

async function tokenizeAndPay(totalCents) {
  setStatus('Processing payment…', 'pending');

  const tokenResult = await card.tokenize();

  if (tokenResult.status !== 'OK') {
    throw new Error(tokenResult.errors?.[0]?.message || 'Card tokenization failed.');
  }

  const formData = new FormData(paymentForm);

  const payload = {
    sourceId: tokenResult.token,
    amount: totalCents,
    currency,
    buyerEmail: formData.get('email') || undefined,
    note: `KK Beauty checkout order for ${formData.get('cardholder') || 'customer'}`
  };

  const response = await fetch('/api/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const { error } = await response.json();
    throw new Error(error || 'Payment failed.');
  }

  const result = await response.json();
  return result;
}

orderForm.addEventListener('input', () => {
  calculateTotals();
});

paymentForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!paymentForm.reportValidity()) {
    return;
  }

  const totalCents = calculateTotals();

  if (totalCents <= 0) {
    setStatus('Add at least one product to your order before paying.', 'error');
    return;
  }

  try {
    const result = await tokenizeAndPay(totalCents);
    setStatus('Payment successful! Confirmation ID: ' + result.payment.id, 'success');
    paymentForm.reset();
    orderForm.reset();
    calculateTotals();
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'An unexpected error occurred while processing payment.', 'error');
  }
});

calculateTotals();

initializeSquare().catch((error) => {
  console.error('Failed to initialize Square payments:', error);
  setStatus(error.message, 'error');
  document.getElementById('card-button').disabled = true;
});
