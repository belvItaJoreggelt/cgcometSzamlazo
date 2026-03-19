/**
 * Egyszerűsített számla XML generátor – NAV Online Számla V3.0
 * Adományokhoz optimalizált, magánszemély vevővel
 * 
 * Referencia: https://github.com/nav-gov-hu/Online-Invoice
 */

import { companyConfig } from './config.js';

const XML_NS = 'http://schemas.nav.gov.hu/OSA/3.0/base';
const COMMON_NS = 'http://schemas.nav.gov.hu/NTCA/1.0/common';

function escapeXml(str) {
  if (str == null || str === '') return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Egyszerűsített számla XML összeállítása adományhoz
 * @param {Object} params
 * @param {string} params.invoiceNumber - Számlaszáml (pl. "DOM-2025-0001")
 * @param {string} params.issueDate - YYYY-MM-DD
 * @param {number} params.amount - Összeg HUF-ban
 * @param {string} [params.customerName] - Vevő neve (ha nincs: "Adományozó")
 * @param {string} [params.customerEmail] - Email (opcionális)
 * @param {Object} [params.customerAddress] - { postalCode, city, addressLine1, addressLine2 }
 * @param {string} [params.stripePaymentId] - Stripe payment ID (megjegyzéshez)
 */
export function buildSimplifiedDonationInvoice(params) {
  const {
    invoiceNumber,
    issueDate,
    amount,
    customerName = 'Adományozó',
    customerEmail,
    customerAddress,
    stripePaymentId,
  } = params;

  const s = companyConfig.supplier;

  // Magánszemély vevő – minimális adatok (kötelező: név, cím)
  const custPostal = customerAddress?.postalCode || '1011';
  const custCity = customerAddress?.city || 'Budapest';
  const custAddr1 = customerAddress?.addressLine1 || 'Nem megadva';
  const custAddr2 = customerAddress?.addressLine2 || '';

  const customerXml = `
    <customerVatStatus>PRIVATE_PERSON</customerVatStatus>
    <customerTaxNumber><unknown>true</unknown></customerTaxNumber>
    <customerTaxNumberType>2</customerTaxNumberType>
    <customerName>${escapeXml(customerName)}</customerName>
    <customerAddress>
      <countryCode>HU</countryCode>
      <postalCode>${escapeXml(custPostal)}</postalCode>
      <city>${escapeXml(custCity)}</city>
      <additionalAddressDetail>
        <addressType>STREET</addressType>
        <address>${escapeXml(custAddr1)}${custAddr2 ? ' ' + escapeXml(custAddr2) : ''}</address>
      </additionalAddressDetail>
    </customerAddress>`;

  const paymentMethod = 'CARD'; // Stripe = kártya
  const invoiceAppearance = 'PAPER'; // PAPER vagy ELECTRONIC

  const lineDescription = stripePaymentId
    ? `Adomány – Stripe fizetés: ${stripePaymentId}`
    : 'Adomány a CGCOMET kreatív stúdió számára';

  // Egyetlen tétel: adomány, adómentes (ÁFA tv. 86. §)
  const lineItemXml = `
    <lineNumber>1</lineNumber>
    <lineExpressionIndicator>false</lineExpressionIndicator>
    <lineDescription>${escapeXml(lineDescription)}</lineDescription>
    <quantity>1</quantity>
    <unitOfMeasure>PIECE</unitOfMeasure>
    <unitPrice>${amount}</unitPrice>
    <lineAmountsSimplified>
      <lineNetAmount>${amount}</lineNetAmount>
      <lineVatAmount>0</lineVatAmount>
      <lineGrossAmountSimplified>${amount}</lineGrossAmountSimplified>
    </lineAmountsSimplified>
    <lineNatureIndicator>SERVICE</lineNatureIndicator>
    <vatExemption>
      <vatExemptionReasonCode>TAM</vatExemptionReasonCode>
      <vatExemptionReason>Adómentes ÁFA tv. 86.§ (1)</vatExemptionReason>
    </vatExemption>`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="${XML_NS}" xmlns:common="${COMMON_NS}">
  <invoiceNumber>${escapeXml(invoiceNumber)}</invoiceNumber>
  <invoiceIssueDate>${issueDate}</invoiceIssueDate>
  <complete>true</complete>
  <invoiceMain>
    <supplierInfo>
      <supplierTaxNumber>${escapeXml(s.taxpayerId)}</supplierTaxNumber>
      <supplierVatStatus>DOMESTIC</supplierVatStatus>
      <supplierName>${escapeXml(s.name)}</supplierName>
      <supplierAddress>
        <countryCode>${s.countryCode}</countryCode>
        <postalCode>${escapeXml(s.postalCode)}</postalCode>
        <city>${escapeXml(s.city)}</city>
        <additionalAddressDetail>
          <addressType>STREET</addressType>
          <address>${escapeXml(s.addressLine1)} ${escapeXml(s.addressLine2)}</address>
        </additionalAddressDetail>
      </supplierAddress>
      <supplierBankAccountNumber>${escapeXml(s.bankAccountNumber.replace(/\s/g, ''))}</supplierBankAccountNumber>
    </supplierInfo>
    ${customerXml}
    <invoiceDetail>
      <invoiceCategory>SIMPLIFIED</invoiceCategory>
      <invoiceDeliveryDate>${issueDate}</invoiceDeliveryDate>
      <currencyCode>HUF</currencyCode>
      <exchangeRate>1</exchangeRate>
      <paymentMethod>${paymentMethod}</paymentMethod>
      <paymentDate>${issueDate}</paymentDate>
      <invoiceAppearance>${invoiceAppearance}</invoiceAppearance>
      <smallBusinessIndicator>false</smallBusinessIndicator>
      <lineItem>
        ${lineItemXml}
      </lineItem>
      <summaryByVatRate>
        <vatExemption>
          <vatExemptionReasonCode>TAM</vatExemptionReasonCode>
          <vatExemptionReason>Adómentes ÁFA tv. 86.§ (1)</vatExemptionReason>
        </vatExemption>
        <vatRateNetAmount>${amount}</vatRateNetAmount>
        <vatRateVatAmount>0</vatRateVatAmount>
        <vatRateGrossAmount>${amount}</vatRateGrossAmount>
      </summaryByVatRate>
      <summarySimplified>
        <totalGrossAmount>${amount}</totalGrossAmount>
      </summarySimplified>
    </invoiceDetail>
  </invoiceMain>
</Invoice>`;

  return xml;
}
