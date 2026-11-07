[![Documentation](https://img.shields.io/badge/documentation-github?style=flat&logo=GitHub&labelColor=5a5a5a&color=98c510)](https://github.com/Mountea-Framework/MounteaProjectLauncher/wiki)
[![license](https://img.shields.io/badge/license-MPL%202.0-98c510?style=flat&labelColor=5a5a5a&link=https://raw.githubusercontent.com/Mountea-Framework/MounteaProjectLauncher/master/LICENSE)](https://github.com/Mountea-Framework/MounteaProjectLauncher/blob/master/LICENSE)
[![YouTube](https://img.shields.io/badge/YouTube-Subscribe-red?style=flat&logo=youtube)](https://www.youtube.com/@mounteaframework)
[![Discord](https://badgen.net/discord/online-members/2vXWEEN?label=&logoColor=ffffff&color=7389D8&icon=discord)](https://discord.com/invite/2vXWEEN)
[![Discord](https://badgen.net/discord/members/2vXWEEN?label=&logo=discord&logoColor=ffffff&color=7389D8&icon=discord)](https://discord.com/invite/2vXWEEN)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/d54a50e410184ddbb012dd24c3fd2bd0)](https://app.codacy.com/gh/Mountea-Framework/MounteaProjectLauncher/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)

# Mountea Project Launcher

Mountea Project Launcher is a tool designed to facilitate the launching of Unreal Engine projects with ease. It provides a graphical user interface that allows users to load Unreal Engine maps, select launch options, and manage different versions of the Unreal Engine installed on their system.

## Features

- **Map Loading**: Dynamically load all `.umap` files within an Unreal Engine project directory.
- **Launch Options**: Choose how to launch the project (Server, Client, Standalone).
- **Engine Version Detection**: Automatically detects installed Unreal Engine versions.
- **Command Preview**: View the command that will be run based on current selections.

## Getting Started

To get started with Mountea Project Launcher, clone the repository or download the latest release.

### Example

<p align="center" width="100%">
    <img width="66%" src="https://github.com/Mountea-Framework/MounteaProjectLauncher/assets/37410226/5e0010bb-c5da-44ce-a661-2d27c8cbc33a">
</p>

<p align="center" width="100%">
    <img width="40%" src="https://github.com/Mountea-Framework/MounteaProjectLauncher/assets/37410226/b2dc31af-d406-4d93-a5bd-d68358cfa9ef">
    <img width="40%" src="https://github.com/Mountea-Framework/MounteaProjectLauncher/assets/37410226/9d43b751-f035-47eb-98ac-9587988787b3">
</p>

<p align="center" width="100%">
    <img width="40%" src="https://github.com/Mountea-Framework/MounteaProjectLauncher/assets/37410226/43532fbe-8d52-4ad3-9d5a-bdc1524bf082">
    <img width="40%" src="https://github.com/Mountea-Framework/MounteaProjectLauncher/assets/37410226/694383a6-78e4-48ec-93d3-24c6c6b16caf">
</p>


### Clone

```bash
git clone https://github.com/Mountea-Framework/MounteaProjectLauncher.git
```

## Prerequisites
Before you begin, ensure you have the following installed:

- Node.js 24 LTS and npm
- Windows or macOS 11+ (Intel and Apple Silicon)

## Development
```
npm ci
npm run lint    # full type-aware ESLint checks (requires installed dependencies)
npm run dev     # Electron app with hot reload
npm test        # core unit tests (scan, command, store)
npm run build   # type-check and build renderer + Electron bundles
```

Codacy's hosted analyzer runs without this project's `node_modules`, so `.eslintrc.json` contains the dependency-independent rules. `npm run lint` adds every type-aware rule from the Codacy report through `eslint.typed.cjs`, using the same `tsconfig.json` and dependencies as the build. The Launcher quality workflow installs dependencies and runs both lint passes, tests, and the production build. This keeps unresolved third-party imports from generating false unsafe-type reports without dropping type-aware checks from CI.

Filesystem warnings are reviewed at each access site. The launcher intentionally reads user-selected project and engine paths; reviewed exceptions carry a local explanation instead of disabling filesystem checks across production code.

## Desktop packages

Build on the target operating system with Node.js 24:

```sh
npm ci
npm run package:dir  # unpacked app for the current OS, under release/
npm run package:mac  # run on a Mac: universal Intel + Apple Silicon DMG and ZIP
npm run package:win  # run on Windows: NSIS installer
```

Packages include the production renderer, Electron main/preload bundles, defaults and Mountea icons. No development server is needed. Nothing is published by these commands. Local builds are unsigned unless signing credentials are configured; public macOS distribution requires a Developer ID identity and Apple notarization credentials through electron-builder. The macOS CI job checks the native build/package without signing; a signed DMG and an actual Unreal launch still need validation on a Mac before release.

The launcher has no in-window File/Edit/View menu. macOS retains its native system app, editing and window menus for Command-key shortcuts, Quit, and standard window behavior. Closing the last window keeps the Mac app available in the Dock; clicking its icon reopens the window.

## Usage
Projects are found automatically from Unreal's recent-projects settings, your Documents/Unreal Projects folder and any scan roots you add in Settings. Select a project to choose engine, map and launch mode; each project keeps its own saved selections.

Windows keeps the existing engine search defaults. On macOS, the defaults are `/Users/Shared/Epic Games` and `/Users/Shared/UnrealEngine`; registered source builds are also read from Epic's `Install.ini`. Add or edit an engine folder in Settings for custom installations. UnrealEditor.app and UE4Editor.app bundles are supported, including directly selected bundles. Recent projects are read from modern Application Support settings and compatible Preferences locations. Existing user-selected paths and per-project settings are preserved.

## Contributing
Contributions to the Mountea Project Launcher are welcome! Feel free to submit pull requests or open issues to improve the tool.

## License
Distributed under the MPL 2.0 License. See `LICENSE` for more information.

## About Mountea
Mountea is dedicated to providing tools and frameworks to enhance game development workflows. Check out our other projects!

## Support
For support join our Discord community.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Mountea-Framework/MounteaProjectLauncher&type=Date)](https://star-history.com/#Mountea-Framework/MounteaProjectLauncher&Date)
