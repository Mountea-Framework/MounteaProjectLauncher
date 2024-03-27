import tkinter as tk
from tkinter import filedialog, messagebox, Listbox, Button, Label, Radiobutton, StringVar
import os
import subprocess
import glob
import json
import os
from pathlib import Path


class ToolTip(object):


    def __init__(self, widget):
        self.widget = widget
        self.tip_window = None
        self.id = None
        self.x = self.y = 0
        self.tooltip_after_id = None


    def show_tip(self, text, index):
        """Display text in tooltip window at the specific index"""
        self.text = text
        if self.tip_window or not self.text:
            return
        
        # Calculate the bbox for the specified index
        bbox = self.widget.bbox(index)
        if not bbox:
            return
        x, y, width, height = bbox
        x = x + self.widget.winfo_rootx() + 25
        y = y + self.widget.winfo_rooty() + 20
        self.tip_window = tw = tk.Toplevel(self.widget)
        tw.wm_overrideredirect(True)
        tw.wm_geometry("+%d+%d" % (x, y))
        label = tk.Label(tw, text=self.text, justify=tk.LEFT,
                      background="#ffffe0", relief=tk.SOLID, borderwidth=1,
                      font=("tahoma", "8", "normal"))
        label.pack(ipadx=1)


    def hide_tip(self):
        tw = self.tip_window
        self.tip_window = None
        if tw:
            tw.destroy()


def read_config():
    try:
        with open('DefaultConfig.json', 'r') as config_file:
            return json.load(config_file)
    except Exception as e:
        print(f"Failed to read config file: {e}")
        return {}

config = read_config()


def find_unreal_project(directory):
    # Check in the given directory for any .uproject file
    uproject_files = list(Path(directory).glob("*.uproject"))
    if uproject_files:
        project_directory = str(uproject_files[0].parent)
        return True  # Return True if a .uproject file is found
    return False


def get_friendly_name(umap_path):
    return os.path.basename(umap_path).replace('.umap', '')


class UnrealLauncherApp:


    def __init__(self, root):
        self.root = root
        self.root.title("Unreal Engine Project Launcher")
        self.root.geometry("1600x600")
        self.maps_with_paths = {}
        self.launch_options = StringVar(value="Standalone")
        self.tooltip = None
        self.selected_index = None
        self.tooltip_after_id = None
        self.selected_version = StringVar()
        self.selected_version.trace_add("write", self.update_command_display)
        self.project_directory = ""
        self.initialize_ui()


    def initialize_ui(self):
        if not self.project_directory or not self.has_uproject_file():
            self.setup_selection_page()
        else:
            self.setup_main_page()
            self.maps_listbox.bind("<Motion>", self.on_hover)
            self.maps_listbox.bind("<Leave>", self.on_leave)
            self.maps_listbox.bind("<<ListboxSelect>>", self.on_select)
            script_dir = os.path.dirname(os.path.realpath(__file__))  # Directory of the current script
            icon_path = os.path.join(script_dir, 'MonuteaProjectLauncher.ico')
            if os.path.exists(icon_path):
                self.root.iconbitmap(icon_path)
            self.detect_unreal_versions()
            self.load_project_uproject_file()
            
        self.setup_version_label()
        
    def setup_version_label(self):
        version_text = config.get("version")
        self.version_label = tk.Label(self.root, text=f"Version: {version_text}", fg="grey")
        self.version_label.pack(side=tk.TOP, fill=tk.X)
            
        
    def has_uproject_file(self):
        """Checks if the project directory contains a .uproject file."""
        # Check if project_directory is set and not empty
        if self.project_directory:
            uproject_files = list(Path(self.project_directory).glob("*.uproject"))
            return len(uproject_files) > 0
        return False
        
    def setup_selection_page(self):
        
        # Button to allow user to select a folder
        self.select_project_folder_label = tk.Label(self.root, text="SELECT PROJECT")
        self.select_project_folder_label.pack(fill=tk.X, expand=False)
        
        self.select_project_folder_button = Button(self.root, text="Select Project Folder", command=self.select_project_folder)
        self.select_project_folder_button.pack(pady=10)

    def select_project_folder(self):
        folder_path = filedialog.askdirectory(title="Select Unreal Project Folder")
        if folder_path and find_unreal_project(folder_path):
            self.project_directory = folder_path
            self.initialize_ui()  # Setup the main UI with the selected project
        else:
            messagebox.showerror("Error", "No .uproject file found in the selected directory.")


    def on_hover(self, event=None):
        index = self.maps_listbox.nearest(event.y)

        # Only show the tooltip if the cursor is actually over an item
        if index < self.maps_listbox.size():
            if index != self.selected_index:  # Avoid changing the highlight of the selected row
                self.maps_listbox.selection_clear(0, tk.END)
                self.maps_listbox.selection_set(index)

            selected_friendly_name = self.maps_listbox.get(index)
            unreal_path = self.maps_with_paths.get(selected_friendly_name, '')
            
            if unreal_path:
                if self.tooltip is None:
                    self.tooltip = ToolTip(self.maps_listbox)
                
                # Cancel any existing tooltip
                if self.tooltip_after_id:
                    self.root.after_cancel(self.tooltip_after_id)
                # Schedule the tooltip to be shown after 500ms
                self.tooltip_after_id = self.root.after(500, lambda: self.tooltip.show_tip(unreal_path, index))
        else:
            # Out of bounds, ensure no temporary selection highlight remains
            self.maps_listbox.selection_clear(0, tk.END)
            if self.selected_index is not None:
                # Ensure the actual selection is still highlighted
                self.maps_listbox.selection_set(self.selected_index)


    def on_leave(self, event=None):
        # Cancel any scheduled tooltip showing
        if self.tooltip_after_id:
            self.root.after_cancel(self.tooltip_after_id)
            self.tooltip_after_id = None

        if self.tooltip:
            self.tooltip.hide_tip()  # Hide the tooltip immediately

        self.maps_listbox.selection_clear(0, tk.END)
        if self.selected_index is not None:
            # Restore the actual selection highlight
            self.maps_listbox.selection_set(self.selected_index)


    def on_select(self, event=None):
        # Update the selected index when an item is clicked
        selection = self.maps_listbox.curselection()
        if selection:
            self.selected_index = selection[0]
        else:  # No selection, e.g., when clicking outside the list items
            self.selected_index = None

        self.update_command_display()


    def setup_main_page(self):
        
        for widget in self.root.winfo_children():
            widget.destroy()

        main_paned_window = tk.PanedWindow(self.root, orient=tk.VERTICAL, sashrelief=tk.RAISED)
        main_paned_window.pack(fill=tk.BOTH, expand=True, pady=10, padx=10)

        self.upper_paned_window = tk.PanedWindow(main_paned_window, orient=tk.HORIZONTAL, sashrelief=tk.RAISED)
        self.upper_paned_window.pack(padx=10, pady=10)
        main_paned_window.add(self.upper_paned_window, stretch='always')

        maps_frame = tk.Frame(self.upper_paned_window)
        maps_frame.pack(padx=10, pady=10)
        self.upper_paned_window.add(maps_frame, stretch='always')

        maps_label = tk.Label(maps_frame, text="MAPS")
        maps_label.pack(fill=tk.X, expand=False)

        self.load_button = Button(maps_frame, text="Load Maps", command=self.load_maps)
        self.load_button.pack(pady=10)
        
        self.maps_listbox = Listbox(maps_frame, width=50, height=10)
        scrollbar = tk.Scrollbar(maps_frame, orient="vertical", command=self.maps_listbox.yview)
        self.maps_listbox.configure(yscrollcommand=scrollbar.set)
        self.maps_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        self.right_side_frame = tk.Frame(self.upper_paned_window)
        self.upper_paned_window.add(self.right_side_frame, stretch='always')
        
        launch_modes_frame = tk.Frame(self.right_side_frame)
        launch_modes_label = tk.Label(self.right_side_frame, text="LAUNCH MODES")
        launch_modes_label.pack(fill=tk.BOTH, expand=False)
        
        launch_modes_frame.pack(fill=tk.BOTH, expand=True)
        launch_modes = config.get("launch_commands", {}).keys()
        for mode in launch_modes:
            Radiobutton(
                launch_modes_frame, 
                text=mode, 
                variable=self.launch_options, 
                value=mode, 
                command=self.update_command_display
            ).pack(anchor=tk.W)

        engine_versions_label = tk.Label(self.right_side_frame, text="ENGINE VERSIONS")
        engine_versions_label.pack(fill=tk.BOTH, expand=False)

        bottom_frame = tk.Frame(main_paned_window)
        main_paned_window.add(bottom_frame, stretch='never')
        
        self.command_display_var = tk.StringVar()
        self.command_display_label = tk.Label(bottom_frame, textvariable=self.command_display_var, bg="white", anchor="w", relief="sunken")
        self.command_display_label.pack(fill=tk.X, padx=5, pady=5)

        self.copy_command_button = Button(bottom_frame, text="Copy Command", command=self.copy_text_to_clipboard)
        self.copy_command_button.pack(side=tk.LEFT, padx=5)

         # New bottom frame for the Launch button
        launch_button_frame = tk.Frame(self.root)  # Create the frame
        launch_button_frame.pack(side=tk.BOTTOM, fill=tk.X)
    
        # Configure the Launch button to fill the X-axis in its frame
        self.launch_button = tk.Button(launch_button_frame, text="Launch", state='disabled', command=self.launch_project)
        self.launch_button.pack(fill=tk.X, padx=10, pady=10)
        
        version_label = tk.Label(bottom_frame, text=config.get("version"))      
        

    def copy_text_to_clipboard(self, event=None):
        """Copy the command display label's text to the clipboard."""
        command_text = self.command_display_var.get()
        self.root.clipboard_clear()
        self.root.clipboard_append(command_text)
        messagebox.showinfo("Info", "Command copied to clipboard")


    def setup_warning_page(self):
        warning_label = Label(self.root, text="WARNING: Not in or near an Unreal Engine project folder.", fg="red")
        warning_label.pack(pady=100)


    def load_maps(self):
        project_content_dir = os.path.join(self.project_directory, 'Content')
        plugin_dirs = glob.glob(os.path.join(self.project_directory, 'Plugins', '*', 'Content'), recursive=True)
        
        project_umap_files = glob.glob(os.path.join(project_content_dir, '**/*.umap'), recursive=True)

        plugin_umap_files = []
        for plugin_dir in plugin_dirs:
            plugin_umap_files.extend(glob.glob(os.path.join(plugin_dir, '**/*.umap'), recursive=True))
        
        all_umap_files = project_umap_files + plugin_umap_files
        self.maps_with_paths = {}
        self.maps_listbox.delete(0, tk.END)

        for full_path in all_umap_files:
            # For project maps
            if project_content_dir in full_path:
                relative_path = os.path.relpath(full_path, project_content_dir)
                unreal_path = '/Game/' + relative_path.replace('\\', '/').replace('.umap', '')
            # For plugin maps
            else:
                for plugin_dir in plugin_dirs:
                    if plugin_dir in full_path:
                        plugin_name = os.path.basename(os.path.dirname(plugin_dir))
                        relative_path = os.path.relpath(full_path, plugin_dir)
                        unreal_path = f'/{plugin_name}/{relative_path.replace("\\", "/").replace(".umap", "")}'
                        break
            
            friendly_name = get_friendly_name(full_path)
            self.maps_with_paths[friendly_name] = unreal_path
            self.maps_listbox.insert(tk.END, friendly_name)


    def enable_launch(self):
        if self.maps_listbox.curselection() and self.selected_version.get() in self.unreal_versions_info:
            self.launch_button.config(state='normal')
        else:
            self.launch_button.config(state='disabled')


    def launch_project(self):
        selected_index = self.maps_listbox.curselection()
        if not selected_index:
            messagebox.showwarning("Warning", "Please select a map to launch.")
            return
        selected_friendly_name = self.maps_listbox.get(selected_index)
        selected_map = self.maps_with_paths[selected_friendly_name]
        selected_mode = self.launch_options.get()
        command = self.construct_command(selected_map, selected_mode)

        subprocess.Popen(command, shell=True)


    def update_command_display(self, *args):
        """Update the command display based on the current selections."""
        selected_map_index = self.maps_listbox.curselection()
        if selected_map_index:
            selected_map_friendly_name = self.maps_listbox.get(selected_map_index[0])
            selected_map = self.maps_with_paths.get(selected_map_friendly_name, '')
            selected_mode = self.launch_options.get()

            command = self.construct_command(selected_map, selected_mode)
            if command:
                self.command_display_var.set(command)
            else:
                self.command_display_var.set("Unable to construct command.")
        else:
            self.command_display_var.set("")


    def load_project_uproject_file(self):
        """Load the .uproject file from the project directory."""
        uproject_files = [f for f in os.listdir(self.project_directory) if f.endswith('.uproject')]
        if uproject_files:
            self.uproject_file = uproject_files[0]  # Take the first .uproject file
        else:
            self.uproject_file = None
            print("No .uproject file found in the project directory.")


    def construct_command(self, selected_map, selected_mode, preview=False):

        if not selected_map or not selected_mode:
            return ""

        # Retrieve the full path to the selected Unreal Engine version's editor executable
        editor_executable = self.unreal_versions_info[self.selected_version.get()]

        if self.uproject_file:
            uproject_path = os.path.join(self.project_directory, self.uproject_file)
        else:
            print("Error: .uproject file not found.")
            return ""
        
        # Standardize the project directory path
        project_dir = self.project_directory.replace('\\', '/')
        uproject_path = uproject_path.replace('\\', '/')
        
        # Standardize the map path for the command
        map_path = selected_map.replace('\\', '/')

        # Depending on the launch mode, construct the command using the selected editor executable
        launch_command_format = config.get("launch_commands", {}).get(selected_mode)
        if not launch_command_format:
            print(f"Error: Launch command format for {selected_mode} not found.")
            raise ValueError("Invalid launch mode selected")
        
        command = launch_command_format.format(executable=editor_executable, uproject_path=uproject_path, map_path=selected_map)
        
        print(f"{command}")

        self.enable_launch()

        return command
    

    def update_launch_option(self, mode):
        self.launch_options.set(mode)
        self.update_command_display()
        self.enable_launch()
        

    def detect_unreal_versions(self):

        engine_versions_frame = tk.Frame(self.right_side_frame)
        engine_versions_frame.pack(fill=tk.BOTH, expand=True)

        default_install_paths = config.get("unreal_engine_paths", [])
        default_install_paths = [Path(path) for path in default_install_paths]

        engine_executables = []

        # Only search in default installation paths
        for install_path in default_install_paths:
            if install_path.exists():
                engine_executables.extend(install_path.glob('*/Engine/Binaries/Win64/UE4Editor.exe'))
                engine_executables.extend(install_path.glob('*/Engine/Binaries/Win64/UnrealEditor.exe'))

        self.unreal_versions_info = {}

        for executable in engine_executables:
            build_file_path = executable.parent.parent.parent / 'Build' / 'Build.version'
            try:
                with open(build_file_path, 'r') as build_file:
                    build_data = json.load(build_file)
                    version = f"{build_data['MajorVersion']}.{build_data['MinorVersion']}"
                    self.unreal_versions_info[version] = str(executable)
            except (IOError, KeyError):
                continue

        # Clear existing version Radiobuttons, if any
        for rb in getattr(self, 'version_radiobuttons', []):
            rb.destroy()
        self.version_radiobuttons = []

        # Default to the first detected version or a placeholder if none are found
        default_version = next(iter(self.unreal_versions_info.keys()), 'No version detected')
        self.selected_version = StringVar(value=default_version)

        # Create a Radiobutton for each detected version and add it to the engine_versions_frame
        for version_key, path in self.unreal_versions_info.items():
            rb = Radiobutton(engine_versions_frame, text=f"UE {version_key}", variable=self.selected_version, value=version_key,
                            command=self.update_command_display)
            rb.pack(anchor=tk.W)
            self.version_radiobuttons.append(rb)

        # If no versions detected, you can add a label to indicate that
        if not self.unreal_versions_info:
            no_versions_label = tk.Label(engine_versions_frame, text="No Unreal Engine versions detected.")
            no_versions_label.pack()


if __name__ == "__main__":
    root = tk.Tk()
    app = UnrealLauncherApp(root)
    root.mainloop()
