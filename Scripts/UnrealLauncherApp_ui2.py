import sys
from PyQt5.QtWidgets import (QApplication, QWidget, QVBoxLayout, QLabel, QPushButton, QComboBox, 
                             QHBoxLayout, QLineEdit, QFileDialog, QListWidget)
from PyQt5.QtCore import Qt
from PyQt5.QtGui import QFont

class Launcher(QWidget):
    def __init__(self):
        super().__init__()

        # Initialize both layouts
        self.initial_layout()
        self.expanded_layout()

        # Set the initial layout
        self.setLayout(self.initial_layout)

        # Set window properties
        self.setWindowTitle("Mountea Project Launcher")
        self.setGeometry(100, 100, 500, 200)

    def initial_layout(self):
        # Layout for the initial state
        layout = QVBoxLayout()

        # Title
        title = QLabel("Mountea Project Launcher")
        title.setAlignment(Qt.AlignCenter)
        title.setFont(QFont("Arial", 16, QFont.Bold))
        layout.addWidget(title)

        # Project name file browser
        project_name_btn = QPushButton("Open Project Folder")
        project_name_btn.clicked.connect(self.openFileNameDialog)
        project_name_btn.setStyleSheet("text-align: left; background:white; border: none; padding-left: 5px; padding-right: 5px;")
        project_name_btn.setFixedHeight(40)
        layout.addWidget(project_name_btn)

        return layout

    def expanded_layout(self):
        # Layout for the expanded state
        layout = QVBoxLayout()

        # Add widgets for expanded state here
        # Divider line
        divider = QLabel()
        divider.setFrameShape(QLabel.HLine)
        divider.setFrameShadow(QLabel.Sunken)
        layout.addWidget(divider)

        # Maps title and Reload maps button
        maps_title_layout = QHBoxLayout()
        maps_title = QLabel("Maps")
        maps_title.setFont(QFont("Roboto", 12, QFont.Bold))
        reload_maps_btn = QPushButton("Reload maps")
        reload_maps_btn.setStyleSheet("text-align: right; color: blue; border: none;")
        maps_title_layout.addWidget(maps_title)
        maps_title_layout.addWidget(reload_maps_btn)
        layout.addLayout(maps_title_layout)

        # Maps list
        maps_list = QListWidget()
        layout.addWidget(maps_list)

        # Launch mode and version selection
        launch_mode_combo = QComboBox()
        launch_mode_combo.addItems(["Server", "Client", "Standalone"])
        launch_mode_combo.setStyleSheet("border: none; padding-left: 5px; padding-right: 5px;")
        launch_mode_combo.setFixedHeight(40)

        unreal_combo = QComboBox()
        unreal_combo.addItems(["Unreal Engine 4.25", "Unreal Engine 4.26"])
        unreal_combo.setStyleSheet("border: none; padding-left: 5px; padding-right: 5px;")
        unreal_combo.setFixedHeight(40)

        combo_layout = QHBoxLayout()
        combo_layout.addWidget(launch_mode_combo)
        combo_layout.addWidget(unreal_combo)
        layout.addLayout(combo_layout)

        # Path and Copy
        path_layout = QHBoxLayout()
        path_edit = QLineEdit("C:/...")
        path_edit.setReadOnly(True)
        path_layout.addWidget(path_edit)
        path_edit.setStyleSheet("border: none; padding-left: 5px; padding-right: 5px;")
        path_edit.setFixedHeight(40)

        copy_button = QPushButton("Copy")
        copy_button.setStyleSheet("color: blue; border: none;")
        path_layout.addWidget(copy_button)

        layout.addLayout(path_layout)

        # Launch project button
        launch_project_btn = QPushButton("Launch project")
        launch_project_btn.setStyleSheet("color: white; background-color: blue; border: none;")
        launch_project_btn.setFixedHeight(40)
        layout.addWidget(launch_project_btn)

        return layout

    def openFileNameDialog(self):
        options = QFileDialog.Options()
        options |= QFileDialog.DontUseNativeDialog
        folder = QFileDialog.getExistingDirectory(self, "Select Folder")
        print(folder)  # This is where you would handle the selected folder path

        # Switch to the expanded layout
        self.setLayout(self.expanded_layout())
        # Resize the window
        self.setGeometry(100, 100, 500, 500)


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = Launcher()
    window.show()
    sys.exit(app.exec_())
