import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Zero-Knowledge Proofs',
    description: (
      <>
        Prove computation correctness without revealing private inputs.
        The verifier learns nothing beyond the validity of the computation.
      </>
    ),
  },
  {
    title: 'Two-Party Computation',
    description: (
      <>
        Jointly compute over private inputs from two mutually distrusting parties.
        Neither party learns the other's private data.
      </>
    ),
  },
  {
    title: 'WebAssembly Native',
    description: (
      <>
        Write programs in Rust, C, or any language that compiles to Wasm.
        No modifications to the core VM specification.
      </>
    ),
  },
];

function Feature({title, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md padding-vert--lg">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
