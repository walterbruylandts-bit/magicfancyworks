import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var __defProp22 = Object.defineProperty;
var __name22 = /* @__PURE__ */ __name2((target, value) => __defProp22(target, "name", { value, configurable: true }), "__name");
var __defProp222 = Object.defineProperty;
var __name222 = /* @__PURE__ */ __name22((target, value) => __defProp222(target, "name", { value, configurable: true }), "__name");
function filterEtsy(text) {
  return text.replace(/via Etsy/gi, "via onze webshop").replace(/van ETSY/gi, "").replace(/ETSY-account/gi, "account").replace(/Etsy/gi, "onze webshop").replace(/Mijn account > Aankopen > Klik op de downloadknop\n?/gi, "");
}

__name(filterEtsy, "filterEtsy");
__name2(filterEtsy, "filterEtsy");
__name22(filterEtsy, "filterEtsy");

const COMPANY = {
  name: "Magic Fancy Works",
  vat: "BE0500363711",
  address: "Churchilllaan 150 bus 2",
  postal: "2900 Schoten",
  country: "België"
};
const PRODUCT_CATALOG = {
  mfw00001: { title: "Baby Boy", price: 7.87, type: "digital" },
  mfw00002: { title: "Baby Girl", price: 8.87, type: "digital" },
  mfw00003: { title: "Schattig meisje", price: 9.87, type: "physical" },
  mfw00006: {
    title: "Big Boy Teddy Bear Iron-On Patch XXL",
    price: 14.95,
    type: "physical",
    freeShipping: true,
    formatPrijzen: {
      "10x15 cm": 14.95,
      "16x24 cm": 24.95
    }
  }
};
function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function formatMoneyDisplay(value, useComma = false) {
  const amount = Number(value || 0);
  if (useComma) {
    return new Intl.NumberFormat("nl-BE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
  return amount.toFixed(2);
}
function getProductCatalogItem(code) {
  const normalizedCode = String(code || "").trim();
  return PRODUCT_CATALOG[normalizedCode] || null;
}
function normalizeSearchValue(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}
function extractVariantCandidates(value) {
  const raw = String(value || "");
  const candidates = [];
  const directMatch = raw.match(/(\d{1,3}\s*[x×]\s*\d{1,3}(?:\s*cm)?)|(\d{1,3}\s*[x×]\s*\d{1,3})/i);
  if (directMatch && directMatch[0]) {
    candidates.push(directMatch[0]);
  }
  const compactMatch = raw.match(/(\d{1,3})\s*[x×]\s*(\d{1,3})/i);
  if (compactMatch) {
    candidates.push(`${compactMatch[1]}x${compactMatch[2]}`);
    candidates.push(`${compactMatch[1]} x ${compactMatch[2]}`);
    candidates.push(`${compactMatch[1]}x${compactMatch[2]} cm`);
    candidates.push(`${compactMatch[1]} x ${compactMatch[2]} cm`);
  }
  return candidates.filter(Boolean);
}
function getCatalogVariantPrice(catalogItem, item) {
  if (!catalogItem) return null;
  const variantPriceMap = catalogItem.variantPrijzen || catalogItem.formatPrijzen || catalogItem.prijzen || catalogItem.prijsOpties || null;
  if (!variantPriceMap) return null;

  const candidateValues = [];
  const suppliedTitle = String(item?.title || item?.displayTitle || "").trim();
  const suppliedPatternFile = normalizePatternFilePath(item?.patternFile);

  if (suppliedTitle) {
    candidateValues.push(suppliedTitle);
    candidateValues.push(...extractVariantCandidates(suppliedTitle));
  }
  if (suppliedPatternFile) {
    const fileName = suppliedPatternFile.split("/").pop() || "";
    candidateValues.push(fileName.replace(/\.zip$/i, ""));
    candidateValues.push(fileName);
    candidateValues.push(...extractVariantCandidates(fileName));
  }

  for (const candidate of candidateValues) {
    const normalizedCandidate = normalizeSearchValue(candidate);
    const matchKey = Object.keys(variantPriceMap).find((key) => normalizeSearchValue(key) === normalizedCandidate);
    if (matchKey !== undefined) {
      const matchedPrice = Number(variantPriceMap[matchKey]);
      if (Number.isFinite(matchedPrice) && matchedPrice >= 0) {
        return matchedPrice;
      }
    }
  }

  return null;
}
function normalizePatternFilePath(value) {
  const file = String(value || "").trim().replace(/^\/+/, "");
  if (!/^downloads\/[A-Za-z0-9._-]+\.zip$/.test(file)) {
    return "";
  }
  return file;
}
function normalizeOrderItems(body) {
  const rawItems = Array.isArray(body?.items) && body.items.length > 0
    ? body.items
    : Array.isArray(body?.codes)
      ? body.codes.map((code) => ({ code, qty: 1 }))
      : [];

  const items = rawItems.map((item) => {
    const code = String(item?.code || "").trim();
    const qty = Number.parseInt(item?.qty, 10);
    const normalizedQty = Number.isFinite(qty) && qty > 0 ? qty : 1;
    const catalogItem = getProductCatalogItem(code);
    const suppliedTitle = String(item?.title || item?.displayTitle || "").trim();
    const suppliedPrice = Number(item?.price);
    const suppliedPromoEligible = item?.promoEligible;
    const suppliedPromoCode = String(item?.promoCode || "").trim().toUpperCase();
    const suppliedFreeShipping = item?.freeShipping;
    const suppliedPatternFile = normalizePatternFilePath(item?.patternFile);

    if (!code) {
      throw new Error("Productcode ontbreekt");
    }
    if (!catalogItem) {
      throw new Error(`Onbekende productcode: ${code}`);
    }

    const catalogVariantPrice = getCatalogVariantPrice(catalogItem, item);
    const expectedPrice = catalogVariantPrice !== null ? catalogVariantPrice : Number(catalogItem.price);

    return {
      code,
      qty: normalizedQty,
      title: suppliedTitle || catalogItem.title,
      price: Number.isFinite(suppliedPrice) && suppliedPrice >= 0 ? suppliedPrice : expectedPrice,
      type: catalogItem.type,
      promoCode: suppliedPromoCode,
      promoEligible: suppliedPromoEligible === undefined ? Boolean(suppliedPromoCode) : Boolean(suppliedPromoEligible),
      freeShipping: suppliedFreeShipping === undefined ? Boolean(catalogItem.freeShipping) : Boolean(suppliedFreeShipping),
      patternFile: suppliedPatternFile
    };
  });

  if (items.length === 0) {
    throw new Error("Geen producten meegegeven");
  }

  return items;
}
function getOrderPatternFile(items, codes) {
  const directPatternFile = items
    .map((item) => normalizePatternFilePath(item?.patternFile))
    .find(Boolean);
  if (directPatternFile) {
    return directPatternFile;
  }
  const firstCode = Array.isArray(codes) && codes.length > 0 ? String(codes[0] || "").trim() : "";
  return firstCode ? `downloads/${firstCode}.zip` : "downloads/unknown.zip";
}
async function updateOrderPatternFile(env, orderID, patternFile) {
  const orderKey = "order:" + orderID;
  const raw = await env.ORDERS.get(orderKey);
  if (!raw) {
    return null;
  }

  const order = JSON.parse(raw);
  order.patternFile = patternFile;
  await env.ORDERS.put(orderKey, JSON.stringify(order));

  if (order.downloadToken) {
    const downloadKey = "download:" + order.downloadToken;
    const downloadRaw = await env.ORDERS.get(downloadKey);
    if (downloadRaw) {
      const download = JSON.parse(downloadRaw);
      download.patternFile = patternFile;
      await env.ORDERS.put(downloadKey, JSON.stringify(download), { expirationTtl: 259200 });
    }
  }

  return order;
}
async function updateOrderInvoiceNumber(env, orderID, invoiceNumber) {
  const orderKey = "order:" + orderID;
  const raw = await env.ORDERS.get(orderKey);
  if (!raw) {
    return null;
  }

  const order = JSON.parse(raw);
  const previousInvoiceNumber = String(order.invoiceNumber || "").trim();
  const nextInvoiceNumber = String(invoiceNumber || "").trim();

  if (!nextInvoiceNumber) {
    return order;
  }

  if (previousInvoiceNumber && previousInvoiceNumber !== nextInvoiceNumber) {
    await env.ORDERS.delete("invoice-number:" + previousInvoiceNumber);
  }

  order.invoiceNumber = nextInvoiceNumber;
  order.invoiceDate = order.invoiceDate || new Date().toISOString().slice(0, 10);
  order.invoiceStatus = order.invoiceStatus || "Niet verzonden";
  order.invoiceFilePdf = "facturen/" + nextInvoiceNumber + ".pdf";
  await env.ORDERS.put("invoice-number:" + nextInvoiceNumber, orderID);
  await env.ORDERS.put(orderKey, JSON.stringify(order));
  return order;
}
async function getNextInvoiceNumber(env) {
  const list = await env.ORDERS.list({ prefix: "order:" });
  const currentYear = new Date().getFullYear();
  let highestInvoiceNumber = 0;

  for (const key of list.keys) {
    const data = await env.ORDERS.get(key.name);
    if (!data) continue;
    const order = JSON.parse(data);
    if (order.invoiceNumber && order.invoiceNumber.startsWith(currentYear + "-")) {
      const numberPart = Number(order.invoiceNumber.split("-")[1]);
      if (!Number.isNaN(numberPart) && numberPart > highestInvoiceNumber) {
        highestInvoiceNumber = numberPart;
      }
    }
  }

  return currentYear + "-" + String(highestInvoiceNumber + 1).padStart(3, "0");
}
async function sendResendEmail(env, payload) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + env.RESEND_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error("Resend mail mislukt (" + response.status + "): " + details);
  }
  return response;
}
function summarizeOrderItems(items) {
  const orderTypes = new Set(items.map((item) => item.type));
  if (orderTypes.size > 1) {
    return { error: "Gemengde bestellingen zijn niet toegestaan" };
  }

  const orderType = items[0]?.type || "digital";
  const basePrice = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const promoEligibleBasePrice = items.reduce((sum, item) => item.promoEligible ? sum + item.price * item.qty : sum, 0);
  const codes = items.flatMap((item) => Array.from({ length: item.qty }, () => item.code));
  const productName = items
    .map((item) => item.qty > 1 ? `${item.title} x${item.qty}` : item.title)
    .join(", ");
  const hasFreeShipping = items.some((item) => item.type === "physical" && item.freeShipping);

  return {
    orderType,
    basePrice,
    promoEligibleBasePrice,
    hasFreeShipping,
    codes,
    productName
  };
}

function orderHasFreeShipping(order) {
  if (order?.hasFreeShipping) {
    return true;
  }
  return Array.isArray(order?.items) && order.items.some((item) => item && item.freeShipping);
}

function normalizePromoCodeInput(code) {
  return String(code || "").trim().toUpperCase();
}

function getPromoRule(code) {
  const normalized = normalizePromoCodeInput(code);
  const match = normalized.match(/^MAGIC(\d{2})$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  return { type: "percent", value };
}

function getItemPromoCodes(items) {
  const codes = new Set();
  for (const item of items || []) {
    const promoCode = normalizePromoCodeInput(item?.promoCode || "");
    if (promoCode && item?.promoEligible) {
      codes.add(promoCode);
    }
  }
  return Array.from(codes);
}

function calculatePromoDiscount(amount, code) {
  const rule = getPromoRule(code);
  const baseAmount = Number(amount || 0);
  if (!rule || !Number.isFinite(baseAmount) || baseAmount <= 0) {
    return 0;
  }
  if (rule.type === "percent") {
    return Math.min(baseAmount, baseAmount * Number(rule.value || 0) / 100);
  }
  if (rule.type === "fixed") {
    return Math.min(baseAmount, Number(rule.value || 0));
  }
  return 0;
}

function normalizeNewsletterEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidNewsletterEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function getNewsletterTexts(lang) {
  return {
    nl: {
      subject: "Bevestig je nieuwsbriefinschrijving",
      intro: "Je hebt je ingeschreven voor de nieuwsbrief van Magic Fancy Works.",
      button: "Bevestig inschrijving",
      note: "Als jij dit niet hebt aangevraagd, kun je dit bericht gewoon negeren.",
      success: "Controleer je e-mail om de inschrijving te bevestigen.",
      already: "Je staat al ingeschreven."
    },
    fr: {
      subject: "Confirmez votre inscription à la newsletter",
      intro: "Vous avez demandé à vous inscrire à la newsletter de Magic Fancy Works.",
      button: "Confirmer l'inscription",
      note: "Si vous n'avez rien demandé, vous pouvez ignorer ce message.",
      success: "Vérifiez votre e-mail pour confirmer l'inscription.",
      already: "Vous êtes déjà inscrit(e)."
    },
    en: {
      subject: "Confirm your newsletter subscription",
      intro: "You asked to subscribe to the Magic Fancy Works newsletter.",
      button: "Confirm subscription",
      note: "If you did not request this, you can ignore this email.",
      success: "Check your email to confirm the subscription.",
      already: "You are already subscribed."
    }
  }[lang] || {
    subject: "Confirm your newsletter subscription",
    intro: "You asked to subscribe to the Magic Fancy Works newsletter.",
    button: "Confirm subscription",
    note: "If you did not request this, you can ignore this email.",
    success: "Check your email to confirm the subscription.",
    already: "You are already subscribed."
  };
}

function normalizeVatNumberInput(vatNumber, countryHint = "") {
  const raw = String(vatNumber || "")
    .trim()
    .toUpperCase()
    .replace(/[\s.\-_/]/g, "");

  if (!raw) {
    return null;
  }

  const prefixed = raw.match(/^([A-Z]{2})([A-Z0-9]+)$/);
  if (prefixed) {
    return {
      countryCode: prefixed[1],
      vatNumber: prefixed[2],
      normalized: prefixed[1] + prefixed[2]
    };
  }

  const fallbackCountry = String(countryHint || "").trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(fallbackCountry)) {
    return {
      countryCode: fallbackCountry,
      vatNumber: raw,
      normalized: fallbackCountry + raw
    };
  }

  return null;
}

function isValidEmailAddress(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function isValidCountryCode(value) {
  return /^[A-Z]{2}$/.test(String(value || "").trim().toUpperCase());
}

function hasMeaningfulText(value, minLength = 2) {
  return String(value || "").trim().length >= minLength;
}

async function checkVatNumberViaVies(countryCode, vatNumber) {
  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
  <soapenv:Body>
    <tns:checkVat>
      <tns:countryCode>${escapeXml(countryCode)}</tns:countryCode>
      <tns:vatNumber>${escapeXml(vatNumber)}</tns:vatNumber>
    </tns:checkVat>
  </soapenv:Body>
</soapenv:Envelope>`;

  const response = await fetch(
    "https://ec.europa.eu/taxation_customs/vies/services/checkVatService",
    {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": "checkVat",
        "Accept": "text/xml"
      },
      body: envelope
    }
  );

  const text = await response.text();
  if (!response.ok) {
    throw new Error("We kunnen het BTW-nummer momenteel niet controleren. Probeer het later opnieuw.");
  }

  const validMatch = text.match(/<valid>\s*(true|false)\s*<\/valid>/i);
  if (!validMatch) {
    const faultMatch = text.match(/<faultstring>([\s\S]*?)<\/faultstring>/i);
    throw new Error(
      faultMatch ? `VIES-fout: ${faultMatch[1].replace(/<[^>]*>/g, "").trim()}` : "Onverwacht VIES-antwoord"
    );
  }

  const nameMatch = text.match(/<name>\s*([\s\S]*?)\s*<\/name>/i);
  const addressMatch = text.match(/<address>\s*([\s\S]*?)\s*<\/address>/i);

  return {
    valid: validMatch[1].toLowerCase() === "true",
    name: nameMatch ? nameMatch[1].replace(/<[^>]*>/g, "").trim() : "",
    address: addressMatch ? addressMatch[1].replace(/<[^>]*>/g, "").trim() : ""
  };
}

function generateUBL(order, env = {}) {
const pricing = getInvoicePricing(order);
const productAmount = pricing.originalProductAmount;
const discountAmount = pricing.discountAmount;
const netProductAmount = pricing.discountedProductAmount;
const shippingAmount = pricing.shippingAmount;
const totalAmount = netProductAmount + shippingAmount;

const currency = order.currency || "EUR";
const sellerEndpointId = env.SELLER_ENDPOINT_ID || "0500363711";
const sellerEndpointSchemeId = env.SELLER_ENDPOINT_SCHEME_ID || "0208";
const sellerName = env.SELLER_NAME || COMPANY.name;
const sellerVat = env.SELLER_VAT || COMPANY.vat;
const sellerStreet = env.SELLER_STREET || COMPANY.address;
const sellerPostalZone = env.SELLER_POSTAL_ZONE || "2900";
const sellerCity = env.SELLER_CITY || "Schoten";
const sellerCountryCode = env.SELLER_COUNTRY_CODE || "BE";
const vatDetails = getVatInfo(order, order.lang || "nl", env);
const vatInfo = { ...vatDetails, ublCategory: vatDetails.ublCategory || vatDetails.category };
const invoiceVatCategory = order.invoiceVatCategory || vatInfo.category;
const invoiceVatNoteXml = order.invoiceVatNote
  ? `      <cbc:TaxExemptionReason>\n        ${escapeXml(order.invoiceVatNote)}\n      </cbc:TaxExemptionReason>\n`
  : "";
const buyerEndpointXml = order.buyerEndpointID
  ? `    <cbc:EndpointID schemeID="${escapeXml(order.buyerEndpointSchemeID || "0208")}">${escapeXml(order.buyerEndpointID)}</cbc:EndpointID>\n`
  : "";
const buyerPartyTaxSchemeXml = order.invoiceType === "business" && order.vatNumber
  ? `    <cac:PartyTaxScheme>\n      <cbc:CompanyID>${escapeXml(order.vatNumber)}</cbc:CompanyID>\n      <cac:TaxScheme>\n        <cbc:ID>VAT</cbc:ID>\n      </cac:TaxScheme>\n    </cac:PartyTaxScheme>\n`
  : "";
const buyerPostalAddressXml = order.invoiceCountry || order.invoiceCity || order.invoicePostalCode
  ? `    <cac:PostalAddress>\n${order.invoiceCity ? `      <cbc:CityName>${escapeXml(order.invoiceCity)}</cbc:CityName>\n` : ""}${order.invoicePostalCode ? `      <cbc:PostalZone>${escapeXml(order.invoicePostalCode)}</cbc:PostalZone>\n` : ""}${order.invoiceCountry ? `      <cac:Country>\n        <cbc:IdentificationCode>${escapeXml(order.invoiceCountry)}</cbc:IdentificationCode>\n      </cac:Country>\n` : ""}    </cac:PostalAddress>\n`
  : "";
const allowanceChargeXml = discountAmount > 0.00001
  ? `\n<cac:AllowanceCharge>\n  <cbc:ChargeIndicator>false</cbc:ChargeIndicator>\n  <cbc:AllowanceChargeReason>${escapeXml(order.lang === "fr" ? "Réduction promo" : order.lang === "en" ? "Promo discount" : "Promokorting")}</cbc:AllowanceChargeReason>\n  <cbc:Amount currencyID="${escapeXml(currency)}">${discountAmount.toFixed(2)}</cbc:Amount>\n</cac:AllowanceCharge>\n`
  : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice
  xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
  <cbc:ID>${escapeXml(order.invoiceNumber)}</cbc:ID>
  <cbc:IssueDate>${escapeXml(order.invoiceDate)}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:BuyerReference>WEBSHOP</cbc:BuyerReference>
<cbc:DocumentCurrencyCode>${escapeXml(currency)}</cbc:DocumentCurrencyCode>

<cac:AccountingSupplierParty>
  <cac:Party>
    <cbc:EndpointID schemeID="${escapeXml(sellerEndpointSchemeId)}">${escapeXml(sellerEndpointId)}</cbc:EndpointID>
    <cac:PartyName>
      <cbc:Name>${escapeXml(sellerName)}</cbc:Name>
    </cac:PartyName>

    <cac:PostalAddress>
      <cbc:StreetName>${escapeXml(sellerStreet)}</cbc:StreetName>
      <cbc:CityName>${escapeXml(sellerCity)}</cbc:CityName>
      <cbc:PostalZone>${escapeXml(sellerPostalZone)}</cbc:PostalZone>
      <cac:Country>
        <cbc:IdentificationCode>${escapeXml(sellerCountryCode)}</cbc:IdentificationCode>
      </cac:Country>
    </cac:PostalAddress>

    <cac:PartyTaxScheme>
      <cbc:CompanyID>${escapeXml(sellerVat)}</cbc:CompanyID>
      <cac:TaxScheme>
        <cbc:ID>VAT</cbc:ID>
      </cac:TaxScheme>
    </cac:PartyTaxScheme>

    <cac:PartyLegalEntity>
      <cbc:RegistrationName>${escapeXml(sellerName)}</cbc:RegistrationName>
      <cbc:CompanyID schemeID="${escapeXml(sellerEndpointSchemeId)}">${escapeXml(sellerEndpointId)}</cbc:CompanyID>
    </cac:PartyLegalEntity>
  </cac:Party>
</cac:AccountingSupplierParty>

<cac:AccountingCustomerParty>
  <cac:Party>
${buyerEndpointXml}    <cac:PartyName>
      <cbc:Name>${escapeXml(order.companyName || order.payerName)}</cbc:Name>
    </cac:PartyName>

${buyerPartyTaxSchemeXml}

    <cac:Contact>
      <cbc:ElectronicMail>${escapeXml(order.invoiceEmail || order.payerEmail)}</cbc:ElectronicMail>
    </cac:Contact>

${buyerPostalAddressXml}
  </cac:Party>
</cac:AccountingCustomerParty>

<cac:PaymentMeans>
  <cbc:PaymentMeansCode listID="UN/ECE 4461">30</cbc:PaymentMeansCode>
  <cbc:PaymentID>${escapeXml(order.transactionID || order.orderID || "")}</cbc:PaymentID>
</cac:PaymentMeans>

<cac:PaymentTerms>
  <cbc:Note>Betaald via PayPal</cbc:Note>
  <cbc:PaymentDueDate>${escapeXml(order.invoiceDate)}</cbc:PaymentDueDate>
</cac:PaymentTerms>

<cac:InvoiceLine>
  <cbc:ID>1</cbc:ID>

  <cbc:InvoicedQuantity unitCode="C62">1</cbc:InvoicedQuantity>

  <cbc:LineExtensionAmount currencyID="${escapeXml(currency)}">
    ${productAmount.toFixed(2)}
  </cbc:LineExtensionAmount>

  <cac:Item>
    <cbc:Name>${escapeXml(order.productName)}</cbc:Name>
    <cac:ClassifiedTaxCategory>
      <cbc:ID>${escapeXml(vatInfo.ublCategory)}</cbc:ID>
      <cbc:Percent>0</cbc:Percent>
      <cac:TaxScheme>
        <cbc:ID>VAT</cbc:ID>
      </cac:TaxScheme>
    </cac:ClassifiedTaxCategory>
  </cac:Item>

  <cac:Price>
    <cbc:PriceAmount currencyID="${escapeXml(currency)}">${productAmount.toFixed(2)}</cbc:PriceAmount>
  </cac:Price>
</cac:InvoiceLine>

<cac:InvoiceLine>
  <cbc:ID>2</cbc:ID>

  <cbc:InvoicedQuantity unitCode="C62">1</cbc:InvoicedQuantity>

  <cbc:LineExtensionAmount currencyID="${escapeXml(currency)}">
    ${shippingAmount.toFixed(2)}
  </cbc:LineExtensionAmount>

  <cac:Item>
    <cbc:Name>Shipping</cbc:Name>
    <cac:ClassifiedTaxCategory>
      <cbc:ID>${escapeXml(vatInfo.ublCategory)}</cbc:ID>
      <cbc:Percent>0</cbc:Percent>
      <cac:TaxScheme>
        <cbc:ID>VAT</cbc:ID>
      </cac:TaxScheme>
    </cac:ClassifiedTaxCategory>
  </cac:Item>

  <cac:Price>
    <cbc:PriceAmount currencyID="${escapeXml(currency)}">${shippingAmount.toFixed(2)}</cbc:PriceAmount>
  </cac:Price>
</cac:InvoiceLine>
${allowanceChargeXml}
 
<cac:TaxTotal>
  <cbc:TaxAmount currencyID="${escapeXml(currency)}">0.00</cbc:TaxAmount>

  <cac:TaxSubtotal>
    <cbc:TaxableAmount currencyID="${escapeXml(currency)}">
      ${totalAmount.toFixed(2)}
    </cbc:TaxableAmount>

    <cbc:TaxAmount currencyID="${escapeXml(currency)}">
      0.00
    </cbc:TaxAmount>

    <cac:TaxCategory>
      <cbc:ID>${escapeXml(invoiceVatCategory)}</cbc:ID>

      <cbc:Percent>0</cbc:Percent>

${invoiceVatNoteXml}

      <cac:TaxScheme>
        <cbc:ID>VAT</cbc:ID>
      </cac:TaxScheme>

    </cac:TaxCategory>
  </cac:TaxSubtotal>

</cac:TaxTotal>

<cac:LegalMonetaryTotal>
  <cbc:LineExtensionAmount currencyID="${escapeXml(currency)}">${totalAmount.toFixed(2)}</cbc:LineExtensionAmount>
  <cbc:TaxExclusiveAmount currencyID="${escapeXml(currency)}">${totalAmount.toFixed(2)}</cbc:TaxExclusiveAmount>
  <cbc:TaxInclusiveAmount currencyID="${escapeXml(currency)}">${totalAmount.toFixed(2)}</cbc:TaxInclusiveAmount>
  <cbc:PayableAmount currencyID="${escapeXml(currency)}">${totalAmount.toFixed(2)}</cbc:PayableAmount>
</cac:LegalMonetaryTotal>
 
</Invoice>`;
}
function buildInvoiceText(order) {
  const t = getInvoiceTexts(order.lang || "nl");
  const pricing = getInvoicePricing(order);
  return `
${COMPANY.name}
${COMPANY.vat}
${COMPANY.address}
${COMPANY.postal}
${COMPANY.country}

Factuurnummer: ${order.invoiceNumber || "-"}
Factuurdatum: ${order.invoiceDate || "-"}

Klant: ${order.companyName || order.payerName || "-"}
BTW nummer: ${order.vatNumber || "-"}

Product: ${order.productName}
${pricing.discountAmount > 0 ? `Promokorting: -€${formatMoneyDisplay(pricing.discountAmount, false)}` : ""}
Verzendkosten: €${formatMoneyDisplay(pricing.shippingAmount, false)}
Totaal: €${formatMoneyDisplay(pricing.totalAmount, false)}

${order.invoiceVatNote || ""}

${t.paymentStatus || "Betaald via PayPal"}
Order ID: ${order.orderID}
`.trim();
}
__name(buildInvoiceText, "buildInvoiceText");
function getInvoiceTexts(lang) {
  return {
    nl: {
      invoice: "FACTUUR",
      invoiceNumber: "Nr",
      invoiceDate: "Datum",
      billing: "FACTURATIE AAN",
      products: "PRODUCTEN",
      description: "Omschrijving",
      amount: "Bedrag",
      shipping: "Verzendkosten",
      total: "TOTAAL",
      vat: "BTW",
      email: "Email",
      paymentStatus: "Betaald via PayPal",
      exemption: "Vrijstellingsregeling kleine ondernemingen - art. 56bis WBTW"
    },

    en: {
      invoice: "INVOICE",
      invoiceNumber: "Invoice no.",
      invoiceDate: "Date",
      billing: "BILL TO",
      products: "PRODUCTS",
      description: "Description",
      amount: "Amount",
      shipping: "Shipping",
      total: "TOTAL",
      vat: "VAT",
      email: "Email",
      paymentStatus: "Paid via PayPal",
      exemption: "Small business exemption scheme - Article 56bis Belgian VAT Code"
    },

    fr: {
      invoice: "FACTURE",
      invoiceNumber: "N° de facture",
      invoiceDate: "Date",
      billing: "FACTURATION À",
      products: "PRODUITS",
      description: "Description",
      amount: "Prix",
      shipping: "Frais de livraison",
      total: "TOTAL",
      vat: "TVA",
      email: "Email",
      paymentStatus: "Payé via PayPal",
      exemption: "Régime de franchise de taxe pour petites entreprises - article 56bis CTVA"
    }
  }[lang] || {};
}
async function generateInvoicePdfAndUbl(order, env) {
const lang = order.lang || "nl";

const t = getInvoiceTexts(lang);

const vatInfo = getVatInfo(order, lang, env);
const pricing = getInvoicePricing(order);
const productAmount = pricing.originalProductAmount;
const discountAmount = pricing.discountAmount;
const netProductAmount = pricing.discountedProductAmount;
const shippingAmount = await getShippingAmount(order, env);
const showShipping = shippingAmount > 0.00001;
const showDiscount = discountAmount > 0.00001;
const totalAmount = netProductAmount + shippingAmount;
const useCommaAmounts = true;

const pdfDoc = await PDFDocument.create();
pdfDoc.registerFontkit(fontkit);

const regularFontFile = await env.PATTERNS.get("fonts/SFNS.ttf");
const boldFontFile = await env.PATTERNS.get("fonts/SFNSDisplayCondensed-Bold.otf");
const titleFontFile = await env.PATTERNS.get("fonts/PlayfairDisplay-SemiBold.ttf");

const titleFontBytes = titleFontFile ? await titleFontFile.arrayBuffer() : null;

const font = regularFontFile
  ? await pdfDoc.embedFont(await regularFontFile.arrayBuffer())
  : await pdfDoc.embedFont(StandardFonts.Helvetica);
const boldFont = boldFontFile
  ? await pdfDoc.embedFont(await boldFontFile.arrayBuffer())
  : await pdfDoc.embedFont(StandardFonts.HelveticaBold);
const titleFont = titleFontBytes
  ? await pdfDoc.embedFont(titleFontBytes)
  : await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const page = pdfDoc.addPage([595, 842]);

  const darkGreen = rgb(0.02, 0.37, 0.27);
  const lightGreen = rgb(0.92, 0.97, 0.95);
  const black = rgb(0, 0, 0);

  function drawTextRight(text, xRight, y, size, usedFont, color = black) {
    const textWidth = usedFont.widthOfTextAtSize(text, size);

    page.drawText(text, {
      x: xRight - textWidth,
      y,
      size,
      font: usedFont,
      color,
    });
  }

  function drawRoundedRect(x, y, w, h, r, color) {
    page.drawRectangle({
      x: x + r,
      y,
      width: w - 2 * r,
      height: h,
      color,
    });

    page.drawRectangle({
      x,
      y: y + r,
      width: w,
      height: h - 2 * r,
      color,
    });

    page.drawCircle({ x: x + r, y: y + r, size: r, color });
    page.drawCircle({ x: x + w - r, y: y + r, size: r, color });
    page.drawCircle({ x: x + r, y: y + h - r, size: r, color });
    page.drawCircle({ x: x + w - r, y: y + h - r, size: r, color });
  }


const logoFile =
  await env.PATTERNS.get("logo-invoice.png") ||
  await env.PATTERNS.get("logo.png");

if (logoFile) {
  const logoBytes = await logoFile.arrayBuffer();
  const logoImage = await pdfDoc.embedPng(logoBytes);

  page.drawImage(logoImage, {
    x: 50,
    y: 705,
    width: 85,
    height: 85,
  });
}

// Titel links
page.drawText("Magic Fancy Works", {
  x: 145,
  y: 770,
  size: 20,
  font: titleFont,
  color: darkGreen,
});

// Bedrijfsgegevens links
page.drawText("BE0500363711", {
  x: 145,
  y: 745,
  size: 10,
  font,
  color: black,
});

page.drawText("Churchilllaan 150 bus 2", {
  x: 145,
  y: 730,
  size: 10,
  font,
  color: black,
});

page.drawText("2900 Schoten", {
  x: 145,
  y: 715,
  size: 10,
  font,
  color: black,
});

page.drawText("Belgie", {
  x: 145,
  y: 700,
  size: 10,
  font,
  color: black,
});

// Titel rechts: zelfde baseline als Magic Fancy Works
page.drawText(t.invoice, {
  x: 390,
  y: 770,
  size: 20,
  font: boldFont,
  color: darkGreen,
});

// Groene factuur-info balk
const invoiceBoxX = 390;
const invoiceBoxY = 710;
const invoiceBoxW = 150;
const invoiceBoxH = 46;
const invoiceBoxRadius = 8;

drawRoundedRect(invoiceBoxX, invoiceBoxY, invoiceBoxW, invoiceBoxH, invoiceBoxRadius, lightGreen);

page.drawText(`${t.invoiceNumber}: ${order.invoiceNumber}`, {
  x: invoiceBoxX + 15,
  y: invoiceBoxY + 27,
  size: 10,
  font: boldFont,
  color: black,
});

page.drawText(`${t.invoiceDate}: ${order.invoiceDate || "-"}`, {
  x: invoiceBoxX + 15,
  y: invoiceBoxY + 12,
  size: 10,
  font: boldFont,
  color: black,
});

page.drawText(t.billing, {
  x: 50,
  y: 660,
  size: 14,
  font: boldFont,
  color: darkGreen,
});

page.drawText(order.companyName || order.payerName || "-", {
  x: 50,
  y: 635,
  size: 12,
  font,
  color: black,
});


page.drawText(
  `${t.vat}: ${order.vatNumber || "-"}`,
  {
    x: 50,
    y: 615,
    size: 10,
    font,
    color: black,
  }
);

page.drawText(
  `${t.email}: ${order.invoiceEmail || order.payerEmail || "-"}`,
  {
    x: 50,
    y: 595,
    size: 10,
    font,
    color: black,
  }
);

  const left = 50;
  const right = 560;
  const width = right - left;



// ====== PRODUCTEN ======
page.drawText(t.products, {
  x: left,
  y: 520,
  size: 16,
  font: boldFont,
  color: darkGreen,
});

const headerY = 485;
const headerHeight = 24;
const radius = 6;

// Headerbalk: rechte onderkant + enkel bovenhoeken rond
page.drawRectangle({
  x: left,
  y: headerY,
  width,
  height: headerHeight - radius,
  color: lightGreen,
});

page.drawRectangle({
  x: left + radius,
  y: headerY + headerHeight - radius,
  width: width - radius * 2,
  height: radius,
  color: lightGreen,
});

page.drawCircle({
  x: left + radius,
  y: headerY + headerHeight - radius,
  size: radius,
  color: lightGreen,
});

page.drawCircle({
  x: right - radius,
  y: headerY + headerHeight - radius,
  size: radius,
  color: lightGreen,
});

page.drawText(t.description, {
  x: left + 12,
  y: headerY + 8,
  size: 10.5,
  font: boldFont,
  color: darkGreen,
});

page.drawLine({
  start: { x: left, y: headerY },
  end: { x: right, y: headerY },
  thickness: 1.5,
  color: darkGreen,
});

// Productregels niet bold
const valueRight = right - 35;
let currentRowY = 460;

drawTextRight(
  t.amount,
  valueRight,
  headerY + 8,
  10.5,
  boldFont,
  darkGreen
);

page.drawText(order.productName || "-", {
  x: left + 12,
  y: currentRowY,
  size: 10.5,
  font,
  color: black,
});

drawTextRight(
  `${formatMoneyDisplay(productAmount, useCommaAmounts)} ${order.currency || "EUR"}`,
  valueRight,
  currentRowY,
  10.5,
  font,
  black
);

if (showDiscount) {
  currentRowY -= 22;
  page.drawText(order.lang === "fr" ? "Réduction promo" : order.lang === "en" ? "Promo discount" : "Promokorting", {
    x: left + 12,
    y: currentRowY,
    size: 10.5,
    font,
    color: rgb(0.8, 0.12, 0.12),
  });

  drawTextRight(
    `- ${formatMoneyDisplay(discountAmount, useCommaAmounts)} ${order.currency || "EUR"}`,
    valueRight,
    currentRowY,
    10.5,
    font,
    rgb(0.8, 0.12, 0.12)
  );
}

if (showShipping) {
  currentRowY -= 22;
  page.drawText(t.shipping, {
    x: left + 12,
    y: currentRowY,
    size: 10.5,
    font,
    color: black,
  });

  drawTextRight(
    `${formatMoneyDisplay(shippingAmount, useCommaAmounts)} ${order.currency || "EUR"}`,
    valueRight,
    currentRowY,
    10.5,
    font,
    black
  );
}

const totalLineY = currentRowY - 18;

// Totaalbalk: rechte bovenkant + enkel onderste hoeken rond
const totalBoxHeight = 30;
const totalBoxY = totalLineY - totalBoxHeight;

// bovenste rechthoek
page.drawRectangle({
  x: left,
  y: totalBoxY + radius,
  width,
  height: totalBoxHeight - radius,
  color: lightGreen,
});

// midden/onder rechthoek
page.drawRectangle({
  x: left + radius,
  y: totalBoxY,
  width: width - radius * 2,
  height: radius,
  color: lightGreen,
});

// onderste afgeronde hoeken
page.drawCircle({
  x: left + radius,
  y: totalBoxY + radius,
  size: radius,
  color: lightGreen,
});

page.drawCircle({
  x: right - radius,
  y: totalBoxY + radius,
  size: radius,
  color: lightGreen,
});

page.drawText(t.total, {
  x: left + 12,
  y: totalBoxY + 10,
  size: 12,
  font: boldFont,
  color: darkGreen,
});

drawTextRight(
  `${formatMoneyDisplay(totalAmount, useCommaAmounts)} ${order.currency || "EUR"}`,
  right - 35,
  totalBoxY + 10,
  12,
  boldFont,
  darkGreen
);
page.drawLine({
  start: { x: left, y: totalLineY },
  end: { x: right, y: totalLineY },
  thickness: 1.5,
  color: darkGreen,
});

page.drawText(t.paymentStatus || "Betaald via PayPal", {
  x: left + 12,
  y: totalBoxY + 2,
  size: 8.5,
  font,
  color: darkGreen,
});

page.drawText(
vatInfo.note,
  {
    x: 50,
    y: totalBoxY - 25,
    size: 9,
    font,
    color: black,
  }
);

const pdfBytes = await pdfDoc.save();

const pdfFilename = "facturen/" + order.invoiceNumber + ".pdf";

await env.FACTUREN.put(pdfFilename, pdfBytes, {
  httpMetadata: {
    contentType: "application/pdf",
  },
});

order.invoiceShippingAmount = shippingAmount;
order.invoiceFilePdf = pdfFilename;
order.invoiceVatCategory = vatInfo.category;
order.invoiceVatKey = vatInfo.key;
order.invoiceVatNote = vatInfo.note;
order.transactionID = "";
order.invoiceCountry = "";
order.buyerEndpointID = "";
order.invoiceCity = "";
order.invoicePostalCode = "";

if (order.invoiceType === "business") {
  const ublXml = generateUBL(order, env);

  const ublFilename =
    "facturen/" + order.invoiceNumber + ".xml";

  await env.FACTUREN.put(
    ublFilename,
    ublXml,
    {
      httpMetadata: {
        contentType: "application/xml; charset=utf-8"
      }
    }
  );

  order.invoiceFileUbl = ublFilename;
} else {
  order.invoiceFileUbl = "";
}

  return { order, pdfBytes };
}
function getVatInfo(order, lang, env = {}) {
  const orderType = order.orderType || "digital";
  const invoiceType = order.invoiceType || "private";
  const invoiceCountry = order.invoiceCountry || "";
  const shippingCountry = order.shippingCountry || order.shippingAddress?.address?.country || "";
  const vatNumber = order.vatNumber || "";

  const euCountries = [
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
    "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
    "PL", "PT", "RO", "SK", "SI", "ES", "SE"
  ];

  const isBusiness = invoiceType === "business" && vatNumber.trim() !== "";
  const isDigital = orderType === "digital";
  const destinationCountry =
    isDigital
      ? invoiceCountry
      : shippingCountry;
  const isEU = euCountries.includes(destinationCountry);
  const isBelgium = destinationCountry === "BE";

  const notes = {
    nl: {
      small: "Vrijstellingsregeling kleine ondernemingen - art. 56bis WBTW",
      physicalEU: "Vrijgesteld van btw op grond van artikel 39bis, eerste lid, 1° van het Btw-Wetboek (Intracommunautaire levering).",
      physicalNonEU: "Vrijgesteld van btw op grond van artikel 39, §1, 1° van het Btw-Wetboek (Uitvoer).",
      digitalEU: "Btw verlegd – Toepassing van artikel 21, §2 van het Belgisch Btw-Wetboek (verlegging van heffing naar de medecontractant).",
      digitalNonEU: "Dienst buiten de EU – Niet onderworpen aan Belgische btw (Toepassing artikel 21, §2 van het Btw-Wetboek)."
    },
    en: {
      small: "Small business exemption scheme - Article 56bis Belgian VAT Code",
      physicalEU: "VAT exempt under Article 39bis, first paragraph, 1° of the Belgian VAT Code (Intra-Community supply).",
      physicalNonEU: "VAT exempt under Article 39, §1, 1° of the Belgian VAT Code (Export).",
      digitalEU: "VAT reverse charged – Application of Article 21, §2 of the Belgian VAT Code.",
      digitalNonEU: "Service outside the EU – Not subject to Belgian VAT (Application of Article 21, §2 of the Belgian VAT Code)."
    },
    fr: {
      small: "Régime de franchise de taxe pour petites entreprises - article 56bis CTVA",
      physicalEU: "Exonéré de TVA en vertu de l’article 39bis, premier alinéa, 1° du Code de la TVA (livraison intracommunautaire).",
      physicalNonEU: "Exonéré de TVA en vertu de l’article 39, §1er, 1° du Code de la TVA (exportation).",
      digitalEU: "Autoliquidation de la TVA – Application de l’article 21, §2 du Code belge de la TVA.",
      digitalNonEU: "Service hors UE – Non soumis à la TVA belge (application de l’article 21, §2 du Code de la TVA)."
    }
  };

  const n = notes[lang] || notes.nl;

if (!isBusiness || isBelgium) {
  return { key: "small", category: "E", note: n.small };
}

if (!isDigital && isEU) {
  return { key: "physicalEU", category: "K", note: n.physicalEU };
}

if (!isDigital && !isEU) {
  return { key: "physicalNonEU", category: "G", note: n.physicalNonEU };
}

if (isDigital && isEU) {
  return { key: "digitalEU", category: "AE", note: n.digitalEU };
}

if (isDigital && !isEU) {
return { key: "digitalNonEU", category: "O", note: n.digitalNonEU };
}

  return { key: "small", category: "E", note: n.small };
}
function getInvoicePricing(order) {
  const originalProductAmount = Number(order.originalBasePrice || order.productAmount || order.amount || 0);
  const discountedProductAmount = Number(order.productAmount || order.amount || originalProductAmount || 0);
  const discountAmountRaw = Number(order.discountAmount || 0);
  const inferredDiscount = Math.max(0, originalProductAmount - discountedProductAmount);
  const discountAmount = Number.isFinite(discountAmountRaw) && discountAmountRaw > 0
    ? discountAmountRaw
    : inferredDiscount;
  const shippingAmount = Number(order.invoiceShippingAmount || order.shippingAmount || 0);
  const totalAmount = discountedProductAmount + shippingAmount;

  return {
    originalProductAmount,
    discountedProductAmount,
    discountAmount,
    shippingAmount,
    totalAmount
  };
}
async function purgeTemporaryOrders(env) {
  const list = await env.ORDERS.list({ prefix: "order:" });
  const now = Date.now();
  let purged = 0;
  for (const key of list.keys) {
    const data = await env.ORDERS.get(key.name);
    if (!data)
      continue;
    const order = JSON.parse(data);
    if (order.retentionClass !== "temporary" || !order.retentionUntil)
      continue;
    const until = Date.parse(order.retentionUntil);
    if (!Number.isFinite(until) || until > now)
      continue;
    if (order.downloadToken) {
      await env.ORDERS.delete("download:" + order.downloadToken);
    }
    await env.ORDERS.delete(key.name);
    purged++;
  }
  return purged;
}
async function purgeTemporaryOrderById(env, orderID, downloadToken) {
  if (downloadToken) {
    await env.ORDERS.delete("download:" + downloadToken);
  }
  await env.ORDERS.delete("order:" + orderID);
}
function isLikelyTestOrder(order) {
  const haystack = [
    order.orderID,
    order.payerName,
    order.payerEmail,
    order.companyName,
    order.invoiceEmail,
    order.productName,
    order.orderType,
    order.invoiceType
  ].join(" ").toLowerCase();

  return (
    String(order.orderID || "").startsWith("retention-test-") ||
    haystack.includes("personal.example.com") ||
    haystack.includes("testdev") ||
    haystack.includes("sandbox") ||
    /\btest\b/.test(haystack) ||
    String(order.payerEmail || "").startsWith("sb-")
  );
}
async function purgeTestOrderArtifacts(env, order) {
  if (order.downloadToken) {
    await env.ORDERS.delete("download:" + order.downloadToken);
  }
  if (order.invoiceNumber) {
    await env.ORDERS.delete("invoice-number:" + order.invoiceNumber);
  }
  if (order.invoiceFile) {
    await env.FACTUREN.delete(order.invoiceFile);
  }
  if (order.invoiceFilePdf) {
    await env.FACTUREN.delete(order.invoiceFilePdf);
  }
  if (order.invoiceFileUbl) {
    await env.FACTUREN.delete(order.invoiceFileUbl);
  }
  await env.ORDERS.delete("order:" + order.orderID);
}
async function purgeTestOrders(env) {
  const list = await env.ORDERS.list({ prefix: "order:" });
  let purged = 0;
  for (const key of list.keys) {
    const data = await env.ORDERS.get(key.name);
    if (!data) {
      continue;
    }
    const order = JSON.parse(data);
    if (!isLikelyTestOrder(order)) {
      continue;
    }
    await purgeTestOrderArtifacts(env, order);
    purged++;
  }
  return purged;
}
async function getPatternFileWithFallback(env, requestedPatternFile) {
  const basePatternFile = String(requestedPatternFile || "");
  const trimmedPatternFile = basePatternFile.replace(/^downloads\//, "");
  const candidates = [
    basePatternFile,
    trimmedPatternFile,
    `digital-products/${basePatternFile}`,
    `digital-products/${trimmedPatternFile}`
  ].filter(Boolean);

  for (const candidate of candidates) {
    const file = await env.PATTERNS.get(candidate);
    if (file) {
      return { file, resolvedPatternFile: candidate };
    }
  }

  return { file: null, resolvedPatternFile: candidates[0] || "", triedPatternFiles: candidates };
}
async function getShippingAmount(order, env) {
  if ((order.orderType || "digital") !== "physical") {
    return 0;
  }

  if (orderHasFreeShipping(order)) {
    return 0;
  }

  const country =
    order.shippingCountry ||
    order.shippingAddress?.address?.country ||
    "default";

  const ratesFile = await env.PATTERNS.get("shipping-rates.json");

  let rates = { default: 9.95 };

  if (ratesFile) {
    rates = await ratesFile.json();
  }

  return rates[country] !== undefined
    ? Number(rates[country])
    : Number(rates.default || 0);
}
function getOrderTotalAmount(order) {
  const totalAmount = Number(order.totalAmount);
  if (Number.isFinite(totalAmount) && totalAmount > 0) {
    return totalAmount;
  }

  const paidAmount = Number(order.paidAmount);
  if (Number.isFinite(paidAmount) && paidAmount > 0) {
    return paidAmount;
  }

  const amount = Number(order.amount || 0);
  const shippingAmount = Number(order.shippingAmount || order.invoiceShippingAmount || 0);
  const productAmount = Number(order.productAmount || 0);

  if (shippingAmount > 0) {
    if (productAmount > 0 && Math.abs(amount - (productAmount + shippingAmount)) < 0.01) {
      return amount;
    }

    if (productAmount > 0 && Math.abs(amount - productAmount) < 0.01) {
      return productAmount + shippingAmount;
    }

    return amount + shippingAmount;
  }

  return amount;
}

function adminShell(title, bodyHtml, accent = "#0f766e") {
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + escapeHtml(title) + '</title><style>' +
    'body{font-family:system-ui;max-width:1200px;margin:0 auto;padding:20px;color:#0f172a;background:#fff}' +
    'h1{color:#1e293b;margin:0}' +
    'h2{margin:26px 0 12px;color:' + accent + '}' +
    '.topbar{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;align-items:center;margin-bottom:16px}' +
    '.nav{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0 8px}' +
    '.btn,.back,.action-btn,.danger-btn,.ghost-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 18px;border-radius:10px;border:1px solid transparent;text-decoration:none;font-weight:700;font-size:14px;cursor:pointer;line-height:1.1}' +
    '.btn,.action-btn,.back{background:' + accent + ';color:#fff}' +
    '.btn.alt{background:#e2e8f0;color:#334155}' +
    '.danger-btn{background:#b91c1c;color:#fff}' +
    '.ghost-btn{background:#fff;color:' + accent + ';border-color:rgba(0,0,0,0.08)}' +
    '.btn:hover,.action-btn:hover,.back:hover,.danger-btn:hover,.ghost-btn:hover{filter:brightness(0.97)}' +
    'table{width:100%;border-collapse:collapse;margin:20px 0}th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #e2e8f0;vertical-align:top}th{background:#f8fafc;font-weight:600}small{color:#64748b}' +
    '.kpi{display:flex;gap:16px;flex-wrap:wrap;margin:18px 0}.kpi-card{background:#f8fafc;padding:18px;border-radius:12px;min-width:160px;border-left:4px solid ' + accent + '}.kpi-value{font-size:28px;font-weight:700;color:#1e293b}.kpi-label{font-size:13px;color:#64748b;margin-top:4px}' +
    '.summary{margin-top:18px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden}.summary summary{cursor:pointer;list-style:none;padding:12px 16px;background:#f8fafc;color:' + accent + ';font-weight:700;border-bottom:1px solid #e2e8f0}.summary summary::-webkit-details-marker{display:none}.summary-body{padding:0 0 4px 0}' +
    '</style></head><body><div class="topbar"><h1>' + escapeHtml(title) + '</h1><a href="/admin/logout" class="ghost-btn" style="color:#ef4444;border-color:#fecaca">Uitloggen</a></div>' + bodyHtml + '</body></html>';
}

var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const paypalBase =
  env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
    
    const publicWorkerUrl =
  env.PUBLIC_WORKER_URL || "https://paypal-handler-v3.camar.workers.dev";
    const shopFromEmail =
  env.RESEND_FROM_EMAIL || "MagicFancyworks <onboarding@resend.dev>";
const orderNotificationEmail =
  env.ORDER_NOTIFY_EMAIL || env.SHOP_EMAIL || env.ADMIN_EMAIL || "magicfancyworks@telenet.be";

const origin = request.headers.get("Origin") || "";

const allowedOrigins = (env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

const corsOrigin = allowedOrigins.includes(origin)
  ? origin
  : "https://magicfancyworks.pages.dev";

const corsHeaders = {
  "Access-Control-Allow-Origin": corsOrigin,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    if (url.pathname === "/test") {
      return new Response(JSON.stringify({ status: "ok", message: "PayPal Worker draait!" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (url.pathname === "/review-submit" && request.method === "POST") {
      try {
        const body = await request.json();
        const productCode = String(body?.productCode || "").trim();
        const productTitle = String(body?.productTitle || "").trim();
        const lang = ["nl", "fr", "en"].includes(String(body?.lang || "").toLowerCase())
          ? String(body.lang).toLowerCase()
          : "nl";
        const name = String(body?.name || "").trim().slice(0, 60);
        const rating = Number(body?.rating || 0);
        const message = String(body?.message || "").trim().slice(0, 1000);

        if (!productCode || !productTitle || !Number.isInteger(rating) || rating < 1 || rating > 5 || !message) {
          return new Response(JSON.stringify({ error: "Vul een geldige review in" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        const createdAt = new Date().toISOString();
        const reviewID = createdAt + ":" + crypto.randomUUID().replace(/-/g, "");
        const review = {
          reviewID,
          productCode,
          productTitle,
          lang,
          name: name || "Anoniem",
          rating,
          message,
          approved: false,
          createdAt
        };

        await env.ORDERS.put("review:" + reviewID, JSON.stringify(review));

        return new Response(JSON.stringify({
          ok: true,
          message: lang === "fr"
            ? "Merci, votre avis a été enregistré."
            : lang === "en"
              ? "Thanks, your review has been saved."
              : "Bedankt, je review is opgeslagen."
        }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    if (url.pathname === "/reviews" && request.method === "GET") {
      const productCode = String(url.searchParams.get("productCode") || "").trim();
      if (!productCode) {
        return new Response(JSON.stringify({ reviews: [] }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      const list = await env.ORDERS.list({ prefix: "review:" });
      const reviews = [];
      for (const key of list.keys) {
        const data = await env.ORDERS.get(key.name);
        if (!data) continue;
        const review = JSON.parse(data);
        if (review.productCode === productCode && review.approved === true) {
          reviews.push(review);
        }
      }

      reviews.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      return new Response(JSON.stringify({
        reviews: reviews.slice(0, 6).map((review) => ({
          name: review.name || "Anoniem",
          rating: Math.max(1, Math.min(5, Number(review.rating || 0) || 0)),
          message: review.message || "",
          createdAt: review.createdAt || "",
          lang: review.lang || "nl"
        }))
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (url.pathname === "/newsletter-signup" && request.method === "POST") {
      try {
        const body = await request.json();
        const email = normalizeNewsletterEmail(body?.email);
        const lang = ["nl", "fr", "en"].includes(String(body?.lang || "").toLowerCase())
          ? String(body.lang).toLowerCase()
          : "nl";
        const texts = getNewsletterTexts(lang);

        if (!isValidNewsletterEmail(email)) {
          return new Response(JSON.stringify({ error: "Geef een geldig e-mailadres in" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        const existing = await env.ORDERS.get("newsletter:" + email);
        if (existing) {
          return new Response(JSON.stringify({ ok: true, message: texts.already }), {
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        const token = crypto.randomUUID().replace(/-/g, "");
        const pending = {
          email,
          lang,
          createdAt: new Date().toISOString()
        };

        await env.ORDERS.put("newsletter-pending:" + token, JSON.stringify(pending), { expirationTtl: 604800 });

        const confirmUrl = publicWorkerUrl + "/newsletter-confirm/" + token;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + env.RESEND_API_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: shopFromEmail,
            to: email,
            subject: texts.subject,
            html: "<h2>" + escapeHtml(texts.intro) + "</h2><p><a href=\"" + escapeHtml(confirmUrl) + "\" style=\"display:inline-block;background:#059669;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700\">" + escapeHtml(texts.button) + "</a></p><p style=\"color:#475569\">" + escapeHtml(texts.note) + "</p>"
          })
        });

        return new Response(JSON.stringify({ ok: true, message: texts.success }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    if (url.pathname.startsWith("/newsletter-confirm/") && request.method === "GET") {
      const token = url.pathname.split("/newsletter-confirm/")[1];
      const pendingRaw = await env.ORDERS.get("newsletter-pending:" + token);

      if (!pendingRaw) {
        return new Response("<h1>Link verlopen</h1><p>Deze bevestigingslink is ongeldig of verlopen.</p>", {
          status: 404,
          headers: { "Content-Type": "text/html; charset=utf-8" }
        });
      }

      const pending = JSON.parse(pendingRaw);
      const email = normalizeNewsletterEmail(pending.email);

      await env.ORDERS.put("newsletter:" + email, JSON.stringify({
        email,
        lang: pending.lang || "nl",
        confirmedAt: new Date().toISOString()
      }));
      await env.ORDERS.delete("newsletter-pending:" + token);

      return new Response(`
        <!doctype html>
        <html lang="nl">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Nieuwsbrief bevestigd</title>
          <style>
            body{font-family:system-ui;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8fafc;color:#1e293b;padding:24px}
            .box{max-width:520px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:28px;box-shadow:0 10px 30px rgba(15,23,42,0.08)}
            a{color:#059669;font-weight:700;text-decoration:none}
          </style>
        </head>
        <body>
          <div class="box">
            <h1>Nieuwsbrief bevestigd</h1>
            <p>Je e-mailadres is nu ingeschreven voor de nieuwsbrief van Magic Fancy Works.</p>
            <p><a href="${escapeHtml(publicWorkerUrl)}">Terug naar de shop</a></p>
          </div>
        </body>
        </html>`, {
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders }
      });
    }
    
if (url.pathname === "/pdf-lib-test") {

  const pdfDoc = await PDFDocument.create();

  const page = pdfDoc.addPage([595, 842]);

  page.drawText("Magic Fancy Works", {
    x: 50,
    y: 780,
    size: 20
  });

  page.drawText("pdf-lib werkt in paypal-handler-v3", {
    x: 50,
    y: 740,
    size: 12
  });

  const pdfBytes = await pdfDoc.save();

  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf"
    }
  });
}
if (url.pathname === "/create-order" && request.method === "POST") {
  try {
    const body = await request.json();

const {
  price,
  currency,
  discountCode,
  invoiceRequested,
  invoiceType,
  companyName,
  vatNumber,
  invoiceEmail,
  invoiceCountry,
  buyerEndpointID,
  buyerEndpointSchemeID,
  invoiceCity,
  invoicePostalCode
} = body;

    const requestedCurrency = String(currency || "EUR").toUpperCase();
    if (requestedCurrency !== "EUR") {
      return new Response(JSON.stringify({ error: "Alleen EUR is toegestaan" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const items = normalizeOrderItems(body);
    const summary = summarizeOrderItems(items);
    if (summary.error) {
      return new Response(JSON.stringify({ error: summary.error }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const clientPrice = Number(price || 0);
    const promoCode = normalizePromoCodeInput(discountCode);
    const promoRule = getPromoRule(promoCode);
    if (promoCode && !promoRule) {
      return new Response(JSON.stringify({ error: "Deze kortingscode is niet geldig" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const allowedPromoCodes = getItemPromoCodes(items);
    if (promoCode && !allowedPromoCodes.includes(promoCode)) {
      return new Response(JSON.stringify({ error: "Deze kortingscode is niet geldig voor deze producten" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const discountAmount = calculatePromoDiscount(summary.promoEligibleBasePrice, promoCode);
    const originalBasePrice = summary.basePrice;
    const basePrice = Math.max(0, originalBasePrice - discountAmount);

    if (Number.isFinite(clientPrice) && Math.abs(clientPrice - basePrice) > 0.01) {
      return new Response(JSON.stringify({ error: "Prijs komt niet overeen met de productcatalogus" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const orderType = summary.orderType;
    const normalizedVat = invoiceType === "business"
      ? normalizeVatNumberInput(vatNumber, invoiceCountry)
      : null;
    const normalizedInvoiceCountry = String(invoiceCountry || "").trim().toUpperCase();
    const isSandboxMode = String(env.PAYPAL_ENV || "").toLowerCase() !== "live";

    if (invoiceRequested === true && invoiceType === "business") {
      if (!hasMeaningfulText(companyName)) {
        return new Response(JSON.stringify({ error: "Bedrijfsnaam ontbreekt" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      if (!isValidEmailAddress(invoiceEmail)) {
        return new Response(JSON.stringify({ error: "Facturatie e-mail ontbreekt of is ongeldig" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      if (!isValidCountryCode(invoiceCountry)) {
        return new Response(JSON.stringify({ error: "Landcode ontbreekt" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      if (!hasMeaningfulText(invoiceCity)) {
        return new Response(JSON.stringify({ error: "Stad ontbreekt" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      if (!hasMeaningfulText(invoicePostalCode)) {
        return new Response(JSON.stringify({ error: "Postcode ontbreekt" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    if (invoiceRequested === true && invoiceType === "business" && !isSandboxMode) {
      if (!normalizedVat) {
        return new Response(JSON.stringify({ error: "BTW-nummer ontbreekt of heeft een ongeldig formaat" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      if (normalizedInvoiceCountry === "BE" && !String(buyerEndpointID || "").trim()) {
        return new Response(JSON.stringify({ error: "Voor Belgische zakelijke facturatie is een Peppol Endpoint ID verplicht" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      const euVatCountries = [
        "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
        "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
        "PL", "PT", "RO", "SK", "SI", "ES", "SE"
      ];

      if (!euVatCountries.includes(normalizedVat.countryCode)) {
        return new Response(JSON.stringify({ error: "Alleen EU-btw-nummers kunnen via VIES worden gecontroleerd" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      const viesResult = await checkVatNumberViaVies(normalizedVat.countryCode, normalizedVat.vatNumber);
      if (!viesResult.valid) {
        return new Response(JSON.stringify({ error: "Dit BTW-nummer lijkt niet geldig. Controleer het nummer of kies particuliere facturatie." }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

        const auth = btoa(env.PAYPAL_CLIENT_ID + ":" + env.PAYPAL_SECRET);
        const tokenResp = await fetch(paypalBase + "/v1/oauth2/token", {
          method: "POST",
          headers: { "Authorization": "Basic " + auth, "Content-Type": "application/x-www-form-urlencoded" },
          body: "grant_type=client_credentials"
        });
        const tokenData = await tokenResp.json();
        if (!tokenData.access_token) {
          return new Response(JSON.stringify({ error: "Geen access token" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const estimatedShippingAmount = 0;
        const orderTotal = basePrice + estimatedShippingAmount;
        const orderResp = await fetch(paypalBase + "/v2/checkout/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + tokenData.access_token },
          body: JSON.stringify({
            intent: "CAPTURE",
            application_context: orderType === "physical"
              ? { shipping_preference: "SET_PROVIDED_ADDRESS" }
              : { shipping_preference: "NO_SHIPPING" },
            purchase_units: [{
              description: summary.productName,
              amount: {
                currency_code: requestedCurrency,
                value: orderTotal.toFixed(2),
                breakdown: {
                  item_total: { currency_code: requestedCurrency, value: basePrice.toFixed(2) },
                  shipping: { currency_code: requestedCurrency, value: estimatedShippingAmount.toFixed(2) }
                }
              }
            }]
          })
        });
        const orderData = await orderResp.json();
        if (!orderResp.ok || !orderData?.id) {
          return new Response(JSON.stringify({
            error: "PayPal order aanmaken mislukt",
            paypal_status: orderResp.status,
            paypal_response: orderData
          }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        await env.ORDERS.put("paypal:" + orderData.id, JSON.stringify({
        title: summary.productName,
        codes: summary.codes,
        items: items.map(({ code, qty, freeShipping, patternFile }) => ({ code, qty, freeShipping, patternFile })),
        type: orderType,
        originalBasePrice: originalBasePrice.toFixed(2),
        basePrice: basePrice.toFixed(2),
        discountCode: promoCode,
        discountAmount: discountAmount.toFixed(2),
        estimatedShippingAmount: estimatedShippingAmount.toFixed(2),
        totalAmount: orderTotal.toFixed(2),
        hasFreeShipping: summary.hasFreeShipping,

        invoiceRequested,
        invoiceType,
        companyName,
        vatNumber: normalizedVat?.normalized || String(vatNumber || "").trim().toUpperCase(),
        invoiceEmail,
        invoiceCountry: body.invoiceCountry || "",
        buyerEndpointID: body.buyerEndpointID || "",
        invoiceCity: body.invoiceCity || "",
        invoicePostalCode: body.invoicePostalCode || "",
        orderType
      }), { expirationTtl: 3600 });

        try {
          await sendResendEmail(env, {
            from: shopFromEmail,
            to: orderNotificationEmail,
            subject: "Nieuwe bestelling: " + summary.productName + " (" + requestedCurrency + " " + orderTotal.toFixed(2) + ")",
            html: "<h2>Nieuwe bestelling!</h2><p><strong>Product:</strong> " + escapeHtml(summary.productName) + "</p><p><strong>Bedrag:</strong> " + escapeHtml(requestedCurrency) + " " + escapeHtml(orderTotal.toFixed(2)) + "</p><p><strong>Klant:</strong> " + escapeHtml(body.name || body.payerName || "Klant") + "</p><p><strong>Email klant:</strong> " + escapeHtml(body.email || body.payerEmail || "-") + "</p><p><strong>Order ID:</strong> " + escapeHtml(orderData.id) + "</p><p><strong>Tijd:</strong> " + escapeHtml((/* @__PURE__ */ new Date()).toLocaleString("nl-BE")) + "</p><p><a href=\"" + escapeHtml(publicWorkerUrl) + "/admin\">Ga naar admin om goed te keuren</a></p>"
          });
        } catch (e) {
          console.error("Email fout:", e);
        }

        return new Response(JSON.stringify({ id: orderData.id }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

if (url.pathname === "/shipping-rates" && request.method === "GET") {

  const file = await env.PATTERNS.get("shipping-rates.json");

  if (!file) {
    return new Response(
      JSON.stringify({
        error: "shipping-rates.json niet gevonden"
      }),
      {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }

  const rates = await file.json();

  return new Response(
    JSON.stringify({
      rates,
      euCountries: [
        "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
        "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
        "PL", "PT", "RO", "SK", "SI", "ES", "SE"
      ]
    }),
    {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
}
    if (url.pathname === "/translate" && request.method === "POST") {
      try {
        const { text, targetLang } = await request.json();
        if (!text || !targetLang) {
          return new Response(JSON.stringify({ error: "text en targetLang vereist" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const langMap = { fr: "french", en: "english" };
        const targetLanguage = langMap[targetLang] || targetLang;
        const filteredText = filterEtsy(text);
        const cacheKey = "translate:v3:" + targetLang + ":" + filteredText.substring(0, 200);
        const cached = await env.ORDERS.get(cacheKey);
        if (cached) {
          return new Response(cached, { headers: { "Content-Type": "application/json", ...corsHeaders } });
        }
        const paragraphs = text.split("\n").filter((p) => p.trim());
        const translated = [];
        for (const para of paragraphs) {
          if (para.trim().length === 0)
            continue;
          try {
            const aiResponse = await env.AI.run("@cf/meta/m2m100-1.2b", {
              text: para.substring(0, 500),
              source_lang: "dutch",
              target_lang: targetLanguage
            });
            translated.push(aiResponse.translated_text || para);
          } catch (e) {
            translated.push(para);
          }
        }
        const translatedText = translated.join("\n");
        const result = JSON.stringify({ translated_text: translatedText });
        await env.ORDERS.put(cacheKey, result, { expirationTtl: 2592e3 });
        return new Response(result, { headers: { "Content-Type": "application/json", ...corsHeaders } });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

// === INVOICE PDF/UBL GENERATION ROUTE START ===
if (url.pathname.startsWith("/admin/invoice-pdf-v2/") && request.method === "GET") {
  if (!await checkAuth(request, env)) {
    return Response.redirect(
      publicWorkerUrl + "/admin/login",
      302
    );
  }
  const orderID = url.pathname.split("/admin/invoice-pdf-v2/")[1];

  const orderRaw = await env.ORDERS.get("order:" + orderID);

  if (!orderRaw) {
    return new Response("Order niet gevonden", { status: 404 });
  }
  
const order = JSON.parse(orderRaw);

try {
  const result = await generateInvoicePdfAndUbl(order, env);
  const updatedOrder = result.order;
  const pdfBytes = result.pdfBytes;

  await env.ORDERS.put(
    "order:" + orderID,
    JSON.stringify(updatedOrder)
  );

  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${updatedOrder.invoiceNumber}.pdf"`
    }
  });
} catch (error) {
  return new Response("Fout bij genereren van de factuur PDF: " + escapeHtml(error.message), {
    status: 500,
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
}
// === INVOICE PDF/UBL GENERATION ROUTE END ===

    if (url.pathname === "/admin/api/analytics" && request.method === "GET") {
      if (!await checkAuth(request, env)) {
        return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
      }
      try {
        const since = url.searchParams.get("since") || "7d";
        const daysMap = { "7d": 7, "30d": 30, "90d": 90 };
        const days = daysMap[since] || 7;
        const startDate = new Date(Date.now() - days * 864e5);
        const startISO = startDate.toISOString();
        const query = `{
          viewer {
            accounts(filter: {accountTag: "${env.ACCOUNT_ID || "5e1f868320c106902f92dcee90238422"}"}) {
              httpRequestsOverviewAdaptiveGroups(
                filter: { datetime_geq: "${startISO}", datetime_leq: "${(/* @__PURE__ */ new Date()).toISOString()}" }
                limit: 10000
                orderBy: [date_ASC]
              ) {
                sum { requests pageViews visits bytes cachedRequests cachedBytes }
                dimensions { date }
              }
            }
          }
        }`;
        const resp = await fetch("https://api.cloudflare.com/client/v4/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + (env.CF_API_TOKEN || "") },
          body: JSON.stringify({ query })
        });
        const data = await resp.json();
        return new Response(JSON.stringify(data), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }
    if (url.pathname === "/capture" && request.method === "POST") {
      try {
const body = await request.json();

const {
  orderID,
  lang,
  type,
  invoiceRequested,
  invoiceType,
  companyName,
  vatNumber,
  invoiceEmail,
  invoiceCountry: buyerInvoiceCountry,
  buyerEndpointID,
  buyerEndpointSchemeID,
  invoiceCity,
  invoicePostalCode
} = body;

const isBusinessInvoice =
  invoiceRequested === true &&
  invoiceType === 'business';

  if (isBusinessInvoice) {

  if (!hasMeaningfulText(companyName)) {
    return new Response(
      JSON.stringify({
        error: "Bedrijfsnaam ontbreekt"
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  if (!isValidEmailAddress(invoiceEmail)) {
    return new Response(
      JSON.stringify({
        error: "Facturatie e-mail ontbreekt of is ongeldig"
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  if (!isValidCountryCode(buyerInvoiceCountry)) {
    return new Response(
      JSON.stringify({
        error: "Landcode ontbreekt"
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

}

const isBelgianBusiness =
  isBusinessInvoice &&
  vatNumber?.toUpperCase().startsWith('BE');
const isSandboxMode = String(env.PAYPAL_ENV || "").toLowerCase() !== "live";
  const normalizedBuyerCountry =
  String(buyerInvoiceCountry || "").trim().toUpperCase();
let peppolRequired = false;

if (isBelgianBusiness && !isSandboxMode) {
  peppolRequired = true;

  if (!String(buyerEndpointID || "").trim() && normalizedBuyerCountry === "BE") {
    return new Response(JSON.stringify({ error: "Voor Belgische zakelijke facturatie is een Peppol Endpoint ID verplicht" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}

if (invoiceRequested === true && invoiceType === "business") {
  if (!hasMeaningfulText(companyName)) {
    return new Response(JSON.stringify({ error: "Bedrijfsnaam ontbreekt" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  if (!isValidEmailAddress(invoiceEmail)) {
    return new Response(JSON.stringify({ error: "Facturatie e-mail ontbreekt of is ongeldig" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  if (!isValidCountryCode(buyerInvoiceCountry)) {
    return new Response(JSON.stringify({ error: "Landcode ontbreekt" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  if (!hasMeaningfulText(invoiceCity)) {
    return new Response(JSON.stringify({ error: "Stad ontbreekt" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  if (!hasMeaningfulText(invoicePostalCode)) {
    return new Response(JSON.stringify({ error: "Postcode ontbreekt" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  if (!hasMeaningfulText(vatNumber)) {
    return new Response(JSON.stringify({ error: "BTW-nummer ontbreekt" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}

const invoiceMailData = {
  orderID,
  language: lang,
  customerType: invoiceType,
  companyName,
  vatNumber,
  invoiceEmail,
  invoiceCountry: buyerInvoiceCountry,
  buyerEndpointID,
  buyerEndpointSchemeID,
  invoiceCity,
  invoicePostalCode,
  peppolRequired
};

        const orderLang = lang || "nl";
        const auth = btoa(env.PAYPAL_CLIENT_ID + ":" + env.PAYPAL_SECRET);
        const tokenResp = await fetch(paypalBase + "/v1/oauth2/token", {
          method: "POST",
          headers: { "Authorization": "Basic " + auth, "Content-Type": "application/x-www-form-urlencoded" },
          body: "grant_type=client_credentials"
        });
        const tokenData = await tokenResp.json();
        if (!tokenData.access_token) {
          return new Response(JSON.stringify({ error: "Geen access token", paypal_response: tokenData }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const captureResp = await fetch(paypalBase + "/v2/checkout/orders/" + orderID + "/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + tokenData.access_token }
        });
        const captureData = await captureResp.json();
        const payment =
          captureData.purchase_units?.[0]?.payments?.captures?.[0] ||
          captureData.purchase_units?.[0]?.payments?.authorizations?.[0] ||
          {};
        let captureStatus = captureData.status || payment.status || "UNKNOWN";
        if (captureStatus === "COMPLETED") {
          const payerEmail = captureData.payer?.email_address || "";
          const payerName = [
            captureData.payer?.name?.given_name || "",
            captureData.payer?.name?.surname || ""
          ].filter(Boolean).join(" ").trim() || "Klant";
          const tempOrder = await env.ORDERS.get("paypal:" + orderID);
          const tempData = tempOrder ? JSON.parse(tempOrder) : {};
          const orderType = tempData.orderType || tempData.type || "digital";

          if (type && type !== orderType) {
            return new Response(JSON.stringify({ error: "Ordertype komt niet overeen met de serverdata" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }

          if (orderType === "mixed") {
            return new Response(JSON.stringify({ error: "Gemengde bestellingen zijn niet toegestaan" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }

          const storedInvoiceRequested =
            invoiceRequested ?? tempData.invoiceRequested ?? false;

          const storedInvoiceType =
            invoiceType || tempData.invoiceType || "private";

          const storedCompanyName =
            companyName || tempData.companyName || "";

          const storedVatNumber =
            vatNumber || tempData.vatNumber || "";

          const storedInvoiceEmail =
            invoiceEmail || tempData.invoiceEmail || "";

          const storedInvoiceCountry =
            buyerInvoiceCountry || tempData.invoiceCountry || "";

          const storedBuyerEndpointID =
            buyerEndpointID || tempData.buyerEndpointID || "";

          const storedInvoiceCity =
            invoiceCity || tempData.invoiceCity || "";

          const storedInvoicePostalCode =
            invoicePostalCode || tempData.invoicePostalCode || "";

const productName = tempData.title || captureData.purchase_units?.[0]?.description || "Bestelling";
const amount = payment.amount?.value || captureData.purchase_units?.[0]?.amount?.value || "0.00";
const currency = payment.amount?.currency_code || captureData.purchase_units?.[0]?.amount?.currency_code || "EUR";

const productAmount = Number(tempData.basePrice || amount || 0);
const paidAmount = Number(amount || 0);
const capturedShippingAmount = Math.max(0, paidAmount - productAmount);
          const expectedTotal = Number(tempData.totalAmount || 0);
          if (Number.isFinite(expectedTotal) && expectedTotal > 0 && Math.abs(paidAmount - expectedTotal) > 0.01) {
            return new Response(JSON.stringify({ error: "Betaald bedrag komt niet overeen met serverdata" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }
          const codes = tempData.codes || [];
          const shippingInfo = captureData.purchase_units?.[0]?.shipping;
          const shippingAddress = shippingInfo ? {
            name: shippingInfo.name?.full_name || "",
            address: {
              line1: shippingInfo.address?.address_line_1 || "",
              line2: shippingInfo.address?.address_line_2 || "",
              city: shippingInfo.address?.admin_area_2 || "",
              postalCode: shippingInfo.address?.postal_code || "",
              country: shippingInfo.address?.country_code || ""
            }
          } : null;
          const officialShippingCountry =
            shippingAddress?.address?.country ||
            tempData.shippingCountry ||
            "";

          if (orderType === "physical" && !officialShippingCountry) {
            return new Response(JSON.stringify({ error: "Officieel verzendland ontbreekt in PayPal" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }
         
         const resolvedInvoiceCountry =
  orderType === "physical"
    ? officialShippingCountry
    : (storedInvoiceCountry || officialShippingCountry || "");

const euCountries = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
  "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
  "PL", "PT", "RO", "SK", "SI", "ES", "SE"
];

let invoiceVatNote = "";

if (storedInvoiceRequested) {
  if (
    storedInvoiceType === "business" &&
    resolvedInvoiceCountry &&
    resolvedInvoiceCountry !== "BE" &&
    euCountries.includes(resolvedInvoiceCountry)
  ) {
    invoiceVatNote = "BTW verlegd – Reverse charge";
  } else if (
    resolvedInvoiceCountry &&
    !euCountries.includes(resolvedInvoiceCountry)
  ) {
    invoiceVatNote = "Geen Belgische BTW verschuldigd";
  } else {
    invoiceVatNote =
      "Bijzondere vrijstellingsregeling kleine ondernemingen – art. 56bis WBTW";
  }
}
          const orderKey = "order:" + orderID;
          const retentionClass =
            storedInvoiceRequested
              ? "accounting"
              : orderType === "digital"
                ? "temporary"
                : "operational";
          const retentionUntil =
            retentionClass === "temporary"
              ? new Date(Date.now() + 259200000).toISOString()
              : "";
          const orderPutOptions =
            orderType === "digital" && !storedInvoiceRequested
              ? { expirationTtl: 259200 }
              : undefined;

          await env.ORDERS.put(orderKey, JSON.stringify({
            orderID,
            status: "new",
            productName,
            amount,
            currency,
            originalBasePrice: tempData.originalBasePrice || "",
            productAmount: productAmount.toFixed(2),
            paidAmount: paidAmount.toFixed(2),
            discountCode: tempData.discountCode || "",
            discountAmount: tempData.discountAmount || "",
            shippingAmount: capturedShippingAmount.toFixed(2),
            totalAmount: paidAmount.toFixed(2),
            payerName,
            payerEmail,
            transactionID: payment.id,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            patternFile: getOrderPatternFile(items, codes),
            lang: orderLang,
            shippingAddress: orderType === "physical" ? shippingAddress : null,
            orderType,
            lifecycleStage: "new",
            retentionClass,
            retentionUntil,
            invoiceRequested: storedInvoiceRequested,
            invoiceType: storedInvoiceType,
            companyName: storedCompanyName,
            vatNumber: storedVatNumber,
            invoiceEmail: storedInvoiceEmail,
            invoiceCountry: storedInvoiceCountry || resolvedInvoiceCountry,
            buyerEndpointID: storedBuyerEndpointID,
            invoiceCity: storedInvoiceCity,
            invoicePostalCode: storedInvoicePostalCode,
            shippingCountry: officialShippingCountry,
            invoiceVatNote
            
          }), orderPutOptions);
          await env.ORDERS.delete("paypal:" + orderID);
          const emailTask = (async () => {
            try {
              await sendResendEmail(env, {
                from: shopFromEmail,
                to: orderNotificationEmail,
                subject: "Nieuwe bestelling: " + productName + " (" + currency + " " + amount + ")",
                html: "<h2>Nieuwe bestelling!</h2><p><strong>Product:</strong> " + escapeHtml(productName) + "</p><p><strong>Bedrag:</strong> " + escapeHtml(currency) + " " + escapeHtml(amount) + "</p><p><strong>Klant:</strong> " + escapeHtml(payerName) + "</p><p><strong>Email klant:</strong> " + escapeHtml(payerEmail) + "</p><p><strong>Order ID:</strong> " + escapeHtml(orderID) + "</p><p><strong>Tijd:</strong> " + escapeHtml((/* @__PURE__ */ new Date()).toLocaleString("nl-BE")) + '</p><p><a href="' + escapeHtml(publicWorkerUrl) + '/admin">Ga naar admin om goed te keuren</a></p>'
              });
            } catch (e) {
              console.error("Email fout:", e);
            }
          })();
          await emailTask;
        }
        return new Response(JSON.stringify({
          ok: captureResp.ok && captureStatus === "COMPLETED",
          status: captureStatus,
          orderID
        }), {
          status: captureResp.status,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }
    if (url.pathname === "/admin/login") {
      if (request.method === "POST") {
        const formData = await request.formData();
        const password = formData.get("password");
        if (password === env.ADMIN_PASSWORD) {
          const token = crypto.randomUUID();
          await env.ORDERS.put("session:" + token, JSON.stringify({ createdAt: (/* @__PURE__ */ new Date()).toISOString() }), { expirationTtl: 259200 });
          return new Response("Redirecting...", {
            status: 302,
            headers: { "Location": "/admin", "Set-Cookie": "admin_session=" + token + "; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400" }
          });
        }
        return new Response(loginPage("Fout wachtwoord"), { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }
      return new Response(loginPage(""), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (url.pathname === "/admin/logout") {
      const cookie = request.headers.get("Cookie") || "";
      const match = cookie.match(/admin_session=([^;]+)/);
      if (match)
        await env.ORDERS.delete("session:" + match[1]);
      return new Response("Redirecting...", { status: 302, headers: { "Location": "/admin/login", "Set-Cookie": "admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0" } });
    }
    if (url.pathname.startsWith("/r2-file/")) {

  if (!await checkAuth(request, env)) {
    return Response.redirect(
      publicWorkerUrl + "/admin/login",
      302
    );
  }

  const key = decodeURIComponent(
    url.pathname.replace("/r2-file/", "")
  );

  const file = await env.FACTUREN.get(key);

  if (!file) {
    return new Response("Bestand niet gevonden", {
      status: 404
    });
  }
 
 const contentType = key.endsWith(".pdf")
  ? "application/pdf"
  : key.endsWith(".html")
    ? "text/html;charset=utf-8"
    : "application/octet-stream";

return new Response(file.body, {
  headers: {
    "Content-Type": contentType,
    "Content-Disposition": `inline; filename="${key.split("/").pop()}"`
  }
});
}
    if (url.pathname === "/admin/invoices") {

  if (!await checkAuth(request, env)) {
    return Response.redirect(
      publicWorkerUrl + "/admin/login",
      302
    );
  }

  const files = await env.FACTUREN.list();
  files.objects.sort((a, b) => {
    const getNum = (key) => {
      const match = key.match(/(\d{4})-(\d+)/);
      if (!match) return 0;
      return Number(match[1] + match[2].padStart(6, "0"));
    };
    return getNum(b.key) - getNum(a.key);
  });

  const invoiceFiles = files.objects.filter((f) => f.key.startsWith("facturen/"));
  const newestInvoice = invoiceFiles
    .map((f) => f.key.replace("facturen/", "").replace(".html", "").replace(".pdf", ""))
    .sort()
    .reverse()[0] || "-";

  const body = `
    <div class="topbar">
      <a href="/admin" class="ghost-btn">&larr; Terug naar admin</a>
    </div>
    <h2>Facturen in R2</h2>
    <p>Totaal aantal facturen: ${invoiceFiles.length}</p>
    <p>Nieuwste factuur: ${escapeHtml(newestInvoice)}</p>
    ${invoiceFiles.map((file) => `
      <div class="file" style="padding:10px 0;border-bottom:1px solid #e2e8f0">
        <a href="/r2-file/${encodeURIComponent(file.key)}" target="_blank" class="ghost-btn" style="margin-right:10px">👁 Open</a>
        <strong>${escapeHtml(file.key.replace("facturen/", "").replace(".html", "").replace(".pdf", ""))}</strong>
      </div>
    `).join("")}
  `;

  return new Response(adminShell("Facturen", body, "#16a34a"), {
    headers: {
      "Content-Type": "text/html;charset=utf-8"
    }
  });
}
    if (url.pathname === "/admin") {
      if (!await checkAuth(request, env)) {
        return Response.redirect(publicWorkerUrl + "/admin/login", 302);
      }
      let analyticsHTML = '<p style="color:#64748b">Geen data beschikbaar voor deze periode. Je site bestaat mogelijk nog niet zo lang.</p>';
      try {
        const since = url.searchParams.get("since") || "7d";
        const daysMap = { "7d": 7, "30d": 30, "90d": 90 };
        const days = daysMap[since] || 7;
        const startDate = new Date(Date.now() - days * 864e5);
        const query = JSON.stringify({
          query: '{viewer{accounts(filter:{accountTag:"5e1f868320c106902f92dcee90238422"}){httpRequestsOverviewAdaptiveGroups(filter:{datetime_geq:"' + startDate.toISOString() + '",datetime_leq:"' + (/* @__PURE__ */ new Date()).toISOString() + '"},limit:10000,orderBy:[date_ASC]){sum{requests pageViews visits bytes}dimensions{date}}}}}'
        });
        const analyticsResp = await fetch("https://api.cloudflare.com/client/v4/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + env.CF_API_TOKEN },
          body: query
        });
        const analyticsData = await analyticsResp.json();
          
        const groups = analyticsData?.data?.viewer?.accounts?.[0]?.httpRequestsOverviewAdaptiveGroups || [];
        if (groups.length > 0) {
          let totalReq = 0, totalViews = 0, totalVisits = 0, totalBytes = 0;
          groups.forEach((g) => {
            totalReq += g.sum.requests;
            totalViews += g.sum.pageViews;
            totalVisits += g.sum.visits;
            totalBytes += g.sum.bytes;
          });
          const maxReq = Math.max(...groups.map((g) => g.sum.requests));
          const btnStyle = /* @__PURE__ */ __name222((p) => since === p ? "background:#6c5ce7;color:white" : "background:#e2e8f0;color:#475569", "btnStyle");
          analyticsHTML = '<div style="margin-bottom:15px"><a href="/admin?since=7d" style="' + btnStyle("7d") + ';padding:6px 14px;border-radius:4px;text-decoration:none;margin-right:6px">7 dagen</a><a href="/admin?since=30d" style="' + btnStyle("30d") + ';padding:6px 14px;border-radius:4px;text-decoration:none;margin-right:6px">30 dagen</a><a href="/admin?since=90d" style="' + btnStyle("90d") + ';padding:6px 14px;border-radius:4px;text-decoration:none">90 dagen</a></div><div style="display:flex;gap:15px;flex-wrap:wrap;margin-bottom:20px"><div style="background:white;padding:15px;border-radius:8px;min-width:120px"><div style="font-size:24px;font-weight:700;color:#1e293b">' + totalReq.toLocaleString() + '</div><div style="color:#64748b;font-size:13px">Requests</div></div><div style="background:white;padding:15px;border-radius:8px;min-width:120px"><div style="font-size:24px;font-weight:700;color:#1e293b">' + totalViews.toLocaleString() + '</div><div style="color:#64748b;font-size:13px">Pagina weergaves</div></div><div style="background:white;padding:15px;border-radius:8px;min-width:120px"><div style="font-size:24px;font-weight:700;color:#1e293b">' + totalVisits.toLocaleString() + '</div><div style="color:#64748b;font-size:13px">Bezoeken</div></div><div style="background:white;padding:15px;border-radius:8px;min-width:120px"><div style="font-size:24px;font-weight:700;color:#1e293b">' + (totalBytes / 1024 / 1024).toFixed(1) + ' MB</div><div style="color:#64748b;font-size:13px">Bandbreedte</div></div></div><table style="width:100%;border-collapse:collapse"><tr><th style="text-align:left;padding:6px;border-bottom:1px solid #e2e8f0">Datum</th><th style="text-align:right;padding:6px;border-bottom:1px solid #e2e8f0">Requests</th><th style="text-align:right;padding:6px;border-bottom:1px solid #e2e8f0">Weergaves</th><th style="text-align:right;padding:6px;border-bottom:1px solid #e2e8f0">Bezoeken</th><th style="width:40%;padding:6px;border-bottom:1px solid #e2e8f0"></th></tr>';
          groups.forEach((g) => {
            const pct = maxReq ? Math.round(g.sum.requests / maxReq * 100) : 0;
            const d = new Date(g.dimensions.date);
            analyticsHTML += '<tr><td style="padding:6px;font-size:13px">' + d.toLocaleDateString("nl-BE", { day: "2-digit", month: "short" }) + '</td><td style="text-align:right;padding:6px;font-size:13px">' + g.sum.requests.toLocaleString() + '</td><td style="text-align:right;padding:6px;font-size:13px">' + g.sum.pageViews.toLocaleString() + '</td><td style="text-align:right;padding:6px;font-size:13px">' + g.sum.visits.toLocaleString() + '</td><td style="padding:6px"><div style="background:#e2e8f0;border-radius:3px;height:16px"><div style="background:#6c5ce7;border-radius:3px;height:16px;width:' + pct + '%"></div></div></td></tr>';
          });
          analyticsHTML += "</table>";
        }
      } catch (e) {
        analyticsHTML = '<p style="color:#ef4444">Fout: ' + escapeHtml(e.message) + "</p>";
      }
      const list = await env.ORDERS.list({ prefix: "order:" });
      const orders = [];
      for (const key of list.keys) {
        const data = await env.ORDERS.get(key.name);
        if (data)
          orders.push(JSON.parse(data));
        orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const currentYear = new Date().getFullYear();

      let highestInvoiceNumber = 0;

      orders.forEach((o) => {
        if (o.invoiceNumber && o.invoiceNumber.startsWith(currentYear + "-")) {
          const numberPart = Number(o.invoiceNumber.split("-")[1]);
          if (!isNaN(numberPart) && numberPart > highestInvoiceNumber) {
            highestInvoiceNumber = numberPart;
          }
        }
      });

const suggestedInvoiceNumber =
  currentYear + "-" + String(highestInvoiceNumber + 1).padStart(3, "0");

      const retentionLabel = (o) => {
        const until = o.retentionUntil ? new Date(o.retentionUntil).toLocaleString("nl-BE") : "-";
        return escapeHtml(o.retentionClass || "-") + "<br><small>" + escapeHtml(until) + "</small>";
      };
      
      const newOrders = orders.filter((o) => o.status === "new").map(
  (o) => "<tr><td>" + escapeHtml(o.orderID) +
    "</td><td>" + escapeHtml(o.productName) +
    "</td><td>" + escapeHtml(getOrderTotalAmount(o).toFixed(2)) + " " + escapeHtml(o.currency) +
    "</td><td>" + escapeHtml(o.payerName) +
    "</td><td>" + escapeHtml(o.payerEmail) +
    "</td><td>" +
    (o.invoiceRequested
      ? (o.invoiceType === "business"
          ? "🧾 <strong>Zakelijk</strong><br>" +
            "Bedrijf: " + escapeHtml(o.companyName || "-") + "<br>" +
            "BTW nr: " + escapeHtml(o.vatNumber || "-") + "<br>" +
            "E-mail: " + escapeHtml(o.invoiceEmail || "-") + "<br>" +
            "<small>" + escapeHtml(o.invoiceVatNote || "-") + "</small>"
          : "🧾 <strong>Privé</strong><br>" +
            "<small>" + escapeHtml(o.invoiceVatNote || "-") + "</small>")
      : "Nee") +
    "</td><td>" + escapeHtml(o.invoiceFile || "-") +
    "</td><td>" + retentionLabel(o) +
    "</td><td>" + escapeHtml(new Date(o.createdAt).toLocaleString("nl-BE")) +
    '</td><td>' +
    (o.orderType === "physical"
      ? '<span style="display:inline-block;background:#e2e8f0;color:#475569;padding:6px 12px;border-radius:4px;font-size:13px;margin-right:4px">Geen digitaal bestand</span>'
      : '<a href="/admin/preview/' + encodeURIComponent(o.orderID) + '" style="background:#3b82f6;color:white;padding:6px 12px;border-radius:4px;text-decoration:none;font-size:13px;margin-right:4px">Bekijk bestand</a><br><a href="/admin/order-edit/' + encodeURIComponent(o.orderID) + '" style="display:inline-block;margin-top:4px;background:#0f766e;color:white;padding:6px 12px;border-radius:4px;text-decoration:none;font-size:13px;margin-right:4px">Order aanpassen</a>') +
    '<form method="POST" action="/admin/approve/' + encodeURIComponent(o.orderID) + '" style="display:inline-block;margin-top:6px">' +
    (o.invoiceRequested
      ? '<div style="margin:6px 0;font-size:12px;font-weight:600">Factuurnr:</div>' +
        '<div style="font-size:11px;color:#64748b;margin-bottom:4px">Voorgesteld: ' + escapeHtml(suggestedInvoiceNumber) + '</div>' +
        '<input name="invoiceNumber" type="text" placeholder="bv. 2026-001" style="width:120px;padding:6px;margin-bottom:6px;border:1px solid #cbd5e1;border-radius:4px;display:block">'
      : '') +
    '<button type="submit" style="background:#10b981;color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer">Goedkeuren</button></form></td></tr>'
).join("");

const approvedOrders = orders.filter((o) => o.status === "approved").map(
  (o) => "<tr><td>" + escapeHtml(o.orderID) +
  "</td><td>" + escapeHtml(o.productName) +
  "</td><td>" + escapeHtml(getOrderTotalAmount(o).toFixed(2)) + " " + escapeHtml(o.currency) +
  "</td><td>" + escapeHtml(o.payerName) +
  "</td><td>" + escapeHtml(o.payerEmail) +
  "</td><td>" +
  (o.invoiceRequested
    ? (
        (o.invoiceType === "business"
          ? "🧾 <strong>Zakelijk</strong>"
          : "🧾 <strong>Privé</strong>") +
        "<br>Nr: " + escapeHtml(o.invoiceNumber || "-") +
        "<br>" + escapeHtml(o.invoiceDate || "-") +
        '<br><a href="/admin/invoice-pdf-v2/' + encodeURIComponent(o.orderID) + '" target="_blank" style="display:inline-block;margin-top:4px;background:#2563eb;color:white;padding:4px 8px;border-radius:4px;text-decoration:none;font-size:11px">📄 PDF</a>' +
        (o.invoiceRequested && o.invoiceStatus !== "Verzonden"
          ? '<br><a href="/admin/invoice-sent/' + encodeURIComponent(o.orderID) + '" style="display:inline-block;margin-top:4px;background:#6366f1;color:white;padding:4px 8px;border-radius:4px;text-decoration:none;font-size:11px">Verzenden</a>'
          : "") +
        "<br><small>" + escapeHtml(o.invoiceVatNote || "-") + "</small>" +
        "<br><small>" + escapeHtml(o.invoiceStatus || "Niet verzonden") + "</small>" +
        (o.invoiceSentAt ? "<br>Verzonden op: " + escapeHtml(new Date(o.invoiceSentAt).toLocaleString("nl-BE")) : "")
      )
    : "Nee") +
  "</td><td>" + retentionLabel(o) +
  "</td><td>" +
  (o.downloaded ? "\u2705 Gedownload" : "\u23F3 Wachtend") +
  '<br><a href="/admin/order-edit/' + o.orderID + '" style="display:inline-block;margin-top:4px;background:#0f766e;color:white;padding:5px 9px;border-radius:4px;text-decoration:none;font-size:11px">Order aanpassen</a>' +
  "</td></tr>"
).join("");

const body = '<div class="nav"><a href="/admin/boekhouding" class="btn">Boekhouding</a><a href="/admin/invoices" class="btn">Facturen</a><a href="/admin/newsletter" class="btn">Nieuwsbrief</a><a href="/admin/reviews" class="btn">Reviews</a><a href="/admin/statistiek" class="btn">Statistiek</a><form method="POST" action="/admin/purge-retention" style="margin:0"><button type="submit" class="danger-btn">Purge verlopen orders</button></form></div><h2>Nieuwe bestellingen (' + orders.filter((o) => o.status === "new").length + ")</h2>" + (newOrders ? "<table><tr><th>Order ID</th><th>Product</th><th>Bedrag</th><th>Klant</th><th>Email</th><th>Factuur</th><th>Bestand</th><th>Retentie</th><th>Tijd</th><th>Actie</th></tr>" + newOrders + "</table>" : "<p>Geen nieuwe bestellingen</p>") + "<h2>Goedgekeurd (" + orders.filter((o) => o.status === "approved").length + ")</h2>" + (approvedOrders ? "<table><tr><th>Order ID</th><th>Product</th><th>Bedrag</th><th>Klant</th><th>Email</th><th>Factuur</th><th>Retentie</th><th>Download</th></tr>" + approvedOrders + "</table>" : "<p>Nog geen goedgekeurde bestellingen</p>") + "";
      return new Response(adminShell("Admin - MagicFancyworks", body, "#5C2D6E"), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (url.pathname === "/admin/purge-retention" && request.method === "POST") {
      if (!await checkAuth(request, env)) {
        return Response.redirect(publicWorkerUrl + "/admin/login", 302);
      }
      const list = await env.ORDERS.list({ prefix: "order:" });
      const now = Date.now();
      let purged = 0;
      for (const key of list.keys) {
        const data = await env.ORDERS.get(key.name);
        if (!data)
          continue;
        const order = JSON.parse(data);
        if (order.retentionClass !== "temporary" || !order.retentionUntil)
          continue;
        const until = Date.parse(order.retentionUntil);
        if (!Number.isFinite(until) || until > now)
          continue;
        if (order.downloadToken) {
          await env.ORDERS.delete("download:" + order.downloadToken);
        }
        await env.ORDERS.delete(key.name);
        purged++;
      }
      return new Response(JSON.stringify({ ok: true, purged }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (url.pathname === "/admin/purge-retention-auto" && request.method === "POST") {
      const authHeader = request.headers.get("Authorization") || "";
      if (authHeader !== "Bearer " + (env.RETENTION_CRON_SECRET || "")) {
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const list = await env.ORDERS.list({ prefix: "order:" });
      const now = Date.now();
      let purged = 0;
      for (const key of list.keys) {
        const data = await env.ORDERS.get(key.name);
        if (!data)
          continue;
        const order = JSON.parse(data);
        if (order.retentionClass !== "temporary" || !order.retentionUntil)
          continue;
        const until = Date.parse(order.retentionUntil);
        if (!Number.isFinite(until) || until > now)
          continue;
        if (order.downloadToken) {
          await env.ORDERS.delete("download:" + order.downloadToken);
        }
        await env.ORDERS.delete(key.name);
        purged++;
      }
      return new Response(JSON.stringify({ ok: true, purged }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (url.pathname === "/admin/purge-testdata" && request.method === "POST") {
      if (!await checkAuth(request, env)) {
        return Response.redirect(publicWorkerUrl + "/admin/login", 302);
      }
      const purged = await purgeTestOrders(env);
      return new Response(JSON.stringify({ ok: true, purged }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (url.pathname === "/admin/retention-selftest" && request.method === "POST") {
      if (!await checkAuth(request, env)) {
        return Response.redirect(publicWorkerUrl + "/admin/login", 302);
      }
      const testOrderID = "retention-test-" + crypto.randomUUID();
      const testDownloadToken = crypto.randomUUID();
      const retentionUntil = new Date(Date.now() - 3600e3).toISOString();
      await env.ORDERS.put("order:" + testOrderID, JSON.stringify({
        orderID: testOrderID,
        status: "new",
        productName: "Retention self-test",
        amount: "0.00",
        currency: "EUR",
        createdAt: new Date().toISOString(),
        orderType: "digital",
        lifecycleStage: "new",
        retentionClass: "temporary",
        retentionUntil,
        downloadToken: testDownloadToken
      }));
      await env.ORDERS.put("download:" + testDownloadToken, JSON.stringify({
        orderID: testOrderID,
        patternFile: "downloads/unknown.zip",
        downloaded: false,
        createdAt: new Date().toISOString()
      }), { expirationTtl: 86400 });
      await purgeTemporaryOrderById(env, testOrderID, testDownloadToken);
      let orderAfter = null;
      let downloadAfter = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        orderAfter = await env.ORDERS.get("order:" + testOrderID);
        downloadAfter = await env.ORDERS.get("download:" + testDownloadToken);
        if (!orderAfter && !downloadAfter) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      return new Response(JSON.stringify({
        ok: true,
        createdOrderID: testOrderID,
        purged: (!orderAfter && !downloadAfter) ? 1 : 0,
        orderDeleted: !orderAfter,
        downloadDeleted: !downloadAfter
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (url.pathname === "/admin/newsletter") {
      if (!await checkAuth(request, env)) {
        return Response.redirect(publicWorkerUrl + "/admin/login", 302);
      }

      const list = await env.ORDERS.list({ prefix: "newsletter:" });
      const subscribers = [];
      for (const key of list.keys) {
        const data = await env.ORDERS.get(key.name);
        if (data) subscribers.push(JSON.parse(data));
      }
      subscribers.sort((a, b) => new Date(b.confirmedAt || 0).getTime() - new Date(a.confirmedAt || 0).getTime());

      const rows = subscribers.map((s) =>
        "<tr><td>" + escapeHtml(s.email || "-") + "</td><td>" + escapeHtml(s.lang || "-") + "</td><td>" + escapeHtml(s.confirmedAt ? new Date(s.confirmedAt).toLocaleString("nl-BE") : "-") + "</td></tr>"
      ).join("");

      const body = '<div class="topbar"><a href="/admin" class="ghost-btn">&larr; Terug naar admin</a></div><h2>Nieuwsbrief</h2><p>Totaal bevestigde inschrijvingen: ' + subscribers.length + '</p>' + (rows ? '<table><tr><th>E-mail</th><th>Taal</th><th>Bevestigd op</th></tr>' + rows + '</table>' : '<p>Nog geen inschrijvingen</p>');

      return new Response(adminShell("Nieuwsbrief", body, "#0f766e"), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (url.pathname === "/admin/boekhouding") {
      if (!await checkAuth(request, env)) {
        return Response.redirect(publicWorkerUrl + "/admin/login", 302);
      }
      const list = await env.ORDERS.list({ prefix: "order:" });
      const orders = [];
      for (const key of list.keys) {
        const data = await env.ORDERS.get(key.name);
        if (data)
          orders.push(JSON.parse(data));
      }
      orders.sort((a, b) => {
        const timeA = new Date(a.createdAt || "1970-01-01").getTime();
        const timeB = new Date(b.createdAt || "1970-01-01").getTime();
        return timeB - timeA;
      });
      const months = {};
      const products = {};
      let totalOrders = 0;
      let totalRevenue = 0;
      orders.forEach((o) => {
        const d = new Date(o.createdAt);
        const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
        if (!months[key])
          months[key] = { orders: 0, revenue: 0, items: {} };
        months[key].orders++;
        months[key].revenue += getOrderTotalAmount(o) || 0;
        const name = o.patternFile || "Onbekend";
        months[key].items[name] = (months[key].items[name] || 0) + 1;
        if (!products[name])
          products[name] = { count: 0, revenue: 0 };
        products[name].count++;
        products[name].revenue += getOrderTotalAmount(o) || 0;
        totalOrders++;
        totalRevenue += getOrderTotalAmount(o) || 0;
      });
      const monthNames = { "01": "Januari", "02": "Februari", "03": "Maart", "04": "April", "05": "Mei", "06": "Juni", "07": "Juli", "08": "Augustus", "09": "September", "10": "Oktober", "11": "November", "12": "December" };
      const sortedMonths = Object.keys(months).sort().reverse();
      const sortedProducts = Object.entries(products).sort((a, b) => b[1].revenue - a[1].revenue);
      let monthlyHTML = '<table style="width:100%;border-collapse:collapse;margin:15px 0;font-family:system-ui"><tr style="background:#f1f5f9"><th style="padding:8px;text-align:left;border-bottom:2px solid #5C2D6E">Maand</th><th style="padding:8px;text-align:right;border-bottom:2px solid #5C2D6E">Bestellingen</th><th style="padding:8px;text-align:right;border-bottom:2px solid #5C2D6E">Omzet</th><th style="padding:8px;text-align:left;border-bottom:2px solid #5C2D6E">Producten</th></tr>';
      sortedMonths.forEach((m) => {
        const [y, mo] = m.split("-");
        const itemsList = Object.entries(months[m].items)
  .map(([name, count]) => escapeHtml(name) + " (" + escapeHtml(count) + "x)")
  .join(", ");
        monthlyHTML += '<tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:600">' + monthNames[mo] + " " + y + '</td><td style="padding:8px;text-align:right;border-bottom:1px solid #e2e8f0">' + months[m].orders + '</td><td style="padding:8px;text-align:right;border-bottom:1px solid #e2e8f0;font-weight:700;color:#5C2D6E">&euro; ' + months[m].revenue.toFixed(2) + '</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b">' + itemsList + "</td></tr>";
      });
      monthlyHTML += '<tr style="background:#5C2D6E;color:white;font-weight:bold"><td style="padding:8px">Totaal</td><td style="padding:8px;text-align:right">' + totalOrders + '</td><td style="padding:8px;text-align:right">&euro; ' + totalRevenue.toFixed(2) + "</td><td></td></tr></table>";
      let productsHTML = '<table style="width:100%;border-collapse:collapse;margin:15px 0;font-family:system-ui"><tr style="background:#f1f5f9"><th style="padding:8px;text-align:left;border-bottom:2px solid #5C2D6E">Product</th><th style="padding:8px;text-align:right;border-bottom:2px solid #5C2D6E">Verkocht</th><th style="padding:8px;text-align:right;border-bottom:2px solid #5C2D6E">Omzet</th></tr>';
      sortedProducts.forEach(([name, data]) => {
        productsHTML += '<tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:600">' + escapeHtml(name) + '</td><td style="padding:8px;text-align:right;border-bottom:1px solid #e2e8f0">' + data.count + '</td><td style="padding:8px;text-align:right;border-bottom:1px solid #e2e8f0;font-weight:700;color:#5C2D6E">&euro; ' + data.revenue.toFixed(2) + "</td></tr>";
      });
      productsHTML += '<tr style="background:#5C2D6E;color:white;font-weight:bold"><td style="padding:8px">Totaal</td><td style="padding:8px;text-align:right">' + totalOrders + '</td><td style="padding:8px;text-align:right">&euro; ' + totalRevenue.toFixed(2) + "</td></tr></table>";
      let allOrdersHTML = '<table style="width:100%;border-collapse:collapse;margin:15px 0;font-family:system-ui"><tr style="background:#f1f5f9"><th style="padding:8px;text-align:left;border-bottom:2px solid #5C2D6E">Datum</th><th style="padding:8px;text-align:left;border-bottom:2px solid #5C2D6E">Factuurnr</th><th style="padding:8px;text-align:left;border-bottom:2px solid #5C2D6E">Factuurdatum</th><th style="padding:8px;text-align:left;border-bottom:2px solid #5C2D6E">Klant</th><th style="padding:8px;text-align:left;border-bottom:2px solid #5C2D6E">Bestand</th><th style="padding:8px;text-align:right;border-bottom:2px solid #5C2D6E">Bedrag</th><th style="padding:8px;text-align:left;border-bottom:2px solid #5C2D6E">Factuur</th><th style="padding:8px;text-align:left;border-bottom:2px solid #5C2D6E">Status</th></tr>';
      orders.forEach((o) => {
        const d = new Date(o.createdAt);
        const status = o.status === "approved" ? "Goedgekeurd" : "Nieuw";
      allOrdersHTML +=
        '<tr>' +
        '<td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:13px">' + escapeHtml(d.toLocaleDateString("nl-BE")) + '</td>' +
'<td style="padding:8px;border-bottom:1px solid #e2e8f0">' + escapeHtml(o.invoiceNumber || "-") + '</td>' +
'<td style="padding:8px;border-bottom:1px solid #e2e8f0">' +
  escapeHtml(o.invoiceDate || (o.createdAt ? o.createdAt.slice(0, 10) : "-")) +
'</td>' +
'<td style="padding:8px;border-bottom:1px solid #e2e8f0">' + escapeHtml(o.companyName || o.payerName || "-") + '</td>' +
'<td style="padding:8px;border-bottom:1px solid #e2e8f0">' + escapeHtml(o.patternFile || "-") + '</td>' +
        '<td style="padding:8px;text-align:right;border-bottom:1px solid #e2e8f0">&euro; ' + getOrderTotalAmount(o).toFixed(2) + '</td>' +
        '<td style="padding:8px;border-bottom:1px solid #e2e8f0">' + (o.invoiceStatus || "-") + '</td>' +
        '<td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:12px">' +
          status +
          (o.invoiceRequested
? '<br><a href="/admin/invoice-pdf-v2/' + o.orderID + '" target="_blank" style="display:inline-block;margin-top:6px;background:#2563eb;color:white;padding:5px 9px;border-radius:4px;text-decoration:none;font-size:11px">📄 Factuur PDF</a>'
      : '') +
          '<br><a href="/admin/pattern-file/' + o.orderID + '" style="display:inline-block;margin-top:6px;background:#0f766e;color:white;padding:5px 9px;border-radius:4px;text-decoration:none;font-size:11px">Bestand aanpassen</a>' +
       '</td>' +
        '</tr>';
      });
      allOrdersHTML += "</table>";
const body = '<div class="topbar"><a href="/admin" class="ghost-btn">&larr; Terug</a></div><div class="kpi"><div class="kpi-card"><div class="kpi-value">' + totalOrders + '</div><div class="kpi-label">Bestellingen</div></div><div class="kpi-card"><div class="kpi-value">&euro; ' + totalRevenue.toFixed(2) + '</div><div class="kpi-label">Omzet</div></div><div class="kpi-card"><div class="kpi-value">' + orders.filter(o => o.invoiceStatus === "Verzonden").length + '</div><div class="kpi-label">Verzonden facturen</div></div><div class="kpi-card"><div class="kpi-value">' + orders.filter(o => o.invoiceRequested && o.invoiceStatus !== "Verzonden").length + '</div><div class="kpi-label">Openstaande facturen</div></div></div><details class="summary"><summary>Per maand</summary><div class="summary-body">' + monthlyHTML + '</div></details><details class="summary"><summary>Per product</summary><div class="summary-body">' + productsHTML + '</div></details><details class="summary" open><summary>Alle bestellingen (' + totalOrders + ')</summary><div class="summary-body">' + allOrdersHTML + '</div></details><p style="font-size:11px;color:#64748b;margin-top:30px">BTW: BE0500363711 | Vrijstellingsregeling kleine ondernemingen - art. 56bis WBTW</p>';
      return new Response(adminShell("Boekhouding", body, "#5C2D6E"), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (url.pathname === "/admin/statistiek") {
      if (!await checkAuth(request, env)) {
        return Response.redirect(publicWorkerUrl + "/admin/login", 302);
      }
      let statsHTML = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Statistiek</title><style>body{font-family:system-ui;max-width:1100px;margin:0 auto;padding:20px;color:#0f172a;background:#fff}h1{color:#1e293b;margin:0 0 8px}h2{color:#3b82f6;margin-top:28px}.back{display:inline-flex;align-items:center;justify-content:center;margin-bottom:18px;padding:10px 16px;background:#3b82f6;color:white;text-decoration:none;border-radius:10px;font-weight:700}.topline{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;align-items:center;margin-bottom:14px}.kpi{display:flex;gap:14px;flex-wrap:wrap;margin:18px 0}.kpi-card{background:#f8fafc;padding:18px;border-radius:12px;min-width:170px;border-left:4px solid #3b82f6;box-shadow:0 1px 3px rgba(15,23,42,0.04)}.kpi-value{font-size:28px;font-weight:700;color:#1e293b}.kpi-label{font-size:13px;color:#64748b;margin-top:4px}.trend{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:10px}.trend-card{background:#f8fafc;padding:16px;border-radius:12px;border:1px solid #e2e8f0}.trend-card strong{display:block;font-size:1.05rem;margin-bottom:4px}.trend-up{color:#15803d;font-weight:700}.trend-down{color:#b91c1c;font-weight:700}.trend-neutral{color:#64748b;font-weight:700}.since-row{margin:12px 0 8px}.since-row a{display:inline-flex;align-items:center;justify-content:center;padding:6px 14px;border-radius:999px;text-decoration:none;margin-right:6px;font-weight:700;font-size:13px;border:1px solid transparent}</style></head><body><div class="topline"><a href="/admin" class="back">&larr; Terug</a><h1>Statistiek</h1></div>';
      try {
        const since = url.searchParams.get("since") || "30d";
        const daysMap = { "7d": 7, "30d": 30, "90d": 90 };
        const days = daysMap[since] || 30;
        const now = new Date();
        const fetchAnalyticsSummary = async (rangeDays) => {
          const startDate = new Date(Date.now() - rangeDays * 864e5);
          const query = JSON.stringify({ query: '{viewer{accounts(filter:{accountTag:"5e1f868320c106902f92dcee90238422"}){httpRequestsOverviewAdaptiveGroups(filter:{datetime_geq:"' + startDate.toISOString() + '",datetime_leq:"' + now.toISOString() + '"},limit:10000,orderBy:[date_ASC]){sum{requests pageViews visits bytes}dimensions{date}}}}}' });
          const analyticsResp = await fetch("https://api.cloudflare.com/client/v4/graphql", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + env.CF_API_TOKEN }, body: query });
          const analyticsData = await analyticsResp.json();
          const groups = analyticsData?.data?.viewer?.accounts?.[0]?.httpRequestsOverviewAdaptiveGroups || [];
          return groups.reduce((acc, g) => {
            acc.requests += g.sum.requests || 0;
            acc.pageViews += g.sum.pageViews || 0;
            acc.visits += g.sum.visits || 0;
            acc.bytes += g.sum.bytes || 0;
            return acc;
          }, { requests: 0, pageViews: 0, visits: 0, bytes: 0 });
        };

        const summary1d = await fetchAnalyticsSummary(1);
        const summary7d = await fetchAnalyticsSummary(7);
        const query = JSON.stringify({ query: '{viewer{accounts(filter:{accountTag:"5e1f868320c106902f92dcee90238422"}){httpRequestsOverviewAdaptiveGroups(filter:{datetime_geq:"' + new Date(Date.now() - days * 864e5).toISOString() + '",datetime_leq:"' + now.toISOString() + '"},limit:10000,orderBy:[date_ASC]){sum{requests pageViews visits bytes}dimensions{date}}}}}' });
        const analyticsResp = await fetch("https://api.cloudflare.com/client/v4/graphql", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + env.CF_API_TOKEN }, body: query });
        const analyticsData = await analyticsResp.json();
        const groups = analyticsData?.data?.viewer?.accounts?.[0]?.httpRequestsOverviewAdaptiveGroups || [];
        if (groups.length > 0) {
          let totalReq = 0, totalViews = 0, totalVisits = 0, totalBytes = 0;
          groups.forEach((g) => {
            totalReq += g.sum.requests;
            totalViews += g.sum.pageViews;
            totalVisits += g.sum.visits;
            totalBytes += g.sum.bytes;
          });
          const btnStyle = /* @__PURE__ */ __name2((p) => since === p ? "background:#3b82f6;color:white;border-color:#3b82f6" : "background:#e2e8f0;color:#475569;border-color:#e2e8f0", "btnStyle");
          statsHTML += '<div class="since-row"><a href="/admin/statistiek?since=7d" style="' + btnStyle("7d") + '">7 dagen</a><a href="/admin/statistiek?since=30d" style="' + btnStyle("30d") + '">30 dagen</a><a href="/admin/statistiek?since=90d" style="' + btnStyle("90d") + '">90 dagen</a></div>';
          statsHTML += '<div class="kpi"><div class="kpi-card"><div class="kpi-value">' + summary1d.visits.toLocaleString() + '</div><div class="kpi-label">Bezoeken vandaag</div></div><div class="kpi-card"><div class="kpi-value">' + summary7d.visits.toLocaleString() + '</div><div class="kpi-label">Bezoeken laatste 7 dagen</div></div><div class="kpi-card"><div class="kpi-value">' + totalReq.toLocaleString() + '</div><div class="kpi-label">Requests</div></div><div class="kpi-card"><div class="kpi-value">' + totalViews.toLocaleString() + '</div><div class="kpi-label">Weergaves</div></div><div class="kpi-card"><div class="kpi-value">' + totalVisits.toLocaleString() + '</div><div class="kpi-label">Bezoeken</div></div><div class="kpi-card"><div class="kpi-value">' + (totalBytes / 1024 / 1024).toFixed(1) + ' MB</div><div class="kpi-label">Bandbreedte</div></div></div>';
          const prev7VisitsAvg = summary7d.visits / 7;
          const trendPct = prev7VisitsAvg > 0 ? ((summary1d.visits - prev7VisitsAvg) / prev7VisitsAvg) * 100 : 0;
          const trendClass = trendPct > 0.5 ? "trend-up" : trendPct < -0.5 ? "trend-down" : "trend-neutral";
          const trendText = prev7VisitsAvg > 0
            ? (trendPct > 0 ? "omhoog" : trendPct < 0 ? "omlaag" : "stabiel")
            : "nog geen vergelijkingsdata";
          statsHTML += '<div class="trend"><div class="trend-card"><strong>Vandaag vs vorige 7 dagen</strong><div class="' + trendClass + '">' + (trendPct > 0 ? "+" : "") + trendPct.toFixed(1).replace(".", ",") + '% ' + trendText + '</div><div style="margin-top:6px;color:#475569;font-size:13px">Vandaag: ' + summary1d.visits.toLocaleString() + ' bezoeken. Vorige 7 dagen gemiddeld: ' + prev7VisitsAvg.toFixed(1).replace(".", ",") + ' per dag.</div></div><div class="trend-card"><strong>Samenvatting</strong><div class="trend-neutral">Alle cijfers komen rechtstreeks uit Cloudflare Analytics.</div><div style="margin-top:6px;color:#475569;font-size:13px">De statistiek hieronder kan even achterlopen, maar blijft live gekoppeld aan Cloudflare.</div></div></div>';
          const maxReq = Math.max(...groups.map((g) => g.sum.requests));
          statsHTML += '<h2>Dagelijks overzicht</h2><table style="width:100%;border-collapse:collapse;margin:15px 0;font-family:system-ui"><tr style="background:#f1f5f9"><th style="padding:8px;text-align:left;border-bottom:2px solid #3b82f6">Datum</th><th style="padding:8px;text-align:right;border-bottom:2px solid #3b82f6">Requests</th><th style="padding:8px;text-align:right;border-bottom:2px solid #3b82f6">Weergaves</th><th style="padding:8px;text-align:right;border-bottom:2px solid #3b82f6">Bezoeken</th><th style="width:40%;padding:8px;border-bottom:2px solid #3b82f6"></th></tr>';
          groups.forEach((g) => {
            const pct = maxReq ? Math.round(g.sum.requests / maxReq * 100) : 0;
            const d = new Date(g.dimensions.date);
            statsHTML += '<tr><td style="padding:6px;font-size:13px;border-bottom:1px solid #e2e8f0">' + d.toLocaleDateString("nl-BE", { day: "2-digit", month: "short" }) + '</td><td style="padding:6px;text-align:right;font-size:13px;border-bottom:1px solid #e2e8f0">' + g.sum.requests.toLocaleString() + '</td><td style="padding:6px;text-align:right;font-size:13px;border-bottom:1px solid #e2e8f0">' + g.sum.pageViews.toLocaleString() + '</td><td style="padding:6px;text-align:right;font-size:13px;border-bottom:1px solid #e2e8f0">' + g.sum.visits.toLocaleString() + '</td><td style="padding:6px;border-bottom:1px solid #e2e8f0"><div style="background:#e2e8f0;border-radius:3px;height:16px"><div style="background:#3b82f6;border-radius:3px;height:16px;width:' + pct + '%"></div></div></td></tr>';
          });
          statsHTML += "</table>";
        } else {
          statsHTML += '<p style="color:#64748b">Geen data beschikbaar.</p>';
        }
      } catch (e) {
        statsHTML += '<p style="color:#ef4444">Fout: ' + escapeHtml(e.message) + "</p>";
      }
      statsHTML += "</body></html>";
      return new Response(statsHTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (url.pathname === "/admin/reviews") {
      if (!await checkAuth(request, env)) {
        return Response.redirect(publicWorkerUrl + "/admin/login", 302);
      }

      const list = await env.ORDERS.list({ prefix: "review:" });
      const reviews = [];
      for (const key of list.keys) {
        const data = await env.ORDERS.get(key.name);
        if (data) reviews.push(JSON.parse(data));
      }
      reviews.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      const reviewRows = reviews.map((r) => {
        const approveButton = r.approved === true
          ? '<span style="display:inline-block;padding:6px 10px;border-radius:999px;background:#dcfce7;color:#166534;font-weight:700;font-size:12px">Goedgekeurd</span>'
          : '<form method="POST" action="/admin/reviews-approve" style="margin:0"><input type="hidden" name="reviewID" value="' + escapeHtml(r.reviewID || "") + '"><button type="submit" style="padding:6px 10px;border:none;border-radius:6px;background:#0f766e;color:white;font-weight:700;cursor:pointer;font-size:12px">Goedkeuren</button></form>';
        return '<tr>' +
          '<td>' + escapeHtml(r.createdAt ? new Date(r.createdAt).toLocaleString("nl-BE") : "-") + '</td>' +
          '<td>' + escapeHtml(r.productTitle || r.productCode || "-") + '<br><small>' + escapeHtml(r.productCode || "-") + '</small></td>' +
          '<td>' + escapeHtml(String(r.rating || "-")) + ' / 5</td>' +
          '<td>' + escapeHtml(r.name || "Anoniem") + '</td>' +
          '<td>' + escapeHtml(r.lang || "-") + '</td>' +
          '<td style="white-space:pre-wrap">' + escapeHtml(r.message || "") + '</td>' +
          '<td>' + approveButton + '</td>' +
          '</tr>';
      }).join("");

      const body = '<div class="topbar"><a href="/admin" class="ghost-btn">&larr; Terug naar admin</a></div><h2>Reviews</h2><p>Totaal reviews: ' + reviews.length + '</p>' + (reviewRows ? '<table><tr><th>Datum</th><th>Product</th><th>Beoordeling</th><th>Naam</th><th>Taal</th><th>Bericht</th><th>Status</th></tr>' + reviewRows + '</table>' : '<p>Nog geen reviews</p>');

      return new Response(adminShell("Reviews", body, "#0f766e"), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (url.pathname === "/admin/reviews-approve" && request.method === "POST") {
      if (!await checkAuth(request, env)) {
        return Response.redirect(publicWorkerUrl + "/admin/login", 302);
      }
      const formData = await request.formData();
      const reviewID = String(formData.get("reviewID") || "").trim();
      if (reviewID) {
        const key = "review:" + reviewID;
        const raw = await env.ORDERS.get(key);
        if (raw) {
          const review = JSON.parse(raw);
          review.approved = true;
          review.approvedAt = new Date().toISOString();
          await env.ORDERS.put(key, JSON.stringify(review));
        }
      }
      return Response.redirect(publicWorkerUrl + "/admin/reviews", 302);
    }
    if (url.pathname.startsWith("/admin/preview/") && request.method === "GET") {
      if (!await checkAuth(request, env)) {
        return Response.redirect(publicWorkerUrl + "/admin/login", 302);
      }
      const orderID = url.pathname.split("/admin/preview/")[1];
      const orderKey = "order:" + orderID;
      const data = await env.ORDERS.get(orderKey);
      if (!data) {
        return new Response("Order niet gevonden", { status: 404 });
      }
      const order = JSON.parse(data);
      if (order.orderType === "physical") {
        const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Geen digitaal bestand</title><style>body{font-family:system-ui;max-width:640px;margin:40px auto;padding:20px}h1{color:#0f766e}.back{color:#6c5ce7;text-decoration:none}</style></head><body><h1>Geen digitaal bestand</h1><p>Deze bestelling is fysiek. Er hoort geen downloadbaar borduurpatroon bij.</p><p><a class="back" href="/admin">Terug naar admin</a></p></body></html>';
        return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }
      const patternLookup = await getPatternFileWithFallback(env, order.patternFile);
      const file = patternLookup.file;
      if (!file) {
        const tried = (patternLookup.triedPatternFiles || [order.patternFile]).map(escapeHtml).join("<br>");
        const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Bestand niet gevonden</title><style>body{font-family:system-ui;max-width:600px;margin:40px auto;padding:20px}h1{color:#ef4444}.back{color:#6c5ce7;text-decoration:none}</style></head><body><h1>Bestand niet gevonden</h1><p>Het bestand <strong>' + escapeHtml(order.patternFile) + "</strong> staat nog niet in R2.</p><p>Geprobeerd:</p><p><code>" + tried + '</code></p><p>Upload het bestand naar de <strong>embroidery-patterns</strong> bucket onder een van deze namen.</p><p><a class="back" href="/admin">Terug naar admin</a></p></body></html>';
        return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }
      return new Response(file.body, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": 'attachment; filename="' + patternLookup.resolvedPatternFile + '"'
        }
      });
    }
    if (url.pathname.startsWith("/admin/pattern-file/")) {
      if (!await checkAuth(request, env)) {
        return Response.redirect(publicWorkerUrl + "/admin/login", 302);
      }

      const orderID = url.pathname.split("/admin/pattern-file/")[1];

      if (request.method === "POST") {
        const formData = await request.formData();
        const patternFile = normalizePatternFilePath(formData.get("patternFile"));

        if (!patternFile) {
          return new Response("Ongeldig bestandspad. Gebruik bijvoorbeeld downloads/mfw00006_10x15.zip", {
            status: 400,
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          });
        }

        const updated = await updateOrderPatternFile(env, orderID, patternFile);
        if (!updated) {
          return new Response("Order niet gevonden", { status: 404 });
        }

        return Response.redirect(publicWorkerUrl + "/admin/pattern-file/" + encodeURIComponent(orderID), 302);
      }

      const orderRaw = await env.ORDERS.get("order:" + orderID);
      if (!orderRaw) {
        return new Response("Order niet gevonden", { status: 404 });
      }

      const order = JSON.parse(orderRaw);
      const currentPatternFile = escapeHtml(order.patternFile || "");
      const body = '<div class="topbar"><a href="/admin" class="ghost-btn">&larr; Terug naar admin</a></div><h2>Bestand aanpassen</h2><div style="max-width:640px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:18px"><p style="margin-top:0"><strong>Order:</strong> ' + escapeHtml(order.orderID) + '<br><strong>Product:</strong> ' + escapeHtml(order.productName || "-") + '</p><form method="POST" action="/admin/pattern-file/' + encodeURIComponent(orderID) + '"><label style="display:block;font-weight:700;margin-bottom:6px">patternFile</label><input name="patternFile" type="text" value="' + currentPatternFile + '" placeholder="downloads/mfw00006_10x15.zip" style="width:100%;max-width:420px;padding:10px;border:1px solid #cbd5e1;border-radius:8px;box-sizing:border-box"><p style="margin:8px 0 0;color:#64748b;font-size:13px">Gebruik exact een bestand uit <code>downloads/</code>. Voorbeeld: <code>downloads/mfw00006_16x24.zip</code></p><div style="margin-top:14px"><button type="submit" style="background:#0f766e;color:white;border:none;padding:10px 16px;border-radius:8px;font-weight:700;cursor:pointer">Opslaan</button></div></form></div>';
      return new Response(adminShell("Bestand aanpassen", body, "#0f766e"), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (url.pathname.startsWith("/admin/order-edit/")) {
      if (!await checkAuth(request, env)) {
        return Response.redirect(publicWorkerUrl + "/admin/login", 302);
      }

      const orderID = url.pathname.split("/admin/order-edit/")[1];
      const orderKey = "order:" + orderID;
      const raw = await env.ORDERS.get(orderKey);
      if (!raw) {
        return new Response("Order niet gevonden", { status: 404 });
      }

      const order = JSON.parse(raw);

      if (request.method === "POST") {
        const formData = await request.formData();
        const invoiceNumber = String(formData.get("invoiceNumber") || "").trim();
        const patternFile = normalizePatternFilePath(formData.get("patternFile"));

        if (invoiceNumber && order.invoiceRequested) {
          const updatedInvoiceOrder = await updateOrderInvoiceNumber(env, orderID, invoiceNumber);
          if (!updatedInvoiceOrder) {
            return new Response("Order niet gevonden", { status: 404 });
          }
        }

        if (patternFile) {
          const updatedPatternOrder = await updateOrderPatternFile(env, orderID, patternFile);
          if (!updatedPatternOrder) {
            return new Response("Order niet gevonden", { status: 404 });
          }
        }

        return Response.redirect(publicWorkerUrl + "/admin/order-edit/" + encodeURIComponent(orderID), 302);
      }

      const currentInvoiceNumber = escapeHtml(order.invoiceNumber || "");
      const currentPatternFile = escapeHtml(order.patternFile || "");
      const body =
        '<div class="topbar"><a href="/admin" class="ghost-btn">&larr; Terug naar admin</a></div>' +
        '<h2>Order aanpassen</h2>' +
        '<div style="max-width:720px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:18px">' +
        '<p style="margin-top:0"><strong>Order:</strong> ' + escapeHtml(order.orderID) + '<br><strong>Product:</strong> ' + escapeHtml(order.productName || "-") + '</p>' +
        '<form method="POST" action="/admin/order-edit/' + encodeURIComponent(orderID) + '">' +
        (order.invoiceRequested ? '<label style="display:block;font-weight:700;margin-bottom:6px">Factuurnummer</label><input name="invoiceNumber" type="text" value="' + currentInvoiceNumber + '" placeholder="bv. 2026-001" style="width:100%;max-width:420px;padding:10px;border:1px solid #cbd5e1;border-radius:8px;box-sizing:border-box;margin-bottom:14px">' : '') +
        (order.orderType !== "physical" ? '<label style="display:block;font-weight:700;margin-bottom:6px">patternFile</label><input name="patternFile" type="text" value="' + currentPatternFile + '" placeholder="downloads/mfw00006_10x15.zip" style="width:100%;max-width:420px;padding:10px;border:1px solid #cbd5e1;border-radius:8px;box-sizing:border-box">' : '') +
        '<p style="margin:8px 0 0;color:#64748b;font-size:13px">Laat leeg wat je niet wilt wijzigen.</p>' +
        '<div style="margin-top:14px"><button type="submit" style="background:#0f766e;color:white;border:none;padding:10px 16px;border-radius:8px;font-weight:700;cursor:pointer">Opslaan</button></div>' +
        '</form></div>';
      return new Response(adminShell("Order aanpassen", body, "#0f766e"), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    
    if (url.pathname === "/admin/test-shipping-json") {

  if (!await checkAuth(request, env)) {
    return Response.redirect(
      publicWorkerUrl + "/admin/login",
      302
    );
  }

  const file = await env.PATTERNS.get("shipping-rates.json");

  if (!file) {
    return new Response(
      "shipping-rates.json niet gevonden",
      { status: 404 }
    );
  }

  const rates = await file.json();

  return new Response(
    JSON.stringify(rates, null, 2),
    {
      headers: {
        "Content-Type": "application/json;charset=utf-8"
      }
    }
  );
}

if (url.pathname.startsWith("/admin/invoice-pdf/") && request.method === "GET") {
  if (!await checkAuth(request, env)) {
    return Response.redirect(
      publicWorkerUrl + "/admin/login",
      302
    );
  }
  const orderID = url.pathname.split("/admin/invoice-pdf/")[1];


let orderRaw = await env.ORDERS.get(orderID);

if (!orderRaw) {
  orderRaw = await env.ORDERS.get("order:" + orderID);
}

if (!orderRaw) {
  return new Response(
    "Order niet gevonden\n\nGezochte orderID:\n" + orderID,
    {
      status: 404,
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      }
    }
  );
}

const order = JSON.parse(orderRaw);
const useCommaAmounts = true;
const pricing = getInvoicePricing(order);
const invoiceShippingAmount = pricing.shippingAmount;
const invoiceDiscountAmount = pricing.discountAmount;
const showShippingRow = invoiceShippingAmount > 0.00001;
const showDiscountRow = invoiceDiscountAmount > 0.00001;
const discountLabel = order.lang === "fr" ? "Réduction promo" : order.lang === "en" ? "Promo discount" : "Promokorting";
const shippingRowHtml = showShippingRow
  ? '<tr><td>' + (order.lang === "fr" ? "Frais de livraison" : order.lang === "en" ? "Shipping" : "Verzendkosten") + '</td><td class="right">€ ' + formatMoneyDisplay(invoiceShippingAmount, useCommaAmounts) + '</td></tr>'
  : "";
const discountRowHtml = showDiscountRow
  ? '<tr><td>' + discountLabel + '</td><td class="right" style="color:#b91c1c">- € ' + formatMoneyDisplay(invoiceDiscountAmount, useCommaAmounts) + '</td></tr>'
  : "";

const invoiceText =
  '<!DOCTYPE html><html><head><meta charset="utf-8">' +
  '<title>Factuur ' + escapeHtml(order.invoiceNumber || "") + '</title>' +
  '<style>' +
  'body{font-family:system-ui;max-width:800px;margin:40px auto;padding:30px;color:#1e293b}' +
  '.top{display:flex;justify-content:space-between;gap:30px;margin-bottom:40px}' +
  '.box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:20px}' +
  'h1{margin:0 0 10px;color:#5C2D6E}' +
  'table{width:100%;border-collapse:collapse;margin-top:20px}' +
  'th,td{padding:10px;border-bottom:1px solid #e2e8f0;text-align:left}' +
  'th{background:#f1f5f9}' +
  '.right{text-align:right}' +
  '.note{font-size:13px;color:#475569;margin-top:30px}' +
  '.back{display:inline-block;margin-bottom:20px;color:#5C2D6E;text-decoration:none;font-weight:600}' +
  '@media print{' +
  '.back,.print-btn{display:none !important}' +
  'body{margin:0;padding:20px}' +
  '}' +
  '</style></head><body>' +

  '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">' +
  '<a class="back" href="/admin">&larr; Terug naar admin</a>' +
  '<button class="print-btn" onclick="window.print()" style="background:#5C2D6E;color:white;border:none;padding:10px 16px;border-radius:6px;cursor:pointer;font-weight:600">🖨 Factuur afdrukken</button>' +
  '</div>' +

  '<div class="top">' +
  '<div>' +
  '<img src="/logo.png" style="max-height:140px;margin-bottom:16px"><br>' +
  '<h1>Factuur</h1>' +
  '<p><strong>Factuurnummer:</strong> ' + escapeHtml(order.invoiceNumber || "-") + '<br>' +
  '<strong>Factuurdatum:</strong> ' + escapeHtml(order.invoiceDate || "-") + '<br>' +
  '<strong>Status:</strong> ' +

  (order.invoiceStatus === "Verzonden"
    ? '<span style="color:#16a34a;font-weight:700">🟢 Verzonden</span>'
    : '<span style="color:#ea580c;font-weight:700">🟠 Niet verzonden</span>') +

  (order.invoiceSentAt
    ? '<br><strong>Verzonden op:</strong> ' + escapeHtml(new Date(order.invoiceSentAt).toLocaleString("nl-BE"))
    : '') +

  '</p>' +
  '</div>' +

  '<div class="box">' +
  '<div style="font-family:\'Playfair Display\', serif;font-size:28px;line-height:1;color:#065f46;font-weight:600;margin-bottom:4px">Magic Fancy Works</div>' +
  'BE0500363711<br>' +
  'Churchilllaan 150 bus 2<br>' +
  '2900 Schoten<br>' +
  'België' +
  '</div>' +
  '</div>' +

  '<div class="box">' +
  '<strong>Facturatie aan:</strong><br>' +
  escapeHtml(order.companyName || order.payerName || "-") + '<br>' +
  (order.vatNumber ? 'BTW nr: ' + escapeHtml(order.vatNumber) + '<br>' : '') +
  escapeHtml(order.invoiceEmail || order.payerEmail || "-") +
  '</div>' +

  '<table>' +
  '<tr><th>Omschrijving</th><th class="right">Bedrag</th></tr>' +
  '<tr><td>' + escapeHtml(order.productName || "Bestelling") + '</td><td class="right">€ ' + formatMoneyDisplay(pricing.originalProductAmount, useCommaAmounts) + '</td></tr>' +
  discountRowHtml +
  shippingRowHtml +
  '<tr><th>Totaal</th><th class="right">€ ' + formatMoneyDisplay(pricing.totalAmount, useCommaAmounts) + '</th></tr>' +
  '<tr><td colspan="2" style="padding-top:5px;border-bottom:none;font-size:12px;color:#475569;font-weight:500">' + escapeHtml(t.paymentStatus || "Betaald via PayPal") + '</td></tr>' +
  '</table>' +

  '<p class="note">' + escapeHtml(order.invoiceVatNote || "") + '</p>' +

  '<div class="box">' +
  '<strong>Order ID:</strong> ' + escapeHtml(order.orderID) + '<br>' +
  '<strong>Transactie ID:</strong> ' + escapeHtml(order.transactionID || "-") +
  '</div>' +

  '</body></html>';

const filename = "facturen/" + order.invoiceNumber + ".html";

let file = await env.FACTUREN.get(filename);

await env.FACTUREN.put(filename, invoiceText, {
  httpMetadata: {
    contentType: "text/html;charset=utf-8"
  }
});

order.invoiceFile = filename;

await env.ORDERS.put(
  "order:" + orderID,
  JSON.stringify(order)
);

file = await env.FACTUREN.get(filename);

return new Response(file.body, {
  headers: {
    "Content-Type": "text/html;charset=utf-8",
    "Content-Disposition":
      `inline; filename="${order.invoiceNumber}.html"`
  }
});
}
if (url.pathname.startsWith("/admin/invoice-download/") && request.method === "GET") {

  if (!await checkAuth(request, env)) {
    return Response.redirect(
      publicWorkerUrl + "/admin/login",
      302
    );
  }

  const orderID = url.pathname.split("/admin/invoice-download/")[1];

  const orderRaw = await env.ORDERS.get("order:" + orderID);

  if (!orderRaw) {
    return new Response("Order niet gevonden", { status: 404 });
  }

  const order = JSON.parse(orderRaw);

  if (!order.invoiceFile) {
    return new Response("Geen factuurbestand gekoppeld aan deze order", { status: 404 });
  }

  const file = await env.FACTUREN.get(order.invoiceFile);

  if (!file) {
    return new Response("Factuurbestand niet gevonden in R2", { status: 404 });
  }

  return new Response(file.body, {
    headers: {
      "Content-Type": "text/html;charset=utf-8",
      "Content-Disposition": `attachment; filename="${order.invoiceNumber}.html"`
    }
  });
}
if (url.pathname.startsWith("/admin/invoice-file/") && request.method === "GET") {
  if (!await checkAuth(request, env)) {
    return Response.redirect(publicWorkerUrl + "/admin/login", 302);
  }

  const orderID = url.pathname.split("/admin/invoice-file/")[1];

  const orderRaw = await env.ORDERS.get("order:" + orderID);

  if (!orderRaw) {
    return new Response("Order niet gevonden", { status: 404 });
  }

  const order = JSON.parse(orderRaw);

  if (!order.invoiceFile) {
    return new Response("Geen factuurbestand gekoppeld aan deze order", { status: 404 });
  }

  const file = await env.FACTUREN.get(order.invoiceFile);

  if (!file) {
    return new Response("Factuurbestand niet gevonden in R2: " + order.invoiceFile, { status: 404 });
  }

  return new Response(file.body, {
    headers: {
      "Content-Type": "text/html;charset=utf-8",
      "Content-Disposition": `inline; filename="${order.invoiceNumber}.html"`
    }
  });
}

    if (url.pathname.startsWith("/admin/invoice-preview/") && request.method === "GET") {
  if (!await checkAuth(request, env)) {
    return Response.redirect(publicWorkerUrl + "/admin/login", 302);
  }

  const orderID = url.pathname.split("/admin/invoice-preview/")[1];
  const orderKey = "order:" + orderID;
  const data = await env.ORDERS.get(orderKey);

  if (!data) {
    return new Response("Order niet gevonden", { status: 404 });
  }

  const order = JSON.parse(data);
  const useCommaAmounts = true;
  const pricing = getInvoicePricing(order);
  const invoiceShippingAmount = pricing.shippingAmount;
  const invoiceDiscountAmount = pricing.discountAmount;
  const showShippingRow = invoiceShippingAmount > 0.00001;
  const showDiscountRow = invoiceDiscountAmount > 0.00001;
  const discountLabel = order.lang === "fr" ? "Réduction promo" : order.lang === "en" ? "Promo discount" : "Promokorting";
  const shippingRowHtml = showShippingRow
    ? '<tr><td>' + (order.lang === "fr" ? "Frais de livraison" : order.lang === "en" ? "Shipping" : "Verzendkosten") + '</td><td class="right">€ ' + formatMoneyDisplay(invoiceShippingAmount, useCommaAmounts) + '</td></tr>'
    : "";
  const discountRowHtml = showDiscountRow
    ? '<tr><td>' + discountLabel + '</td><td class="right" style="color:#b91c1c">- € ' + formatMoneyDisplay(invoiceDiscountAmount, useCommaAmounts) + '</td></tr>'
    : "";

  if (!order.invoiceRequested) {
    return new Response("Voor deze bestelling werd geen factuur gevraagd.", { status: 400 });
  }

  const invoiceHtml =
    '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<title>Factuur ' + escapeHtml(order.invoiceNumber || "") + '</title>' +
    '<style>' +
    'body{font-family:system-ui;max-width:800px;margin:40px auto;padding:30px;color:#1e293b}' +
    '.top{display:flex;justify-content:space-between;gap:30px;margin-bottom:40px}' +
    '.box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:20px}' +
    'h1{margin:0 0 10px;color:#5C2D6E}' +
    'table{width:100%;border-collapse:collapse;margin-top:20px}' +
    'th,td{padding:10px;border-bottom:1px solid #e2e8f0;text-align:left}' +
    'th{background:#f1f5f9}' +
    '.right{text-align:right}' +
    '.note{font-size:13px;color:#475569;margin-top:30px}' +
    '.back{display:inline-block;margin-bottom:20px;color:#5C2D6E;text-decoration:none;font-weight:600}' +
    '@media print{' +
    '.back,.print-btn{display:none !important}' +
    'body{margin:0;padding:20px}' +
    '}' +
    '</style></head><body>' +

      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">' +
        '<a class="back" href="/admin">&larr; Terug naar admin</a>' +
        '<button class="print-btn" onclick="window.print()" style="background:#5C2D6E;color:white;border:none;padding:10px 16px;border-radius:6px;cursor:pointer;font-weight:600">🖨 Factuur afdrukken</button>' +
      '</div>' +

'<div class="top">' +
  '<div>' +
    '<img src="/logo.png" style="max-height:140px;margin-bottom:16px"><br>' +
    '<h1>Factuur</h1>' +
'<p><strong>Factuurnummer:</strong> ' + escapeHtml(order.invoiceNumber || "-") + '<br>' +
'<strong>Factuurdatum:</strong> ' + escapeHtml(order.invoiceDate || "-") + '<br>' +

'<strong>Status:</strong> ' +
(order.invoiceStatus === "Verzonden"
  ? '<span style="color:#16a34a;font-weight:700">🟢 Verzonden</span>'
  : '<span style="color:#ea580c;font-weight:700">🟠 Niet verzonden</span>') +

(order.invoiceSentAt
  ? '<br><strong>Verzonden op:</strong> ' +
    escapeHtml(new Date(order.invoiceSentAt).toLocaleString("nl-BE"))
  : '') +

'</p>' +
      '</div>' +
      '<div class="box">' +
        '<div style="font-family:\'Playfair Display\', serif;font-size:28px;line-height:1;color:#065f46;font-weight:600;margin-bottom:4px">' + COMPANY.name + '</div>' +
        COMPANY.vat + '<br>' +
        COMPANY.address + '<br>' +
        COMPANY.postal + '<br>' +
        COMPANY.country +
      '</div>' +
    '</div>' +

    '<div class="box">' +
      '<strong>Facturatie aan:</strong><br>' +
      escapeHtml(order.companyName || order.payerName || "-") + '<br>' +
      (order.vatNumber ? 'BTW nr: ' + escapeHtml(order.vatNumber) + '<br>' : '') +
      escapeHtml(order.invoiceEmail || order.payerEmail || "-") +
    '</div>' +

    '<table>' +
      '<tr><th>Omschrijving</th><th class="right">Bedrag</th></tr>' +
      '<tr><td>' + escapeHtml(order.productName || "Bestelling") + '</td><td class="right">€ ' + formatMoneyDisplay(pricing.originalProductAmount, useCommaAmounts) + '</td></tr>' +
      discountRowHtml +
      shippingRowHtml +
      '<tr><th>Totaal</th><th class="right">€ ' + formatMoneyDisplay(pricing.totalAmount, useCommaAmounts) + '</th></tr>' +
      '<tr><td colspan="2" style="padding-top:5px;border-bottom:none;font-size:12px;color:#475569;font-weight:500">' + escapeHtml(t.paymentStatus || "Betaald via PayPal") + '</td></tr>' +
    '</table>' +

    '<p class="note">' + escapeHtml(order.invoiceVatNote || "") + '</p>' +

    '<div class="box">' +
      '<strong>Order ID:</strong> ' + escapeHtml(order.orderID) +
    '</div>' +

    '</body></html>';

  return new Response(invoiceHtml, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
            if (url.pathname.startsWith("/admin/invoice-sent/")) {

        if (!await checkAuth(request, env)) {
          return Response.redirect(publicWorkerUrl + "/admin/login", 302);
        }

        const orderID = url.pathname.split("/admin/invoice-sent/")[1];
        const orderKey = "order:" + orderID;
        const data = await env.ORDERS.get(orderKey);

        if (!data) {
          return new Response("Order niet gevonden", { status: 404 });
        }

let order = JSON.parse(data);
        order.invoiceStatus = "Verzonden";
        order.invoiceSentAt = new Date().toISOString();
        order.lifecycleStage = "invoice-sent";

        await env.ORDERS.put(orderKey, JSON.stringify(order));

        return Response.redirect(publicWorkerUrl + "/admin", 302);
      }
    if (url.pathname.startsWith("/admin/approve/") && request.method === "POST") {
      if (!await checkAuth(request, env)) {
        return Response.redirect(publicWorkerUrl + "/admin/login", 302);
      }
      const orderID = url.pathname.split("/admin/approve/")[1];
      const orderKey = "order:" + orderID;
      const data = await env.ORDERS.get(orderKey);
      if (!data) {
        return new Response("Order niet gevonden", { status: 404 });
      }
      let order = JSON.parse(data);
      const orderType = order.orderType || "digital";
      const orderLang = order.lang || "nl";
      const payerFirstName = String(order.payerName || "Klant").trim().split(/\s+/)[0] || "Klant";
      const formData = await request.formData();
      const invoiceNumber = formData.get("invoiceNumber") || "";

     let normalizedInvoiceNumber = String(invoiceNumber || "").trim() || String(order.invoiceNumber || "").trim();

if (order.invoiceRequested && !normalizedInvoiceNumber) {
  normalizedInvoiceNumber = await getNextInvoiceNumber(env);
}

if (order.invoiceRequested) {
  const invoiceIndexKey = "invoice-number:" + normalizedInvoiceNumber;
  const existingInvoiceOrderID = await env.ORDERS.get(invoiceIndexKey);

  if (existingInvoiceOrderID && existingInvoiceOrderID !== orderID) {
    return new Response(
      "Factuurnummer bestaat al in webshop-orders: " + normalizedInvoiceNumber,
      { status: 400 }
    );
  }

  if (order.invoiceNumber && order.invoiceNumber !== normalizedInvoiceNumber) {
    await env.ORDERS.delete("invoice-number:" + order.invoiceNumber);
  }

  order.invoiceNumber = normalizedInvoiceNumber;
  order.invoiceDate = new Date().toISOString().slice(0, 10);
  order.invoiceStatus = "Niet verzonden";
  order.invoiceFilePdf = "facturen/" + normalizedInvoiceNumber + ".pdf";
  await env.ORDERS.put(invoiceIndexKey, orderID);
}
     
      if (orderType === "digital" || orderType === "mixed") {
        const downloadToken = crypto.randomUUID();
        await env.ORDERS.put("download:" + downloadToken, JSON.stringify({
          orderID,
          patternFile: order.patternFile,
          downloaded: false,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        }), { expirationTtl: 259200 });
        order.downloadToken = downloadToken;
        const downloadUrl = publicWorkerUrl + "/download/" + downloadToken;
        const subjects = {
          nl: "Je borduurpatroon is klaar om te downloaden!",
          fr: "Votre motif de broderie est pret a telecharger!",
          en: "Your embroidery pattern is ready to download!"
        };
        const bodies = {
          nl: `<h2>Hallo ${escapeHtml(payerFirstName)}!</h2><p>Bedankt voor je bestelling van <strong>${escapeHtml(order.productName)}</strong>.</p><p>Je borduurpatroon is klaar om te downloaden:</p><p><a href="${escapeHtml(downloadUrl)}" style="background:#10b981;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;display:inline-block">Download je patroon</a></p><p><strong>Let op:</strong> Deze link kan slechts 1 keer gebruikt worden en is 72 uur geldig.</p>${orderType === "mixed" ? "<p>Je fysieke producten worden binnen 10 werkdagen verzonden.</p>" : ""}<p>Met vriendelijke groet,<br>MagicFancyworks</p>`,
          fr: `<h2>Bonjour ${escapeHtml(payerFirstName)}!</h2><p>Merci pour votre commande de <strong>${escapeHtml(order.productName)}</strong>.</p><p>Votre motif de broderie est pret a telecharger:</p><p><a href="${escapeHtml(downloadUrl)}" style="background:#10b981;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;display:inline-block">Telecharger votre motif</a></p><p><strong>Attention:</strong> Ce lien ne peut etre utilise qu'une seule fois et est valable 72 heures.</p>${orderType === "mixed" ? "<p>Vos produits physiques seront expedies sous 10 jours ouvrables.</p>" : ""}<p>Cordialement,<br>MagicFancyworks</p>`,
          en: `<h2>Hello ${escapeHtml(payerFirstName)}!</h2><p>Thank you for your order of <strong>${escapeHtml(order.productName)}</strong>.</p><p>Your embroidery pattern is ready to download:</p><p><a href="${escapeHtml(downloadUrl)}" style="background:#10b981;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;display:inline-block">Download your pattern</a></p><p><strong>Note:</strong> This link can only be used once and is valid for 72 hours.</p>${orderType === "mixed" ? "<p>Your physical products will be shipped within 10 business days.</p>" : ""}<p>Best regards,<br>MagicFancyworks</p>`
        };
        const mailSubject = subjects[orderLang] || subjects["nl"];
        const mailBody = bodies[orderLang] || bodies["nl"];
        const mailResults = await Promise.allSettled([
          sendResendEmail(env, {
            from: shopFromEmail,
            to: order.payerEmail,
            subject: mailSubject,
            html: mailBody
          }),
          sendResendEmail(env, {
            from: shopFromEmail,
            to: orderNotificationEmail,
            subject: "[KOPIE KLANT] " + mailSubject,
            html: mailBody
          })
        ]);
        for (const result of mailResults) {
          if (result.status === "rejected") {
            console.error("Email fout:", result.reason);
          }
        }
      }
      if (orderType === "physical") {
        const subjects = {
          nl: "Je bestelling is klaar voor verzending",
          fr: "Votre commande est prete a etre expediee",
          en: "Your order is ready for shipment"
        };
        const bodies = {
          nl: `<h2>Hallo ${escapeHtml(order.payerName.split(" ")[0])}!</h2><p>Bedankt voor je bestelling van <strong>${escapeHtml(order.productName)}</strong>.</p><p>Je producten worden binnen 10 werkdagen verzonden.</p><p>Met vriendelijke groet,<br>MagicFancyworks</p>`,
          fr: `<h2>Bonjour ${escapeHtml(order.payerName.split(" ")[0])}!</h2><p>Merci pour votre commande de <strong>${escapeHtml(order.productName)}</strong>.</p><p>Vos produits seront expedies sous 10 jours ouvrables.</p><p>Cordialement,<br>MagicFancyworks</p>`,
          en: `<h2>Hello ${escapeHtml(order.payerName.split(" ")[0])}!</h2><p>Thank you for your order of <strong>${escapeHtml(order.productName)}</strong>.</p><p>Your products will be shipped within 10 business days.</p><p>Best regards,<br>MagicFancyworks</p>`
        };
        const mailSubject = subjects[orderLang] || subjects["nl"];
        const mailBody = bodies[orderLang] || bodies["nl"];
        const mailResults = await Promise.allSettled([
          sendResendEmail(env, {
            from: shopFromEmail,
            to: order.payerEmail,
            subject: mailSubject,
            html: mailBody
          }),
          sendResendEmail(env, {
            from: shopFromEmail,
            to: orderNotificationEmail,
            subject: "[KOPIE KLANT] " + mailSubject,
            html: mailBody
          })
        ]);
        for (const result of mailResults) {
          if (result.status === "rejected") {
            console.error("Email fout:", result.reason);
          }
        }
      }
      let walterBody = `<h2>Nieuwe bestelling!</h2><p><strong>Product:</strong> ${escapeHtml(order.productName)}</p><p><strong>Bedrag:</strong> ${escapeHtml(order.currency)} ${escapeHtml(order.amount)}</p><p><strong>Klant:</strong> ${escapeHtml(order.payerName)}</p><p><strong>Email:</strong> ${escapeHtml(order.payerEmail)}</p><p><strong>Type:</strong> ${escapeHtml(orderType)}</p><p><strong>Order ID:</strong> ${escapeHtml(orderID)}</p>`;
      if (order.discountCode) {
        walterBody += `<p><strong>Promocode:</strong> ${escapeHtml(order.discountCode)} (${escapeHtml(order.discountAmount || "0.00")})</p>`;
      }
      if (order.invoiceRequested) {
        walterBody += `<p><strong>Factuur:</strong><br>
        Type: ${escapeHtml(order.invoiceType || "-")}<br>
        Factuurnummer: ${escapeHtml(order.invoiceNumber || "-")}<br>
        Bedrijf: ${escapeHtml(order.companyName || "-")}<br>
        BTW: ${escapeHtml(order.vatNumber || "-")}<br>
        Facturatie e-mail: ${escapeHtml(order.invoiceEmail || "-")}</p>`;
      }
      if (order.shippingAddress) {
        walterBody += `<p><strong>Verzendadres:</strong><br>${escapeHtml(order.shippingAddress.name)}<br>${escapeHtml(order.shippingAddress.address.line1)}<br>${escapeHtml(order.shippingAddress.address.postalCode)} ${escapeHtml(order.shippingAddress.address.city)}<br>${escapeHtml(order.shippingAddress.address.country)}</p>`;
      }
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
              body: JSON.stringify({
            from: shopFromEmail,
            to: orderNotificationEmail,
            subject: "Nieuwe bestelling: " + order.productName,
            html: walterBody
          })
        });
      } catch (e) {
        console.error("Email fout:", e);
      }
order.status = "approved";
order.approvedAt = (/* @__PURE__ */ new Date()).toISOString();
order.lifecycleStage = order.invoiceRequested ? "approved-with-invoice" : "approved";

await env.ORDERS.put(orderKey, JSON.stringify(order));

return Response.redirect(publicWorkerUrl + "/admin", 302);

    }
    if (url.pathname.startsWith("/download/")) {
      const token = url.pathname.split("/download/")[1];
      const downloadKey = "download:" + token;
      const data = await env.ORDERS.get(downloadKey);
      if (!data) {
        return new Response("<h1>Link verlopen</h1><p>Deze download link is niet meer geldig of is al gebruikt.</p>", {
          status: 404,
          headers: { "Content-Type": "text/html; charset=utf-8" }
        });
      }
      const download = JSON.parse(data);
      if (download.downloaded) {
        return new Response("<h1>Al gedownload</h1><p>Dit bestand is al een keer gedownload.</p>", {
          headers: { "Content-Type": "text/html; charset=utf-8" }
        });
      }
      const patternLookup = await getPatternFileWithFallback(env, download.patternFile);
      const file = patternLookup.file;
      if (!file) {
        const tried = (patternLookup.triedPatternFiles || [download.patternFile]).map(escapeHtml).join("<br>");
        return new Response("<h1>Bestand niet gevonden</h1><p>Contacteer " + escapeHtml(orderNotificationEmail) + "</p><p>Geprobeerd:<br><code>" + tried + "</code></p>", {
          status: 404,
          headers: { "Content-Type": "text/html; charset=utf-8" }
        });
      }
      download.downloaded = true;
      download.downloadedAt = (/* @__PURE__ */ new Date()).toISOString();
      const orderKey = "order:" + download.orderID;
      const orderData = await env.ORDERS.get(orderKey);
      if (orderData) {
        const order = JSON.parse(orderData);
        order.downloaded = true;
        order.downloadToken = "";
        order.lifecycleStage = "downloaded";
        if (order.orderType === "digital" && !order.invoiceRequested) {
          order.payerName = "";
          order.payerEmail = "";
          order.shippingAddress = null;
          order.transactionID = "";
          order.companyName = "";
          order.vatNumber = "";
          order.invoiceEmail = "";
          order.invoiceCountry = "";
          order.buyerEndpointID = "";
          order.invoiceCity = "";
          order.invoicePostalCode = "";
          order.invoiceVatNote = "";
        }
        await env.ORDERS.put(orderKey, JSON.stringify(order));
      }
      await env.ORDERS.delete(downloadKey);
      return new Response(file.body, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": 'attachment; filename="' + patternLookup.resolvedPatternFile + '"'
        }
      });
    }
    if (url.pathname === "/webhook" && request.method === "POST") {
      try {
        const rawBody = await request.text();
        const body = JSON.parse(rawBody);
        const webhookId = env.PAYPAL_WEBHOOK_ID || "";

        if (!webhookId) {
          return new Response(JSON.stringify({ error: "PAYPAL_WEBHOOK_ID ontbreekt" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        const auth = btoa(env.PAYPAL_CLIENT_ID + ":" + env.PAYPAL_SECRET);
        const tokenResp = await fetch(paypalBase + "/v1/oauth2/token", {
          method: "POST",
          headers: { "Authorization": "Basic " + auth, "Content-Type": "application/x-www-form-urlencoded" },
          body: "grant_type=client_credentials"
        });
        const tokenData = await tokenResp.json();
        if (!tokenData.access_token) {
          return new Response(JSON.stringify({ error: "Geen access token voor webhook-verificatie", paypal_response: tokenData }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        const verifyResp = await fetch(paypalBase + "/v1/notifications/verify-webhook-signature", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + tokenData.access_token
          },
          body: JSON.stringify({
            auth_algo: request.headers.get("PayPal-Auth-Algo") || "",
            cert_url: request.headers.get("PayPal-Cert-Url") || "",
            transmission_id: request.headers.get("PayPal-Transmission-Id") || "",
            transmission_sig: request.headers.get("PayPal-Transmission-Sig") || "",
            transmission_time: request.headers.get("PayPal-Transmission-Time") || "",
            webhook_id: webhookId,
            webhook_event: body
          })
        });
        const verifyData = await verifyResp.json();

        if (verifyData.verification_status !== "SUCCESS") {
          return new Response(JSON.stringify({
            error: "Webhook-signature ongeldig",
            verification_status: verifyData.verification_status || "UNKNOWN"
          }), {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        if (body.event_type === "PAYMENT.CAPTURE.COMPLETED") {
          const payment = body.resource;
          const totalAmount = Number(payment.amount?.value || 0);
          const shippingAmount = Number(payment.amount?.breakdown?.shipping?.value || 0);
          const itemTotal = Number(payment.amount?.breakdown?.item_total?.value || (totalAmount - shippingAmount));
          const totalDisplay = formatMoneyDisplay(totalAmount, true);
          const itemDisplay = formatMoneyDisplay(itemTotal, true);
          const shippingDisplay = formatMoneyDisplay(shippingAmount, true);
          try {
            await sendResendEmail(env, {
              from: shopFromEmail,
              to: orderNotificationEmail,
              subject: "Webhook: betaling EUR " + totalDisplay,
              html: "<h2>PayPal Webhook!</h2><p><strong>Totaal:</strong> €" + escapeHtml(totalDisplay) + "</p><p><strong>Product:</strong> €" + escapeHtml(itemDisplay) + "</p><p><strong>Verzendkosten:</strong> €" + escapeHtml(shippingDisplay) + "</p><p><strong>ID:</strong> " + escapeHtml(payment.id) + "</p>"
            });
          } catch (e) {
            console.error("Email fout:", e);
          }
        }
        return new Response(JSON.stringify({ status: "success" }), { headers: { "Content-Type": "application/json" } });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
      }
    }
    if (url.pathname === "/update-shipping" && request.method === "POST") {
      try {
        const { orderID, countryCode } = await request.json();
const ratesFile = await env.PATTERNS.get("shipping-rates.json");

if (!ratesFile) {
  return new Response(
    JSON.stringify({ error: "shipping-rates.json niet gevonden" }),
    {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    }
  );
}

const rates = await ratesFile.json();

const country = String(countryCode || "").toUpperCase();

        const tempOrder = await env.ORDERS.get("paypal:" + orderID);
        const tempData = tempOrder ? JSON.parse(tempOrder) : {};
const freeShippingApplied = orderHasFreeShipping(tempData);
const shipping =
  freeShippingApplied
    ? 0
    : rates[country] !== undefined
      ? Number(rates[country])
      : Number(rates.default || 0);
        const basePrice = Number(tempData.basePrice || 0);
        const total = basePrice + shipping;
        const auth = btoa(env.PAYPAL_CLIENT_ID + ":" + env.PAYPAL_SECRET);
        const tokenResp = await fetch(paypalBase + "/v1/oauth2/token", {      
              method: "POST",
          headers: { "Authorization": "Basic " + auth, "Content-Type": "application/x-www-form-urlencoded" },
          body: "grant_type=client_credentials"
        });
        const tokenData = await tokenResp.json();
        const patchResp = await fetch(paypalBase + "/v2/checkout/orders/" + orderID, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + tokenData.access_token
          },
          body: JSON.stringify([
            {
              "op": "replace",
              "path": "/purchase_units/0/amount",
              "value": {
                "currency_code": "EUR",
                "value": total.toFixed(2),
                "breakdown": {
                  "item_total": { "currency_code": "EUR", "value": basePrice.toFixed(2) },
                  "shipping": { "currency_code": "EUR", "value": shipping.toFixed(2) }
                }
              }
            }
          ])
        });
        if (patchResp.ok) {
          const updatedTempOrder = {
            ...tempData,
            shippingCountry: country,
            estimatedShippingAmount: shipping.toFixed(2),
            totalAmount: total.toFixed(2),
            hasFreeShipping: freeShippingApplied || Boolean(tempData.hasFreeShipping)
          };
          await env.ORDERS.put("paypal:" + orderID, JSON.stringify(updatedTempOrder), { expirationTtl: 3600 });
          return new Response(JSON.stringify({ success: true, shipping, total }), {
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        } else {
          const errText = await patchResp.text();
          return new Response(JSON.stringify({ success: false, error: errText }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
      } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }
    if (url.pathname === "/contact" && request.method === "POST") {
      try {
        const { name, email, subject, message } = await request.json();
        if (!name || !email || !message) {
          return new Response(JSON.stringify({ error: "Alle velden zijn verplicht" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: shopFromEmail,
            to: orderNotificationEmail,
            subject: "Contactformulier: " + (subject || "Geen onderwerp"),
            html: "<h2>Nieuw contactbericht</h2><p><strong>Naam:</strong> " + escapeHtml(name) + "</p><p><strong>Email:</strong> " + escapeHtml(email) + "</p><p><strong>Onderwerp:</strong> " + escapeHtml(subject || "-") + "</p><p><strong>Bericht:</strong></p><p>" + escapeHtml(message).replace(/\n/g, "<br>") + "</p>"
          })
        });
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    if (url.pathname === "/logo.png" && request.method === "GET") {
      const logo = await env.PATTERNS.get("logo.png");

      if (!logo) {
        return new Response("Logo niet gevonden", { status: 404 });
      }

      return new Response(logo.body, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400"
        }
      });
    }

    return new Response("PayPal Handler actief!", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(purgeTemporaryOrders(env));
  }
};
async function checkAuth(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/admin_session=([^;]+)/);
  if (!match)
    return false;
  const session = await env.ORDERS.get("session:" + match[1]);
  return !!session;
}
__name(checkAuth, "checkAuth");
__name2(checkAuth, "checkAuth");
__name22(checkAuth, "checkAuth");
__name222(checkAuth, "checkAuth");
function loginPage(error) {
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Login</title><style>body{font-family:system-ui;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f1f5f9}.login{background:white;padding:40px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);width:300px}h1{text-align:center;color:#1e293b}input{width:100%;padding:10px;margin:10px 0;border:1px solid #cbd5e1;border-radius:4px;box-sizing:border-box}button{width:100%;padding:10px;background:#10b981;color:white;border:none;border-radius:4px;cursor:pointer;font-size:16px}.error{color:#ef4444;text-align:center;font-size:14px}</style></head><body><div class="login"><h1>Admin</h1>' + (error ? '<p class="error">' + error + "</p>" : "") + '<form method="POST" action="/admin/login"><input type="password" name="password" placeholder="Wachtwoord" autofocus><button type="submit">Inloggen</button></form></div></body></html>';
  function getCustomerEmail(order, downloadUrl) {
    const lang = order.lang || "nl";
    const texts = {
      nl: {
        subject: "Je borduurpatroon is klaar om te downloaden!",
        greeting: "Hallo",
        thanks: "Bedankt voor je bestelling van",
        ready: "Je borduurpatroon is klaar om te downloaden:",
        button: "Download je patroon",
        notice: "Let op: Deze link kan slechts 1 keer gebruikt worden en is 24 uur geldig.",
        regards: "Met vriendelijke groet,"
      },
      fr: {
        subject: "Votre motif de broderie est pret a telecharger!",
        greeting: "Bonjour",
        thanks: "Merci pour votre commande de",
        ready: "Votre motif de broderie est pret a telecharger:",
        button: "Telecharger votre motif",
        notice: "Attention: Ce lien ne peut etre utilise qu'une seule fois et est valable 24 heures.",
        regards: "Cordialement,"
      },
      en: {
        subject: "Your embroidery pattern is ready to download!",
        greeting: "Hello",
        thanks: "Thank you for your order of",
        ready: "Your embroidery pattern is ready to download:",
        button: "Download your pattern",
        notice: "Note: This link can only be used once and is valid for 24 hours.",
        regards: "Best regards,"
      }
    };
    const t = texts[lang] || texts["nl"];
    return {
      from: shopFromEmail,
      to: order.payerEmail,
      subject: t.subject,
      html: "<h2>" + t.greeting + " " + escapeHtml(order.payerName.split(" ")[0]) + "!</h2><p>" + t.thanks + " <strong>" + escapeHtml(order.productName) + "</strong>.</p><p>" + t.ready + '</p><p><a href="' + escapeHtml(downloadUrl) + '" style="background:#10b981;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;display:inline-block">' + t.button + "</a></p><p><strong>" + t.notice + "</strong></p><p>" + t.regards + "<br>MagicFancyworks</p>"
    };
  }
  __name(getCustomerEmail, "getCustomerEmail");
  __name2(getCustomerEmail, "getCustomerEmail");
  __name22(getCustomerEmail, "getCustomerEmail");
  __name222(getCustomerEmail, "getCustomerEmail");
}
__name(loginPage, "loginPage");
__name2(loginPage, "loginPage");
__name22(loginPage, "loginPage");
__name222(loginPage, "loginPage");
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
