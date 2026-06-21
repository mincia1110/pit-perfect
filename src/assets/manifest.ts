export const assetManifest = {
  keyart: { key: 'keyart', path: 'assets/keyart/pit-perfect-keyart.png', width: 1536, height: 1024 },
  pit: { key: 'pitbox-scene', path: 'assets/pit/pitbox-scene.png', width: 1672, height: 941 },
  pitMarkings: { key: 'pit-markings', path: 'assets/pit/markings.svg', width: 1200, height: 800 },
  car: { key: 'hypercar-generated', path: 'assets/cars/original-hypercar.png', width: 1254, height: 1254 },
  carSilhouette: { key: 'hypercar-silhouette', path: 'assets/cars/hypercar.svg', width: 320, height: 760 },
  operator: { key: 'operator', path: 'assets/crew/operator.svg', width: 180, height: 180 },
  wheel: { key: 'wheel', path: 'assets/ui/wheel.svg', width: 128, height: 128 },
} as const;

export type AssetKey = keyof typeof assetManifest;
