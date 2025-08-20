import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport';
import { TurboModuleRegistry } from 'react-native';

// This interface defines the contract between your JS and Native code.
// The method names and parameters MUST match exactly.
export interface Spec extends TurboModule {
  onUserClicked(
    username: string,
    href: string
  ): Promise<any>;

  onLinkClicked(
    href: string,
    text: string | null,
    target: string | null
  ): Promise<any>;

  onImageClicked(
    src: string,
    alt: string | null,
    imgClass: string | null
  ): Promise<any>;
}

// Register the module with the name you'll use to call it from JS.
// This MUST match the name in your native implementation.
export default TurboModuleRegistry.getEnforcing<Spec>('ElementClickHandler');
