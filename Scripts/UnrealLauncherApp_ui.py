from tkinter import filedialog, messagebox
import tkinter as tk

from .ui_elements import *
from .utility import find_unreal_project
from .launch_operations import *


def open_file_directory():
    folder_path = filedialog.askdirectory(title="Select Unreal Project Folder")
    if folder_path and find_unreal_project(folder_path):
        return folder_path
    else:
        messagebox.showerror("Error", "No .uproject file found in the selected directory.")
        return None
    
def copy_text_to_clipboard(root):
    """Copy the command display label's text to the clipboard."""
    # Implementation here
    # Read command form launch_operations.py
    root.clipboard_clear()
    root.clipboard_append(construct_command())
    
    
def setup_version_label(root, version_text="Version Unknown"):
    version_label = tk.Label(root, text=f"Version: {version_text}", fg="grey")
    version_label.pack(side=tk.BOTTOM, fill=tk.X)


def setup_selection_page(root, select_project_callback):
    select_project_button = create_button(root, text="Select Project Folder", command=select_project_callback)
    select_project_button.pack(pady=10)


def setup_main_page(root, maps_with_paths, selected_version, launch_options, launch_project_callback):
    # Assuming 'create_button' and other UI components are defined in 'ui_elements.py'
    # This is a simplified example; expand according to your application's needs.
    
    # Maps Listbox and Scrollbar setup
    maps_frame = tk.Frame(root)
    maps_listbox = tk.Listbox(maps_frame)
    maps_scrollbar = tk.Scrollbar(maps_frame, orient="vertical", command=maps_listbox.yview)
    maps_listbox.configure(yscrollcommand=maps_scrollbar.set)
    maps_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
    maps_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
    maps_frame.pack(fill=tk.BOTH, expand=True)
    
    # Populate the listbox with maps
    for map_name in maps_with_paths.keys():
        maps_listbox.insert(tk.END, map_name)
    
    # Setup launch button
    launch_button = create_button(root, text="Launch", command=launch_project_callback)
    launch_button.pack(side=tk.BOTTOM, fill=tk.X)


def setup_warning_page(root):
    warning_label = tk.Label(root, text="WARNING: Not in or near an Unreal Engine project folder.", fg="red")
    warning_label.pack(pady=100)
