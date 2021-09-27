// vue.config.js

/**
 * @type {import('@vue/cli-service').ProjectOptions}
 */
 module.exports = {
    // options...
    publicPath: '',
    css: {
      loaderOptions: {
        sass: {
          additionalData: `@import "@/assets/sass/variables.scss";`
        }
      }
    }
  }
  