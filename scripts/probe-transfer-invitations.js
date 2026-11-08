#!/usr/bin/env node

/**
 * Read-only probe: shows which account the sync token belongs to, what kind
 * of token it is, and which repository invitations are pending for it.
 *
 * Purpose: find out whether a repository transferred to the bot account shows
 * up as a pending repository invitation, which could then be accepted via the
 * API. This never accepts, declines or changes anything.
 */

const API = "https://api.github.com";

async function get(token, path) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "worlddriven-transfer-probe",
    },
  });
  const body = res.ok ? await res.json() : await res.text();
  return { res, body };
}

async function main() {
  const token = process.env.WORLDDRIVEN_GITHUB_TOKEN;
  if (!token) {
    console.log("WORLDDRIVEN_GITHUB_TOKEN is not set");
    process.exit(1);
  }

  const user = await get(token, "/user");
  console.log(`GET /user -> ${user.res.status}`);
  if (user.res.ok) {
    console.log(`login: ${user.body.login} (type ${user.body.type})`);
  }
  // Classic tokens report their scopes in this header; fine-grained tokens do not.
  const scopes = user.res.headers.get("x-oauth-scopes");
  console.log(
    scopes === null
      ? "token kind: no x-oauth-scopes header (fine-grained token or app token)"
      : `token kind: classic, scopes: ${scopes || "(none)"}`,
  );

  const inv = await get(token, "/user/repository_invitations?per_page=100");
  console.log(`GET /user/repository_invitations -> ${inv.res.status}`);
  if (!inv.res.ok) {
    console.log(String(inv.body).slice(0, 300));
    return;
  }

  let hidden = 0;
  for (const i of inv.body) {
    if (i.repository?.private) {
      hidden++;
      continue;
    }
    console.log(
      `- ${i.repository?.full_name} from ${i.inviter?.login}, ` +
        `permissions: ${i.permissions}, created: ${i.created_at}`,
    );
  }
  console.log(
    `pending invitations: ${inv.body.length} (${hidden} private, not listed)`,
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
