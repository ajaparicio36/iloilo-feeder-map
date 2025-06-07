"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
function extractBarangayData() {
    try {
        // Read the GeoJSON file
        var geoJsonPath = path.join(__dirname, "public", "barangay-data.json");
        var rawData = fs.readFileSync(geoJsonPath, "utf8");
        var geoJsonData = JSON.parse(rawData);
        // Extract barangay names and PSGC codes
        var barangayList = geoJsonData.features
            .filter(function (feature) { return feature.properties.adm4_en && feature.properties.adm4_psgc; })
            .map(function (feature) { return ({
            name: feature.properties.adm4_en,
            psgcId: feature.properties.adm4_psgc,
        }); })
            .sort(function (a, b) { return a.name.localeCompare(b.name); }); // Sort alphabetically
        // Create the dataset structure
        var dataset = {
            barangay: barangayList,
        };
        // Write to barangay-dataset.json
        var outputPath = path.join(__dirname, "public", "barangay-dataset.json");
        fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2), "utf8");
        console.log("Successfully extracted ".concat(barangayList.length, " barangays to barangay-dataset.json"));
        // Print all barangay names
        console.log("\nBarangay names:");
        barangayList.forEach(function (barangay) {
            console.log("- ".concat(barangay.name, " (").concat(barangay.psgcId, ")"));
        });
    }
    catch (error) {
        console.error("Error extracting barangay data:", error);
    }
}
// Run the extraction
extractBarangayData();
