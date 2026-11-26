import { Easing } from 'react-native';

export const motion = {
  duration: {
    instant: 0,
    fast: 100,
    standard: 200,
    emphasis: 300,
  },
  easing: {
    standard: Easing.bezier(0.2, 0, 0, 1),
    emphasized: Easing.bezier(0.2, 0, 0, 1),
    linear: Easing.linear,
  },
  scale: {
    pressed: 0.98,
    subtle: 0.99,
  },
  opacity: {
    pressed: 0.88,
    disabled: 0.5,
  },
} as const;
