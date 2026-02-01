import type { ReactNode } from "react";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import Layout from "@theme/Layout";

import styles from "./index.module.css";

/* ═══════════════════════════════════════════════════════════════
   Hero
   ═══════════════════════════════════════════════════════════════ */

function Hero() {
  const memeImg = useBaseUrl("/img/xkcd-standards.png");
  return (
    <header className={styles.hero}>
      <div className={styles.heroInner}>
        <span className={styles.badge}>Draft Specification</span>
        <h1 className={styles.title}>Verifiable Compute</h1>
        <p className={styles.subtitle}>
          An open specification for two-party verifiable computation, layered
          on WebAssembly.
        </p>
        <div className={styles.heroCtas}>
          <Link className={styles.ctaPrimary} to="/docs/introduction">
            Read the Docs
          </Link>
          <Link className={styles.ctaSecondary} to="/docs/spec">
            Specification
          </Link>
        </div>
        <div className={styles.heroMeme}>
          <img
            src={memeImg}
            alt={"xkcd 927: Standards. Situation: there are 14 competing standards. We need to develop one universal standard that covers everyone's use cases. Soon: there are 15 competing standards."}
            className={styles.memeImg}
          />
          <p className={styles.memeCaption}>
            Alice and Bob are tired of rewriting their program for every new
            proving system. &mdash;{" "}
            <a href="https://xkcd.com/927/">xkcd 927</a>,{" "}
            <a href="https://creativecommons.org/licenses/by-nc/2.5/">
              CC BY-NC 2.5
            </a>
          </p>
        </div>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Features
   ═══════════════════════════════════════════════════════════════ */

type Feature = {
  title: string;
  desc: string;
};

const FEATURES: Feature[] = [
  {
    title: "Zero-Knowledge Proofs",
    desc: "Prove computation correctness without revealing private inputs.",
  },
  {
    title: "Two-Party Computation",
    desc: "Both parties contribute private inputs. Neither learns the other's secrets.",
  },
  {
    title: "WebAssembly Native",
    desc: "Write in Rust, C, or any language that compiles to Wasm. No VM modifications.",
  },
  {
    title: "Embedder Independent",
    desc: "Decouple business logic from the cryptographic backend.",
  },
  {
    title: "Standard Toolchains",
    desc: "Compile, test, and debug with the tools you already use.",
  },
  {
    title: "Formally Grounded",
    desc: "Built on formally specified WebAssembly semantics. Deterministic execution.",
  },
];

function Features() {
  return (
    <section className={`${styles.section} ${styles.sectionCenter}`}>
      <div className={styles.sectionInner}>
        <h2 className={styles.sectionTitle}>What this enables</h2>
        <p className={styles.sectionSubtitle}>
          A single abstraction layer for verifiable computation.
        </p>
        <div className={styles.featureGrid}>
          {FEATURES.map((f, i) => (
            <div key={i} className={styles.featureCard}>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Architecture
   ═══════════════════════════════════════════════════════════════ */

function Architecture() {
  return (
    <section className={`${styles.sectionAlt} ${styles.sectionCenter}`}>
      <div className={styles.sectionInner}>
        <h2 className={styles.sectionTitle}>Layered on WebAssembly</h2>
        <p className={styles.sectionSubtitle}>
          Guest programs are standard Wasm modules. No annotations required.
        </p>
        <div className={styles.archBlock}>
          <div className={styles.archRow}>
            <div className={styles.archBox}>Your Application</div>
          </div>
          <div className={styles.archArrow}>{"↓"}</div>
          <div className={styles.archRow}>
            <div className={styles.archBox}>Standard Toolchain</div>
          </div>
          <div className={styles.archArrow}>{"↓ .wasm"}</div>
          <div className={styles.archRow}>
            <div className={styles.archBoxAccent}>Verifiable Compute</div>
          </div>
          <div className={styles.archArrow}>{"↓"}</div>
          <div className={styles.archRow}>
            <div className={styles.archBox}>WebAssembly Core</div>
          </div>
          <div className={styles.archArrow}>{"↓"}</div>
          <div className={styles.archRow}>
            <div className={styles.archBox}>Embedder A</div>
            <div className={styles.archBox}>Embedder B</div>
            <div className={styles.archBox}>Embedder C</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Design Principles
   ═══════════════════════════════════════════════════════════════ */

type Principle = {
  title: string;
  desc: string;
};

const PRINCIPLES: Principle[] = [
  {
    title: "Write Once, Prove Anywhere",
    desc: "Programs target a single specification. The cryptographic backend is the embedder's concern, not the developer's.",
  },
  {
    title: "Standard Computation Model",
    desc: "Built on WebAssembly — a formally specified, language-independent VM with structured control flow.",
  },
  {
    title: "Deterministic",
    desc: "Two conforming embedders always produce the same result for the same module and inputs.",
  },
  {
    title: "Minimal Surface Area",
    desc: "The core spec defines what, not how. Embedders are free to implement the semantics however they choose.",
  },
];

function DesignPrinciples() {
  return (
    <section className={`${styles.section} ${styles.sectionCenter}`}>
      <div className={styles.sectionInner}>
        <h2 className={styles.sectionTitle}>Design Principles</h2>
        <p className={styles.sectionSubtitle}>
          Separate what the computation does from how it is securely
          implemented.
        </p>
        <div className={styles.principleGrid}>
          {PRINCIPLES.map((p, i) => (
            <div key={i} className={styles.principleCard}>
              <h3 className={styles.principleTitle}>{p.title}</h3>
              <p className={styles.principleDesc}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════════════════════ */

export default function Home(): ReactNode {
  return (
    <Layout
      title="Home"
      description="An open specification for two-party verifiable computation, layered on WebAssembly"
    >
      <Hero />
      <main>
        <Features />
        <Architecture />
        <DesignPrinciples />
      </main>
    </Layout>
  );
}
