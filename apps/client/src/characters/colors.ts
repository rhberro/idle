// Raw color values matching apps/client's Tailwind default palette exactly (this file's
// values are never themed/customized elsewhere in the app). ../chakra-system.ts doesn't
// define "neutral"/"emerald" as design tokens, so these are kept as literal values here
// to keep this Tailwind->Chakra port pixel-faithful rather than drifting onto Chakra's
// differently-tuned default "gray"/"green" token ramps.
const neutral100 = "oklch(97% 0 none)";
const neutral200 = "oklch(92.2% 0 none)";
const neutral400 = "oklch(70.8% 0 none)";
const neutral700 = "oklch(37.1% 0 none)";
const neutral800 = "oklch(26.9% 0 none)";
const red400 = "oklch(70.4% 0.191 22.216)";
const emerald600 = "oklch(59.6% 0.145 163.225)";
const emerald700 = "oklch(50.8% 0.118 165.612)";
const emerald900At40Percent = "oklch(37.8% 0.077 168.94 / 0.4)";

export const primaryTextColor = neutral100;
export const mutedTextColor = neutral400;
export const emphasisTextColor = neutral200;
export const errorTextColor = red400;
export const borderColor = neutral700;
export const surfaceBackground = neutral800;
export const selectedBorderColor = emerald600;
export const selectedBackground = emerald900At40Percent;
export const primaryButtonBackground = emerald700;
export const primaryButtonHoverBackground = emerald600;
