import React from "react";
import CodeBlock from "@theme/CodeBlock";
import styles from "./styles.module.css";

const guestCode = `#[vc::export]
fn assert_age(credential: &[u8], issuer_key: &[u8], min_age: u32, country: &[u8]) {
    let id: Identity = parse_json(credential);

    let is_valid_credential = id.verify_signature(issuer_key);
    let is_min_age = id.age() >= min_age;
    let is_in_country = id.country() == country;

    assert!(is_valid_credential && is_min_age && is_in_country);
}`;

const proverCode = `let instance = Instance::new(&module);

let result = instance.assert_age()
    .credential(Private(my_credential))  // Credential is hidden.
    .issuer_key(Public(ISSUER_KEY))      // Both parties agree on public inputs.
    .min_age(Public(18))
    .country(Public(b"US"))
    .invoke()?;

assert!(result.success());`;

const verifierCode = `let instance = Instance::new(&module);

let result = instance.assert_age()
    .credential(Blind)
    .issuer_key(Public(ISSUER_KEY))      // Both parties agree on public inputs.
    .min_age(Public(18))
    .country(Public(b"US"))
    .invoke()?;

assert!(result.success());`;

export default function CodeShowcase() {
  return (
    <div className={styles.container}>
      <div className={styles.pane}>
        <div className={styles.label}>Guest</div>
        <div className={styles.codeWrapper}>
          <CodeBlock language="rust">{guestCode}</CodeBlock>
        </div>
      </div>
      <div className={styles.pane}>
        <div className={styles.label}>Prover</div>
        <div className={styles.codeWrapper}>
          <CodeBlock language="rust">{proverCode}</CodeBlock>
        </div>
      </div>
      <div className={styles.pane}>
        <div className={styles.label}>Verifier</div>
        <div className={styles.codeWrapper}>
          <CodeBlock language="rust">{verifierCode}</CodeBlock>
        </div>
      </div>
    </div>
  );
}
