import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from "react-native";
import { ThemedText } from "./themed-text";

type ButtonProps = {
    name: string,
    route: any
}

export const Button = (props: ButtonProps) => {
    const router = useRouter()

    return (
        <Pressable style={styles.button}>
            <ThemedText style={styles.buttonText}>{props.name}</ThemedText>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: 'tomato',
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 50,
        marginTop: 15,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
})