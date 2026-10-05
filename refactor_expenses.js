const fs = require('fs');

const filePath = 'c:\\xampp\\htdocs\\harshit_invoice_website\\frontend\\src\\pages\\admin\\AdminExpenses.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove status Filter State
content = content.replace(/const \[statusFilter, setStatusFilter\] = useState\('ALL'\);\s*\n/g, '');

// 2. Remove states extraction and replace with INDIAN_STATES
content = content.replace(/const \[states, setStates\] = useState\(\[\]\);\s*\n/g, '');
content = content.replace(/import React, { useState, useEffect } from 'react';/, `import React, { useState, useEffect } from 'react';\n\nconst INDIAN_STATES = [\n    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", \n    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", \n    "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", \n    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",\n    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", \n    "Delhi", "Lakshadweep", "Puducherry", "Ladakh", "Jammu and Kashmir"\n];\n`);

// Remove setStates from fetchExpenses
content = content.replace(/setStates\(\[\.\.\.new Set\(res\.data\.map\(e => e\.state\)\.filter\(Boolean\)\)\]\);\s*\n/g, '');

// 3. Remove handleUpdateStatus
content = content.replace(/const handleUpdateStatus = async \(id, status\) => \{[\s\S]*?\};\s*\n/g, '');

// 4. Remove matchesStatus from filter
content = content.replace(/const matchesStatus = statusFilter === 'ALL' \|\| exp\.status === statusFilter;\s*\n/g, '');
content = content.replace(/return matchesSearch && matchesStatus && matchesTeam && matchesState;/g, 'return matchesSearch && matchesTeam && matchesState;');

// 5. Remove getStatusIcon
content = content.replace(/const getStatusIcon = \(status\) => \{[\s\S]*?\};\s*\n/g, '');

// 6. Remove tabs
content = content.replace(/<div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg shrink-0 w-full sm:w-auto">[\s\S]*?<\/div>/, '');

// 7. Update states mapping in dropdown
content = content.replace(/\{states\.map\(s => <option key=\{s\} value=\{s\}>\{s\}<\/option>\)\}/g, '{INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}');

// 8. Remove status column from table header
content = content.replace(/<th className="px-2 py-2 md:px-6 md:py-4 text-center">Status<\/th>\s*\n/g, '');

// 9. Remove status column from table body
content = content.replace(/<td className="px-2 py-2 md:px-6 md:py-4 text-center">\s*<span className={`inline-flex items-center[\s\S]*?<\/td>\s*\n/g, '');

// 10. Update ID display
content = content.replace(/ID: \{exp\.emp_code\}/g, 'Emp ID: {exp.emp_code} | Exp ID: #{exp.id.toString(16).toUpperCase()}');
content = content.replace(/<p className="text-sm text-gray-500 dark:text-gray-400">ID: \{selectedExpense\.emp_code\}<\/p>/g, '<p className="text-sm text-gray-500 dark:text-gray-400">Emp ID: {selectedExpense.emp_code} | Exp ID: #{selectedExpense.id.toString(16).toUpperCase()}</p>');

// 11. Remove Status display in Modal
content = content.replace(/<div>\s*<p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Status<\/p>\s*<span className={`inline-flex items-center[\s\S]*?<\/span>\s*<\/div>\s*\n/g, '');

// Make sure grid-cols-2 is adjusted in modal if needed. It was grid-cols-2 for 4 items, now it's 3 items. I can leave it.

fs.writeFileSync(filePath, content, 'utf8');
console.log("Replacements done!");
