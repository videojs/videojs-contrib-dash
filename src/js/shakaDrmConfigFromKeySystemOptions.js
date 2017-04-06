/*
 * Iterate over the `keySystemOptions` array and convert each object into
 * the type of object Shaka Player expects.
 */
export default function shakaDrmConfigFromKeySystemOptions(keySystemOptions) {
  const servers = Object.assign(...keySystemOptions
    .filter(ks => !!ks.options)
    .map(ks => ({ [ks.name]: ks.options.serverURL })));

  return { drm: { servers } };
}