from .utility import *
from .launch_operations import execute_command, construct_command
from .UnrealLauncherApp_ui import UnrealLauncherAppUI


class UnrealLauncherApp:
    def __init__(self):
        self.maps_with_paths = {}
        self.selected_launch = ""
        self.selected_version = ""
        self.project_directory = ""
        self.selected_project_file = ""
        self.selected_map = ""
        self.command = ""
        self.config = read_config()
        if self.config.get("GUI", False):
            self.initialize_ui()

    def initialize_ui(self):
        ui = UnrealLauncherAppUI(self, self, has_uproject_file(self.project_directory), self.config)
        ui.initialize_ui()

    def set_selected_version(self, version):
        self.selected_version = version
        self.update_command()

    def set_selected_project_file(self, file):
        self.selected_project_file = file
        self.update_command()

    def set_selected_map(self, map):
        self.selected_map = map
        self.update_command()

    def set_selected_launch(self, options):
        self.selected_launch = options
        self.update_command()

    def set_project_directory(self, directory):
        self.project_directory = directory
        self.update_command()

    def set_config(self, config):
        self.config = config
        self.update_command()

    def update_command(self):
        self.command = construct_command(self.selected_map, self.selected_launch,
                                         self.selected_project_file, self.project_directory,
                                         self.selected_version)

    def launch_project(self):
        execute_command(self.command)
