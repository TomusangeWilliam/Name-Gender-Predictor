# PDF Upload Quick Guide - Smart PayCode Matcher

## 🚀 Quick Start (3 Steps)

### 1️⃣ Upload PDF
- Go to **Smart Match** tab
- Click **"Choose PDF File"**
- Select your PDF (e.g., `P6.pdf`)

### 2️⃣ Review Preview
- Check extracted names and codes
- Verify data looks correct
- See how many entries were found

### 3️⃣ Confirm & Match
- Click **"Confirm & Match"**
- System updates matching rows
- Orange highlight = successful match

---

## 📋 What Gets Extracted

The system looks for:
- ✅ **10-digit numbers** (Payment Codes)
- ✅ **Capitalized words** (Names)
- ✅ **Context around codes** (Full names)

### Example Formats That Work:

```
✓ John Doe 1234567890
✓ Name: Jane Smith, Code: 0987654321
✓ Mary Johnson    1022083456
✓ Robert Smith - Payment Code: 1033074567
```

---

## ⚠️ Common Issues

### "No data found"
- PDF might be scanned (image-based)
- Text not selectable in PDF viewer
- No 10-digit numbers present

**Fix:** Try copying text from PDF and pasting manually

### "No matches found"
- Names spelled differently in table
- Format mismatch (First Last vs Last, First)
- Middle names causing confusion

**Fix:** Check name spelling or use manual paste method

### Wrong data extracted
- Headers/footers confused as data
- Random numbers detected as codes
- Non-name words identified as names

**Fix:** Cancel and try different PDF or manual entry

---

## 💡 Pro Tips

1. **Preview First** - Always review before confirming
2. **Check Count** - Make sure expected number of entries found
3. **Verify Codes** - Ensure 10-digit format is correct
4. **Watch Highlights** - Orange rows show successful updates
5. **Backup Data** - Download CSV before major changes

---

## 🔄 Alternative Methods

If PDF upload doesn't work:

### Method A: Copy-Paste
1. Select all text in PDF (Ctrl+A)
2. Copy (Ctrl+C)
3. Paste in text box below PDF section
4. Click "Match & Update"

### Method B: Convert to Excel
1. Use online PDF-to-Excel tool
2. Upload Excel via "Bulk Import" tab
3. Confirm import

### Method C: Manual Entry
1. Click "Add Row" button
2. Type names and codes directly
3. Double-click to edit any cell

---

## 🎯 Success Checklist

Before clicking "Confirm & Match":
- [ ] Preview shows correct number of entries
- [ ] Names look accurate (no garbled text)
- [ ] Payment codes are 10 digits
- [ ] No obvious errors in extraction
- [ ] Ready to update existing table

After matching:
- [ ] Switched to "View & Edit" tab
- [ ] Saw orange highlights on matched rows
- [ ] Statistics updated correctly
- [ ] Verified a few entries manually
- [ ] Downloaded backup CSV (optional)

---

## 🆘 Need Help?

**Problem:** PDF won't upload  
**Solution:** Check file is actually PDF (not renamed .doc or .xls)

**Problem:** Extraction takes too long  
**Solution:** Large PDFs (>50 pages) can take 10+ seconds. Be patient.

**Problem:** Only some entries matched  
**Solution:** Manually update unmatched ones or check name spelling

**Problem:** Lost extracted data  
**Solution:** Refresh page and re-upload PDF (data isn't saved until confirmed)

---

## 📊 Understanding Results

After matching, you'll see:
```
"Successfully matched X rows from PDF! Y entries had no matches."
```

- **X** = Rows successfully updated with pay codes
- **Y** = Entries that couldn't find matching names
- **Orange highlight** = Recently updated rows (fades after 3 seconds)

---

## 🔒 Privacy Note

✅ All processing happens in your browser  
✅ PDF never leaves your computer  
✅ No data sent to servers  
✅ Temporary memory only (cleared on refresh)  

---

**Quick Reference:** Upload → Preview → Confirm → Done! 🎉
