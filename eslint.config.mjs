import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
  ...nextCoreWebVitals,
  {
    rules: {
      '@next/next/no-img-element': 'warn',
      // New React-compiler style checks: reported as warnings so they can be cleaned up gradually.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/incompatible-library': 'warn',
      '@next/next/no-location-assign-relative-destination': 'warn',
    },
  },
];

export default config;
