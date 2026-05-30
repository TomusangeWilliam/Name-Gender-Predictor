# Smart PayCode Matcher - PDF Upload & Extraction Feature

## Overview

The Smart PayCode Matcher now supports **PDF file uploads** with automatic extraction of Payment Codes and Names. This feature intelligently parses PDF documents to identify payment codes (10-digit numbers) and associated names, then matches them against your existing table data using fuzzy matching algorithms.

## Features

### 1. PDF Upload Support
- Upload any PDF file containing payment codes and names
- Supports multi-page PDFs
- Automatic text extraction from PDF content
- Real-time preview of extracted data before matching

### 2. Intelligent Data Extraction
The system uses multiple pattern recognition strategies:

#### Pattern 1: Line-by-Line Detection
- Scans each line for 10-digit payment codes
- Extracts surrounding context to identify names
- Looks for capitalized words near payment codes

#### Pattern 2: Named Patterns
- Detects formats like: "John Doe Pay Code: 1234567890"
- Recognizes variations: "Payment Code", "Code #", etc.
- Handles labeled data structures

#### Pattern 3: Tabular Data
- Identifies columnar layouts common in PDFs
- Detects name-code pairs in structured formats
- Handles tab/space-separated data

### 3. Fuzzy Name Matching
- Uses Levenshtein distance algorithm for approximate matching
- Tolerates spelling variations and typos
- Requires at least 2 matching name components
- Highlights matched rows with orange accent color

### 4. Preview & Validation
- Preview extracted data before applying changes
- Shows count of successfully extracted entries
- Displays first 50 entries in scrollable table
- Option to cancel if extraction is incorrect

## How to Use

### Step 1: Navigate to Smart Match Tab
1. Open the PayCode Hub page
2. Click on the **"Smart Match"** tab
3. You'll see the PDF upload section at the top

### Step 2: Upload Your PDF
1. Click **"Choose PDF File"** button
2. Select your PDF file (e.g., `P6.pdf`)
3. The system will automatically process the file
4. Wait for the "Processing..." indicator to complete

### Step 3: Review Extracted Data
After processing, you'll see:
- **File name and size** confirmation
- **Preview table** showing extracted entries
- **Count** of total entries found
- Each entry displays: First Name, Middle Name, Last Name, Pay Code

### Step 4: Confirm & Match
1. Review the preview to ensure data looks correct
2. Click **"Confirm & Match"** to apply changes
3. The system will:
   - Search existing table for matching names
   - Update pay codes for matched rows
   - Highlight updated rows in orange
   - Show success message with match statistics

### Step 5: Verify Results
- Switch to **"View & Edit"** tab automatically
- Check that pay codes were updated correctly
- Look for orange-highlighted rows (recently updated)
- Review statistics in the mini-stat cards

## Supported PDF Formats

### Text-Based PDFs ✅
- PDFs with selectable/copyable text
- Generated from Word, Excel, or other applications
- Digital forms and reports

### Scanned PDFs ⚠️
- May not work without OCR (Optical Character Recognition)
- Text must be extractable by PDF.js
- Consider converting scanned PDFs to text-based first

### Common Layouts
```
Format 1: Inline
  John Doe 1234567890
  
Format 2: Labeled
  Name: Jane Smith
  Pay Code: 0987654321
  
Format 3: Tabular
  First Name    Last Name    Pay Code
  John          Doe          1234567890
```

## Example Workflow

### Sample PDF Content (P6.pdf)
```
Student Payment Records

Name: John Kakooza        Pay Code: 1011091547
Name: Mary Johnson        Pay Code: 1022083456
Name: Robert Smith        Pay Code: 1033074567
```

### What Happens:
1. **Upload** P6.pdf
2. **Extract** 3 entries with names and codes
3. **Preview** shows all 3 entries
4. **Match** against existing table:
   - Finds "John Kakooza" → Updates code to 1011091547
   - Finds "Mary Johnson" → Updates code to 1022083456
   - Finds "Robert Smith" → Updates code to 1033074567
5. **Highlight** matched rows temporarily
6. **Display** "Successfully matched 3 rows!"

## Troubleshooting

### No Data Extracted
**Problem:** "No payment codes or names found in the PDF"

**Solutions:**
1. Verify PDF contains 10-digit numbers
2. Check if text is selectable (not scanned image)
3. Ensure names are capitalized properly
4. Try copying text from PDF and pasting manually

### Poor Match Rate
**Problem:** Many entries show as "unmatched"

**Solutions:**
1. Check name spelling in both PDF and table
2. Ensure names follow similar format (First Last vs Last, First)
3. Verify middle names are consistent
4. Use the manual paste option for problematic entries

### Extraction Errors
**Problem:** Incorrect names or codes extracted

**Solutions:**
1. Review preview carefully before confirming
2. Cancel and try alternative extraction method
3. Manually edit table after import if needed
4. Contact support if PDF format is unusual

## Technical Details

### Libraries Used
- **PDF.js** (v3.11.174): Mozilla's PDF rendering library
  - Client-side PDF parsing
  - Text extraction from all pages
  - No server processing required

### Extraction Algorithm
```javascript
1. Load PDF → Convert to ArrayBuffer
2. Iterate through all pages
3. Extract text content from each page
4. Apply pattern matching:
   - Regex for 10-digit codes: /\b(\d{10})\b/g
   - Capitalized word detection: /\b([A-Z][a-z]{2,})\b/g
   - Context analysis around codes
5. Build structured data objects
6. Display preview for validation
```

### Fuzzy Matching Logic
```javascript
1. Compare extracted names with table names
2. Calculate Levenshtein distance for each word
3. Count matching words (threshold: ≥2)
4. Update pay code if match found
5. Apply temporary highlight effect
```

## Best Practices

### For Best Results:
1. **Use text-based PDFs** (not scanned images)
2. **Ensure clear formatting** with consistent spacing
3. **Include full names** (first and last at minimum)
4. **Verify 10-digit codes** are present and correct
5. **Review preview** before confirming matches

### Data Preparation:
- Clean up PDF formatting if possible
- Remove headers/footers that might confuse extraction
- Ensure names use standard capitalization
- Keep payment codes in consistent format

### After Matching:
- Verify all important entries were matched
- Manually update any unmatched entries
- Download updated CSV for backup
- Clear PDF selection when done

## Alternative Methods

If PDF extraction doesn't work well:

### Option 1: Copy-Paste from PDF
1. Open PDF and select all text (Ctrl+A)
2. Copy text (Ctrl+C)
3. Paste into the text area below PDF upload
4. Use "Match & Update" button

### Option 2: Convert PDF to Excel
1. Use online PDF-to-Excel converter
2. Upload resulting Excel file via "Bulk Import" tab
3. Review and confirm import

### Option 3: Manual Entry
1. Add rows manually using "Add Row" button
2. Enter names and codes directly
3. Double-click cells to edit

## Security & Privacy

- **Local Processing**: All PDF parsing happens in your browser
- **No Upload**: Files are NOT sent to any server
- **Temporary Storage**: Extracted data exists only in memory
- **Clear on Refresh**: Data is lost if page is refreshed (unless saved to table)

## Performance

- **Small PDFs** (<10 pages): Instant processing
- **Medium PDFs** (10-50 pages): 2-5 seconds
- **Large PDFs** (>50 pages): 5-15 seconds
- **Memory Usage**: Proportional to PDF size and text content

## Future Enhancements

Potential improvements:
- [ ] OCR support for scanned PDFs
- [ ] Custom pattern configuration
- [ ] Batch PDF processing
- [ ] Export unmatched entries
- [ ] Confidence scoring for matches
- [ ] Manual correction interface

## Support

For issues or questions:
1. Check this documentation first
2. Verify PDF format compatibility
3. Try alternative input methods
4. Report bugs with sample PDF (if possible)

---

**Last Updated:** 2026-05-25  
**Version:** 1.0.0  
**Feature Status:** Production Ready ✅
