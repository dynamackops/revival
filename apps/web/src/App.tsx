import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@revival/contracts";

import { GitHubSignIn } from "./features/auth/GitHubSignIn";

export function App() {
  return (
    <main className="shell">
      <section className="terminal" aria-labelledby="revival-title">
        <p className="eyebrow">Digital Archaeology Lab</p>
        <h1 id="revival-title">{PRODUCT_NAME}</h1>
        <p className="tagline">{PRODUCT_TAGLINE}</p>
        <GitHubSignIn />
        <div className="status" role="status">
          <span aria-hidden="true" />
          Foundation systems online
        </div>
      </section>
    </main>
  );
}
