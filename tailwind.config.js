import { getIconCollections, iconsPlugin } from '@egoist/tailwindcss-icons';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [
    iconsPlugin({
      // Select the icon collections you want to use
      collections: getIconCollections(['lucide', 'logos']),
    }),
  ],
};
