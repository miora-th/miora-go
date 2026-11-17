// Settings for the relay page. Nothing here is secret: the pixel ID and the
// LINE ID are visible to anyone who opens the page anyway.
// Edit this file only; index.html and relay.js stay as they are.
window.MIORA_CONFIG = {
  // Meta Pixel ID (numbers only). Empty = the pixel is not loaded (for tests).
  pixelId: '1861059461987624',

  // LINE Official Account ID, with the '@'.
  lineId: '@miora.official',

  // Message put in the LINE chat when the ad has no message of its own.
  // The ad code is added at the end as ' #A01' (nothing when there is no code).
  defaultMessage: 'ขอดูรูปจริงและราคาแหวนวงนี้ค่ะ',

  // Messages for single ad codes. Example:
  //   A01: 'ขอดูรูปจริงและราคาแหวน AURA ค่ะ',
  messages: {
  },

  // Wait before opening LINE so the pixel event can leave the page (ms).
  openDelayMs: 300,
};
