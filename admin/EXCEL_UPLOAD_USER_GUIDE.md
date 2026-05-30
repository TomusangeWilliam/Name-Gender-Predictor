# Excel Upload - Quick User Guide

## How to Import Data from Excel

### Step 1: Navigate to Bulk Import
1. Open the PayCode Hub page
2. Click on the **"Bulk Import"** tab at the top

### Step 2: Upload Your Excel File
1. Click the **"Choose Excel File"** button
2. Select your Excel file (.xlsx or .xls format)
3. The system will automatically detect and display the file name

### Step 3: Review Preview
- A preview table will show the first 50 rows of extracted data
- Check that the names and codes are correctly extracted
- The system extracts these fields:
  - ✅ First Name (required)
  - ✅ Last Name (required)
  - ✅ Middle Name (optional)
  - ✅ School Pay Code (optional)

### Step 4: Confirm Import
- If the preview looks correct, click **"Confirm & Import"**
- The system will replace all existing data with the imported rows
- You'll be automatically switched to the "View & Edit" tab

### Step 5: Verify Data
- Review the imported data in the table
- Check the statistics at the top (Total Records, With PayCodes, Pending Codes)
- Edit any cells if needed by double-clicking

---

## Supported Excel Formats

✅ **Accepted Formats:**
- `.xlsx` (Excel 2007+)
- `.xls` (Excel 97-2003)

❌ **Not Supported:**
- CSV files (use the paste area instead)
- Google Sheets (download as .xlsx first)
- Other spreadsheet formats

---

## Required Column Headers

Your Excel file must have column headers. The system recognizes these variations:

### First Name (Required)
Recognized headers: `First Name`, `FirstName`, `first_name`, `fname`

### Last Name (Required)
Recognized headers: `Last Name`, `LastName`, `last_name`, `lname`, `Surname`

### Middle Name (Optional)
Recognized headers: `Middle Name`, `MiddleName`, `middle_name`, `mname`, `Middle Initial`

### School Pay Code (Optional)
Recognized headers: `School Pay Code`, `PayCode`, `pay_code`, `Pay Code`, `Code`

**Note:** Header matching is case-insensitive, so "FIRST NAME" works the same as "First Name".

---

## Example Excel Structure

| First Name | Last Name | Middle Name | School Pay Code |
|------------|-----------|-------------|-----------------|
| John       | Doe       | Michael     | 1234567890      |
| Jane       | Smith     |             | 0987654321      |
| Robert     | Johnson   | Lee         |                 |

**Important:** 
- Column order doesn't matter - the system finds them by header name
- Extra columns are ignored
- Empty rows are skipped automatically

---

## Common Issues & Solutions

### ❌ "Invalid file format"
**Problem:** File is not an Excel file  
**Solution:** Ensure file extension is .xlsx or .xls. Don't rename CSV files to .xlsx.

### ❌ "Could not find required columns"
**Problem:** Excel file missing "First Name" or "Last Name" headers  
**Solution:** Add proper column headers to your Excel file using one of the recognized names listed above.

### ❌ "Excel file is empty"
**Problem:** File has no data rows  
**Solution:** Make sure there's at least one row of data below the headers.

### ❌ "No valid data found"
**Problem:** All rows are empty or contain only numbers  
**Solution:** Ensure rows contain actual text in the First Name or Last Name columns.

### ⚠️ Preview shows wrong data
**Problem:** Data appears jumbled or incorrect  
**Solution:** 
- Check that your Excel file uses the first sheet (tab)
- Verify headers are in row 1
- Remove any merged cells or complex formatting

---

## Tips for Best Results

### ✅ Do:
- Use clear, simple column headers
- Keep data in the first worksheet/tab
- Remove blank rows between data
- Save file before uploading
- Use standard Excel formatting

### ❌ Don't:
- Use merged cells in data rows
- Include images or charts in the data range
- Use formulas in cells (convert to values first)
- Password-protect the Excel file
- Use multiple sheets (only first sheet is read)

---

## Alternative: Paste Method

If you're having trouble with Excel upload, you can also:
1. Copy data from Excel
2. Paste it into the text area below the upload section
3. Select the format (Last, First or First, Last)
4. Click "Process & Replace"

This method works well for smaller datasets.

---

## Need Help?

If you continue experiencing issues:
1. Try opening the test page: `test_excel_upload.html`
2. Check browser console for error messages (F12 → Console)
3. Verify your Excel file matches the example structure
4. Contact support with your Excel file attached

---

## Keyboard Shortcuts

- **Ctrl + O**: Open file dialog (when on Bulk Import tab)
- **Esc**: Cancel import preview
- **Tab**: Navigate between buttons

---

*Last updated: May 2026*
