const xlsx = require('xlsx'); 
const cb = xlsx.readFile('template-onboarding-template.xlsx'); 
console.log('Sheets:', cb.SheetNames);
const sheet = cb.Sheets[cb.SheetNames[0]];
console.log(xlsx.utils.sheet_to_json(sheet, {header: 1}).slice(0, 5));
