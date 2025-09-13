declare module 'bun' {
  interface Env {
    DEV?: string;
    FOUNDRY_DATA_PATH: string;
    FOUNDRY_RELEASE_TOKEN: string;
    GH_API_TOKEN?: string;
    OSTYPE: string;
    RELEASE_VERSION?: string;
  }
}

export {};
