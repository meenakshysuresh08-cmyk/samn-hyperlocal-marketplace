import React, { useEffect, useState } from 'react';

import { AppRadioButton } from './AppRadioButton';
import { AppRadioGroupProps } from './types';
import { createRadioStyles } from './styles';
import { useThemeStore } from '../../theme/useThemeStore';
import { useIsRTL } from '../../hooks/useIsRTL';
import { AppView } from '../AppView';

export const AppRadioGroup: React.FC<AppRadioGroupProps> = ({
  options,
  value,
  defaultValue,
  onChange,
  disabled,
  containerStyle,
  optionStyle,
  labelStyle,
}) => {
  const theme = useThemeStore(s => s.theme);
  const isRTL = useIsRTL();
    const styles = createRadioStyles(theme, isRTL);

  const [selected, setSelected] = useState<string | number | null>(
    value ?? defaultValue ?? null,
  );

  useEffect(() => {
    if (value !== undefined) setSelected(value);
  }, [value]);

  const handleSelect = (val: string | number) => {
    if (disabled) return;
    setSelected(val);
    onChange?.(val);
  };

  return (
    <AppView style={[styles.groupContainer, containerStyle]}>
      {options.map(opt => (
        <AppRadioButton
          key={opt.value}
          selected={selected === opt.value}
          label={opt.label}
          description={opt.description}
          onPress={() => handleSelect(opt.value)}
          disabled={disabled}
          containerStyle={optionStyle}
          labelStyle={labelStyle}
        />
      ))}
    </AppView>
  );
};
