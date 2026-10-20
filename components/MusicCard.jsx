export default function MusicCard({
title,
artist,
image
}){


return(

<View style={styles.card}>


<Image
source={{uri:image}}
style={styles.image}
/>


<Text>
{title}
</Text>


<Text>
{artist}
</Text>


</View>


)

}