import { Image, type ImageSource } from 'expo-image';
import { StyleSheet } from "react-native";

type Props = {
    imgSource: ImageSource;
    selectedImage?: string;
};

export default function ImageViewer({ imgSource, selectedImage }: Props) {
    const selectImgSource = selectedImage ? { uri: selectedImage } : imgSource; // Conditional operation to select image source (? might mean if not null)

    return <Image source={selectImgSource} style={styles.image} />; // Image component's source prop does a conditional operation (might be able to accept multiple types of source [file data, uri, etc.])
}

const styles = StyleSheet.create({
    image: {
        width: 320,
        height: 440,
        borderRadius: 18,
    },
});