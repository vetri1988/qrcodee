; Script generated for Inno Setup 6+
; ATM Sensor Barcode Manager - Enterprise Windows Installer Script

#define MyAppName "ATM Sensor Barcode Manager"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "ATM Sensor Systems"
#define MyAppExeName "ATM Sensor Barcode Manager.exe"

[Setup]
AppId={{D3F781A4-9E32-42B1-87C4-1A582F92C012}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=release
OutputBaseFilename=ATM-Sensor-Barcode-Manager-InnoSetup
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "dist\*"; DestDir: "{app}\dist"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "electron\*"; DestDir: "{app}\electron"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "server\scripts\*"; DestDir: "{app}\server\scripts"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "server\scripts\*"; DestDir: "{app}\resources\scripts"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "package.json"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
; Auto-configure Windows Spooler and Firewall during setup
Filename: "sc.exe"; Parameters: "config spooler start= auto"; Flags: runhidden
Filename: "net.exe"; Parameters: "start spooler"; Flags: runhidden
Filename: "netsh.exe"; Parameters: "advfirewall firewall add rule name=""ATM Sensor Barcode Manager (HTTP 3000)"" dir=in action=allow protocol=TCP localport=3000 profile=any"; Flags: runhidden
Filename: "netsh.exe"; Parameters: "advfirewall firewall add rule name=""Zebra ZT230 RAW Spooler (Port 9100)"" dir=in action=allow protocol=TCP localport=9100 profile=any"; Flags: runhidden
; Run application after finish
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
Filename: "netsh.exe"; Parameters: "advfirewall firewall delete rule name=""ATM Sensor Barcode Manager (HTTP 3000)"""; Flags: runhidden
Filename: "netsh.exe"; Parameters: "advfirewall firewall delete rule name=""Zebra ZT230 RAW Spooler (Port 9100)"""; Flags: runhidden
