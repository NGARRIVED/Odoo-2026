const fs = require('fs');
const glob = [
  'D:\\odoooo\\Odoo-2026\\features\\allocation-transfer\\backend\\index.js',
  'D:\\odoooo\\Odoo-2026\\features\\assets\\backend\\index.js',
  'D:\\odoooo\\Odoo-2026\\features\\audit\\backend\\index.js',
  'D:\\odoooo\\Odoo-2026\\features\\authentication\\backend\\index.js',
  'D:\\odoooo\\Odoo-2026\\features\\dashboard\\backend\\index.js',
  'D:\\odoooo\\Odoo-2026\\features\\landing-page\\backend\\index.js',
  'D:\\odoooo\\Odoo-2026\\features\\maintenance\\backend\\index.js',
  'D:\\odoooo\\Odoo-2026\\features\\notifications\\backend\\index.js',
  'D:\\odoooo\\Odoo-2026\\features\\organization-setup\\backend\\index.js',
  'D:\\odoooo\\Odoo-2026\\features\\reports-analytics\\backend\\index.js',
  'D:\\odoooo\\Odoo-2026\\features\\resource-booking\\backend\\index.js'
];
glob.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('module.exports = {}') || content.trim() === '') {
    fs.writeFileSync(f, "const express = require('express');\nconst router = express.Router();\nmodule.exports = router;");
  }
});
