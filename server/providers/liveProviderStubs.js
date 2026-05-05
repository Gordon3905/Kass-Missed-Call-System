export function createUnavailableLiveProvider(name) {
  return new Proxy(
    {},
    {
      get() {
        return async () => {
          throw new Error(`${name} live provider is configured but no live adapter has been implemented in this scaffold.`);
        };
      },
    },
  );
}
