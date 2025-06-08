import { BarangayFeederData, BarangayData } from "@/types/map";

export const fixEncoding = (text: string): string => {
  if (!text) return text;

  return text
    .replace(/Ã±/g, "ñ")
    .replace(/Ã¡/g, "á")
    .replace(/Ã©/g, "é")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ãº/g, "ú")
    .replace(/Ã¿/g, "ÿ")
    .replace(/Ã/g, "Á")
    .replace(/Ã‰/g, "É")
    .replace(/Ã/g, "Í")
    .replace(/Ã"/g, "Ó")
    .replace(/Ãš/g, "Ú")
    .replace(/Ã'/g, "Ñ");
};

export const hasActiveInterruption = (
  feederData: BarangayFeederData
): boolean => {
  if (!feederData || !feederData.FeederCoverage) {
    return false;
  }

  return feederData.FeederCoverage.some((coverage) => {
    if (!coverage.feeder || !coverage.feeder.interruptedFeeders) {
      return false;
    }
    return coverage.feeder.interruptedFeeders.some(
      (interrupted) => interrupted.interruption
    );
  });
};

export const getBarangayFeederData = (
  psgcId: string,
  barangayData: BarangayFeederData[],
  geoData: any
): BarangayFeederData | null => {
  if (!barangayData || barangayData.length === 0) {
    return null;
  }

  const found = barangayData.find((b) => b.psgcId === psgcId);

  if (!found && psgcId) {
    // Try to find by name as fallback with encoding fix
    const nameFromGeo = geoData?.features?.find(
      (f: any) => f.properties?.adm4_psgc === psgcId
    )?.properties?.adm4_en;

    if (nameFromGeo) {
      const fixedNameFromGeo = fixEncoding(nameFromGeo);

      const foundByName = barangayData.find((b) => {
        const fixedDbName = fixEncoding(b.name);
        return fixedDbName.toLowerCase() === fixedNameFromGeo.toLowerCase();
      });

      if (foundByName) {
        return foundByName;
      }
    }
  }

  return found || null;
};

export const isBarangayFiltered = (
  psgcId: string,
  filters: { feeders: string[]; interruptions: string[] },
  barangayData: BarangayFeederData[],
  geoData: any
): boolean => {
  const feederData = getBarangayFeederData(psgcId, barangayData, geoData);
  if (!feederData || !feederData.FeederCoverage) return false;

  // Check if any of the barangay's feeders are in the selected filters
  if (filters.feeders.length > 0) {
    const hasFilteredFeeder = feederData.FeederCoverage.some((coverage) => {
      if (!coverage.feeder) return false;
      return filters.feeders.includes(coverage.feeder.id);
    });
    if (hasFilteredFeeder) return true;
  }

  // Check if any interruptions affect this barangay
  if (filters.interruptions.length > 0) {
    const hasFilteredInterruption = feederData.FeederCoverage.some(
      (coverage) => {
        if (!coverage.feeder || !coverage.feeder.interruptedFeeders)
          return false;
        return coverage.feeder.interruptedFeeders.some(
          (interrupted) =>
            interrupted.interruption &&
            filters.interruptions.includes(interrupted.interruption.id)
        );
      }
    );
    if (hasFilteredInterruption) return true;
  }

  return false;
};
