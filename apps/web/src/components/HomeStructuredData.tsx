const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://voisss.netlify.app";

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "VOISSS",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: "Voice licensing marketplace for AI agents and applications.",
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "VOISSS voice licensing",
    provider: { "@type": "Organization", name: "VOISSS", url: siteUrl },
    serviceType: "Voice licensing for AI agents",
    areaServed: "Worldwide",
    url: `${siteUrl}/marketplace`,
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How does voice licensing work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "When you license a voice, a smart contract is executed on the Base network. This provides a cryptographically verifiable right to use that voice for your AI agent according to the contributor's terms.",
        },
      },
      {
        "@type": "Question",
        name: "Is the voice recording secure?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Recordings are encrypted and processed to create a unique voice fingerprint. Blockchain provenance makes the origin and ownership of every voice transparent and immutable.",
        },
      },
      {
        "@type": "Question",
        name: "What are x402 payments?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "x402 is a payment protocol for AI agents that supports low-latency micro-transactions and automated billing for services such as voice licensing.",
        },
      },
      {
        "@type": "Question",
        name: "How much can I earn as a contributor?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Contributors receive 70% of every licensing fee paid for their voice. Earnings depend on voice popularity and the rates they set.",
        },
      },
    ],
  },
];

export default function HomeStructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
