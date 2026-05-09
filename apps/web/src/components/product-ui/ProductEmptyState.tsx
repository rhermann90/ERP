import type { ReactNode } from "react";

type Props = {
  title: string;
  description: ReactNode;
  children?: ReactNode;
};

/** Standard-Leer-/Platzhalter-Zustand für Produkt-Hubs (kein Pflicht-Roh-JSON). */
export function ProductEmptyState({ title, description, children }: Props) {
  return (
    <div
      className="product-empty-state"
      role="status"
      aria-live="polite"
      data-testid="product-empty-state"
    >
      <p className="product-empty-state-title">{title}</p>
      <div className="product-empty-state-desc">{description}</div>
      {children ? <div className="product-empty-state-actions">{children}</div> : null}
    </div>
  );
}
