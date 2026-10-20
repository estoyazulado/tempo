import {
 View,
 Text,
 StyleSheet,
 ScrollView,
 Image,
 TouchableOpacity
} from "react-native";


export default function Home(){

return(

<ScrollView style={styles.container}>


<Text style={styles.title}>
Hi John,
</Text>


<Text style={styles.subtitle}>
Ready to explore your music?
</Text>


</ScrollView>

)

}



const styles = StyleSheet.create({

container:{
backgroundColor:"#171717",
flex:1,
padding:20
},

title:{
color:"white",
fontSize:22,
fontWeight:"bold"
},

subtitle:{
color:"#c5ff00",
fontSize:16,
fontWeight:"700"
}

})

const periods=[
"4 weeks",
"6 months",
"1 year"
];


{
periods.map((item,index)=>(

<TouchableOpacity>

<Text>
{item}
</Text>

</TouchableOpacity>

))
}