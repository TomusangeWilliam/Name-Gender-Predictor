# 🚀 Quick Start - Excel Upload Feature

## Get Started in 3 Steps

### 1️⃣ Open PayCode Hub
Navigate to: `admin/paycode.html`

### 2️⃣ Go to Bulk Import Tab
Click the **"Bulk Import"** tab at the top of the page

### 3️⃣ Upload Your Excel File
- Click **"Choose Excel File"** button
- Select your .xlsx or .xls file
- Review the preview
- Click **"Confirm & Import"**

That's it! Your data is now imported. ✅

---

## 📋 What Gets Extracted

The system automatically extracts these fields from your Excel file:

| Field | Required? | Example |
|-------|-----------|---------|
| First Name | ✅ Yes | John |
| Last Name | ✅ Yes | Doe |
| Middle Name | ❌ Optional | Michael |
| School Pay Code | ❌ Optional | 1234567890 |

---

## 🎯 Column Header Examples

Your Excel file needs headers in row 1. These are recognized:

**First Name:** `First Name`, `FirstName`, `first_name`, `fname`  
**Last Name:** `Last Name`, `LastName`, `last_name`, `lname`, `Surname`  
**Middle Name:** `Middle Name`, `MiddleName`, `middle_name`, `mname`  
**Pay Code:** `School Pay Code`, `PayCode`, `pay_code`, `Code`

*Case doesn't matter!* "FIRST NAME" works just fine.

---

## ⚡ Quick Tips

✅ **DO:**
- Use clear column headers
- Keep data on first sheet
- Remove blank rows
- Save file before upload

❌ **DON'T:**
- Use merged cells
- Include formulas (convert to values)
- Password-protect the file
- Rename CSV to .xlsx

---

## 🆘 Need Help?

**Problem:** Can't upload file  
**Solution:** Make sure it's .xlsx or .xls format

**Problem:** "Could not find required columns"  
**Solution:** Add "First Name" and "Last Name" headers

**Problem:** Preview looks wrong  
**Solution:** Check that data is on first sheet, headers in row 1

**Still stuck?**  
Open `test_excel_upload.html` to test your file separately.

---

## 📖 More Information

- **User Guide:** `EXCEL_UPLOAD_USER_GUIDE.md`
- **Technical Docs:** `EXCEL_UPLOAD_FEATURE.md`
- **Test Page:** `test_excel_upload.html`

---

*Ready to import? Just click "Choose Excel File" and go!* 🎉
