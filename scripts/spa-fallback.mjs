// GitHub Pages serves 404.html for unknown paths. Making it a copy of index.html
// lets the React router handle deep links like /app/tricks/123.
import { copyFileSync } from 'node:fs'
copyFileSync('dist/index.html', 'dist/404.html')
console.log('SPA fallback: dist/404.html created')
