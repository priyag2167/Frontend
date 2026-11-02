export function getBrandTheme(color: string | null | undefined) {
  const accent = color && /^#[0-9a-f]{6}$/i.test(color) ? color : "#117b67";
  const channels = [1, 3, 5].map((offset) => {
    const channel = parseInt(accent.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance =
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  const contrast = luminance > 0.179 ? "#000000" : "#ffffff";

  return {
    "--accent": accent,
    "--accent-contrast": contrast,
    "--accent-hover": `color-mix(in srgb, ${accent} 90%, ${contrast === "#ffffff" ? "#000000" : "#ffffff"})`,
  };
}
