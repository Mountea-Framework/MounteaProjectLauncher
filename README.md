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

https://github.com/user-attachments/assets/2b08bb3d-6a9a-4664-9b73-97f33eb3fc7e

<p align="center" width="100%">
    <img width="49%" src="https://github.com/user-attachments/assets/6ff137d6-c7c4-43e8-a3b9-f43cb8a4a34f">
    <img width="49%" src="https://github.com/user-attachments/assets/20e2dc20-be82-4588-ae38-a264ec0a4707">
</p>

<p align="center" width="100%">
    <img width="49%" src="https://github.com/user-attachments/assets/60464a95-79e3-41cf-9fc8-99f994fa2877">
    <img width="49%" src="https://github.com/user-attachments/assets/50cbe8f7-5051-445f-afa1-9841b5688c85">
</p>


### Clone

```bash
git clone https://github.com/Mountea-Framework/MounteaProjectLauncher.git
```

## Prerequisites
Before you begin, ensure you have the following installed:

- Node.js 24 LTS and npm

## Development
```
npm ci
npm run lint    # full type-aware ESLint checks (requires installed dependencies)
npm run dev     # Electron app with hot reload
npm test        # core unit tests (scan, command, store)
npm run build   # type-check and build renderer + Electron bundles
```

## Usage
Projects are found automatically from the recent-projects list, your Documents\Unreal Projects folder and any scan roots you add in Settings. Select a project to choose engine, map and launch mode; each project keeps its own saved selections.

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
