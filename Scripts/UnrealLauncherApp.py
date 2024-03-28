import tkinter as tk

from .utility import read_config, find_unreal_project, load_state_from_json
from .launch_operations import *
from .UnrealLauncherApp_ui import *


class UnrealLauncherApp:
    def __init__(self, root):
        self.root = root
        self.config = read_config()
        self.project_directory = ""
        self.maps_with_paths = {}
        self.selected_version = tk.StringVar()
        self.launch_options = tk.StringVar(value="Standalone")
        self.initialize_ui()


    def initialize_ui(self):
        # Attempt to load the saved state if exists
        self.state = load_state_from_json()

        # Determine if a project directory has already been selected
        if not self.project_directory or not find_unreal_project(self.project_directory):
            self.setup_selection_page()
        else:
            self.setup_main_page()
            
        setup_version_label(self.root)


    def setup_selection_page(self):
        # This function should create UI elements for project directory selection
        setup_selection_page(self.root, self.select_project_directory_callback)


    def setup_main_page(self):
        # This function sets up the main UI elements of the application
        setup_main_page(self.root, self.maps_with_paths, self.selected_version, self.launch_options, self.launch_project_callback)


    def select_project_directory_callback(self):
        # This callback function is triggered when the user selects a project directory
        self.project_directory = select_project_folder()
        if self.project_directory:
            self.initialize_ui()  # Re-initialize UI with the selected project directory


    def launch_project_callback(self):
        # This callback function is triggered to launch the project
        launch_project(self.project_directory, self.maps_with_paths, self.selected_version.get(), self.launch_options.get())


if __name__ == "__main__":
    root = tk.Tk()
    app = UnrealLauncherApp(root)
    root.mainloop()
