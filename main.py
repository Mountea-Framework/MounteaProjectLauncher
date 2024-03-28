import tkinter as tk
from tkinter import filedialog, messagebox, Listbox, Button, Label, Radiobutton, StringVar
import os
import subprocess
import glob
import json
import sys
from pathlib import Path

# PROJECT LIBRARIES
scripts_dir = os.path.join(os.path.dirname(__file__), 'Scripts')
sys.path.append(scripts_dir)

from Scripts.utility import *
from Scripts.ui_elements import *
from Scripts.UnrealLauncherApp import UnrealLauncherApp


#config = read_config(os.path.dirname(os.path.realpath(__file__))) #read_config()


if __name__ == "__main__":
    app = UnrealLauncherApp()
