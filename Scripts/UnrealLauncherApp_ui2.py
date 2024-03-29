import sys
import os
from PyQt5.QtWidgets import (QApplication, QWidget, QVBoxLayout, QLabel, QPushButton, QComboBox, 
                             QHBoxLayout, QLineEdit, QFileDialog, QListWidget, QSizePolicy, QMessageBox)
from PyQt5.QtCore import Qt
from PyQt5.QtGui import QFont, QIcon

from .utility import (find_umap_files, find_unreal_project, detect_unreal_versions)

primary_button_style = """
    QPushButton {
        color: white;
        background-color: #3651ea;
        border: none;
        font-family: Roboto;
        font-size: 14px;
        font-weight: bold;
    }
    
    QPushButton:hover {
        background-color: blue;        
    }
    
    QPushButton:disabled {
        background-color: #b8b9bf;
        color: gray;
    }
"""

secondary_button_style = """
    QPushButton {
        color: #3651ea;
        border: none;
        font-family: Roboto;
        font-size: 12px;
        text-align: right;
        font-weight: bold;
    }
    
    QPushButton:hover {
        color: blue;
    }
    
    QPushButton:disabled {
        color: #b8b9bf;
    }
"""


class Launcher(QWidget):
    def __init__(self, app):
        super().__init__()
        
        self.app = app

        # Main layout
        layout = QVBoxLayout()
        
        self.setWindowFlags(Qt.WindowCloseButtonHint)
        
        script_dir = os.path.dirname(os.path.realpath(__file__))

        # Icon filename
        icon_filename = "MPLIcon.png"
        chevron_right_filename = "icon_chevron_right.png"
        chevron_down_filename = "icon_chevron_down.png"
        
        # Icons path
        icon_path = os.path.join(script_dir, "..", "Icons", icon_filename).replace("\\", "/")
        chevron_right_path = os.path.join(script_dir, "..", "Icons", chevron_right_filename).replace("\\", "/")
        chevron_down_path = os.path.join(script_dir, "..", "Icons", chevron_down_filename).replace("\\", "/")


        combo_style = """
            QComboBox {
                color: black;
                font: 14px;
                padding: 0px 10px 0px 10px;
                border: none
            }
            
            QComboBox::drop-down {
                border: none;
            }
            
            QComboBox::down-arrow {
                image: url(%s);
                width: 14px;
                height: 14px;
                padding: 0px 10px 0px 0px;
            }
        """ % chevron_down_path

        # Set window icon
        self.setWindowIcon(QIcon(icon_path))


        # Title and Project Name Wrapper
        title_wrapper = QWidget()
        title_layout = QVBoxLayout(title_wrapper)
        title_layout.setAlignment(Qt.AlignTop)

        # Title
        title = QLabel("Mountea Project Launcher")
        title.setAlignment(Qt.AlignCenter)
        title.setFont(QFont("Roboto", 16, QFont.Bold))
        title_layout.addWidget(title)
        
        
        # Small spacer
        spacer = QWidget()
        spacer.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Fixed)
        title_layout.addWidget(spacer)

        # Project name file browser
        self.project_name_btn = QPushButton()
        button_layout = QHBoxLayout()
        self.project_name_btn.setLayout(button_layout)


        # Left side (aligned to the left)
        self.left_label = QLabel("Open Project Folder")
        self.left_label.setFont(QFont("Roboto", 10))
        button_layout.addWidget(self.left_label, alignment=Qt.AlignLeft)

        # Spacer to push ">" to the right
        button_layout.addStretch()

        # Right side (aligned to the right)
        icon_label = QLabel()
        icon_label.setPixmap(QIcon(chevron_right_path).pixmap(16, 16))  # Adjust the size as needed
        button_layout.addWidget(icon_label, alignment=Qt.AlignRight)

        # Set styling for the button
        self.project_name_btn.setStyleSheet("background: white; border: none; padding-left: 5px; padding-right: 5px;")
        self.project_name_btn.setFixedHeight(50)
        self.project_name_btn.setSizePolicy(QSizePolicy.Minimum, QSizePolicy.Fixed)

        # Connect button click signal
        self.project_name_btn.clicked.connect(self.openFileNameDialog)

        title_layout.addWidget(self.project_name_btn)

        layout.addWidget(title_wrapper)
          
          
        # Wrapper for widgets below the divider
        self.wrapper = QWidget()
        self.wrapper_layout = QVBoxLayout(self.wrapper)
        self.wrapper.setVisible(False)
        layout.addWidget(self.wrapper)

        
        # Divider line
        divider = QLabel()
        divider.setFrameShape(QLabel.HLine)
        divider.setFrameShadow(QLabel.Sunken)
        self.wrapper_layout.addWidget(divider)
        

        # Maps title and Reload maps button
        maps_title_layout = QHBoxLayout()
        maps_title = QLabel("Maps")
        maps_title.setFont(QFont("Roboto", 12, QFont.Bold))
        reload_maps_btn = QPushButton("Reload maps")
        reload_maps_btn.setStyleSheet(secondary_button_style)
        maps_title_layout.addWidget(maps_title)
        maps_title_layout.addWidget(reload_maps_btn)
        self.wrapper_layout.addLayout(maps_title_layout)
        
        # Vertical slicer
        maps_spacer = QWidget()
        maps_spacer.setFixedHeight(2)
        self.wrapper_layout.addWidget(maps_spacer)

        # Maps list
        maps_list = QListWidget()
        maps_list.setStyleSheet("border: none;")
        self.wrapper_layout.addWidget(maps_list)        
        
        # Vertical slicer
        maps_spacer2 = QWidget()
        maps_spacer2.setFixedHeight(2)
        self.wrapper_layout.addWidget(maps_spacer2)

        # Launch mode and version selection
        comb_spacer = QWidget()
        comb_spacer.setFixedWidth(2)     
        
        self.launch_modes = self.app.config.get("launch_commands", {})
        self.launch_mode_combo = QComboBox()
        self.launch_mode_combo.addItems(self.launch_modes)
        self.launch_mode_combo.setStyleSheet(combo_style)
        self.launch_mode_combo.setFixedHeight(50)
        self.launch_mode_combo.currentIndexChanged.connect(self.launchModeChanged)

        self.unreal_versions = detect_unreal_versions()
        self.unreal_combo = QComboBox()
        self.unreal_combo.addItems(self.unreal_versions)
        self.unreal_combo.setStyleSheet(combo_style)
        self.unreal_combo.setFixedHeight(50)
        self.unreal_combo.currentIndexChanged.connect(self.engineVersionChanged)

        combo_layout = QHBoxLayout()
        combo_layout.addWidget(self.launch_mode_combo)
        combo_layout.addWidget(comb_spacer)
        combo_layout.addWidget(self.unreal_combo)
        self.wrapper_layout.addLayout(combo_layout)
        
        # Vertical slicer
        comb_spacer2 = QWidget()
        comb_spacer2.setFixedHeight(2)
        self.wrapper_layout.addWidget(comb_spacer2)

        # Path and Copy
        path_layout = QHBoxLayout()
        path_edit = QLineEdit("")
        path_edit.setReadOnly(True)
        path_layout.addWidget(path_edit)
        path_edit.setStyleSheet("border: none; padding-left: 5px; padding-right: 5px;")
        path_edit.setFixedHeight(50)

        copy_button = QPushButton("Copy")
        copy_button.setStyleSheet(secondary_button_style)
        path_layout.addWidget(copy_button)

        self.wrapper_layout.addLayout(path_layout)
        
        # Vertical slicer
        path_spacer = QWidget()
        path_spacer.setFixedHeight(2)
        self.wrapper_layout.addWidget(path_spacer)

        # Launch project button
        self.launch_project_btn = QPushButton("Launch project")
        self.launch_project_btn.setStyleSheet(primary_button_style)
        self.launch_project_btn.setDisabled(True)

        self.launch_project_btn.setFixedHeight(50)
        self.wrapper_layout.addWidget(self.launch_project_btn)

        # Set the layout on the application's window
        self.setLayout(layout)
        self.setGeometry(100, 100, 500, 500)

    def openFileNameDialog(self):
        options = QFileDialog.Options()
        options |= QFileDialog.DontUseNativeDialog
        folder = QFileDialog.getExistingDirectory(self, "Select Folder")
        if folder:
            if find_umap_files(folder):
                # Save the folder path
                self.folder_path = folder
                # Show the wrapper
                self.wrapper.setVisible(True)
                self.setGeometry(100, 100, 500, 500)
                
                self.app.set_project_directory(folder)
                self.app.set_selected_project_file(find_unreal_project(folder))

                folder_name = os.path.basename(folder)
                self.left_label.setText(f"{folder_name} Folder")
                self.project_name_btn.setDisabled(True)
            else:
                QMessageBox.critical(self, "Error", "Invalid folder path selected.")
        else:
            QMessageBox.information(self, "Info", "Folder selection canceled.")
            
            
    def launchModeChanged(self):
        selected_mode = self.launch_mode_combo.currentText()
        self.app.set_selected_launch(selected_mode)


    def engineVersionChanged(self):
        selected_engine = self.unreal_combo.currentText()
        print(f"Engine Version has Changed. New value: ", selected_engine)
        

class LauncherApp(QApplication):
    def __init__(self, parent, argv):
        super().__init__(argv)
        self.parent = parent

    def start(self):
        self.launcher = Launcher(self.parent)
        self.launcher.setWindowTitle("Mountea Project Launcher")
        self.launcher.show()
        sys.exit(self.exec_())