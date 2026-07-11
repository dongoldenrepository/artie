# Photography Folder — Needs Organizing (2026-07-01)

The photography folder was almost entirely skipped during bulk upload — only
1 file had a descriptive name (an Unsplash stock photo, probably not your work).
All 7 files are raw camera roll names (IMG_XXXX).

**To add your photography to the site:**
Rename your photos descriptively before uploading, e.g.:
`IMG_0063.jpg` → `red-barn-at-sunset-2023.jpg`

Then run:
```
node scripts/bulk-upload.mjs \
  --folder "/Volumes/SP4TB/TaylorArtie/photography" \
  --type "photography" \
  --token "MyArtie2026" \
  --max-px 2000
```

---

## Skipped files (original names)

### (root)

- `IMG_0063.jpg`
- `IMG_0261.jpg`
- `IMG_0266.jpg`
- `IMG_0540.jpg`
- `IMG_0875.jpg`
- `IMG_2061.jpg`
- `IMG_20200424_184703.jpg`
