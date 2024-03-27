import subprocess
import json
from pathlib import Path


def read_config():
    try:
        with open('DefaultConfig.json', 'r') as config_file:
            return json.load(config_file)
    except Exception as e:
        print(f"Failed to read config file: {e}")
        return {}

# The config file must contains an entry for launch commands in the following formats:
# "launch_commands": {
#   "Server": "\"{executable}\" \"{uproject_path}\" {map_path} -server -log",
#   "Client": "\"{executable}\" \"{uproject_path}\" {map_path}?listen -game -WINDOWED -ResX=1200 -ResY=800 -log",
#   "Standalone": "\"{executable}\" \"{uproject_path}\" {map_path} -game -WINDOWED -ResX=1200 -ResY=800 -log"
# }


config = read_config()


def construct_command(selected_map, selected_mode, uproject_file, project_directory, unreal_versions_info):
    if not selected_map or not selected_mode or not uproject_file:
        print("Missing required parameters to construct the command.")
        return ""

    # Retrieve the full path to the selected Unreal Engine version's editor executable
    editor_executable = unreal_versions_info.get(selected_mode)

    # Check if we have a launch command format for the selected mode
    launch_command_format = config.get("launch_commands", {}).get(selected_mode)
    if not launch_command_format:
        print(f"Error: Launch command format for {selected_mode} not found in the config.")
        return ""

    # Format the command with the necessary paths
    uproject_path = Path(project_directory) / uproject_file
    map_path = f'"{selected_map}"' if selected_map else ""

    # Note: The `map_path` variable must be enclosed in double quotes if it is not empty,
    # to ensure that the command works correctly with paths that contain spaces.

    command = launch_command_format.format(
        executable=editor_executable,
        uproject_path=uproject_path,
        map_path=map_path
    )
    
    return command


def execute_command(command):
    try:
        # The actual execution of the command can be separated into its own function for clarity
        subprocess.Popen(command, shell=True)
        print(f"Launched with command: {command}")
    except Exception as e:
        print(f"Failed to execute the command: {e}")
