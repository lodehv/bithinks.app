# Payment Status Stream

Last reviewed: 2 October 2026.

## Payment screen

- VA and QRIS status updates use authenticated SSE at `/api/wallet/topup/events?paymentId=<id>`.
- The initial `payment-status` event and later events contain the existing payment object.
- Streaming is the primary transport; unavailable streams fall back to four-second polling and bounded reconnect retries.
- Reconnect delays grow from one second to thirty seconds; 15-second server heartbeats reset a 45-second inactivity watchdog.
- Hidden tabs suspend connections and polling, and returning tabs receive a fresh snapshot.
- Authorization failures use the shared session-expiry handler, and committed `credited` state refreshes the wallet once per payment.
- Bank choices and their ordering remain authoritative on the backend.

Update this document when the payment transport, recovery, bank choices, or session behavior changes.
