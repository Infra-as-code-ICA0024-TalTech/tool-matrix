# ICA0024 tool matrix

An interactive version of the supplied **SM INDEX** lecture chart, extended with an inventory of automation tools and supporting tools used or documented in the course demos. Filter tools by name, demo, or category. Selection is reflected in both the radar chart and exact-value table and is preserved in the page URL.

## Data and scope

Edit [site/data/tool-matrix.csv](site/data/tool-matrix.csv). It is the only source for tool names, scores, categories, demo references, and notes. No scores are duplicated in the page code.

The CSV contains **32 tools**. The three scored profiles were visually transcribed from the supplied [source image](site/assets/source-chart.png):

| Tool | Idempotent | Declarative | Query | Execution | Modularity | Documentation |
|---|---:|---:|---:|---:|---:|---:|
| Kubernetes | 9 | 10 | 5 | 8 | 1 | 5 |
| Ansible | 4 | 6 | 6 | 3 | 4 | 5 |
| Terraform | 9 | 9 | 8 | 7 | 6 | 8 |

Scores use the slide's 0–10 scale. The image does not provide a rubric, tool versions, or an assessment date. Its scores are preserved as teaching material, not presented as current independent benchmarks. The expansion of “SM” is not specified in the image.

The additional 29 tools have **blank scores**, recorded as `unscored`. No numeric ratings were inferred from the mere presence of a tool in a demo. Missing values appear as dashes in the table; only tools with all six scores are plotted. A numeric zero is a real score, not a missing value. To add scores, fill the six numeric cells and update `score_source` and `notes` with the rating method, context, and review date.

The inventory was reviewed on 21 September 2026 across the local demo repositories: `demo-01`, `demo-02`, `demo-03a` through `demo-03e`, `demo-04a` through `demo-04d`, `demo-05`, and `demo-06`. It includes:

- Infrastructure definition, configuration, image-building, and orchestration tools.
- Explicit supporting workflow tools, testing tools, installation managers, and runtimes documented in the demos. Optional tools are identified in the notes.
- Kubernetes from the source slide, clearly marked as not found as a deployment tool in the inspected demos.

The scope excludes deployed application services (such as the web server and database), individual libraries, and general operating-system utilities installed as base packages. Puppet/OpenVox and Chef/Cinc are represented as tool-family/distribution pairs; they are not counted twice. Demo references link to the private teaching repositories and require course access. No demo source contents, credentials, state files, or deployment outputs are copied here.

### CSV columns

`tool`, `idempotent`, `declarative`, `query`, `execution`, `modularity`, `documentation`, `category`, `demos`, `evidence`, `score_source`, `notes`.

- Scores: a number from 0 through 10, or a blank field.
- Category: currently `Infrastructure`, `Workflow`, or `Runtime`.
- Demos: semicolon-separated repository names.
- Evidence: semicolon-separated `demo-name/path/to/file` references, or `assets/source-chart.png` for the slide.
- Quote a CSV field containing commas, quotes, or newlines using standard CSV escaping.
- Each tool name must be unique. Adding a row automatically adds a filter and a table entry.

## Local development

Requires Node.js 22+ for checks/build and Python 3 for the preview server. There are no npm dependencies to install.

```sh
npm test
npm run build
npm run serve
```

Open `http://localhost:8080`. The browser fetches the CSV, so serve the directory rather than opening `index.html` directly with a `file:` URL. The generated site is in `dist/`; edits belong in `site/`.

VS Code tasks provide **Matrix: Validate**, **Matrix: Build**, and **Matrix: Preview**. The build task is the default build task. The preview task supports the Windows Python launcher as well as macOS/Linux `python3`.

## GitHub Pages pipeline

[.github/workflows/pages.yml](.github/workflows/pages.yml) runs tests and builds on pull requests, pushes to `main`, and manual dispatch. When the repository variable `PAGES_ENABLED` is set to `true`, successful `main` pushes deploy the `dist/` artifact using the official GitHub Pages Actions. Pull requests always validate without deploying. Until Pages is enabled, pushes still run the tests and build.

Before the first deployment, choose **Settings > Pages > Source: GitHub Actions**, then set the repository Actions variable `PAGES_ENABLED` to `true`. Run the workflow manually or push to `main`. Deployment uses the `github-pages` environment with `pages: write` and `id-token: write`; the build has read-only repository permissions.

The repository is `Infra-as-code-ICA0024-TalTech/tool-matrix`, with the project site at `https://infra-as-code-ica0024-taltech.github.io/tool-matrix/` once deployment is enabled and succeeds. On the organization's Free plan, Pages requires a public repository; the repository is private with the organization's existing member permissions, and Pages publication is pending approval of public visibility.

References: [GitHub Pages availability](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Verification

The Node tests cover the transcribed scores, missing versus zero values, CSV quoting, invalid scores, duplicate names, filters, and radar geometry. Browser checks cover desktop/mobile rendering, selection persistence, search, categories, unscored tools, and empty selections.
