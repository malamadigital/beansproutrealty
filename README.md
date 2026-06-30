# Bean Sprout Realty — Client Files (Netlify Blobs)

A small client/admin file-sharing app. Files are stored in **Netlify Blobs**
(included in the free plan, 10 GB/month) via two serverless functions.

## What's in here

```
netlify.toml                     → tells Netlify where functions & pages live
package.json                     → declares the @netlify/blobs dependency
netlify/functions/
  files-list.js                  → GET: returns file metadata list
  files-upload.js                → POST: stores a file in Blobs (5MB limit)
  files-download.js              → GET: streams a file back for download
  files-delete.js                → POST: removes a file
public/
  admin.html                     → upload / manage files
  client.html                    → read-only view for the client
```

## Deploy it

**Option A — Netlify CLI (fastest for testing)**
```bash
npm install
npx netlify-cli dev
```
This runs everything locally at `http://localhost:8888`, with Blobs
emulated on disk. Visit `/admin` and `/` (client view).

**Option B — Connect to Git (recommended for production)**
1. Push this folder to a GitHub/GitLab repo.
2. In Netlify: **Add new site → Import an existing project** → pick the repo.
3. Build settings are already set via `netlify.toml` — no changes needed.
4. Deploy. Netlify auto-installs `@netlify/blobs` from `package.json` and
   provisions the Blobs store with zero configuration.

**Option C — Drag-and-drop**
Netlify's drag-and-drop deploy only works for static files, not functions.
Use Option A or B if you want the upload feature to actually work.

## URLs once deployed

- `https://your-site.netlify.app/admin` → admin upload page
- `https://your-site.netlify.app/` → client view

## Notes

- **No login/auth yet.** Anyone with the `/admin` URL can upload or delete
  files. Fine for an internal demo; for production you'd want to add
  Netlify Identity (or another auth method) in front of `/admin`.
- **5MB per file** limit is enforced both in the browser and in the
  `files-upload` function.
- All files for this app live in a single Blobs store named
  `client-files`. If you want this to scale to multiple clients later,
  the simplest change is to give each client a separate store name
  (e.g. `client-files-beansprout`, `client-files-eaassociates`).
