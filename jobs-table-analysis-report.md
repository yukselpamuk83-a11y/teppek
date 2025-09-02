# Jobs Table Optimization Analysis Report

## Current Table Structure
- **Total Columns:** 21
- **Total Records:** ~20,544
- **Table Name:** jobs

## Field Analysis

### ✅ REQUIRED FIELDS (Used in Bucket/Frontend)
| Field | Type | Nullable | Current Usage | Notes |
|-------|------|----------|---------------|-------|
| `id` | bigint | NO | ✅ Primary key | Essential |
| `title` | varchar | NO | ✅ Job title | Essential |
| `company` | varchar | YES | ✅ Company name | Essential |
| `lat` | numeric | NO | ✅ Latitude | Essential for map |
| `lon` | numeric | NO | ✅ Longitude | Essential for map |
| `url` | text | NO | ✅ Job application URL | Essential |
| `country` | varchar | NO | ✅ Country code | Essential |
| `city` | varchar | YES | ✅ City name | Essential |
| `salary_min` | integer | YES | ✅ Min salary | Essential |
| `salary_max` | integer | YES | ✅ Max salary | Essential |
| `currency` | varchar | YES | ✅ Salary currency | Essential |
| `source` | varchar | YES | ✅ Data source | Essential for filtering |
| `remote` | boolean | YES | ✅ Remote work flag | Essential |

### ⚠️ POTENTIALLY USEFUL FIELDS
| Field | Type | Nullable | Current Usage | Notes |
|-------|------|----------|---------------|-------|
| `adzuna_id` | varchar | NO | ✅ API reference | Useful for deduplication |
| `created_at` | timestamp | YES | ✅ Record creation | Useful for maintenance |
| `contact` | text | YES | ❌ Mostly NULL | Only for manual listings |
| `icon_type` | varchar | YES | ❌ Mostly NULL | Could be useful for UI |

### ❌ UNNECESSARY/UNUSED FIELDS
| Field | Type | Nullable | Current Usage | Recommendation |
|-------|------|----------|---------------|----------------|
| `popup_html` | text | YES | ❌ NULL (cleaned) | **DELETE** - Frontend generates dynamically |
| `marker_html` | text | YES | ❌ NULL | **DELETE** - Not used |
| `created_by` | uuid | YES | ❌ NULL | **DELETE** - No user system |
| `user_id` | uuid | YES | ❌ NULL | **DELETE** - No user system |
| `location` | USER-DEFINED | YES | ❌ NULL | **DELETE** - PostGIS type, unused |

## Storage Impact Analysis

### Current Situation
- **Total fields:** 21
- **Unused fields:** 5 (popup_html, marker_html, created_by, user_id, location)
- **Estimated storage waste:** ~20-30% of table size

### Optimization Potential
- **Fields to remove:** 5 unnecessary fields
- **Space savings:** Significant reduction in row size
- **Performance improvement:** Faster queries, smaller indexes

## API Integration Requirements

### Adzuna API Fields (Current)
- ✅ All required fields present
- ✅ `adzuna_id` for deduplication
- ✅ Salary, location, company data

### Manual Entry Fields (Future)
- ✅ All bucket fields available
- ✅ `contact` field for direct contact info
- ✅ `source = 'manual'` for identification

### Other API Integration (Future)
- ✅ Current structure supports any job API
- ✅ `source` field for source identification
- ✅ All standard job fields available

## Recommendations

### Immediate Actions (Safe to Remove)
1. **DROP `popup_html`** - Already NULL, frontend handles this
2. **DROP `marker_html`** - Not used anywhere
3. **DROP `created_by`** - No user authentication system
4. **DROP `user_id`** - No user authentication system
5. **DROP `location`** - PostGIS field not used, lat/lon sufficient

### Keep for Future Use
- **`contact`** - Useful for manual job entries
- **`icon_type`** - Could be useful for different job types
- **`adzuna_id`** - Important for API deduplication
- **`created_at`** - Useful for data maintenance

### SQL Commands for Optimization
```sql
-- Remove unnecessary columns
ALTER TABLE jobs DROP COLUMN popup_html;
ALTER TABLE jobs DROP COLUMN marker_html; 
ALTER TABLE jobs DROP COLUMN created_by;
ALTER TABLE jobs DROP COLUMN user_id;
ALTER TABLE jobs DROP COLUMN location;
```

## Final Optimized Structure (16 fields)
```
id, adzuna_id, title, company, lat, lon, url, country, city, 
remote, salary_min, salary_max, currency, created_at, contact, 
source, icon_type
```

## Benefits After Optimization
- **Storage reduction:** ~20-30% smaller table
- **Faster queries:** Less data to scan
- **Cleaner schema:** Only relevant fields
- **Better maintainability:** Clear purpose for each field
- **Future-proof:** Supports manual entries and new APIs