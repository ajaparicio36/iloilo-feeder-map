import * as fs from "fs";
import * as path from "path";

interface BarangayProperties {
  adm4_en: string;
  adm4_psgc: string;
  [key: string]: any;
}

interface GeoJSONFeature {
  properties: BarangayProperties;
  [key: string]: any;
}

interface GeoJSONData {
  features: GeoJSONFeature[];
  [key: string]: any;
}

interface BarangayDataset {
  barangay: Array<{
    name: string;
    psgcId: string;
  }>;
}

function extractBarangayData(): void {
  try {
    // Read the GeoJSON file
    const geoJsonPath = path.join(__dirname, "public", "barangay-data.json");
    const rawData = fs.readFileSync(geoJsonPath, "utf8");
    const geoJsonData: GeoJSONData = JSON.parse(rawData);

    // Extract barangay names and PSGC codes
    const barangayList = geoJsonData.features
      .filter(
        (feature) => feature.properties.adm4_en && feature.properties.adm4_psgc
      )
      .map((feature) => ({
        name: feature.properties.adm4_en,
        psgcId: feature.properties.adm4_psgc,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

    // Create the dataset structure
    const dataset: BarangayDataset = {
      barangay: barangayList,
    };

    // Write to barangay-dataset.json
    const outputPath = path.join(__dirname, "public", "barangay-dataset.json");
    fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2), "utf8");

    console.log(
      `Successfully extracted ${barangayList.length} barangays to barangay-dataset.json`
    );

    // Print all barangay names
    console.log("\nBarangay names:");
    barangayList.forEach((barangay) => {
      console.log(`- ${barangay.name} (${barangay.psgcId})`);
    });
  } catch (error) {
    console.error("Error extracting barangay data:", error);
  }
}

// Run the extraction
extractBarangayData();
