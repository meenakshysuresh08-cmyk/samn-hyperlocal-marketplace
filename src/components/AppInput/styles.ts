import { StyleSheet } from 'react-native';

/** Show/hide password eye icon size (width & height). */
export const SECURE_TOGGLE_ICON_SIZE = 18;

export const AppInputStyles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '600',
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 52, // more space for floating label
  },

  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    // paddingTop: 0, // add spacing for floating label
  },

  iconButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },

  helperText: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },

  errorText: {
    fontSize: 12,
    marginTop: 4,
    color: 'red',
  },
});
