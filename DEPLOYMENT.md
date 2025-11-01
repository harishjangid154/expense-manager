# Deployment Guide - GitHub Pages

This Next.js application is configured for static export and can be deployed to GitHub Pages.

## Build Configuration

The app is configured for static export in `next.config.js`:
- `output: 'export'` - Enables static export
- `trailingSlash: true` - Required for GitHub Pages routing
- `images.unoptimized: true` - Required for static export

## Building Locally

```bash
# Install dependencies
yarn install

# Build static site
yarn build

# Output will be in the `out` folder
```

## GitHub Pages Deployment

### Automatic Deployment (Recommended)

The project includes a GitHub Actions workflow (`.github/workflow/deploy-pages.yml`) that automatically deploys to GitHub Pages on push to `main` branch.

**Steps:**
1. Push your code to GitHub
2. Go to your repository Settings > Pages
3. Under "Source", select "GitHub Actions"
4. The workflow will automatically build and deploy on each push

### Manual Deployment

1. Build the static site:
   ```bash
   yarn build
   ```

2. The static files will be in the `out` folder

3. You can:
   - Push the `out` folder to a `gh-pages` branch, OR
   - Use GitHub Actions (see automatic deployment above)

## Important Notes

- **IndexedDB**: All data is stored locally in the browser's IndexedDB. No backend server required.
- **Client-Side Only**: The app uses `'use client'` components, so everything runs in the browser.
- **Static Export**: All pages are pre-rendered at build time as static HTML.
- **No API Routes**: This is a fully static site with no server-side code.

## Troubleshooting

### Build Fails
- Check that all components are client components (`'use client'`)
- Ensure no server-side APIs are used
- Check `next.config.js` has `output: 'export'`

### Pages Not Loading
- Make sure `trailingSlash: true` is set in `next.config.js`
- Check that GitHub Pages is using the correct branch/folder

### IndexedDB Issues
- IndexedDB only works in browsers, not during build
- All IndexedDB calls are properly guarded with `typeof window !== 'undefined'`

