import { StyleSheet } from 'react-native';

export const colors = { //Default Colors (Light Mode) | Dark Mode Colors will change these colors to others
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
    padding: 5,
  },
});

export const settingStyles = StyleSheet.create({
  settingsDrawer: {
        backgroundColor: '#25292e',
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
    color: '#fff',
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

