# Bean Sprout Realty — Client Files (Netlify Blobs)

A client/admin file-sharing app with real per-client accounts. Admin uploads
and assigns files to a specific client; each client only sees their own
files after logging in.

## What's in here

```
netlify.toml                     → routing rules
package.json                     → declares the @netlify/blobs dependency
netlify/functions/
  files-list.js                  → GET: file metadata (filtered by client)
  files-upload.js                → POST: stores a file, assigned to a client (admin only)
  files-download.js              → GET: streams a file back (ownership-checked)
  files-delete.js                → POST: removes a file (admin only)
  clients-list.js                 → GET: list of clients (admin only)
  clients-create.js               → POST: create a new client login (admin only)
  clients-delete.js               → POST: remove a client login (admin only)
  auth-login.js                  → POST: admin password OR client username+password
  auth-check.js                  → GET: is the current cookie valid for this role?
  auth-logout.js                 → POST: clears the cookie for a role
  utils/auth.js                  → shared token signing/verification (not a public endpoint)
  utils/password.js              → password hashing helpers (not a public endpoint)
public/
  admin.html                     → client management + upload + full file list (admin only)
  client.html                    → the logged-in client's own files, read-only
  login.html                     → admin login (password only)
  client-login.html              → client login (username + password)
```

## How client accounts work

There's no default client account anymore. Clients are created by the admin,
from inside the admin page itself:

1. Log in at `/login` with `ADMIN_PASSWORD` (see below)
2. Open the **Manage Clients** panel at the top of `/admin`
3. Add a client: name, username, password
4. That client can now log in at `/client-login` and will only see files
   you've uploaded and assigned to them

When uploading, use the search box above the upload area to find and select
which client the file belongs to — the upload is disabled until a client is
selected.

## Set the admin password (required)

Set this environment variable on your Netlify site
(**Project configuration → Environment variables**), then redeploy:

| Variable | Purpose |
|---|---|
| `ADMIN_PASSWORD` | Password for `/login` (the only admin credential) |
| `SESSION_SECRET` | (Optional but recommended) any random long string, used to sign login cookies. Falls back to `ADMIN_PASSWORD` if omitted. |

**Suggested test value** — use this to verify everything works, then change
it before this touches a real deployment:

```
ADMIN_PASSWORD  = BeanSprout-Admin-Test-01
SESSION_SECRET  = a-long-random-string-change-this-later
```

Client credentials are **not** environment variables — they live in the
client directory (Netlify Blobs) and are created through the admin UI as
described above.

## Deploy it

**Option A — Netlify CLI (fastest for testing)**
```bash
npm install
npx netlify-cli dev
```
Runs locally at `http://localhost:8888`. Note: the login cookies are marked
`Secure`, which requires HTTPS — local HTTP testing may not let login
persist. Test on the deployed HTTPS URL if login seems to silently fail.

**Option B — Connect to Git (recommended for production)**
1. Push this folder (unzipped, not as a zip) to a GitHub/GitLab repo.
2. In Netlify: **Add new site → Import an existing project** → pick the repo.
3. Build settings come from `netlify.toml` automatically.
4. Deploy. Netlify installs `@netlify/blobs` from `package.json` and
   provisions Blobs storage automatically.

**Option C — Drag-and-drop**
Doesn't work here — this project has server-side functions and a
dependency that needs installing, which drag-and-drop deploy skips. Use
Option A or B.

## URLs once deployed

- `https://your-site.netlify.app/admin` → admin (redirects to `/login` if not signed in)
- `https://your-site.netlify.app/` → client view (redirects to `/client-login` if not signed in)
- `https://your-site.netlify.app/login` → admin login
- `https://your-site.netlify.app/client-login` → client login

## Notes

- **Admin is a single shared password.** Clients each get their own
  username/password, created via the admin panel.
- **Removing a client** deletes their login but leaves their files in
  storage (now showing as "Unassigned" to admin) — nothing gets silently
  deleted.
- **5MB per file** limit, enforced both in the browser and in the
  `files-upload` function.
- Login cookies expire after 8 hours.
- All files live in a single Blobs store named `client-files`; client
  accounts live in a separate store named `clients-directory`. Passwords
  are hashed (PBKDF2) before being stored — never stored in plain text.
- **Local testing note:** login cookies require HTTPS (`Secure` flag) — if
  `netlify dev` serves over plain HTTP, test on the deployed URL instead.
