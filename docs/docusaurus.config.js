// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const darkCodeTheme = require('prism-react-renderer/themes/dracula')
const lightCodeTheme = require('prism-react-renderer/themes/github')

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Perfsee',
  tagline: 'Perfsee the frontend performance analysis platform',
  url: 'https://perfsee.512.pub',
  baseUrl: '/docs/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: '/favicon.ico',
  organizationName: 'perfsee',
  projectName: 'perfsee',
  staticDirectories: ['assets'],
  trailingSlash: false,
  markdown: {
    mermaid: true,
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      {
        theme: {
          customCss: [require.resolve('./src/css/custom.css')],
        },
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl: 'https://github.com/skywalker512/perfsee/tree/main/docs/',
          routeBasePath: '/',
        },
        blog: false,
        pages: false,
      },
    ],
  ],

  themes: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        docsRouteBasePath: '/',
        hashed: true,
        language: ['en', 'zh'],
        highlightSearchTermsOnTargetPage: true,
      },
    ],
    '@docusaurus/theme-mermaid',
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    {
      mermaid: {
        theme: { light: 'neutral', dark: 'forest' },
      },
      navbar: {
        hideOnScroll: true,
        title: 'Perfsee',
        logo: {
          alt: 'Logo',
          src: '/logo.png',
          href: 'https://perfsee.512.pub',
          target: '_self',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'documentsSidebar',
            position: 'left',
            label: 'Docs',
          },
          {
            type: 'docSidebar',
            position: 'left',
            label: 'Development',
            sidebarId: 'apiSidebar',
          },
          {
            type: 'localeDropdown',
            position: 'right',
          },
          {
            href: 'https://github.com/skywalker512/perfsee',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Products',
            items: [
              {
                label: 'Perfsee',
                href: 'https://perfsee.512.pub',
              },
            ],
          },
          {
            title: 'Docs',
            items: [
              {
                label: 'Documents',
                to: '/',
              },
              {
                label: 'Develop',
                to: '/development/dev/architecture',
              },
              {
                label: 'API',
                to: '/development/api',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/skywalker512/perfsee',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Perfsee.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    },

  i18n: {
    defaultLocale: 'en',
    locales: ['cn', 'en'],
    localeConfigs: {
      en: {
        label: 'English',
        htmlLang: 'en-GB',
      },
      cn: {
        label: '简体中文',
        htmlLang: 'zh-CN',
      },
    },
  },
}

module.exports = config
