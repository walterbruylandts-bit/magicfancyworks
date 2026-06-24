# VAT decisions

This document records the current VAT decision logic in `worker.js` and the scenarios that were technically checked by simulating the `getVatInfo()` decision tree.

No PayPal sandbox transaction is required for these checks. Physical orders can be simulated with order objects containing `orderType`, `invoiceType`, `invoiceCountry`, `shippingAddress.address.country`, and `vatNumber`.

## Technically tested scenarios

The following combinations were simulated:

- Order types: `digital`, `physical`, `mixed`
- Customer types:
  - private customer, no VAT number
  - business customer, no VAT number
  - business customer, Belgian VAT number
  - business customer, EU VAT number
  - business customer, non-EU VAT-like number
- Country cases:
  - invoice country BE, shipping country BE
  - invoice country NL, shipping country NL
  - invoice country US, shipping country US
  - invoice country NL, shipping country US
  - invoice country US, shipping country NL

This covers 75 simulated combinations.

## Current worker outputs

The current `getVatInfo()` logic returns these VAT keys and UBL categories:

| Scenario | Worker key | UBL category | Current invoice note |
|---|---|---:|---|
| Private customer, any country | `small` | `E` | Vrijstellingsregeling kleine ondernemingen - art. 56bis WBTW |
| Business customer without VAT number, any country | `small` | `E` | Vrijstellingsregeling kleine ondernemingen - art. 56bis WBTW |
| Business customer, Belgian destination | `small` | `E` | Vrijstellingsregeling kleine ondernemingen - art. 56bis WBTW |
| Business customer, digital order, EU non-BE destination | `digitalEU` | `AE` | Btw verlegd - Toepassing van artikel 21, §2 van het Belgisch Btw-Wetboek |
| Business customer, digital order, non-EU destination | `digitalNonEU` | `O` | Dienst buiten de EU - Niet onderworpen aan Belgische btw |
| Business customer, physical order, EU non-BE shipping destination | `physicalEU` | `K` | Intracommunautaire levering - artikel 39bis |
| Business customer, physical order, non-EU shipping destination | `physicalNonEU` | `G` | Uitvoer - artikel 39, §1 |
| Business customer, mixed order, EU non-BE shipping destination | `physicalEU` | `K` | Treated as physical order |
| Business customer, mixed order, non-EU shipping destination | `physicalNonEU` | `G` | Treated as physical order |

For digital orders, the decision country is `invoiceCountry`.

For physical and mixed orders, the decision country is `shippingAddress.address.country`, falling back to `invoiceCountry`.

## Fiscally confirmed scenarios

The following are considered technically aligned with common VAT principles, but still depend on correct business data and records:

- Belgian private or Belgian business invoices using the small business exemption note.
- EU B2B digital services with a valid EU VAT number using reverse charge.
- EU B2B physical goods shipped to another EU member state with a valid EU VAT number and transport evidence.
- Non-EU physical exports when export/shipping evidence is retained.
- Non-EU services where the service is outside the scope of Belgian VAT, subject to normal place-of-supply rules.

## Requires bookkeeping approval

The following scenarios should be confirmed by the accountant before relying on the current automation:

- EU B2C digital orders under the Belgian small business exemption versus OSS/e-commerce rules.
- EU B2C physical distance sales under the Belgian small business exemption versus OSS/e-commerce thresholds.
- Business customers with a non-empty but unvalidated VAT number.
- EU B2B treatment without automated VIES validation.
- Non-EU private customers where the correct note may depend on whether the sale is a service or export of goods.
- Orders where `invoiceCountry` and shipping country differ.
- Any special VAT territories or exceptions, such as Canary Islands, Monaco, Northern Ireland goods rules, overseas territories, or other non-standard VAT areas.

## Mixed orders

Mixed orders are currently treated as physical orders by `getVatInfo()` because only `orderType === "digital"` is considered digital. This means a mixed order with both a downloadable product and a shipped product receives one VAT treatment based on the shipping country.

Recommendation:

- Do not automatically approve mixed orders for invoicing until the accountant confirms the desired treatment.
- Prefer separate invoice lines with separate VAT treatment, or separate invoices for digital and physical parts.
- If mixed orders remain enabled, add an explicit manual review flag before invoice generation.

## Notes for future implementation

Recommended future improvements:

- Add VIES validation before applying EU B2B reverse charge or intra-Community supply logic.
- Keep export/shipping evidence references for non-EU physical orders.
- Add a reviewed/approved VAT decision field for orders that required manual judgement.
- Consider splitting `mixed` into separate invoice line types rather than one order-level VAT decision.
