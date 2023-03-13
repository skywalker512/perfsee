---
id: plugin-options
title: Plugin Options
sidebar_position: 4
---

### Plugin Options

```ts
interface Options {
  /**
   * Your project ID on Perfsee platform.
   *
   * **Required if you want ot upload the build to Perfsee platform for further analysis.**
   */
  project?: string

  /**
   * Your Perfsee platform url.
   *
   * Used for private deployment of Perfsee, equivalent to setting `PERFSEE_PLATFORM_HOST`.
   */
  platform?: string

  /**
   * Authentication token used for uploading build to remote server.
   * will also read from env `PERFSEE_TOKEN` if not provided.
   *
   * @environment `PERFSEE_TOKEN`
   */
  token?: string

  /**
   * Give a uniq name for the bundled artifact.
   *
   * This option will be very useful when there are multiple builds in a single commit(in single CI progress)
   *
   * Because the comparison with historical builds is based on `Entrypoint`, and if multiple builds
   * emit same entrypoint names, we can't detect which entrypoint is the correct one to be compared.
   *
   * e.g. `build-1/main` and `build-2/main` are more confusing then `landing/main` and `customers/main`.
   *
   * @default 'main'
   */
  artifactName?: string

  /**
   * Enable analysis and audit right after bundle emitted.
   *
   * With this option being `true`, perfsee will output bundle analyzed result in-place in CI workflow,
   * or start a server which serves html report viewer in non-CI environment.
   *
   * It would slow down the progress if enabled.
   *
   * @environment `PERFSEE_AUDIT`
   *
   * @default false
   * @default true // "in CI environment"
   */
  enableAudit?: boolean

  /**
   * Used to customize project's own bundle auditing logic.
   *
   * Return `true` means this bundle should pass auditing, `false` to fail.
   *
   * Only used when `enableAudit` is true.
   *
   * @default (score) => score >= 80
   */
  shouldPassAudit?: (score: number, result: BundleResult) => Promise<boolean> | boolean

  /**
   * Fail the progress if bundle audit not pass and exit with non-zero code.
   *
   * set to `true` to fail the CI pipeline.
   *
   * @default false
   */
  failIfNotPass?: boolean

  /**
   * Options for output bundle report static html file.
   * Only used when `enableAudit` is true.
   */
  reportOptions?: {
    /**
     * Automatically open report in default browser.
     *
     * @default true
     */
    openBrowser?: boolean

    /**
     * Path to bundle report file that will be generated.
     * It can be either an absolute path or a path relative to a bundle output directory.
     *
     * By default the report will be output in the cache directory.
     */
    fileName?: string
  }
}
```
