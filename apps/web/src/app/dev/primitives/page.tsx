"use client";

import { notFound } from "next/navigation";
import { Badge, Button, Chip, Disclosure, Notice } from "@/components/ui";

function Swatch({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <p className="lr-quiet" style={{ margin: "0 0 0.5rem" }}>{label}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
        {children}
      </div>
    </div>
  );
}

function PrimitiveSet() {
  return (
    <>
      <Swatch label="Buttons">
        <Button>Primary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button disabled>Disabled</Button>
      </Swatch>
      <Swatch label="Chips & badges">
        <Chip>Example brief</Chip>
        <Chip disabled>Disabled</Chip>
        <Badge>Platform catalog</Badge>
        <Badge style={{ borderColor: "var(--lr-accent)", color: "var(--lr-accent)" }}>
          Best match
        </Badge>
      </Swatch>
      <Swatch label="Notices">
        <Notice style={{ flex: "1 1 100%" }}>Default notice — neutral status or empty state.</Notice>
        <Notice tone="error" style={{ flex: "1 1 100%" }}>
          Error notice — something failed. <Chip>Retry</Chip>
        </Notice>
      </Swatch>
      <Swatch label="Inputs">
        <label className="lr-label" htmlFor="prim-input" style={{ flexBasis: "100%", margin: 0 }}>
          Label
        </label>
        <input id="prim-input" className="lr-input" placeholder="Describe the voice you need" style={{ maxWidth: "20rem" }} />
        <select className="lr-select" style={{ maxWidth: "12rem" }} defaultValue="" aria-label="Demo select">
          <option value="">All tones</option>
          <option value="warm">Warm</option>
        </select>
      </Swatch>
      <Swatch label="Disclosure — section">
        <div style={{ flex: "1 1 100%" }}>
          <Disclosure title="Section disclosure" name="demo-sections">
            <p style={{ margin: 0 }}>Secondary content lives here until asked for. Siblings sharing <code>name</code> form an exclusive accordion.</p>
          </Disclosure>
          <Disclosure title="Another section" name="demo-sections">
            <p style={{ margin: 0 }}>Opening this closes the one above.</p>
          </Disclosure>
        </div>
      </Swatch>
      <Swatch label="Disclosure — inline">
        <div style={{ flex: "1 1 100%" }}>
          <Disclosure title="Why this match?" variant="inline">
            <p className="lr-quiet" style={{ marginTop: "0.5rem" }}>Quiet inline detail inside a card or row.</p>
          </Disclosure>
        </div>
      </Swatch>
    </>
  );
}

export default function PrimitivesPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main
      id="listening-main"
      className="lr-shell"
      style={{ minHeight: "100vh" }}
    >
      <div className="lr-wrap" style={{ paddingTop: "2.5rem", paddingBottom: "4rem" }}>
        <h1 className="lr-h1" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>Primitives</h1>
        <p className="lr-lede">Listening Room component states — light and dark.</p>

        <section style={{ marginTop: "2rem" }}>
          <h2 className="lr-quiet" style={{ margin: "0 0 1rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Light</h2>
          <PrimitiveSet />
        </section>

        <section
          className="lr-dark"
          style={{
            marginTop: "2.5rem",
            background: "var(--lr-night)",
            color: "var(--lr-night-ink)",
            border: "1px solid var(--lr-night-line)",
            borderRadius: "var(--lr-radius)",
            padding: "var(--lr-space-lg)",
          }}
        >
          <h2 className="lr-quiet" style={{ margin: "0 0 1rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Dark</h2>
          <PrimitiveSet />
        </section>
      </div>
    </main>
  );
}
