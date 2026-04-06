/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as config from "../config.js";
import type * as crons from "../crons.js";
import type * as etl_arcgis from "../etl/arcgis.js";
import type * as etl_census from "../etl/census.js";
import type * as etl_community from "../etl/community.js";
import type * as etl_coordinates from "../etl/coordinates.js";
import type * as etl_csv from "../etl/csv.js";
import type * as etl_economic from "../etl/economic.js";
import type * as etl_historical from "../etl/historical.js";
import type * as etl_zones from "../etl/zones.js";
import type * as maiCache from "../maiCache.js";
import type * as neighborhoods from "../neighborhoods.js";
import type * as sync from "../sync.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  config: typeof config;
  crons: typeof crons;
  "etl/arcgis": typeof etl_arcgis;
  "etl/census": typeof etl_census;
  "etl/community": typeof etl_community;
  "etl/coordinates": typeof etl_coordinates;
  "etl/csv": typeof etl_csv;
  "etl/economic": typeof etl_economic;
  "etl/historical": typeof etl_historical;
  "etl/zones": typeof etl_zones;
  maiCache: typeof maiCache;
  neighborhoods: typeof neighborhoods;
  sync: typeof sync;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
