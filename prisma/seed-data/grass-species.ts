type GrassSpeciesInput = {
  name: string;
  scientificName: string;
  type: 'cool-season' | 'warm-season';
  characteristics: {
    growthHabit: string;
    leafTexture: string;
    color: string;
    rootSystem: string;
    droughtTolerance: number;
    shadeTolerance: number;
    wearTolerance: number;
  };
  idealConditions: {
    soilPH: {
      min: number;
      max: number;
    };
    soilTypes: string[];
    temperature: {
      min: number;
      max: number;
      optimal: number;
    };
    annualRainfall: {
      min: number;
      max: number;
    };
  };
  maintenance: {
    mowingHeight: {
      min: number;
      max: number;
      optimal: number;
    };
    wateringNeeds: number;
    fertilizationFrequency: string;
    aerationFrequency: string;
  };
  commonMixes: string[];
  // Image fields
  mainImage?: string;
  images?: string[];
  imageDescriptions?: {
    main?: string;
    additional?: Record<string, string>;
  };
};

export const grassSpeciesData: GrassSpeciesInput[] = [
  {
    name: "Kentucky Bluegrass",
    scientificName: "Poa pratensis",
    type: "cool-season",
    characteristics: {
      growthHabit: "Rhizomatous",
      leafTexture: "Fine to Medium",
      color: "Dark Green",
      rootSystem: "Shallow to Medium",
      droughtTolerance: 3,
      shadeTolerance: 2,
      wearTolerance: 4
    },
    idealConditions: {
      soilPH: {
        min: 6.0,
        max: 7.0
      },
      soilTypes: ["Loam", "Clay Loam", "Sandy Loam"],
      temperature: {
        min: 40,
        max: 85,
        optimal: 65
      },
      annualRainfall: {
        min: 25,
        max: 40
      }
    },
    maintenance: {
      mowingHeight: {
        min: 1.5,
        max: 3.0,
        optimal: 2.5
      },
      wateringNeeds: 4,
      fertilizationFrequency: "3-4 times per year",
      aerationFrequency: "Annually"
    },
    commonMixes: ["Fine Fescue", "Perennial Ryegrass"],
    mainImage: "/images/grass-species/kentucky-bluegrass/main.jpg",
    images: [
      "/images/grass-species/kentucky-bluegrass/growth-stages.jpg",
      "/images/grass-species/kentucky-bluegrass/texture.jpg",
      "/images/grass-species/kentucky-bluegrass/disease-resistance.jpg"
    ],
    imageDescriptions: {
      main: "Mature Kentucky Bluegrass showing characteristic blue-green color and fine texture",
      additional: {
        "growth-stages": "Different growth stages from germination to maturity",
        "texture": "Close-up of leaf blade texture and venation",
        "disease-resistance": "Comparison of disease-resistant varieties"
      }
    }
  },
  {
    name: "Tall Fescue",
    scientificName: "Festuca arundinacea",
    type: "cool-season",
    characteristics: {
      growthHabit: "Bunch-type",
      leafTexture: "Coarse to Medium",
      color: "Dark Green",
      rootSystem: "Deep",
      droughtTolerance: 4,
      shadeTolerance: 3,
      wearTolerance: 5
    },
    idealConditions: {
      soilPH: {
        min: 5.5,
        max: 7.5
      },
      soilTypes: ["Clay", "Loam", "Sandy"],
      temperature: {
        min: 45,
        max: 90,
        optimal: 70
      },
      annualRainfall: {
        min: 20,
        max: 35
      }
    },
    maintenance: {
      mowingHeight: {
        min: 2.0,
        max: 4.0,
        optimal: 3.0
      },
      wateringNeeds: 3,
      fertilizationFrequency: "2-3 times per year",
      aerationFrequency: "Annually"
    },
    commonMixes: ["Kentucky Bluegrass", "Perennial Ryegrass"],
    mainImage: "/images/grass-species/tall-fescue/main.jpg",
    images: [
      "/images/grass-species/tall-fescue/root-system.jpg",
      "/images/grass-species/tall-fescue/drought-tolerance.jpg",
      "/images/grass-species/tall-fescue/shade-performance.jpg"
    ],
    imageDescriptions: {
      main: "Mature Tall Fescue showing characteristic coarse texture and deep green color",
      additional: {
        "root-system": "Deep root system development",
        "drought-tolerance": "Performance under drought conditions",
        "shade-performance": "Growth pattern in partial shade"
      }
    }
  },
  {
    name: "Bermuda Grass",
    scientificName: "Cynodon dactylon",
    type: "warm-season",
    characteristics: {
      growthHabit: "Stoloniferous and Rhizomatous",
      leafTexture: "Fine to Medium",
      color: "Dark Green",
      rootSystem: "Deep",
      droughtTolerance: 5,
      shadeTolerance: 1,
      wearTolerance: 5
    },
    idealConditions: {
      soilPH: {
        min: 6.0,
        max: 7.5
      },
      soilTypes: ["Sandy", "Clay", "Loam"],
      temperature: {
        min: 60,
        max: 95,
        optimal: 80
      },
      annualRainfall: {
        min: 15,
        max: 30
      }
    },
    maintenance: {
      mowingHeight: {
        min: 0.5,
        max: 2.0,
        optimal: 1.5
      },
      wateringNeeds: 3,
      fertilizationFrequency: "4-5 times per year",
      aerationFrequency: "Annually"
    },
    commonMixes: ["Zoysia"],
    mainImage: "/images/grass-species/bermuda/main.jpg",
    images: [
      "/images/grass-species/bermuda/stolons.jpg",
      "/images/grass-species/bermuda/heat-tolerance.jpg",
      "/images/grass-species/bermuda/recovery-rate.jpg"
    ],
    imageDescriptions: {
      main: "Mature Bermuda grass showing dense growth pattern and fine texture",
      additional: {
        "stolons": "Stolon development and spreading pattern",
        "heat-tolerance": "Performance in high temperature conditions",
        "recovery-rate": "Recovery after heavy traffic or stress"
      }
    }
  },
  {
    name: "Zoysia Grass",
    scientificName: "Zoysia japonica",
    type: "warm-season",
    characteristics: {
      growthHabit: "Stoloniferous and Rhizomatous",
      leafTexture: "Fine",
      color: "Medium to Dark Green",
      rootSystem: "Deep",
      droughtTolerance: 4,
      shadeTolerance: 3,
      wearTolerance: 4
    },
    idealConditions: {
      soilPH: {
        min: 6.0,
        max: 7.0
      },
      soilTypes: ["Sandy Loam", "Clay", "Loam"],
      temperature: {
        min: 55,
        max: 95,
        optimal: 80
      },
      annualRainfall: {
        min: 20,
        max: 35
      }
    },
    maintenance: {
      mowingHeight: {
        min: 0.5,
        max: 2.0,
        optimal: 1.0
      },
      wateringNeeds: 2,
      fertilizationFrequency: "2-3 times per year",
      aerationFrequency: "Every 2-3 years"
    },
    commonMixes: ["Bermuda Grass"],
    mainImage: "/images/grass-species/zoysia/main.jpg",
    images: [
      "/images/grass-species/zoysia/density.jpg",
      "/images/grass-species/zoysia/shade-adaptation.jpg",
      "/images/grass-species/zoysia/seasonal-color.jpg"
    ],
    imageDescriptions: {
      main: "Mature Zoysia grass displaying dense growth and fine leaf texture",
      additional: {
        "density": "Close-up of characteristic dense growth pattern",
        "shade-adaptation": "Growth performance in partial shade conditions",
        "seasonal-color": "Color variations through different seasons"
      }
    }
  }
];