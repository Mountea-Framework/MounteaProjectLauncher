import json
import os
import glob
from pathlib import Path


CONFIG_PATH = 'DefaultConfig.json'
CONFIG_FILE = ""


def get_relative_path(root_path, filename):
    # Get the directory of the current script
    script_dir = root_path #.replace('\\', '/')
    
    # Search for the file recursively in the script directory and its subfolders
    for root, dirs, files in os.walk(script_dir):
        if filename in files:
            # If the file is found, return its relative path
            return os.path.join(root, filename)
    
    # If the file is not found in the script directory or its subfolders, return None
    return None


def read_config(root_Path):
    """
    Reads the configuration from a JSON file.

    :param root_Path: Path to the root folder of this project.
    :return: A dictionary with the configuration data.
    """

    # Construct the absolute path to the configuration file
    config_path = os.path.join(root_Path, CONFIG_PATH)
    try:
        with open(config_path, 'r') as config_file:
            CONFIG_FILE = json.load(config_file)
            return CONFIG_FILE
    except Exception as e:
        print(f"Failed to read config file: {e}")
        return {}


def find_unreal_project(directory):
    """
    Searches for a .uproject file in the specified directory.

    :param directory: The directory to search in.
    :return: The path to the .uproject file if found, None otherwise.
    """
    uproject_files = list(Path(directory).glob('*.uproject'))
    if uproject_files:
        return str(uproject_files[0])
    return None


def get_friendly_name(file_path):
    """
    Extracts a friendly name from a file path by removing the extension and directories.

    :param file_path: The full path to the file.
    :return: A friendly name for the file.
    """
    return os.path.basename(file_path).replace('.umap', '')


def save_state_to_json(data, file_path='state.json'):
    """
    Saves application state to a JSON file.

    :param data: The data to save.
    :param file_path: The file path to save the data to.
    """
    try:
        with open(file_path, 'w') as file:
            json.dump(data, file, indent=4)
    except Exception as e:
        print(f"Failed to save state to {file_path}: {e}")


def load_state_from_json(file_path='state.json'):
    """
    Loads application state from a JSON file.

    :param file_path: The file path to load the data from.
    :return: The loaded data if successful, None otherwise.
    """
    try:
        with open(file_path, 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        print(f"State file {file_path} not found.")
        return None
    except json.JSONDecodeError:
        print(f"Error decoding JSON from the state file {file_path}.")
        return None


def find_umap_files(project_directory):
    """
    Finds all .umap files within the specified project directory,
    including in both the main content directory and any plugin directories.

    Args:
    - project_directory: Path to the project directory.

    Returns:
    A dictionary mapping friendly map names to their Unreal Engine paths.
    """
    def get_friendly_name(full_path):
        # Define your logic for getting the friendly name here
        # For example, you might want to extract the base name of the file
        return os.path.basename(full_path)

    project_content_dir = os.path.join(project_directory, 'Content')
    plugin_dirs = glob.glob(os.path.join(project_directory, 'Plugins', '*', 'Content'), recursive=True)
    
    project_umap_files = glob.glob(os.path.join(project_content_dir, '**/*.umap'), recursive=True)

    plugin_umap_files = []
    for plugin_dir in plugin_dirs:
        plugin_umap_files.extend(glob.glob(os.path.join(plugin_dir, '**/*.umap'), recursive=True))
    
    all_umap_files = project_umap_files + plugin_umap_files
    maps_with_paths = {}

    for full_path in all_umap_files:
        if project_content_dir in full_path:
            relative_path = os.path.relpath(full_path, project_content_dir)
            unreal_path = '/Game/' + relative_path.replace('\\', '/').replace('.umap', '')
        else:
            for plugin_dir in plugin_dirs:
                if plugin_dir in full_path:
                    plugin_name = os.path.basename(os.path.dirname(plugin_dir))
                    relative_path = os.path.relpath(full_path, plugin_dir)
                    unreal_path = f'/{plugin_name}/{relative_path.replace("\\", "/").replace(".umap", "")}'
                    break
        
        friendly_name = get_friendly_name(full_path)
        maps_with_paths[friendly_name] = unreal_path
    
    return maps_with_paths


def has_uproject_file(project_directory):
    """Checks if the project directory contains a .uproject file."""
    return bool(find_unreal_project(project_directory))
    
    
def detect_unreal_versions():
    """Detects installed Unreal Engine versions."""
    versions_info = {}
    paths = read_config().get("unreal_engine_paths", [])
    for path in paths:
        engine_executables = list(Path(path).glob('*/Engine/Binaries/Win64/UE4Editor.exe'))
        for executable in engine_executables:
            build_file_path = executable.parent.parent.parent / 'Build' / 'Build.version'
            try:
                with open(build_file_path, 'r') as build_file:
                    build_data = json.load(build_file)
                    versions_info[f"{build_data['MajorVersion']}.{build_data['MinorVersion']}"] = str(executable)
            except (IOError, KeyError):
                continue
    return versions_info
    
        
    
def load_project_uproject_file(project_directory):
    """Loads the .uproject file from the project directory."""
    # Implementation here