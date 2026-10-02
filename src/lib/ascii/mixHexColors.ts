const HEX_CHANNEL_STARTS = [1, 3, 5] as const;

export function mixHexColors(fromColor: string, toColor: string, share: number): string {
  const channels = HEX_CHANNEL_STARTS.map((start) => {
    const fromChannel = parseInt(fromColor.slice(start, start + 2), 16);
    const toChannel = parseInt(toColor.slice(start, start + 2), 16);
    return Math.round(fromChannel + (toChannel - fromChannel) * share);
  });
  return `rgb(${channels.join(",")})`;
}
