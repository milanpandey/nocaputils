export const SHOW_TRIPTEA = false;
export const TRIPTEA_PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.triptea.app";

/**
 * Generates a Google Play Store link for TripTea with UTM parameters.
 * 
 * @param pageIdentifier - The identifier for the page where the link is placed.
 * @returns The full Play Store URL with UTM parameters.
 */
export const getTripTeaLink = (pageIdentifier: string) => {
  const params = new URLSearchParams({
    utm_source: "nocaputils",
    utm_medium: "referral",
    utm_campaign: "nocaputils_triptea",
    utm_content: pageIdentifier,
  });

  return `${TRIPTEA_PLAY_STORE_URL}&${params.toString()}`;
};
