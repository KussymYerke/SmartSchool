// Friendly Node version guard for Vite 7.
// Vite requires Node 20.19+ or 22.12+. Node 21.x is NOT supported.

const v = process.versions.node; // e.g. "21.5.0"
const [major, minor, patch] = v.split('.').map((x) => Number(x));

function fail(msg) {
  console.error("\n\x1b[31m[Node version error]\x1b[0m " + msg);
  console.error(
    "\nInstall an allowed Node version and retry:\n" +
      "  - recommended: Node 22.12+ (LTS)\n" +
      "  - also ok:      Node 20.19+\n" +
      "\nIf you use nvm:\n" +
      "  nvm install 22.12.0\n" +
      "  nvm use 22.12.0\n"
  );
  process.exit(1);
}

const is20ok = major === 20 && (minor > 19 || (minor === 19 && patch >= 0));
const is22ok = major === 22 && (minor > 12 || (minor === 12 && patch >= 0));
const isNewerOk = major > 22; // future-proof

if (major === 21) {
  fail(
    `You are using Node.js ${v}. Vite 7 does not support Node 21.x. Please use Node 20.19+ or 22.12+.`
  );
}

if (!is20ok && !is22ok && !isNewerOk) {
  fail(
    `You are using Node.js ${v}. This project expects Node 20.19+ or 22.12+.`
  );
}
