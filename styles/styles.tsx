import { StyleSheet } from 'react-native';

export const colors = { //Default Colors (Light Mode) | Dark Mode Colors will change these colors to others
  background: '#fff',
  white: '#fff',
  offWhite: '#AFAFAF',
  black: '#000',
  offBlack: '#070c1f',
  lightBrown: '#e2c19e',
  darkBrown: '#582e2d',
  darkGreen: '#3b8439',
  midGreen: '#54ab41',
  lightGreen: '#4dbe46',
  grey: '#A9A9A9',
  divider: '#f2f2f2',
  inactive: '#bbb',
  text: '#222',
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
    padding: 5,
  },
});

export const settingStyles = StyleSheet.create({
  settingsDrawer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '85%',
        padding: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  drawerTitle: {
    color: '#070c1f',
    fontSize: 20,
    fontWeight: 'bold',
  },
  settingsContent: {
    marginTop: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 15,
  },
});

