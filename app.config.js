import appConfig from "./app.json" with { type: "json" };

export default ({ config }) => ({
  ...config,
  ...appConfig.expo,
  android: {
    ...appConfig.expo.android,
    usesCleartextTraffic: process.env.NODE_ENV !== "production",
  },
});
