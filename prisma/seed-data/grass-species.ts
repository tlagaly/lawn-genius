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
    commonMixes: ["Fine Fescue", "Perennial Ryegrass"]
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
    commonMixes: ["Kentucky Bluegrass", "Perennial Ryegrass"]
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
    commonMixes: ["Zoysia"]
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
    commonMixes: ["Bermuda Grass"]
  }
];