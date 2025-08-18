
import React, { useState, useRef, useCallback, memo } from 'react';
import {
  useWindowDimensions,
  FlatList,
  Text,
  StyleSheet,
  Image,
  View,
  ActivityIndicator,
  NativeModules
} from 'react-native';
import RenderHtml from 'react-native-render-html';

const { PostsFetcher } = NativeModules;


function HtmlRenderer({ sources, baseDomain }): React.JSX.Element {
  const { width } = useWindowDimensions();
  const jsonData = JSON.parse(sources);
  const postStream = jsonData.post_stream;
  const topicTitle = jsonData.title;
  const topicId = jsonData.id;
  const postsCount = jsonData.posts_count;
  const stream = postStream.stream; // Contains the list of all post IDs in the topic
  const chunkSize = jsonData.chunk_size || 20;

  // Maintain State in variables
  const [posts, setPosts] = useState(postStream.posts);
  const [pageNumber, setPageNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(postStream.posts.length < stream.length);
  const [error, setError] = useState<string | null>(null);

  // Track loaded post IDs so far
  const loadedPostIds = useRef(new Set(posts.map(p => p.id)));

  // Helper to get the next chunk of postIDs
  const getNextPostIds = useCallback(() => {
    const loadedLength = posts.length;
    return stream.slice(loadedLength, loadedLength + chunkSize).filter(id => !loadedPostIds.current.has(id));
  }, [posts.length, stream, chunkSize]);

  // Load more posts
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    const nextPostIds = getNextPostIds();
    if (nextPostIds.length === 0) {
      setHasMore(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const response = await PostsFetcher.fetchPosts(baseDomain, topicId, nextPostIds);
      const newPosts = response.post_stream.posts;
      // Update the `posts` array in state to update in the ui as well
      setPosts(prev => [...prev, ...newPosts]);
      // Update the ref (doesnt help with UI changes) and not destryed with layout changes
      newPosts.forEach(p => loadedPostIds.current.add(p.id));
      // Update page number to possibly load the next ones.
      setPageNumber(prev => prev + 1);
      // Set in advance the list has ended to avoid additional computation
      if (posts.length + newPosts.length >= stream.length) setHasMore(false);
    } catch (e) {
      console.error('PostsFetcher Error: ', e);
      setError('Failed: ' + e);
    }
    setIsLoading(false);
  }, [isLoading, hasMore, error, getNextPostIds, topicId, posts.length, stream.length, baseDomain]);

  // Retry handler
  const handleRetry = () => {
    setError(null);
    loadMore();
  };

  const handleEndReached = () => {
    if (!isLoading && !error) {
      loadMore();
    }
  }

  const PageFooter = () => {
    if (isLoading) {
      return (
        <View style={{ padding: 30 }}>
          <ActivityIndicator size="large" />
        </View>
      )
    }
    if (error) {
      return (
        <View style={{ padding: 30, alignItems: 'center' }}>
          <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>
          <Text style={{ color: 'blue' }} onPress={handleRetry}>Retry</Text>
        </View>
      )
    }
    if (!hasMore) {
      return <View style={{ height: 60 }} />;
    }
    return null;
  }

  const TopicHeading = ({ heading_params }) => {
    // topic_title: string, post_count: number
    return (
      <Text style={{ fontSize: 24, fontFamily: 'Sans-Serif', fontWeight: 700 }}>
        {heading_params.topic_title} [{heading_params.post_count}]
      </Text>
    )
  };

  // Handle PostAuthor render

  const getAvatarUrl = useCallback((avatarTemplate: string) => {
    if (avatarTemplate.startsWith('http')) {
      return avatarTemplate.replace(/{size}/g, "256");
    }
    if (avatarTemplate.startsWith('//')) {
      return `https:${avatarTemplate.replace(/{size}/g, "256")}`;
    }
    // Fallback: when there is a relative path provided
    return `${baseDomain}${avatarTemplate.replace(/{size}/g, "256")}`;
  }, [baseDomain]);

  const PostItemAuthorView = memo(({ author_params }: PostAuthorProps) => {
    const displayName = author_params.name || author_params.username;
    return (
      <View style={styles.authorContainer}>
        <Image
          source={{ uri: getAvatarUrl(author_params.avatar_template) }}
          style={styles.authorAvatar}
        />
        <View style={styles.authorDetailContainer}>
          <Text style={{ fontWeight: 700, fontSize: 18 }}>{displayName}</Text>
        </View>
      </View>
    )
  });



  // const TopicPost = ({postContent}) => {
  //   return (
  //     <View style={{ padding: 20 }}>
  //       <Text>{postContent}</Text>
  //     </View>
  //   )
  // }

  const PostItemView = memo(({ each_post }: PostItemViewProps) => {
    return (
      <View>
        <PostItemAuthorView author_params={{
          avatar_template: each_post.avatar_template,
          name: each_post.name,
          username: each_post.username
        }}
        />
        <View style={{ padding: 20 }}>
          <RenderHtml
            source={{ html: each_post.cooked }}
            tagsStyles={tagsStyles}
            contentWidth={width}
            ignoredDomTags={[]} />
        </View>
      </View>
    );
  }, (prev, next) => prev.each_post.id === next.each_post.id);

  const renderPostItem = useCallback(
    ({ item }) => <PostItemView each_post={item} />,
    []
  );

  const keyExtractor = useCallback(postItem => String(postItem.id), []);

  return (
    <View style={{ width: width }}>
      <TopicHeading heading_params={{ topic_title: topicTitle, post_count: postsCount }} />
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={keyExtractor}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={PageFooter}
        ItemSeparatorComponent={
          ({ highlighted }) => (
            <View style={{ backgroundColor: 'red', height: 2, marginTop: 10, marginBottom: 10 }} />
          )
        }
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviewstrue
      />
    </View>
  )
}


type AuthorParams = {
  avatar_template: string;
  name?: string;
  username: string;
};

type PostAuthorProps = {
  author_params: AuthorParams;
};

type PostItemViewProps = {
  each_post: any;
};


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

const tagsStyles = {
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


export default HtmlRenderer;