
import React from 'react';
import {
  useWindowDimensions,
  FlatList,
  Text,
  StyleSheet,
  Image,
  View,
} from 'react-native';
import RenderHtml from 'react-native-render-html';


function HtmlRenderer({sources}): React.JSX.Element {
  // const isDarkMode = useColorScheme() === 'dark';

  // var finalSource = ""
  // sources.reduce(
  //   (accumulator: string, currentValue: string) => accumulator + "<br/><br/>--------------------<br/><br/>" + currentValue, finalSource
  // )


  // const backgroundStyle = {
  //   backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  // };


  let jsonData = JSON.parse(sources)
  let postStream = jsonData.post_stream
  let topicTitle = jsonData.title
  let posts = postStream.posts
  let topicPostsCount = jsonData.posts_count

  const TopicHeading = ({heading_params}) => {
    // topic_title: string, post_count: number
    return (
      <Text style={{ fontSize: 24, fontFamily: 'Sans-Serif', fontWeight: 700 }}>
        {heading_params.topic_title} [{heading_params.post_count}]
      </Text>
    )
  };

  const TopicAuthor = ({author_params}) => {    
    return (
      <View style={styles.authorContainer}>
        <Image source={{ uri: `https://meta.discourse.org${author_params.avatar_template}`.replace(/{size}/g, "256") }} style={styles.authorAvatar} />
        <View style={styles.authorDetailContainer}>
          <Text style={{ fontWeight: 700, fontSize: 18 }}>{author_params.name}</Text>
        </View>
      </View>
    )
  }

  // const TopicPost = ({postContent}) => {
  //   return (
  //     <View style={{ padding: 20 }}>
  //       <Text>{postContent}</Text>
  //     </View>
  //   )
  // }

  const ListItem = ({each_post}) => {
    return (
      <View>
        <TopicAuthor author_params={{ avatar_template: each_post.avatar_template, name: each_post.username }}/>
        <View style={{ padding: 20 }}>
          <RenderHtml
            source={{ html: each_post.cooked }}
            tagsStyles={tagsS}
            contentWidth={width} 
            ignoredDomTags={['svg', 'details']} />
        </View>
      </View>
    )
  }

  const styles = StyleSheet.create({
    authorContainer: {
      flex: 1,
      padding: 10,
      flexDirection: 'row'
    },
    authorDetailContainer: {
      //flex: 4,
    },
    authorAvatar: {
      //flex: 1,
      width: 40,
      height: 40,
      borderRadius: 20,
      overflow: "hidden",
      borderWidth: 2,
      borderColor: "green",
      marginRight: 10,
    }
  });

  const tagsS = {
    // body: {
    //   whiteSpace: 'normal',
    //   color: 'gray'
    // },
    // a: {
    //   color: 'green'
    // },
    code: {
      fontSize: 7,
      borderRadius: 15,
      borderWidth: 2,
      borderColor: 'blue',
      backgroundColor: '#abdcca'
    }
  };

  const classesStyles = {

    "topic-avatar": {
      borderRadius: 10,
      width: 40,
      height: 40,
      overflow: "hidden",
      borderWidth: 2,
      borderColor: "green",
      marginRight: 10,
    }

  };


  const { width } = useWindowDimensions();

  return (
    <View style={{ width: width}}>
      <TopicHeading heading_params={{ topic_title: topicTitle, post_count: topicPostsCount }} />
      <FlatList
        data={posts}
        renderItem={({item}) => <ListItem each_post={item} />}
        keyExtractor={postItem => postItem.id}
        ItemSeparatorComponent={ 
          ({highlighted}) => (
            <View style={{ backgroundColor: 'red', height: 2, marginTop: 10, marginBottom: 10}} />
          )
         }
      />
    </View>
  )
}

export default HtmlRenderer;