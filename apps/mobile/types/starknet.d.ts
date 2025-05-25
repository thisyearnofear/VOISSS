declare module "starknet" {
  export class Nostr {
    keysService: {
      generateKeyPair(): { public: string; private: string };
    };
    relaysService: {
      init(config: { relaysUrl: string[] }): Promise<void>;
      disconnectFromRelays(): Promise<void>;
      sendEventToRelaysAsync(event: any): Promise<void>;
    };
    createEvent(params: {
      kind: number;
      content: string;
      tags: string[][];
    }): any;
  }
}
