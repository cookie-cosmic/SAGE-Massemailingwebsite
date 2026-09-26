# SAGE Mass Emailing Website

SAGE Mass Emailing Website is a static React dashboard for finding and selecting publicly available institutional school contacts within a geographic radius. It is designed for internal SAGE operations and supports elementary, middle, high school, and college/university categories.

## Features

- SHA-256 client-side password gate and logout
- Interactive OpenStreetMap/Leaflet map with a cursor-positioned search circle
- Radius controlled by map zoom or the radius slider (0.25–50 miles)
- Haversine distance search with bounding-box prefiltering
- School-type multi-select filters, grouped result cards, and marker popups
- Individual and bulk selection with duplicate-free email collection
- Clipboard, CSV, and TXT exports
- Responsive mobile results layout

## Installation and development

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The static demo password is `SAGEAdweikRohan@1234`.

## Build and preview

```bash
npm run build
npm run preview
```

There is no separate lint or test script in this initial Vite project. To verify a change, run `npm run build`; it performs the TypeScript check and production build.

## Data and environment variables

The current adapter is [src/data/schools.ts](./src/data/schools.ts), which contains public institutional examples from official Dallas ISD and university pages so the interface works offline without exposing student or parent information. Replace it with an official education dataset or approved API integration before operational use. Keep school location data separate from public contact data, and only include institutional addresses published by the institution or an official dataset. Never add student, parent, private-personal, or consumer email addresses.

Copy `.env.example` to `.env` when adding an approved data endpoint. `VITE_SCHOOL_DATA_URL` is reserved for that integration. Do not commit `.env` or API keys.

## Authentication limitation

GitHub Pages is static hosting. The password gate is a reasonable client-side access barrier and stores a SHA-256 digest rather than plaintext in the UI, but it is **not secure server authentication**: users who can inspect the deployed JavaScript can bypass it. Use a server-backed identity provider and authorization layer for sensitive or production data.

## GitHub Pages deployment

The repository is configured for the `/SAGE-Massemailingwebsite/` base path. Push the project to that repository and enable GitHub Pages with **GitHub Actions** as the source. The workflow in `.github/workflows/deploy.yml` installs dependencies, builds `dist/`, and deploys it to Pages.

## Usage

1. Sign in.
2. Move the pointer over the map to position the search area. Zoom or use the radius slider to set its size.
3. Press **Enter** or click **Search Area**. The search runs once, not continuously.
4. Adjust school-type filters, select cards, and copy or export the selected public contacts.

## Troubleshooting

- If the map is blank, check network access to OpenStreetMap tiles and browser console errors.
- If a search returns no records, move the circle over the sample Dallas area or increase the radius.
- If clipboard copy is unavailable, use the TXT export; clipboard APIs require a secure context in many browsers.
- If Pages assets 404, verify the repository name matches `SAGE-Massemailingwebsite` and that the Pages base path remains configured in `vite.config.ts`.
