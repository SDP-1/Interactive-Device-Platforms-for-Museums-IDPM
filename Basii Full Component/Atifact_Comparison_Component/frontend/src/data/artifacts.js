// Mock data for artifacts - Based on the existing backend data structure
// These can be replaced with API calls to the Flask backend

export const ARTIFACTS_DATA = [
  {
    id: "A001",
    name: "Kasthane Sword",
    category: "Weapons & Armory",
    era: "16th - 19th Century CE",
    origin: "Sri Lanka",
    image: "/images/A001_Sword.jpg",
    description: "A traditional Sri Lankan sword known for its distinctive curved blade and ornate handle. The Kasthane represents the pinnacle of Sinhalese metalworking craftsmanship.",
    details: {
      material: "Steel blade with brass/silver handle decorations, wooden scabbard",
      function: "Ceremonial sword used by nobility and military officers",
      dimensions: "Blade: 60-70cm, Total length: 80-90cm",
      symbolism: "Symbol of authority, nobility, and martial prowess in Kandyan Kingdom"
    },
    similarArtifacts: ["A002", "A003", "A010"],
    aiAnalysis: "The Kasthane sword represents a unique fusion of indigenous Sinhalese craftsmanship with influences from Portuguese and Dutch colonial periods. The distinctive curved blade, often featuring intricate engravings of mythological creatures and floral patterns, demonstrates the sophisticated metallurgical knowledge of Sri Lankan artisans. The handle, typically adorned with lion head pommels (representing the Sinhalese lion), showcases the cultural identity embedded in weaponry. These swords were not merely weapons but symbols of status and authority, often presented during royal ceremonies and diplomatic exchanges.",
    comparisonTo: {
      "A010": "Both artifacts represent ceremonial objects from Asian traditions, though the Kasthane served military-ceremonial purposes while pottery served religious-domestic functions. They share elaborate decorative traditions reflecting cultural identity."
    }
  },
  {
    id: "A002",
    name: "Geta Bera Drum",
    category: "Musical Instruments",
    era: "Traditional - Present",
    origin: "Sri Lanka",
    image: "/images/A002_Geta_Bera.jpg",
    description: "The principal drum of Sri Lankan traditional music, essential for Kandyan dance performances and Buddhist temple ceremonies.",
    details: {
      material: "Jak wood body, cattle hide membranes, hemp/cotton ropes",
      function: "Accompaniment for traditional dance, religious ceremonies, and festivals",
      dimensions: "Length: 65-70cm, Diameter: 25-30cm",
      symbolism: "Sacred instrument representing connection between earthly and divine realms"
    },
    similarArtifacts: ["A001", "A005", "A003"],
    aiAnalysis: "The Geta Bera holds a sacred position in Sri Lankan Buddhist culture, serving as the rhythmic heartbeat of Kandyan dance traditions. Its distinctive double-headed design produces complex polyrhythmic patterns that have been preserved through generations of master drummers. The instrument's construction follows strict traditional guidelines, with specific types of wood and animal hides selected based on acoustic properties and ritual purity. The intricate rope tensioning system allows for precise tuning, enabling drummers to produce the subtle tonal variations essential for accompanying different dance forms and ceremonial occasions.",
    comparisonTo: {
      "A005": "Both are integral to Sri Lankan ceremonial traditions. While the Geta Bera provides the auditory dimension of rituals, masks like the Kolam provide the visual and spiritual dimension, often used together in traditional performances."
    }
  },
  {
    id: "A003",
    name: "Moonstone (Sandakada Pahana)",
    category: "Architectural Elements",
    era: "7th - 12th Century CE",
    origin: "Sri Lanka",
    image: "/images/A003_M1.jpg",
    description: "A semicircular stone slab placed at the entrance of Buddhist temples, featuring intricate carvings representing the cycle of life and spiritual progression.",
    details: {
      material: "Granite or gneiss stone",
      function: "Threshold marker symbolizing the transition from mundane to sacred space",
      dimensions: "Typically 1-2 meters in diameter",
      symbolism: "Represents samsara (cycle of rebirth) and the path to enlightenment"
    },
    similarArtifacts: ["A004", "A012", "A013"],
    aiAnalysis: "The Sandakada Pahana represents one of the most sophisticated expressions of Buddhist symbolism in stone. The concentric bands of carvings—flames, elephants, horses, lions, bulls, swans, and lotus flowers—encode profound philosophical teachings about the stages of spiritual development. The outermost flame band represents worldly desires, while subsequent animal bands symbolize different aspects of existence (elephants for birth, horses for aging, lions for illness, bulls for death). The central lotus represents ultimate enlightenment. This architectural element demonstrates how Sri Lankan craftsmen integrated religious instruction into everyday sacred spaces.",
    comparisonTo: {
      "A012": "Both represent Buddhist architectural traditions, though from different cultural contexts. The Moonstone is uniquely Sri Lankan while similar threshold elements in other Buddhist cultures may take different forms."
    }
  },
  {
    id: "A004",
    name: "Guard Stone (Muragala)",
    category: "Architectural Elements",
    era: "7th - 12th Century CE",
    origin: "Sri Lanka",
    image: "/images/A004_C2.jpg",
    description: "Carved stone pillars placed at entrances to sacred sites, typically featuring Nagaraja (cobra king) figures and pot of abundance motifs.",
    details: {
      material: "Granite stone",
      function: "Protective guardians marking sacred boundaries",
      dimensions: "Height: 1.5-2.5 meters",
      symbolism: "Divine protection and blessing for those entering sacred spaces"
    },
    similarArtifacts: ["A003", "A013", "A012"],
    aiAnalysis: "Guard stones represent the sophisticated integration of Hindu-Buddhist iconography in Sri Lankan sacred architecture. The central Nagaraja figure, depicted with multiple cobra hoods forming a canopy, serves as a divine protector while also symbolizing the earth's fertility and hidden treasures. The accompanying 'purna kalasha' (pot of abundance) overflowing with lotus flowers represents prosperity and spiritual fullness. The evolution of guard stone design from simple to highly ornate forms mirrors the development of Sri Lankan Buddhist art across different dynastic periods, with the Polonnaruwa period examples showing the highest artistic achievement.",
    comparisonTo: {
      "A003": "Guard stones and moonstones form complementary pairs at temple entrances. While moonstones represent the spiritual journey, guard stones provide symbolic protection and blessing for pilgrims entering sacred spaces."
    }
  },
  {
    id: "A005",
    name: "Kolam Devil Mask",
    category: "Masks & Ritual Objects",
    era: "Traditional - Present",
    origin: "Sri Lanka",
    image: "/images/A005_Kolam_devil_mask_Wellcome_L0037158.jpg",
    description: "Traditional mask used in Kolam folk drama performances, representing various characters from folk tales and Buddhist Jataka stories.",
    details: {
      material: "Kaduru (Strychnos nux-vomica) wood, natural pigments",
      function: "Theatrical performances, ritual healing ceremonies, and exorcism rites",
      dimensions: "Varies by character, typically 30-60cm",
      symbolism: "Transformation, spirit embodiment, and connection to supernatural realms"
    },
    similarArtifacts: ["A002", "A011", "A001"],
    aiAnalysis: "Kolam masks represent a living tradition that bridges entertainment, religious instruction, and healing practices in Sri Lankan culture. The exaggerated features—bulging eyes, protruding teeth, vibrant colors—serve both theatrical visibility and spiritual potency. Each mask character carries specific symbolic meanings, from the noble Gurunnanse (teacher) to fearsome demon figures. The carving process itself is considered a sacred act, with craftsmen following traditional rituals and using specific wood species believed to possess protective properties. These masks continue to play vital roles in village ceremonies, particularly in Southern Sri Lanka where the tradition remains strongest.",
    comparisonTo: {
      "A011": "Both represent mask traditions from different cultures. Sri Lankan Kolam masks serve theatrical and healing purposes, while masks from other traditions may emphasize different cultural functions such as ancestor worship or seasonal celebrations."
    }
  },
  {
    id: "A010",
    name: "Ancient Pottery Vessel",
    category: "Pottery & Ceramics",
    era: "Ancient Period",
    origin: "South Asia",
    image: "/images/A010_P1.jpg",
    description: "A traditional pottery vessel showcasing ancient craftsmanship and utilitarian design principles.",
    details: {
      material: "Terracotta clay with natural glazes",
      function: "Storage, cooking, or ceremonial purposes",
      dimensions: "Varies by type and region",
      symbolism: "Connection to earth, sustenance, and domestic life"
    },
    similarArtifacts: ["A001", "A012", "A003"],
    aiAnalysis: "This pottery vessel exemplifies the sophisticated ceramic traditions of ancient South Asia. The form follows function, with carefully proportioned bodies designed for specific storage or cooking requirements. Surface treatments—whether burnished, painted, or textured—served both aesthetic and practical purposes, from improving water impermeability to facilitating grip. Such vessels were essential elements of daily life while also serving important roles in ritual contexts, from funeral offerings to temple worship. The continuity of pottery traditions across millennia demonstrates the fundamental importance of ceramic craft to human civilization.",
    comparisonTo: {
      "A001": "While the Kasthane represents elite ceremonial culture, pottery vessels represent the foundation of everyday domestic life. Both demonstrate sophisticated craftsmanship but serve fundamentally different social purposes."
    }
  },
  {
    id: "A011",
    name: "Indonesian Ceremonial Mask",
    category: "Masks & Ritual Objects",
    era: "Traditional",
    origin: "Indonesia",
    image: "/images/A011_I1.jpg",
    description: "A ceremonial mask from Indonesian traditions, used in theatrical performances and ritual ceremonies.",
    details: {
      material: "Carved wood with paint and decorative elements",
      function: "Theatrical performances, religious ceremonies, ancestral veneration",
      dimensions: "Typically 25-45cm",
      symbolism: "Spirit embodiment, cultural identity, and connection to ancestors"
    },
    similarArtifacts: ["A005", "A012", "A002"],
    aiAnalysis: "Indonesian ceremonial masks represent one of the world's richest mask-making traditions, with distinct regional styles across Java, Bali, and other islands. These masks serve multiple functions: as theatrical props in wayang wong performances, as sacred objects in temple ceremonies, and as embodiments of ancestral spirits. The carving traditions encode complex iconographic systems where facial features, colors, and decorative elements communicate character types and spiritual attributes. The mask-making craft is often hereditary, with master carvers maintaining traditions passed down through generations while adapting to contemporary cultural contexts.",
    comparisonTo: {
      "A005": "Sri Lankan Kolam and Indonesian masks share Southeast Asian cultural connections while maintaining distinct regional characteristics. Both traditions emphasize the transformative power of masks in bridging human and supernatural realms."
    }
  },
  {
    id: "A012",
    name: "Buddhist Votive Tablet",
    category: "Religious Objects",
    era: "Medieval Period",
    origin: "Southeast Asia",
    image: "/images/A012_1.jpg",
    description: "A clay or terracotta tablet impressed with Buddhist imagery, created as acts of merit-making and devotion.",
    details: {
      material: "Terracotta or clay, sometimes with gold leaf",
      function: "Merit-making, devotional practice, pilgrimage souvenirs",
      dimensions: "Typically 5-15cm",
      symbolism: "Accumulation of spiritual merit, devotion to Buddha and Dharma"
    },
    similarArtifacts: ["A003", "A004", "A013"],
    aiAnalysis: "Buddhist votive tablets represent a widespread practice across the Buddhist world, serving as tangible expressions of devotion and merit-making. These small objects, often mass-produced using molds, democratized religious practice by allowing ordinary devotees to participate in creating sacred images. The tablets were deposited in stupas, placed in shrines, or carried as protective amulets. The imagery typically depicts Buddha figures, stupas, or important Buddhist symbols, sometimes with inscribed dharani (sacred verses). This artifact category demonstrates how Buddhist material culture adapted to local contexts while maintaining pan-Asian connections through shared iconographic traditions.",
    comparisonTo: {
      "A003": "Both artifacts serve Buddhist devotional purposes but operate at different scales—moonstones as permanent architectural features and votive tablets as portable personal objects. They represent complementary aspects of Buddhist material culture."
    }
  },
  {
    id: "A013",
    name: "Nissanka Latha Mandapaya Column",
    category: "Architectural Elements",
    era: "12th Century CE",
    origin: "Sri Lanka (Polonnaruwa)",
    image: "/images/A013_nissaka_3.jpg",
    description: "An ornate stone column from the famous Nissanka Latha Mandapaya, featuring lotus stem design unique to Sri Lankan Buddhist architecture.",
    details: {
      material: "Granite stone",
      function: "Structural and decorative element of royal meditation pavilion",
      dimensions: "Height approximately 2-2.5 meters",
      symbolism: "Royal patronage, Buddhist devotion, and artistic excellence"
    },
    similarArtifacts: ["A003", "A004", "A012"],
    aiAnalysis: "The Nissanka Latha Mandapaya columns represent the pinnacle of Polonnaruwa period architectural innovation. King Nissankamalla commissioned this unique structure for meditation and recitation of Buddhist texts. The columns' lotus-stem design, curving gracefully like natural flower stems, demonstrates extraordinary engineering and artistic achievement. This organic form, unprecedented in South Asian architecture, required sophisticated stone-carving techniques to achieve the delicate curves while maintaining structural integrity. The structure exemplifies the Polonnaruwa period's distinctive aesthetic that combined indigenous Sri Lankan elements with broader South Asian and Southeast Asian influences.",
    comparisonTo: {
      "A004": "Both represent architectural elements from Sri Lankan Buddhist sites, but serve different functions. Guard stones protect entrances while mandapaya columns support meditation structures. Together they demonstrate the range of architectural innovation in medieval Sri Lanka."
    }
  }
];

// Helper function to get artifact by ID
export const getArtifactById = (id) => {
  return ARTIFACTS_DATA.find(artifact => artifact.id === id);
};

// Get similar artifacts with similarity scores
export const getSimilarArtifacts = (artifactId) => {
  const artifact = getArtifactById(artifactId);
  if (!artifact) return [];
  
  return artifact.similarArtifacts.map(id => {
    const similarArtifact = getArtifactById(id);
    if (!similarArtifact) return null;
    
    // Generate a mock similarity score between 75-98%
    const baseScore = 75 + Math.random() * 23;
    return {
      ...similarArtifact,
      similarityScore: Math.round(baseScore)
    };
  }).filter(Boolean).sort((a, b) => b.similarityScore - a.similarityScore);
};

// Get unique categories
export const getCategories = () => {
  const categories = [...new Set(ARTIFACTS_DATA.map(a => a.category))];
  return categories.sort();
};

// Get unique eras
export const getEras = () => {
  const eras = [...new Set(ARTIFACTS_DATA.map(a => a.era))];
  return eras.sort();
};

// Get unique origins
export const getOrigins = () => {
  const origins = [...new Set(ARTIFACTS_DATA.map(a => a.origin))];
  return origins.sort();
};

// Filter artifacts
export const filterArtifacts = (searchTerm = '', category = '', era = '', origin = '') => {
  return ARTIFACTS_DATA.filter(artifact => {
    const matchesSearch = !searchTerm || 
      artifact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artifact.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artifact.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !category || artifact.category === category;
    const matchesEra = !era || artifact.era === era;
    const matchesOrigin = !origin || artifact.origin === origin;
    
    return matchesSearch && matchesCategory && matchesEra && matchesOrigin;
  });
};
