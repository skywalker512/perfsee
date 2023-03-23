/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  documentsSidebar: [
    'intro',
    'get-started',
    { type: 'category', label: 'Bundle Analysis', items: [{ type: 'autogenerated', dirName: 'bundle' }] },
    { type: 'category', label: 'Lab Analysis', items: [{ type: 'autogenerated', dirName: 'lab' }] },
    { type: 'category', label: 'Source Analysis', items: [{ type: 'autogenerated', dirName: 'source' }] },
    { type: 'category', label: 'Project Settings', items: [{ type: 'autogenerated', dirName: 'settings' }] },
    { type: 'doc', label: 'Group View', id: 'group' },
    { type: 'doc', label: 'FAQ', id: 'qa' },
  ],
  apiSidebar: [{ type: 'autogenerated', dirName: 'development' }],
}

module.exports = sidebars
