const fs = require('fs');
const path = require('path');

const dir = 'frontend/src/pages/admin';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

const mappings = [
    { from: /text-slate-800/g, to: 'text-gray-800 dark:text-white/90' },
    { from: /text-slate-700/g, to: 'text-gray-700 dark:text-gray-300' },
    { from: /text-slate-600/g, to: 'text-gray-600 dark:text-gray-400' },
    { from: /text-slate-500/g, to: 'text-gray-500 dark:text-gray-400' },
    { from: /text-slate-400/g, to: 'text-gray-400 dark:text-gray-500' },
    { from: /bg-slate-50/g, to: 'bg-gray-50 dark:bg-gray-800/50' },
    { from: /bg-slate-100/g, to: 'bg-gray-100 dark:bg-gray-800' },
    { from: /bg-slate-200/g, to: 'bg-gray-200 dark:bg-gray-700' },
    { from: /border-slate-100/g, to: 'border-gray-100 dark:border-gray-800' },
    { from: /border-slate-200/g, to: 'border-gray-200 dark:border-gray-800' },
    { from: /border-slate-300/g, to: 'border-gray-300 dark:border-gray-700' },
    { from: /bg-primary\/10/g, to: 'bg-brand-500/10' },
    { from: /bg-primary\/5/g, to: 'bg-brand-500/5' },
    { from: /bg-primary/g, to: 'bg-brand-500' },
    { from: /text-primary\/80/g, to: 'text-brand-500/80' },
    { from: /text-primary/g, to: 'text-brand-500' },
    { from: /border-primary/g, to: 'border-brand-500' },
    { from: /ring-primary/g, to: 'ring-brand-500' },
    { from: /focus:ring-primary/g, to: 'focus:ring-brand-500' },
    { from: /focus:border-primary/g, to: 'focus:border-brand-500' },
    { from: /hover:bg-primary\/90/g, to: 'hover:bg-brand-600' },
    { from: /text-red-600/g, to: 'text-error-600 dark:text-error-500' },
    { from: /text-red-500/g, to: 'text-error-500 dark:text-error-400' },
    { from: /text-red-800/g, to: 'text-error-800 dark:text-error-400' },
    { from: /bg-red-50/g, to: 'bg-error-50 dark:bg-error-500/10' },
    { from: /bg-red-100/g, to: 'bg-error-100 dark:bg-error-500/20' },
    { from: /border-red-200/g, to: 'border-error-200 dark:border-error-800' },
    { from: /hover:text-red-800/g, to: 'hover:text-error-700 dark:hover:text-error-400' },
    { from: /text-green-600/g, to: 'text-success-600 dark:text-success-500' },
    { from: /text-green-700/g, to: 'text-success-700 dark:text-success-400' },
    { from: /text-green-800/g, to: 'text-success-800 dark:text-success-400' },
    { from: /bg-green-50/g, to: 'bg-success-50 dark:bg-success-500/10' },
    { from: /bg-green-100/g, to: 'bg-success-100 dark:bg-success-500/20' },
    { from: /border-green-200/g, to: 'border-success-200 dark:border-success-800' },
    { from: /text-amber-500/g, to: 'text-warning-500 dark:text-warning-400' },
    { from: /text-amber-700/g, to: 'text-warning-700 dark:text-warning-400' },
    { from: /bg-amber-50/g, to: 'bg-warning-50 dark:bg-warning-500/10' },
    { from: /border-amber-200/g, to: 'border-warning-200 dark:border-warning-800' },
    { from: /text-blue-500/g, to: 'text-blue-light-500 dark:text-blue-light-400' },
    { from: /text-blue-600/g, to: 'text-blue-light-600 dark:text-blue-light-500' },
    { from: /text-blue-700/g, to: 'text-blue-light-700 dark:text-blue-light-400' },
    { from: /bg-blue-50/g, to: 'bg-blue-light-50 dark:bg-blue-light-500/10' },
    { from: /border-blue-200/g, to: 'border-blue-light-200 dark:border-blue-light-800' },
    { from: /hover:text-blue-800/g, to: 'hover:text-blue-light-700 dark:hover:text-blue-light-400' },
    { from: /divide-slate-100/g, to: 'divide-gray-100 dark:divide-gray-800' },
    { from: /shadow-sm/g, to: 'shadow-theme-xs' },
    { from: /bg-white/g, to: 'bg-white dark:bg-gray-900' }
];

files.forEach(f => {
    if (f === 'AdminDashboard.jsx' || f === 'TeamManagement.jsx' || f === 'SiteManagement.jsx') return;
    
    let content = fs.readFileSync(path.join(dir, f), 'utf-8');
    
    mappings.forEach(m => {
        content = content.replace(m.from, m.to);
    });

    fs.writeFileSync(path.join(dir, f), content);
    console.log('Updated ' + f);
});
