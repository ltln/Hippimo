import { StyleSheet, Text, View } from 'react-native'

export default function LimitsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Màn hình Hạn mức</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
})
