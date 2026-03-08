# Royal Portraits Dataset - CSV Implementation Guide

## 📁 File Structure

```
Component3-CraftSimulation/
├── public/
│   └── data/                           # CSV datasets (publicly accessible)
│       ├── royalPortraitsData.csv      # Main royal portraits historical data
│       ├── restorationConfigs.csv      # Puzzle difficulty configurations
│       └── collectionMetadata.csv      # Collection information and metadata
├── src/
│   ├── data/
│   │   ├── csvParser.js                # CSV parsing utility functions
│   │   └── royalPortraitsData.js       # (Legacy - kept for reference)
│   └── components/
│       └── simulations/
│           └── PaintingSimulation.js   # Main component using CSV data
```

## 📊 CSV File Descriptions

### 1. **royalPortraitsData.csv**
Contains comprehensive historical information about each royal portrait.

**Columns:**
- `id` - Unique identifier (walagamba, vikrama, king2)
- `name` - Full name of the king
- `filename` - Image file path
- `shortDescription` - Brief description (1 sentence)
- `period` - Historical period/reign dates
- `dynasty` - Dynasty name
- `reign` - Reign duration description
- `background` - Historical background paragraph
- `achievements` - Pipe-separated list of achievements (|)
- `culturalSignificance` - Cultural importance paragraph
- `militaryContext` - Military history (optional)
- `religiousLegacy` - Religious contributions (optional)
- `historicalImpact` - Historical impact (optional)
- `archaeologicalEvidence` - Archaeological evidence (optional)
- `culturalInfluence` - Cultural influence (optional)
- `endOfEra` - End of era description (optional)
- `artisticTradition` - Artistic tradition (optional)
- `architecturalHeritage` - Architectural legacy (optional)
- `culturalPreservation` - Cultural preservation efforts (optional)
- `modernLegacy` - Modern legacy (optional)
- `scholarlyTradition` - Scholarly tradition (optional)
- `culturalSynthesis` - Cultural synthesis (optional)

**Data Format Notes:**
- Multiple achievements are separated by pipe character `|`
- Empty optional fields are left blank
- Text containing commas must be enclosed in quotes

### 2. **restorationConfigs.csv**
Defines puzzle difficulty levels and configurations.

**Columns:**
- `difficulty` - Difficulty level identifier (easy, hard)
- `rows` - Number of puzzle rows
- `cols` - Number of puzzle columns
- `pieces` - Total number of pieces
- `label` - Display label
- `description` - Difficulty description
- `skillLevel` - Skill level description
- `timeEstimate` - Estimated completion time
- `educationalFocus` - Educational learning objective

### 3. **collectionMetadata.csv**
Contains metadata about the entire collection.

**Columns:**
- `key` - Metadata field name
- `value` - Metadata value

**Special Formats:**
- Arrays (culturalThemes, educationalObjectives): Pipe-separated `|`
- Historical periods: Format `Name:Timeframe:Significance|Next Period...`

## 🔧 CSV Parser Functions

### `csvParser.js` Utility Functions

#### **loadAllDatasets()**
Loads all three CSV files and returns parsed data.

```javascript
const datasets = await loadAllDatasets();
// Returns:
// {
//   ROYAL_PORTRAITS_DATA: [...],
//   RESTORATION_CONFIGS: {...},
//   COLLECTION_METADATA: {...}
// }
```

#### **parseRoyalPortraitsCSV(csvData)**
Converts CSV data into structured royal portrait objects.

**Features:**
- Splits pipe-separated achievements into array
- Builds nested historicalContext object
- Removes empty optional fields
- Returns clean data structure

#### **parseRestorationConfigsCSV(csvData)**
Converts CSV data into configuration object.

**Returns:**
```javascript
{
  easy: { rows: 3, cols: 4, pieces: 12, ... },
  hard: { rows: 4, cols: 6, pieces: 24, ... }
}
```

#### **parseCollectionMetadataCSV(csvData)**
Converts CSV data into metadata object.

**Features:**
- Parses pipe-separated arrays
- Handles special historical periods format
- Returns structured metadata

## 💻 Component Integration

### PaintingSimulation.js Implementation

```javascript
import { loadAllDatasets } from '../../data/csvParser';

const PaintingSimulation = () => {
  // State for CSV data
  const [ROYAL_PORTRAITS_DATA, setRoyalPortraitsData] = useState([]);
  const [RESTORATION_CONFIGS, setRestorationConfigs] = useState({});
  const [COLLECTION_METADATA, setCollectionMetadata] = useState({});
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load CSV data on mount
  useEffect(() => {
    const loadData = async () => {
      const datasets = await loadAllDatasets();
      if (datasets) {
        setRoyalPortraitsData(datasets.ROYAL_PORTRAITS_DATA);
        setRestorationConfigs(datasets.RESTORATION_CONFIGS);
        setCollectionMetadata(datasets.COLLECTION_METADATA);
        setDataLoaded(true);
      }
    };
    loadData();
  }, []);

  // Show loading state while data loads
  if (!dataLoaded) {
    return <LoadingScreen />;
  }

  // Use data normally
  return (
    <div>
      {ROYAL_PORTRAITS_DATA.map(painting => (
        <PaintingCard key={painting.id} {...painting} />
      ))}
    </div>
  );
};
```

## 📝 Adding New Royal Portraits

### Step 1: Update royalPortraitsData.csv

Add a new row with all required and relevant optional fields:

```csv
newking,"King Name",/image.jpg,"Short description","Period","Dynasty","Reign","Background...","Achievement1|Achievement2","Cultural significance...","Military context...","",...
```

### Step 2: Add Image

Place the image file in `public/` folder:
- `/King-NewName.jpg`
- `/king-image.png`

### Step 3: Test

The component will automatically load and display the new data on next refresh.

## 🎯 Benefits of CSV-Based System

### ✅ **Advantages**

1. **Easy Editing**: Edit in Excel, Google Sheets, or any CSV editor
2. **Non-Technical Updates**: Content managers can update without coding
3. **Version Control**: Easy to track changes in Git
4. **Data Portability**: CSV is universal format
5. **Scalability**: Add unlimited portraits without code changes
6. **Separation of Concerns**: Data separate from logic
7. **Collaborative**: Multiple people can edit simultaneously
8. **Backup Friendly**: Simple text files, easy to backup

### ⚙️ **Technical Features**

1. **Async Loading**: Data loads asynchronously
2. **Error Handling**: Graceful fallback if CSV fails
3. **Loading States**: User feedback during data fetch
4. **Type Safety**: Parsed into proper data structures
5. **Memory Efficient**: Data loaded once on mount
6. **Cache Friendly**: Browser can cache CSV files

## 🔍 Data Validation

### Required Fields Checklist

For each new portrait entry, ensure:

- ✅ Unique `id` (lowercase, no spaces)
- ✅ Complete `name` with proper formatting
- ✅ Valid `filename` path starting with `/`
- ✅ Concise `shortDescription` (1-2 sentences)
- ✅ Accurate `period` with dates
- ✅ Correct `dynasty` name
- ✅ Clear `reign` duration
- ✅ Detailed `background` paragraph
- ✅ At least 3-4 `achievements` (pipe-separated)
- ✅ Meaningful `culturalSignificance`

### Optional Fields Guidelines

Add optional fields when:
- `militaryContext`: King had significant military campaigns
- `religiousLegacy`: Major religious contributions
- `endOfEra`: Final king of a period/dynasty
- `artisticTradition`: Known for artistic patronage
- `architecturalHeritage`: Built significant monuments

## 🛠️ Troubleshooting

### Common Issues

**Problem**: Data not loading
- **Solution**: Check browser console for errors
- **Check**: CSV files are in `public/data/` folder
- **Verify**: CSV syntax is valid (use CSV validator)

**Problem**: Achievements not displaying
- **Solution**: Ensure pipe `|` separator between items
- **Check**: No trailing pipes at end

**Problem**: Special characters display incorrectly
- **Solution**: Ensure CSV file is UTF-8 encoded
- **Save**: Use "Save as CSV (UTF-8)" in Excel

**Problem**: Commas breaking data
- **Solution**: Wrap text containing commas in quotes
- **Example**: `"Defeated enemies, restored peace"`

## 📊 Data Statistics

Current Dataset:
- **Total Portraits**: 3
- **Time Period Covered**: 1,918 years (103 BCE - 1815 CE)
- **Dynasties Represented**: 3
- **Total Achievements Documented**: 12
- **Historical Periods**: 3 (Anuradhapura, Classical, Kandyan)

## 🔄 Migration from JavaScript to CSV

### What Changed

**Before (royalPortraitsData.js):**
```javascript
export const ROYAL_PORTRAITS_DATA = [
  {
    id: 'walagamba',
    name: 'King Walagamba',
    // ... nested objects
  }
];
```

**After (royalPortraitsData.csv + csvParser.js):**
```csv
id,name,filename,...
walagamba,"King Walagamba",/image.jpg,...
```

### Benefits of Migration

1. **Accessibility**: Non-developers can edit
2. **Tools**: Use Excel, Sheets, database tools
3. **Import/Export**: Easy data transfer
4. **Scalability**: Handle hundreds of entries
5. **Collaboration**: Better for teams

## 🎓 Educational Use

This dataset structure is ideal for:
- Museum digital archives
- Educational applications
- Cultural heritage projects
- Historical databases
- Research applications
- Interactive exhibitions

## 📄 License & Attribution

When using this dataset structure:
- Credit original historical sources
- Maintain data accuracy
- Cite archaeological evidence
- Respect cultural sensitivity
- Update with new research

---

## 🎭 Kolam Mask Painting Datasets

### File Structure (Mask Painting)

```
public/
└── data/
    ├── kolamMasksData.csv           # Mask information and cultural context
    ├── maskColors.csv               # Traditional color palette
    └── maskPaintingMetadata.csv     # Collection metadata
```

### 4. **kolamMasksData.csv**
Contains detailed information about each traditional Kolam mask.

**Columns:**
- `id` - Unique identifier (raksha_demon, gurulu_bird)
- `name` - Full mask name
- `filename` - Image file path (e.g., Kolam_devil_mask_1.png)
- `maskType` - Type of mask (e.g., "Sanni Yakuma Healing Mask")
- `ritualContext` - Ritual/ceremonial context
- `shortDescription` - Brief description
- `period` - Historical period (e.g., "Pre-Buddhist Era (2000+ years)")
- `region` - Geographic region (e.g., "Southern Province, Ambalangoda")
- `traditionalColors` - Pipe-separated color list (Red|Black|White|Gold|Yellow)
- `culturalBackground` - Cultural history and context
- `spiritualPurpose` - Spiritual/religious purpose
- `demonRepresented` - Name of demon/spirit represented
- `healingProperties` - Healing attributes and medicinal uses
- `performanceContext` - Performance/ceremony usage
- `symbolism` - Symbolic meanings and interpretations
- `craftingTradition` - Traditional crafting methods and lineage
- `modernRelevance` - Contemporary significance and UNESCO status

**Example Row:**
```csv
id,name,filename,maskType,traditionalColors,...
raksha_demon,"Raksha Demon Mask","Kolam_devil_mask_1.png","Sanni Yakuma Healing Mask","Red|Black|White|Gold|Yellow",...
```

### 5. **maskColors.csv**
Traditional color palette with cultural meanings.

**Columns:**
- `colorName` - English color name (Red, Black, White, etc.)
- `hexCode` - Hex color code (#DC143C)
- `traditionalName` - Sinhala/traditional name (Rathu Rang)
- `culturalMeaning` - Cultural significance
- `usage` - Traditional usage in mask painting
- `symbolicSignificance` - Symbolic meaning
- `historicalSource` - Historical origins and references

**Example Row:**
```csv
colorName,hexCode,traditionalName,culturalMeaning,...
Red,#DC143C,Rathu Rang,"Represents fierce protective energy and power",...
```

### 6. **maskPaintingMetadata.csv**
General collection information and metadata.

**Columns:**
- `key` - Metadata key (title, tradition, region, etc.)
- `value` - Metadata value

**Special Formats:**
- Arrays: Use pipe-separated values (`|`)
- Mask Types: Use colon-separated structure (`Name:Description:Details`)

**Example Rows:**
```csv
key,value
title,"Traditional Kolam Mask Painting"
culturalThemes,"Healing Rituals|Spiritual Protection|Folk Theatre"
maskTypes,"Sanni Yakuma:Healing masks:18 disease demons|Kolam:Performance masks:Folk theatre tradition"
```

### Code Integration (Mask Painting)

**Parser Functions in csvParser.js:**
```javascript
// Mask painting parsers
export const parseKolamMasksCSV = (csvData) => { ... }
export const parseMaskColorsCSV = (csvData) => { ... }
export const parseMaskMetadataCSV = (csvData) => { ... }
export const loadMaskDatasets = async () => { ... }
```

**Usage Example:**
```javascript
import { loadMaskDatasets } from './data/csvParser';

const MaskComponent = () => {
  const [datasets, setDatasets] = useState(null);
  
  useEffect(() => {
    const loadData = async () => {
      const data = await loadMaskDatasets();
      setDatasets(data);
    };
    loadData();
  }, []);
  
  // Access data:
  // datasets.KOLAM_MASKS_DATA - Array of masks
  // datasets.MASK_COLORS - Array of colors
  // datasets.MASK_METADATA - Metadata object
};
```

### Adding New Masks

1. **Add mask image** to `/public/` folder
2. **Edit kolamMasksData.csv**:
   ```csv
   new_mask,"New Mask Name","new_mask.png","Kolam Performance Mask","Red|Blue|Gold",...
   ```
3. **Use pipe separators** for traditional colors
4. **Include all cultural information** for educational value

### Adding New Colors

1. **Edit maskColors.csv**:
   ```csv
   Purple,#800080,Udha Rang,"Royal dignity and wisdom",...
   ```
2. **Ensure hex code is valid** (6-digit format)
3. **Include traditional name** in Sinhala/local language
4. **Explain cultural significance** for educational context

---

**Last Updated**: December 21, 2025
**Version**: 2.0.0 (Added Mask Painting Datasets)
**Format**: CSV (UTF-8)
**Dependencies**: PapaParse library for CSV parsing