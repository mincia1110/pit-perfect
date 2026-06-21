export const assetManifest = {
  keyart: { key: 'keyart', path: 'assets/keyart/pit-perfect-keyart.png', width: 1536, height: 1024 },
  pit: { key: 'pit-markings', path: 'assets/pit/markings.svg', width: 1200, height: 800 },
  car: { key: 'hypercar', path: 'assets/cars/hypercar.svg', width: 320, height: 760 },
  operator: { key: 'operator', path: 'assets/crew/operator.svg', width: 180, height: 180 },
  wheel: { key: 'wheel', path: 'assets/ui/wheel.svg', width: 128, height: 128 },
} as const;

export type AssetKey = keyof typeof assetManifest;
