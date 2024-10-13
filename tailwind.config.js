import { getIconCollections, iconsPlugin } from '@egoist/tailwindcss-icons';
import { gray } from '@radix-ui/colors';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    colors: {
      primary: getColorScale('sky'),
      gray: getColorScale('neutral'),
    },
  },
  plugins: [
    iconsPlugin({
      // Select the icon collections you want to use
      collections: getIconCollections(['lucide', 'logos']),
    }),
  ],
};

function getColorScale(name) {
  let scale = {};
  for (let i = 1; i <= 12; i++) {
    scale[i] = `hsl(var(--${name}-${i}))`;
  }

  return scale;
}
