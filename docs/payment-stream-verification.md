# Payment Stream Verification

Last reviewed: 2 October 2026.

## Checks

Run `node --test scripts/payment-status-subscription.test.mjs`, `node scripts/payment-bank-ui.test.mjs` and `node scripts/payment-stream-ui.test.mjs`. The browser fixtures use isolated local HTTP servers and synthetic payment data; they never call a provider or perform financial mutations. Screenshots are written outside the repository.

Run the existing render, appearance and access checks plus production build. Changed JavaScript files pass targeted ESLint. Full frontend lint retains the same 22 errors and four warnings as the main baseline in unrelated files.

Update this document when payment verification commands or fixture boundaries change.
