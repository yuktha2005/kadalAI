module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Remove fork-ts-checker-webpack-plugin to avoid ajv compatibility issues
      const forkTsCheckerIndex = webpackConfig.plugins.findIndex(
        plugin => plugin.constructor.name === 'ForkTsCheckerWebpackPlugin'
      );
      if (forkTsCheckerIndex !== -1) {
        webpackConfig.plugins.splice(forkTsCheckerIndex, 1);
      }
      return webpackConfig;
    },
  },
};

