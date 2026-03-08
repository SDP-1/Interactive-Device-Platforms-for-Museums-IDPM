import Papa from 'papaparse';

/**
 * Parses CSV data for royal portraits
 * Handles complex nested data structures stored in CSV format
 */
export const parseRoyalPortraitsCSV = (csvData) => {
  return csvData.map(row => {
    // Parse achievements array (pipe-separated values)
    const achievements = row.achievements 
      ? row.achievements.split('|').filter(item => item.trim())
      : [];

    // Build historical context object from CSV columns
    const historicalContext = {
      background: row.background || '',
      achievements: achievements,
      culturalSignificance: row.culturalSignificance || '',
      militaryContext: row.militaryContext || '',
      religiousLegacy: row.religiousLegacy || '',
      historicalImpact: row.historicalImpact || '',
      archaeologicalEvidence: row.archaeologicalEvidence || '',
      culturalInfluence: row.culturalInfluence || '',
      endOfEra: row.endOfEra || '',
      artisticTradition: row.artisticTradition || '',
      architecturalHeritage: row.architecturalHeritage || '',
      culturalPreservation: row.culturalPreservation || '',
      modernLegacy: row.modernLegacy || '',
      scholarlyTradition: row.scholarlyTradition || '',
      culturalSynthesis: row.culturalSynthesis || ''
    };

    // Remove empty fields from historicalContext
    Object.keys(historicalContext).forEach(key => {
      if (!historicalContext[key] || historicalContext[key].length === 0) {
        delete historicalContext[key];
      }
    });

    return {
      id: row.id,
      name: row.name,
      filename: row.filename,
      shortDescription: row.shortDescription,
      period: row.period,
      dynasty: row.dynasty,
      reign: row.reign,
      historicalContext: historicalContext
    };
  });
};

/**
 * Parses restoration configuration CSV data
 */
export const parseRestorationConfigsCSV = (csvData) => {
  const configs = {};
  
  csvData.forEach(row => {
    configs[row.difficulty] = {
      rows: parseInt(row.rows),
      cols: parseInt(row.cols),
      pieces: parseInt(row.pieces),
      label: row.label,
      description: row.description,
      skillLevel: row.skillLevel,
      timeEstimate: row.timeEstimate,
      educationalFocus: row.educationalFocus
    };
  });
  
  return configs;
};

/**
 * Parses collection metadata CSV data
 */
export const parseCollectionMetadataCSV = (csvData) => {
  const metadata = {};
  
  csvData.forEach(row => {
    const key = row.key;
    let value = row.value;
    
    // Parse arrays (pipe-separated)
    if (key === 'culturalThemes' || key === 'educationalObjectives') {
      value = value.split('|').filter(item => item.trim());
    }
    
    // Parse historical periods (special format)
    if (key === 'historicalPeriods') {
      value = value.split('|').map(period => {
        const [name, timeframe, significance] = period.split(':');
        return {
          name: name.trim(),
          timeframe: timeframe.trim(),
          significance: significance.trim()
        };
      });
    }
    
    metadata[key] = value;
  });
  
  return metadata;
};

/**
 * Loads and parses CSV file
 */
export const loadCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    Papa.parse(filePath, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

/**
 * Loads all dataset files
 */
export const loadAllDatasets = async () => {
  try {
    const [portraitsData, configsData, metadataData] = await Promise.all([
      loadCSV('/data/royalPortraitsData.csv'),
      loadCSV('/data/restorationConfigs.csv'),
      loadCSV('/data/collectionMetadata.csv')
    ]);

    return {
      ROYAL_PORTRAITS_DATA: parseRoyalPortraitsCSV(portraitsData),
      RESTORATION_CONFIGS: parseRestorationConfigsCSV(configsData),
      COLLECTION_METADATA: parseCollectionMetadataCSV(metadataData)
    };
  } catch (error) {
    console.error('Error loading CSV datasets:', error);
    return null;
  }
};

/**
 * Parses Kolam mask CSV data
 */
export const parseKolamMasksCSV = (csvData) => {
  return csvData.map(row => {
    // Parse traditional colors array (pipe-separated values)
    const traditionalColors = row.traditionalColors 
      ? row.traditionalColors.split('|').filter(item => item.trim())
      : [];

    return {
      id: row.id,
      name: row.name,
      filename: row.filename,
      maskType: row.maskType,
      ritualContext: row.ritualContext,
      shortDescription: row.shortDescription,
      period: row.period,
      region: row.region,
      traditionalColors: traditionalColors,
      culturalInfo: {
        background: row.culturalBackground || '',
        spiritualPurpose: row.spiritualPurpose || '',
        demonRepresented: row.demonRepresented || '',
        healingProperties: row.healingProperties || '',
        performanceContext: row.performanceContext || '',
        symbolism: row.symbolism || '',
        craftingTradition: row.craftingTradition || '',
        modernRelevance: row.modernRelevance || ''
      }
    };
  });
};

/**
 * Parses mask colors CSV data
 */
export const parseMaskColorsCSV = (csvData) => {
  return csvData.map(row => ({
    colorName: row.colorName,
    hexCode: row.hexCode,
    traditionalName: row.traditionalName,
    culturalMeaning: row.culturalMeaning,
    usage: row.usage,
    symbolicSignificance: row.symbolicSignificance,
    historicalSource: row.historicalSource
  }));
};

/**
 * Parses mask painting metadata CSV data
 */
export const parseMaskMetadataCSV = (csvData) => {
  const metadata = {};
  
  csvData.forEach(row => {
    const key = row.key;
    let value = row.value;
    
    // Parse arrays (pipe-separated)
    if (key === 'culturalThemes' || key === 'educationalObjectives' || key === 'paintingTechniques') {
      value = value.split('|').filter(item => item.trim());
    }
    
    // Parse mask types (special format)
    if (key === 'maskTypes') {
      value = value.split('|').map(type => {
        const [name, description, details] = type.split(':');
        return {
          name: name.trim(),
          description: description.trim(),
          details: details.trim()
        };
      });
    }
    
    metadata[key] = value;
  });
  
  return metadata;
};

/**
 * Loads all mask painting datasets
 */
export const loadMaskDatasets = async () => {
  try {
    const [masksData, colorsData, metadataData] = await Promise.all([
      loadCSV('/data/kolamMasksData.csv'),
      loadCSV('/data/maskColors.csv'),
      loadCSV('/data/maskPaintingMetadata.csv')
    ]);

    return {
      KOLAM_MASKS_DATA: parseKolamMasksCSV(masksData),
      MASK_COLORS: parseMaskColorsCSV(colorsData),
      MASK_METADATA: parseMaskMetadataCSV(metadataData)
    };
  } catch (error) {
    console.error('Error loading mask CSV datasets:', error);
    return null;
  }
};

export default {
  parseRoyalPortraitsCSV,
  parseRestorationConfigsCSV,
  parseCollectionMetadataCSV,
  loadCSV,
  loadAllDatasets,
  parseKolamMasksCSV,
  parseMaskColorsCSV,
  parseMaskMetadataCSV,
  loadMaskDatasets
};