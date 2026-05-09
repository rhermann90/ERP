import type { EInvoicePartySnapshot } from "../../../lib/api-client.js";

type Props = {
  party: EInvoicePartySnapshot | null;
  testId?: string;
};

export function EInvoicePartyDetailFields({ party, testId }: Props) {
  if (!party) {
    return (
      <p className="hint" data-testid={testId}>
        Keine strukturierten Partei-Daten hinterlegt.
      </p>
    );
  }
  const rows: Array<{ label: string; value: string }> = [
    { label: "Rechtsname / Firmenname", value: party.legalName },
    { label: "Straße", value: party.streetName },
    { label: "PLZ / Ort", value: `${party.postalZone} ${party.cityName}`.trim() },
    { label: "Land", value: party.countryCode },
  ];
  if (party.vatId) rows.push({ label: "USt-IdNr.", value: party.vatId });
  if (party.companyId) rows.push({ label: "Unternehmens-ID", value: party.companyId });
  if (party.companyIdSchemeId) rows.push({ label: "ID-Schema", value: party.companyIdSchemeId });
  if (party.email) rows.push({ label: "E-Mail", value: party.email });

  return (
    <dl
      data-testid={testId}
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(8rem, 11rem) 1fr",
        gap: "0.35rem 1rem",
        margin: "0.5rem 0 0",
        fontSize: "0.9rem",
      }}
    >
      {rows.map((r) => (
        <div key={r.label} style={{ display: "contents" }}>
          <dt style={{ margin: 0, color: "var(--text-secondary, #666)" }}>{r.label}</dt>
          <dd style={{ margin: 0 }}>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
