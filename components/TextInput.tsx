import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { commonStyles } from '@/styles/styles'; 

export default function CustomInput(props: TextInputProps) {
  return (
    <TextInput
      style={[commonStyles.textInput, props.style]}
      placeholderTextColor="#AFAFAF"
      returnKeyType='done'
      {...props}
    />
  );
}
