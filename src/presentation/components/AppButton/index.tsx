import { JSX } from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { colors, glass, spacing, typography, radius } from '../../../core/theme'

type AppButtonProps = {
  text: string
  onPress: () => void
  variant: 'primary' | 'secondary'
  disabled?: boolean
}

export const AppButton = ({
  text,
  onPress,
  variant,
  disabled = false,
}: AppButtonProps): JSX.Element => {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        variant === 'primary' ? styles.primary : styles.secondary,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
      accessibilityRole="button"
    >
      <Text
        style={[
          styles.text,
          variant === 'primary' ? styles.textPrimary : styles.textSecondary,
          disabled && styles.disabledText,
        ]}
      >
        {text}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: glass.surfacePrimary,
    borderColor: glass.border,
    borderWidth: 1,
    shadowColor: glass.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  secondary: {
    backgroundColor: glass.surfaceSecondary,
    borderWidth: 1,
    borderColor: glass.border,
    shadowColor: glass.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  text: {
    fontSize: typography.subtitle,
    fontWeight: '600',
  },
  textPrimary: {
    color: colors.surface,
  },
  textSecondary: {
    color: colors.textPrimary,
  },
  disabled: {
    backgroundColor: 'rgba(107, 114, 128, 0.16)',
    borderColor: glass.borderAccent,
  },
  disabledText: {
    color: colors.textPrimary,
  },
})
