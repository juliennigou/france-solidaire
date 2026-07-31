import assert from "node:assert/strict";
import test from "node:test";
import {
  escapeHtml,
  hashToken,
  randomToken,
  safeTokenEquals,
} from "../lib/security";

test("les jetons sont aléatoires et comparés via leur empreinte", () => {
  const first = randomToken();
  const second = randomToken();
  assert.notEqual(first, second);
  assert.equal(safeTokenEquals(first, hashToken(first)), true);
  assert.equal(safeTokenEquals(second, hashToken(first)), false);
});

test("le contenu injecté dans les emails est échappé", () => {
  assert.equal(
    escapeHtml(`<script>alert("x")</script>`),
    "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
  );
});
