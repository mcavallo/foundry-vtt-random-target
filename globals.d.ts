declare module 'bun' {
  interface Env {
    OSTYPE: string;

    DEV?: string;
    RELEASE_VERSION?: string;

    FOUNDRY_DATA_PATH: string;
    FOUNDRY_RELEASE_TOKEN: string;
    GH_API_TOKEN?: string;
  }
}

export {};
