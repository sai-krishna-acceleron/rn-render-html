import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport';
import { TurboModuleRegistry } from 'react-native';

// This interface defines the contract between your JS and Native code.
// The method names and parameters MUST match exactly.
export interface Spec extends TurboModule {
  fetchWindow(
    baseUrl: string,
    topicId: string,
    postNumber: string | null // Use `| null` for nullable types
  ): Promise<any>; // Promises should resolve with the data you expect

  fetchNext(
    baseUrl: string,
    topicId: string,
    lastPostNumber: string
  ): Promise<any>;

  fetchPrev(
    baseUrl: string,
    topicId: string,
    firstPostNumber: string
  ): Promise<any>;
}

// Register the module with the name you'll use to call it from JS.
// This MUST match the name in your native implementation.
export default TurboModuleRegistry.getEnforcing<Spec>('PostsFetcher');
