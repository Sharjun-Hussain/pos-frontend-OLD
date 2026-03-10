const fs = require('fs');
const path = require('path');

const files = [
  'src/app/(system)/reports/customer/history/page.jsx',
  'src/app/(system)/reports/purchase/supplier-performance/page.jsx',
  'src/app/(system)/reports/sales/profit-loss/page.jsx',
  // tax is already mostly updated, but let's run it just in case any were missed
  'src/app/(system)/reports/stocks/current-value/page.jsx',
  'src/app/(system)/reports/stocks/low-stock/page.jsx'
];

const replacements = [
  // Generic background replacements
  { regex: /bg-slate-50(\/30)?(?!\s*dark:)/g, replacement: 'bg-slate-50$1 dark:bg-slate-800/50' },
  { regex: /bg-slate-100(\/50)?(?!\s*dark:)/g, replacement: 'bg-slate-100$1 dark:bg-slate-800' },
  { regex: /text-slate-900(?!\s*dark:)/g, replacement: 'text-slate-900 dark:text-slate-200' },
  { regex: /text-slate-800(?!\s*dark:)/g, replacement: 'text-slate-800 dark:text-slate-300' },
  { regex: /text-slate-500(?!\s*dark:)/g, replacement: 'text-slate-500 dark:text-slate-400' },
  
  // Color badge and highlight replacements
  { regex: /bg-emerald-50(\/30)?(?!\s*dark:)/g, replacement: 'bg-emerald-50$1 dark:bg-emerald-500/10' },
  { regex: /text-emerald-700(?!\s*dark:)/g, replacement: 'text-emerald-700 dark:text-emerald-400' },
  { regex: /text-emerald-600(?!\s*dark:)/g, replacement: 'text-emerald-600 dark:text-emerald-500' },
  
  { regex: /bg-amber-50(\/30)?(?!\s*dark:)/g, replacement: 'bg-amber-50$1 dark:bg-amber-500/10' },
  { regex: /bg-amber-100(\/50)?(?!\s*dark:)/g, replacement: 'bg-amber-100$1 dark:bg-amber-500/20' },
  { regex: /text-amber-700(?!\s*dark:)/g, replacement: 'text-amber-700 dark:text-amber-400' },
  { regex: /text-amber-600(?!\s*dark:)/g, replacement: 'text-amber-600 dark:text-amber-500' },
  
  { regex: /bg-purple-50(\/30)?(?!\s*dark:)/g, replacement: 'bg-purple-50$1 dark:bg-purple-500/10' },
  { regex: /bg-red-50(\/30)?(?!\s*dark:)/g, replacement: 'bg-red-50$1 dark:bg-red-500/10' },
  { regex: /bg-blue-50(\/30)?(?!\s*dark:)/g, replacement: 'bg-blue-50$1 dark:bg-blue-500/10' },

  { regex: /bg-white(?!\s*\/?\d*)?(?!\s*dark:)/g, replacement: 'bg-white dark:bg-slate-900' },
  { regex: /border-slate-200(?!\s*dark:)/g, replacement: 'border-slate-200 dark:border-slate-800' },
  { regex: /border-slate-100(?!\s*dark:)/g, replacement: 'border-slate-100 dark:border-slate-800' },
  { regex: /border-b(?!-)(?!\s*dark:)/g, replacement: 'border-b dark:border-slate-800' },
];

for (const file of files) {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) continue;
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  let originalContent = content;

  for (const { regex, replacement } of replacements) {
    content = content.replace(regex, replacement);
  }

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${file}`);
  }
}
