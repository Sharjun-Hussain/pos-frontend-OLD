const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDir = path.join(__dirname, 'src/components/reports');

// Recursively get all .jsx files
function getFiles(dir, filesList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    // Ignore MainReportPage since we just fixed it
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, filesList);
    } else if (fullPath.endsWith('.jsx') && !fullPath.includes('MainReportPage.jsx')) {
      filesList.push(fullPath);
    }
  }
  return filesList;
}

const files = getFiles(targetDir);

// Mapping of replacements
const replacements = [
  // Generic background replacements
  { regex: /bg-slate-50(\/30)?(?!\s*dark:)/g, replacement: 'bg-slate-50$1 dark:bg-slate-800/50' },
  { regex: /bg-slate-100(\/50)?(?!\s*dark:)/g, replacement: 'bg-slate-100$1 dark:bg-slate-800' },
  
  // Color badge and highlight replacements
  { regex: /bg-emerald-50(\/30)?(?!\s*dark:)/g, replacement: 'bg-emerald-50$1 dark:bg-emerald-500/10' },
  { regex: /text-emerald-700(?!\s*dark:)/g, replacement: 'text-emerald-700 dark:text-emerald-400' },
  { regex: /text-emerald-600(?!\s*dark:)/g, replacement: 'text-emerald-600 dark:text-emerald-500' },
  { regex: /border-emerald-100(?!\s*dark:)/g, replacement: 'border-emerald-100 dark:border-emerald-500/20' },
  
  { regex: /bg-amber-50(\/30)?(?!\s*dark:)/g, replacement: 'bg-amber-50$1 dark:bg-amber-500/10' },
  { regex: /text-amber-700(?!\s*dark:)/g, replacement: 'text-amber-700 dark:text-amber-400' },
  { regex: /text-amber-600(?!\s*dark:)/g, replacement: 'text-amber-600 dark:text-amber-500' },
  { regex: /border-amber-200(?!\s*dark:)/g, replacement: 'border-amber-200 dark:border-amber-500/20' },
  { regex: /border-amber-100(?!\s*dark:)/g, replacement: 'border-amber-100 dark:border-amber-500/20' },
  
  { regex: /bg-purple-50(\/30)?(?!\s*dark:)/g, replacement: 'bg-purple-50$1 dark:bg-purple-500/10' },
  { regex: /text-purple-700(?!\s*dark:)/g, replacement: 'text-purple-700 dark:text-purple-400' },
  { regex: /border-purple-100(?!\s*dark:)/g, replacement: 'border-purple-100 dark:border-purple-500/20' },
  
  { regex: /bg-red-50(\/30)?(?!\s*dark:)/g, replacement: 'bg-red-50$1 dark:bg-red-500/10' },
  { regex: /text-red-700(?!\s*dark:)/g, replacement: 'text-red-700 dark:text-red-400' },
  { regex: /border-red-100(?!\s*dark:)/g, replacement: 'border-red-100 dark:border-red-500/20' },
  
  { regex: /bg-blue-50(\/30)?(?!\s*dark:)/g, replacement: 'bg-blue-50$1 dark:bg-blue-500/10' },
  { regex: /text-blue-700(?!\s*dark:)/g, replacement: 'text-blue-700 dark:text-blue-400' },
  { regex: /border-blue-100(?!\s*dark:)/g, replacement: 'border-blue-100 dark:border-blue-500/20' },

  { regex: /bg-green-50(\/30)?(?!\s*dark:)/g, replacement: 'bg-green-50$1 dark:bg-green-500/10' },
  { regex: /text-green-700(?!\s*dark:)/g, replacement: 'text-green-700 dark:text-green-400' },
  { regex: /border-green-100(?!\s*dark:)/g, replacement: 'border-green-100 dark:border-green-500/20' },

  // Add borders and text to popover filters where missing
  { regex: /bg-white(?!\s*\/?\d*)?(?!\s*dark:)/g, replacement: 'bg-white dark:bg-slate-900' },

  // Recharts specific
  { regex: /backgroundColor:\s*'#fff'/g, replacement: "backgroundColor: 'hsl(var(--card))'" },
  { regex: /border:\s*'1px solid #e2e8f0'/g, replacement: "border: '1px solid hsl(var(--border))'" },
  { regex: /stroke="#e2e8f0"/g, replacement: 'stroke="hsl(var(--border))"' },
  { regex: /stroke="#94a3b8"/g, replacement: 'stroke="hsl(var(--muted-foreground))"' },
  { regex: /stroke="#64748b"/g, replacement: 'stroke="hsl(var(--muted-foreground))"' },
  { regex: /fill="#64748b"/g, replacement: 'fill="hsl(var(--muted-foreground))"' },
  { regex: /backgroundColor:\s*'#ffffff'/g, replacement: "backgroundColor: 'hsl(var(--background))'" },
  { regex: /color:\s*'#334155'/g, replacement: "color: 'hsl(var(--foreground))'" },
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  let originalContent = content;

  for (const { regex, replacement } of replacements) {
    content = content.replace(regex, replacement);
  }

  // Also fix `<div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0">` cases
  // Actually wait, bg-emerald-500 is fine, bg-emerald-600 etc. are used for bar charts or badges.

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}
