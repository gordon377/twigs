import { StyleSheet } from 'react-native';

export const colors = {
  background: '#25292e',
  white: '#fff',
  offWhite: '#AFAFAF',
  black: '#000',
  darkBrown: '#e2c19e',
  lightBrown: '#582e2d',
  darkGreen: '#3b8439',
  midGreen: '#54ab41',
  lightGreen: '#4dbe46',
};

//Default Font: Open Sans or Alt: Delius Swash Caps

export const commonStyles = StyleSheet.create({
  textInput: {
    width: 250,
    height: 40,
    margin: 12,
    marginHorizontal: 20,
    color: '#fff',
    borderWidth: 3,
    borderColor: '#fff',
    padding: 10,
  },
});

