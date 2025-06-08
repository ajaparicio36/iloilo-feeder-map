export interface BarangayData {
  adm1_psgc: string;
  adm2_psgc: string;
  adm3_psgc: string;
  adm4_psgc: string;
  adm4_en: string;
  geo_level: string;
  len_crs: number;
  area_crs: number;
  len_km: number;
  area_km2: number;
}

export interface BarangayFeederData {
  id: string;
  name: string;
  psgcId: string;
  FeederCoverage: Array<{
    feeder: {
      id: string;
      name: string;
      interruptedFeeders: Array<{
        interruption: {
          id: string;
          description: string;
          startTime: string;
          endTime?: string | null;
          type: string;
        } | null;
      }>;
    };
  }>;
}

export interface InterruptionData {
  id: string;
  description: string;
  startTime: string;
  endTime?: string | null;
  type: string;
  polygon?: any;
  customArea?: boolean;
  interruptedFeeders: Array<{
    feeder: {
      id: string;
      name: string;
      feederCoverage: Array<{
        barangay: {
          id: string;
          name: string;
          psgcId: string;
        };
      }>;
    };
  }>;
}

export interface MapProps {
  selectedBarangay?: string | null;
  filters: { feeders: string[]; interruptions: string[] };
  geoData: any;
  barangayData: BarangayFeederData[];
  interruptions: InterruptionData[];
}

export interface ClickedBarangayData {
  geoData: BarangayData;
  feederData: BarangayFeederData | null;
}
