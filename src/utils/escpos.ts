export const EscPos = {
  init: (): number[] => [0x1B, 0x40],
  alignLeft: (): number[] => [0x1B, 0x61, 0x00],
  alignCenter: (): number[] => [0x1B, 0x61, 0x01],
  alignRight: (): number[] => [0x1B, 0x61, 0x02],
  boldOn: (): number[] => [0x1B, 0x45, 0x01],
  boldOff: (): number[] => [0x1B, 0x45, 0x00],
  textSizeNormal: (): number[] => [0x1D, 0x21, 0x00],
  textSizeDouble: (): number[] => [0x1D, 0x21, 0x11],
  feed: (): number[] => [0x0A],
  text: (str: string): number[] => {
    // Replace rupee symbol since basic printers lack the codepage
    const cleanStr = str.replace(/₹/g, 'Rs.');
    const bytes: number[] = [];
    for (let i = 0; i < cleanStr.length; i++) {
      // Basic ASCII encoding
      bytes.push(cleanStr.charCodeAt(i) & 0xFF);
    }
    return bytes;
  }
};
