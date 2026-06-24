# Retention policy

This project keeps two kinds of data:

1. **Temporary operational data**
2. **Accounting and invoice data**

The goal is to keep the payment and invoice workflow working while minimizing stored personal data.

## Temporary operational data

These records are meant to disappear automatically or immediately after use.

- `paypal:<orderID>`: temporary checkout state before capture, TTL 1 hour
- `download:<token>`: temporary embroidery download token, TTL 72 hours and deleted after first successful download
- `session:<token>`: admin login session, TTL 3 days
- translated text cache: TTL 30 days

## Order data after payment

The final `order:<orderID>` record is kept because it drives:

- admin approval
- invoice generation
- download tracking
- customer support

After invoice generation and order completion, the worker now clears fields that are no longer needed for the workflow:

- `transactionID`
- `invoiceCountry`
- `buyerEndpointID`
- `invoiceCity`
- `invoicePostalCode`
- `shippingAddress` for digital orders

The temporary `paypal:<orderID>` record is also deleted after the final order is stored.

The final order record now carries retention metadata:

- `retentionClass = temporary` for digital orders without invoice request
- `retentionClass = accounting` for orders with invoice request
- `retentionClass = operational` for physical orders
- `retentionUntil` is set to the 72-hour download window for temporary digital orders

## Accounting data

Invoice files in `FACTUREN` are kept as the accounting archive:

- HTML invoice
- PDF invoice
- UBL XML for business invoices

This archive is the authoritative invoice record. It should only be deleted according to the bookkeeping retention period agreed with the accountant.

## Current retention decisions

- Keep invoice files for the legally required accounting period.
- Keep `accounting` and `operational` order records only as long as needed for admin, support, and bookkeeping.
- Do not keep temporary checkout state longer than necessary.
- Do not keep download tokens after successful use.

## Next review point

The next concrete decision should be the exact deletion policy for old completed orders and invoice archives:

- what is kept permanently
- what is deleted after a fixed number of years
- whether completed non-billing support data should be purged earlier

## Scheduled cleanup

Automatic cleanup runs through the Worker `scheduled` handler.

The scheduled purge route is protected by `RETENTION_CRON_SECRET`, which should be set as a Wrangler secret, not in the repository.
