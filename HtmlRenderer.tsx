
import React, { useState, useRef, useCallback, memo, useEffect } from 'react';
import {
  useWindowDimensions,
  FlatList,
  Text,
  StyleSheet,
  Image,
  View,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import RenderHtml from 'react-native-render-html';

import PostsFetcher from './specs/NativePostsFetcher';

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


function HtmlRenderer({ baseDomain, topicId, postNumber }): React.JSX.Element {
  const { width } = useWindowDimensions();
  const chunkSize = 20;

  // Loading states
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isLoadingPrev, setIsLoadingPrev] = useState(false);
  const [isLoadingNext, setIsLoadingNext] = useState(false);


  // Maintain State in variables
  const [posts, setPosts] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPrev, setHasPrev] = useState(!!postNumber); // true if postNumber is provided, assuming we are loading from the middle
  const [hasNext, setHasNext] = useState(true);

  // Track present range of post numbers to enable pagination
  const firstPostNumber = useRef<number | null>(null);
  const lastPostNumber = useRef<number | null>(null);


  // Initial topic Load
  const loadInitial = useCallback(async () => {
    setIsLoadingInitial(true);
    setError(null);
    // Load the first time, using `fetchWindow`
    try {
      const response = await PostsFetcher.fetchWindow(
        String(baseDomain),
        String(topicId),
        postNumber != null ? String(postNumber) : null
      );
      setMetadata(response);
      setPosts(response.post_stream.posts);
      if (response.post_stream.posts.length > 0) {
        firstPostNumber.current = response.post_stream.posts[0].post_number;
        lastPostNumber.current = response.post_stream.posts[response.post_stream.posts.length - 1].post_number;
      }
      setHasPrev(!!postNumber);
      setHasNext(true);
    } catch (e) {
      setError('Failed to load posts.');
      console.error('PostsFetcher error:', e);
    }
    setIsLoadingInitial(false);
  }, [baseDomain, topicId, postNumber]);

  // Initial topic load
  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Pagination: load next
  const loadNext = useCallback(async () => {
    if (isLoadingNext || !hasNext || !lastPostNumber.current) return;
    setIsLoadingNext(true);
    setError(null);
    try {
      const response = await PostsFetcher.fetchNext(
        String(baseDomain),
        String(topicId),
        String(lastPostNumber.current)
      );
      const newPosts = response.post_stream.posts;
      if (newPosts.length === 0) setHasNext(false);
      else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const filtered = newPosts.filter(p => !existingIds.has(p.id));
          return [...prev, ...filtered];
        });
        lastPostNumber.current = newPosts[newPosts.length - 1].post_number;
      }
    } catch (e) {
      setError('Failed to load next posts.');
      console.error('PostsFetcher error:', e);
    }
    setIsLoadingNext(false);
  }, [isLoadingNext, hasNext, baseDomain, topicId]);

  // Pagination: load prev
  const loadPrev = useCallback(async () => {
    if (isLoadingPrev || !hasPrev || !firstPostNumber.current) return;
    setIsLoadingPrev(true);
    setError(null);
    try {
      const response = await PostsFetcher.fetchPrev(
        String(baseDomain),
        String(topicId),
        String(firstPostNumber.current)
      );
      const newPosts = response.post_stream.posts;
      if (newPosts.length === 0) setHasPrev(false);
      // TODO: Reverse `newPosts` before inserting in front of the current list
      else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const filtered = newPosts.filter(p => !existingIds.has(p.id));
          return [...filtered, ...prev];
        });
        firstPostNumber.current = newPosts[newPosts.length - 1].post_number;
      }
    } catch (e) {
      setError('Failed to load previous posts.');
      console.error('PostsFetcher error:', e);
    }
    setIsLoadingPrev(false);
  }, [isLoadingPrev, hasPrev, baseDomain, topicId]);


  // End reached handler
  const handleEndReached = () => {
    if (!isLoadingNext && !error && hasNext) {
      loadNext();
    }
  }

  // Beginning reached handler (triggered using onScroll)
  const isHandlingBeginning = useRef(false);
  const handleScroll = useCallback((event) => {
    // Get the current Y offset
    const offsetY = event.nativeEvent.contentOffset.y;
    // If completely scrolled to the beginning 
    if (offsetY <= 0 && hasPrev && !isLoadingPrev && !isHandlingBeginning.current) {
      isHandlingBeginning.current = true;
      loadPrev().finally(() => {
        isHandlingBeginning.current = false;
      });
    }
  }, [hasPrev, isLoadingPrev, loadPrev]);

  // Retry handler
  // const handleRetry = () => {
  //   setError(null);
  //   loadMore();
  // };

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


  const PageFooter = () => {
    if (isLoadingNext) {
      return (
        <View style={{ padding: 30 }}>
          <ActivityIndicator size="large" />
        </View>
      )
    }
    if (error && !isLoadingInitial) {
      return (
        <View style={{ padding: 30, alignItems: 'center' }}>
          <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>
          <TouchableOpacity onPress={loadNext}>
            <Text style={{ color: 'blue' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      )
    }
    if (!hasNext) {
      return <View style={{ height: 60 }} />;
    }
    return null;
  }

  // Initial load error/retry UI
  if (isLoadingInitial || !metadata) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error && !posts.length) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>
        <TouchableOpacity onPress={loadInitial}>
          <Text style={{ color: 'blue' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (metadata && (!posts || posts.length === 0)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No posts found.</Text>
      </View>
    );
  }

  return (
    <View style={{ width: width }}>
      <TopicHeading
        heading_params={{
          topic_title: metadata.fancy_title || metadata.title || "No title",
          post_count: metadata.posts_count || "Unknown"
        }} />
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
        removeClippedSubviews={true}
        // refreshing={isLoadingInitial || isLoadingPrev || isLoadingNext}
        // onRefresh={handleRefresh}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />
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