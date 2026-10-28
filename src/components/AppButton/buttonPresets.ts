import { AppTheme } from '../../theme/themes';

export interface ButtonPresetResult {
  backgroundColor?: string;
  textColor: string;
  borderColor?: string;
  isGradient?: boolean;
  gradientColors?: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  gradientLocations?: number[];
}

export const buttonPresets = {
  primary: (theme: AppTheme): ButtonPresetResult => ({
    backgroundColor: theme.primary,
    textColor: '#fff',
    borderColor: theme.primary,
  }),

  secondary: (theme: AppTheme): ButtonPresetResult => ({
    backgroundColor: 'transparent',
    textColor: theme.primary,
    borderColor: theme.primary,
  }),

  small: (theme: AppTheme): ButtonPresetResult => ({
    backgroundColor: theme.primary,
    textColor: '#fff',
    borderColor: theme.primary,
  }),

  inline: (theme: AppTheme): ButtonPresetResult => ({
    backgroundColor: 'transparent',
    textColor: theme.primary,
    borderColor: 'transparent',
  }),

  gradientPrimary: (theme: AppTheme): ButtonPresetResult => ({
    textColor: '#fff',
    isGradient: true,
    gradientColors: theme.gradientAuthButton,
    start: { x: 0, y: 0.5 },
    end: { x: 1, y: 0.5 },
  }),

  gradientSecondary: (theme: AppTheme): ButtonPresetResult => ({
    textColor: '#fff',
    isGradient: true,
    gradientColors: theme.gradientAuthButton,
    start: { x: 0.3, y: 0.3 },
    end: { x: 1, y: 0.3 },
    gradientLocations: [0.3, 1.0],
  }),

  gradientDisabled: (_theme: AppTheme): ButtonPresetResult => ({
    textColor: '#F9FAFB',
    isGradient: true,
    gradientColors: ['#9CA3AF', '#6B7280'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  }),

  danger: (theme: AppTheme): ButtonPresetResult => ({
    backgroundColor: '#F44336',
    textColor: '#fff',
    borderColor: '#F44336',
  }),
};
