export const RocksetPluginVersions = {
  V1: '0.0.1',
  V7: '0.0.7'
};

const RocksetRegionBaseURL = {
  US_WEST_2: 'https://api.usw2a1.rockset.com',
  US_EAST_1: 'https://api.use1a1.rockset.com',
  EU_CENTRAL_1: 'https://api.euc1a1.rockset.com'
};

// NOTE(taha) This is the default value for the region dropdown in the Rockset integration form, as well as the default value for the
// region-based baseURL in the Rockset plugin code (packages/plugins/rockset/src/index.ts). If you change this value, existing Rockset
// integration instances (created using v1) might no longer work. If you absolutely need to change this value, you'll need to run a migration
// to set the baseURL for all existing Rockset integration configurations first.
export const DEFAULT_ROCKSET_REGION_BASE_URL = RocksetRegionBaseURL.US_WEST_2;
