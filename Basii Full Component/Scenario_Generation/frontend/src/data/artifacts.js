export const artifacts = [
  {
    id: 'art001',
    name: 'Kandyan Battle Sword (Kasthāne)',
    category: 'Weapon',
    subcategory: 'Royal Armament',
    period: 'Kandyan Era',
    era: '1590–1815',
    location: 'Kandy, Sri Lanka',
    images: ['/images/kasthane.jpg'],
    description: 'The Kastāne was used by Kandyan nobles and ceremonial guards. It symbolizes resistance during the Kandyan Wars (1590–1815), when the kingdom fought Portuguese, Dutch, and British invasions.'
  },
  {
    id: 'art002',
    name: 'Kandyan Mural Painting',
    category: 'Religious Wall Art',
    subcategory: 'Mural',
    period: 'Kandyan Era',
    era: '1700–1800',
    location: 'Temple of the Tooth / Degaldoruwa Temple',
    images: ['/images/mural.jpg'],
    description: 'Kandyan murals depict Buddhist religious scenes using natural pigments. They illustrate Jataka tales, floral motifs, and distinctive Kandyan visual styles.'
  },
  {
    id: 'art003',
    name: 'Kolam Mask (Traditional Dance Mask)',
    category: 'Folk Drama Mask',
    subcategory: 'Performance Art',
    period: '18th century',
    era: '1735 – Present',
    location: 'Southern Sri Lanka (Ambalangoda)',
    images: ['/images/kolam-mask.jpg'],
    description: 'Used in Kolam dance dramas blending humor, satire, and folklore. Traditionally carved from kaduru wood. Kolam performances include characters such as kings, queens, village elders, demons, and social caricatures.'
  },
  {
    id: 'art004',
    name: 'Traditional Clay Pot (Sri Lankan Earthenware)',
    category: 'Domestic Craft',
    subcategory: 'Pottery',
    period: 'Pre-Colonial to Present',
    era: '1000 BCE – Present',
    location: 'Anuradhapura, Hambantota, Kurunegala',
    images: ['/images/clay-pot.jpg'],
    description: 'Clay pottery has been used in Sri Lanka for millennia for cooking, water storage, and rituals. Early civilizations used hand-coiled or wheel-turned clay vessels made from local red clay.'
  },
  {
    id: 'art005',
    name: 'Traditional Sri Lankan Drum (Geta Bera / Yak Bera)',
    category: 'Musical Instrument',
    subcategory: 'Drum',
    period: 'Pre‑colonial to Present',
    era: '3rd century BCE – Present',
    location: 'Kandy / Low-country Sri Lanka',
    images: ['/images/Geta_Bera.jpg', '/images/yak_bera.jpg'],
    description: 'The Geta Bera is a double-headed, barrel-shaped drum used in Kandyan dance. Yak Bera is used in low-country dance traditions, often in ritual and mask dance contexts.'
  },
  {
    id: 'art006',
    name: 'Polonnaruwa Moonstone (Sandakada Pahana)',
    category: 'Architectural Ornament',
    subcategory: 'Stone Sculpture',
    period: 'Polonnaruwa Era',
    era: '11th–12th century CE',
    location: 'Polonnaruwa, Sri Lanka',
    images: ['/images/moonstone.jpg'],
    description: 'The Polonnaruwa Moonstone is a semicircular stone slab carved with concentric bands of animals and floral patterns, found at the entrance of ancient buildings in Polonnaruwa. It symbolizes the cycle of samsara and reflects the fusion of Buddhist symbolism with Sinhalese craftsmanship.'
  },
  {
    id: 'art007',
    name: 'Sigiriya Fresco Fragment',
    category: 'Wall Painting',
    subcategory: 'Fresco',
    period: 'Sigiriya Period',
    era: '477–495 CE',
    location: 'Sigiriya, Sri Lanka',
    images: ['/images/fresco.jpg'],
    description: 'The Sigiriya Frescoes are painted on the western rock face of the Sigiriya fortress, depicting female figures believed to be celestial beings (apsaras) or royal attendants. Executed with natural pigments on plaster, these vibrant frescoes showcase sophisticated technique, perspective, and color usage.'
  },
  {
    id: 'art008',
    name: 'Polonnaruwa Vatadage Relic Casket',
    category: 'Religious Artifact',
    subcategory: 'Stone & Metal Casket',
    period: 'Polonnaruwa Era',
    era: '11th–12th century CE',
    location: 'Polonnaruwa, Sri Lanka',
    images: ['/images/relic-casket.jpg', '/images/Polonnaruwa_Vatadage.jpeg'],
    description: 'The Polonnaruwa Vatadage Relic Casket is a circular stone shrine built to house sacred relics of the Buddha. It was part of the larger Vatadage structure, which exemplifies the Polonnaruwa period\'s architectural innovation and devotion to Buddhist practice.'
  },
  {
    id: 'art009',
    name: 'Isurumuniya Lovers Statue',
    category: 'Rock-cut Sculpture',
    subcategory: 'Monolithic Art',
    period: 'Anuradhapura Period',
    era: '6th–7th century CE',
    location: 'Isurumuniya Temple, Anuradhapura, Sri Lanka',
    images: ['/images/pem-y.jpeg'],
    description: 'The Isurumuniya Lovers is a renowned granite sculpture depicting a seated couple, traditionally identified as Saliya and Asokamala or a divine pair. It demonstrates sophisticated Anuradhapura-era stone carving techniques with smooth surfaces and naturalistic body forms.'
  },
  {
    id: 'art010',
    name: 'Nissankalata Mandapa',
    category: 'Stone Pavilion',
    subcategory: 'Architectural Sculpture',
    period: 'Polonnaruwa Period',
    era: '1170–1196 CE',
    location: 'Polonnaruwa, Sri Lanka',
    images: ['/images/mandapa.jpg'],
    description: 'The Nissankalata Mandapa is a finely carved stone pavilion commissioned by King Nissanka Malla in Polonnaruwa. Its pillars and capitals feature elaborate floral designs, lions, and mythological motifs, demonstrating Polonnaruwa-era architectural and sculptural mastery.'
  }
];

// Helper functions
export const getArtifactById = (id) => {
  return artifacts.find(artifact => artifact.id === id);
};

export const getCategories = () => {
  return [...new Set(artifacts.map(a => a.category))];
};

export const getEras = () => {
  return [...new Set(artifacts.map(a => a.era))];
};

export const getOrigins = () => {
  return [...new Set(artifacts.map(a => a.location))];
};
