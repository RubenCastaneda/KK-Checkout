# KK Beauty Checkout Template

A complete Square Web Payments SDK example for KK Beauty. This template includes an Express
server, a styled checkout page, and ready-to-use API routes that create payments with Square.
Replace the demo products, plug in your own Square credentials, and you are ready to accept
payments.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- A Square developer account with a Sandbox application configured

## 1. Clone and install dependencies

```bash
npm install
```

## 2. Configure Square credentials

1. Copy the example environment file and edit it:

   ```bash
   cp .env.example .env
   ```

2. Populate the following values from your Square Developer Dashboard:
   - `SQUARE_APPLICATION_ID`
   - `SQUARE_LOCATION_ID`
   - `SQUARE_ACCESS_TOKEN` (use the Sandbox token while testing)

3. Adjust `SQUARE_ENVIRONMENT` to `production` when you are ready to take real payments.

> **Security tip:** Never commit `.env` or share your Square access token. The template already
> ignores `.env` and `node_modules/` via `.gitignore`.

## 3. Start the development server

```bash
npm run dev
```

The checkout page is now available at [http://localhost:3000](http://localhost:3000).

Use Square's sandbox test card numbers while developing:

- Card number: `4111 1111 1111 1111`
- CVV: `111`
- Expiration: Any future date
- ZIP: `12345`

## 4. Customize the experience

- Edit `public/index.html` and `public/js/main.js` to update the products, copy, and UX.
- Tweak styling in `public/css/styles.css` to match KK Beauty branding.
- Update the `tokenizeAndPay` payload in `public/js/main.js` if you want to send additional
  buyer or order information to Square.

## Production checklist

- Switch the script tag in `public/index.html` from the sandbox SDK to the production CDN:

  ```html
  <script src="https://web.squarecdn.com/v1/square.js" defer></script>
  ```

- Set `SQUARE_ENVIRONMENT=production` in `.env`.
- Replace Sandbox credentials with your production Application ID, Location ID, and Access Token.
- Consider storing order details in your own database before calling the payments API.
- Configure HTTPS (required by Square in production) and deploy the Express server to your
  preferred hosting platform.

## Project structure

```
KK-Checkout/
├─ public/
│  ├─ css/styles.css      # Checkout styling
│  ├─ js/main.js          # Square Web Payments SDK integration
│  ├─ index.html          # Checkout template
│  └─ 404.html            # Simple not-found page
├─ server/index.js        # Express server and payments endpoint
├─ .env.example           # Environment variable template
├─ package.json
└─ README.md
```

## Troubleshooting

| Symptom | Likely cause | Resolution |
| --- | --- | --- |
| "Square Web Payments SDK failed to load" | Using Sandbox SDK without internet access or CDN blocked | Ensure the `<script>` tag points to the sandbox CDN in development and that you have connectivity. |
| 401 errors from `/api/payments` | Invalid or missing Square credentials | Double-check `.env` values and restart the server. |
| Payment completes in Sandbox but not Production | Environment mismatch | Confirm `SQUARE_ENVIRONMENT` and the CDN URL both point to the same environment. |

## License

MIT
