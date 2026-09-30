import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

export const display = loadOswald("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
}).fontFamily;
export const body = loadInter("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
}).fontFamily;

export const C = {
  bg: "#07090d",
  ink: "#f3f1ec",
  dim: "#9aa3b2",
  faint: "#5b6475",
  accent: "#e0a53b", // amber: pins, highlights
  red: "#d6453d", // strikes, stamps
  panel: "rgba(10,13,19,0.86)",
  land: "#161c27",
  landHi: "#1f2837",
  border: "#3b475b",
  water: "#06080c",
};
