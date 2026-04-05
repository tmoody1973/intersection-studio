/**
 * Development zone detection for MKE neighborhoods.
 * Queries ArcGIS special_districts layers to find which
 * TID/BID/TIN/OZ/NID zones intersect each neighborhood envelope.
 */

import { spatialFeatures, type Envelope } from "./arcgis";

const SPECIAL_DISTRICTS_BASE =
  "https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/planning/special_districts/MapServer";

const ZONE_LAYERS = {
  tid: { layer: 8, fields: "TID,NAME" },
  bid: { layer: 3, fields: "BID,BIDNAME" },
  nid: { layer: 5, fields: "NID_NAME" },
  opportunityZones: { layer: 9, fields: "TRACTCE10" },
  tin: { layer: 13, fields: "TIN,ALTNAME" },
} as const;

export interface DevelopmentZones {
  tidDistricts: string;
  bidDistricts: string;
  tinDistricts: string;
  opportunityZones: string;
  nidDistricts: string;
}

/**
 * Fetch all development zones that intersect a neighborhood envelope.
 * Returns JSON strings for each zone type.
 */
export async function fetchDevelopmentZones(
  envelope: Envelope,
): Promise<DevelopmentZones> {
  const [tidFeatures, bidFeatures, nidFeatures, ozFeatures, tinFeatures] =
    await Promise.all([
      spatialFeatures(
        `${SPECIAL_DISTRICTS_BASE}/${ZONE_LAYERS.tid.layer}`,
        "1=1",
        ZONE_LAYERS.tid.fields,
        envelope,
      ),
      spatialFeatures(
        `${SPECIAL_DISTRICTS_BASE}/${ZONE_LAYERS.bid.layer}`,
        "1=1",
        ZONE_LAYERS.bid.fields,
        envelope,
      ),
      spatialFeatures(
        `${SPECIAL_DISTRICTS_BASE}/${ZONE_LAYERS.nid.layer}`,
        "1=1",
        ZONE_LAYERS.nid.fields,
        envelope,
      ),
      spatialFeatures(
        `${SPECIAL_DISTRICTS_BASE}/${ZONE_LAYERS.opportunityZones.layer}`,
        "1=1",
        ZONE_LAYERS.opportunityZones.fields,
        envelope,
      ),
      spatialFeatures(
        `${SPECIAL_DISTRICTS_BASE}/${ZONE_LAYERS.tin.layer}`,
        "1=1",
        ZONE_LAYERS.tin.fields,
        envelope,
      ),
    ]);

  return {
    tidDistricts: JSON.stringify(tidFeatures),
    bidDistricts: JSON.stringify(bidFeatures),
    tinDistricts: JSON.stringify(tinFeatures),
    opportunityZones: JSON.stringify(ozFeatures),
    nidDistricts: JSON.stringify(nidFeatures),
  };
}
