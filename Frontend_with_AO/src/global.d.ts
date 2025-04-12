export {};

declare global {
  interface Window {
    arweaveWallet?: {
      connect(permissions: string[]): Promise<void>;
      disconnect(): Promise<void>;
      getActiveAddress(): Promise<string>;
      // Add other methods or properties as needed
    };
  }
}