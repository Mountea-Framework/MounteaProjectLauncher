import sys
import os
from PyQt5.QtWidgets import (QApplication, QWidget, QVBoxLayout, QLabel, QPushButton, QComboBox, 
                             QHBoxLayout, QLineEdit, QFileDialog, QListWidget, QSizePolicy, QMessageBox)
from PyQt5.QtCore import Qt
from PyQt5.QtGui import QFont, QIcon

from .utility import (find_umap_files, find_unreal_project)

primary_button_style = """
    QPushButton {
        color: white;
        background-color: blue;
        border: none;
        font-family: Roboto;
        font-size: 14px;
        font-weight: bold;
    }
    
    QPushButton:hover {
        background-color: #3651ea;
    }
    
    QPushButton:disabled {
        background-color: #b8b9bf;
        color: gray;
    }
"""

secondary_button_style = """
    QPushButton {
        color: blue;
        border: none;
        font-family: Roboto;
        font-size: 12px;
        font-weight: bold;
        text-align: right;
    }
    
    QPushButton:hover {
        color: #3651ea;
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

        # Maps list
        maps_list = QListWidget()
        maps_list.setStyleSheet("border: none;")
        self.wrapper_layout.addWidget(maps_list)

        # Launch mode and version selection
        comb_spacer = QWidget()
        comb_spacer.setFixedWidth(5)     
        
        launch_mode_combo = QComboBox()
        launch_mode_combo.addItems(["Server", "Client", "Standalone"])
        launch_mode_combo.setStyleSheet(combo_style)
        launch_mode_combo.setFixedHeight(50)

        unreal_combo = QComboBox()
        unreal_combo.addItems(["Unreal Engine 4.25", "Unreal Engine 4.26", "Unreal Engine 5.0"])
        unreal_combo.setStyleSheet(combo_style)
        unreal_combo.setFixedHeight(50)

        combo_layout = QHBoxLayout()
        combo_layout.addWidget(launch_mode_combo)
        combo_layout.addWidget(comb_spacer)
        combo_layout.addWidget(unreal_combo)
        self.wrapper_layout.addLayout(combo_layout)

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


class LauncherApp(QApplication):
    def __init__(self, parent, argv):
        super().__init__(argv)
        self.parent = parent

    def start(self):
        self.launcher = Launcher(self.parent)
        self.launcher.setWindowTitle("Mountea Project Launcher")
        self.launcher.show()
        sys.exit(self.exec_())