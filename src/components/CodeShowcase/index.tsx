import React from "react";
import CodeBlock from "@theme/CodeBlock";
import styles from "./styles.module.css";

const guestCode = `#[vc::export]
fn assert_age(credential: &[u8], issuer_key: &[u8], min_age: u32, country: &[u8]) {
    let id: Identity = parse_json(credential);

    // Only success or failure is revealed
    // Birthdate and address stay private
    assert!(id.verify_signature(issuer_key));
    assert!(id.age() >= min_age && id.country() == country);
}`;

const proverCode = `let instance = Instance::new(&module);

let result = instance.assert_age()
    .credential(Private(my_credential))
    .issuer_key(Public(ISSUER_KEY))
    .min_age(Public(18))
    .country(Public(b"US"))
    .invoke()?;

assert!(result.success());`;

const verifierCode = `let instance = Instance::new(&module);

let result = instance.assert_age()
    .credential(Blind)
    .issuer_key(Public(ISSUER_KEY))
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
