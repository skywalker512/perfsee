import Module from 'node:module'

import { SVG_REGEX, DefaultBuilderPlugin } from '@modern-js/builder-shared'

import svgoConfig from './svgo.config.json'

const require = Module.createRequire(import.meta.url)

export const svgPluginSvg: () => DefaultBuilderPlugin = () => ({
  name: 'perfsee-plugin-svg',
  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
      const rule = chain.module.rule(CHAIN_ID.RULE.SVG).test(SVG_REGEX)
      rule
        .oneOf(CHAIN_ID.ONE_OF.SVG)
        .use(CHAIN_ID.USE.SVGR)
        .clear()
        .loader(require.resolve('@svgr/webpack'))
        .options({ icon: true, svgoConfig })
        .end()
    })
  },
})
