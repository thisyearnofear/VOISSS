module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { unstable_transformImportMeta: true }]
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./",
          },
        },
      ],
    ],
    // Optimize babel for better performance
    env: {
      development: {
        compact: true,
        comments: false,
      },
      production: {
        compact: true,
        comments: false,
      },
    },
  };
};
