const XLSX = require('xlsx');
const workbook = XLSX.readFile('c:/Users/NILE/Desktop/random-name-master/random-name-master/admin/template-onboarding-template.xlsx');
console.log('SheetNames:', workbook.SheetNames);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
console.log('First Sheet Headers:', XLSX.utils.sheet_to_json(sheet, {header:1})[0]);
