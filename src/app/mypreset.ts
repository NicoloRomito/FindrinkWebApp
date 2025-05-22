import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

const Noir = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{blue.50}',
      100: '{blue.100}',
      200: '{blue.200}',
      300: '{blue.300}',
      400: '{blue.400}',
      500: '{blue.500}',
      600: '{blue.600}',
      700: '{blue.700}',
      800: '{blue.800}',
      900: '{blue.900}',
      950: '{blue.950}'
    },
    colorScheme: {
      dark: {
        primary: {
          color: '{blue.400}',
          inverseColor: '{blue.950}',
          hoverColor: '{blue.100}',
          activeColor: '{blue.200}'
        },
        highlight: {
          background: 'rgb(252,105,52)',
          focusBackground: 'rgb(252,105,52)',
          color: 'rgba(255, 255, 255, 0.9)',
          focusColor: 'rgba(255, 255, 255, 1)'
        },
        background: '#0068ff' // Dark mode page background
      }
    }
  }
});

export default Noir;

