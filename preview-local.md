# Local Preview Guide

## Quick Start - Preview Locally

You can preview your changes locally without deploying to Vercel using one of these methods:

### Method 1: Using npm (Recommended)

1. **Install dependencies** (first time only):
   ```bash
   npm install
   ```

2. **Start local server**:
   ```bash
   npm run preview
   ```
   
   This will:
   - Start a local server on `http://localhost:8080`
   - Automatically open your browser
   - Serve all your HTML files

3. **Navigate to Settings**:
   - Go to `http://localhost:8080/settings.html`
   - You should now see the "Master Database" tab!

### Method 2: Using Python (No installation needed)

If you have Python installed:

```bash
# Python 3
python -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

Then open: `http://localhost:8080/settings.html`

### Method 3: Using Node.js http-server directly

```bash
npx http-server . -p 8080 -o
```

### Method 4: Using VS Code Live Server

If you use VS Code:
1. Install the "Live Server" extension
2. Right-click on `settings.html`
3. Select "Open with Live Server"

## Troubleshooting

- **Port already in use?** Change the port: `npm run preview -- -p 3000`
- **CORS issues?** Use: `npm run dev` (enables CORS)
- **Still seeing old version?** Hard refresh: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)

## Benefits of Local Preview

✅ Instant feedback - see changes immediately
✅ No deployment wait time
✅ Test before committing
✅ No Vercel rate limits
✅ Works offline

