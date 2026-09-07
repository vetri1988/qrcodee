import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import net from 'net';

export interface InstalledPrinterInfo {
  name: string;
  driverName: string;
  portName: string;
  status: number;
  isZebra: boolean;
  isDefaultZt230: boolean;
}

const EMBEDDED_POWERSHELL_SCRIPT = `param (
    [Parameter(Mandatory = $true)]
    [string]$PrinterName,

    [Parameter(Mandatory = $true)]
    [string]$FilePath,

    [string]$DocName = "ATM Sensor Barcode Label"
)

$definition = @'
using System;
using System.IO;
using System.Runtime.InteropServices;

public class WinSpoolHelper {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }

    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

    [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

    public static string SendRawFile(string szPrinterName, string szFileName, string docName) {
        if (!File.Exists(szFileName)) {
            return "ERROR:File not found: " + szFileName;
        }

        byte[] bytes;
        try {
            bytes = File.ReadAllBytes(szFileName);
        } catch (Exception ex) {
            return "ERROR:Failed to read file: " + ex.Message;
        }

        if (bytes.Length == 0) {
            return "ERROR:Payload file is empty";
        }

        IntPtr hPrinter = IntPtr.Zero;
        DOCINFOA di = new DOCINFOA();
        di.pDocName = docName;
        di.pDataType = "RAW";

        if (!OpenPrinter(szPrinterName, out hPrinter, IntPtr.Zero)) {
            int err = Marshal.GetLastWin32Error();
            return "ERROR:OpenPrinter failed with error code " + err;
        }

        try {
            if (!StartDocPrinter(hPrinter, 1, di)) {
                int err = Marshal.GetLastWin32Error();
                return "ERROR:StartDocPrinter failed with error code " + err;
            }

            try {
                if (!StartPagePrinter(hPrinter)) {
                    int err = Marshal.GetLastWin32Error();
                    return "ERROR:StartPagePrinter failed with error code " + err;
                }

                try {
                    IntPtr pBytes = Marshal.AllocCoTaskMem(bytes.Length);
                    try {
                        Marshal.Copy(bytes, 0, pBytes, bytes.Length);
                        int written = 0;
                        bool success = WritePrinter(hPrinter, pBytes, bytes.Length, out written);
                        if (!success) {
                            int err = Marshal.GetLastWin32Error();
                            return "ERROR:WritePrinter failed with error code " + err;
                        }
                        return "SUCCESS:Wrote " + written + " bytes to " + szPrinterName;
                    } finally {
                        Marshal.FreeCoTaskMem(pBytes);
                    }
                } finally {
                    EndPagePrinter(hPrinter);
                }
            } finally {
                EndDocPrinter(hPrinter);
            }
        } finally {
            ClosePrinter(hPrinter);
        }
    }
}
'@

try {
    Add-Type -TypeDefinition $definition -ErrorAction Stop
} catch {
    # Type might already be added in current runspace
}

$res = [WinSpoolHelper]::SendRawFile($PrinterName, $FilePath, $DocName)
Write-Output $res
`;

/**
 * Resolves the path to the PowerShell raw spooler script.
 * If not found at standard disk locations (e.g., in packaged Electron ASAR),
 * writes the embedded script to os.tmpdir() atomically and returns that path.
 */
export function getSpoolerScriptPath(): string {
  const candidates = [
    path.resolve(process.cwd(), 'server', 'scripts', 'printRawZpl.ps1'),
    path.resolve(process.cwd(), 'dist', 'scripts', 'printRawZpl.ps1'),
    path.resolve(__dirname, 'scripts', 'printRawZpl.ps1'),
    path.resolve(__dirname, '..', 'scripts', 'printRawZpl.ps1'),
    path.resolve(__dirname, '..', 'server', 'scripts', 'printRawZpl.ps1'),
  ];

  const anyProc = process as any;
  if (anyProc.resourcesPath) {
    candidates.push(
      path.join(anyProc.resourcesPath, 'scripts', 'printRawZpl.ps1'),
      path.join(anyProc.resourcesPath, 'server', 'scripts', 'printRawZpl.ps1')
    );
  }

  for (const candidate of candidates) {
    try {
      // External processes like powershell.exe cannot execute files inside an Electron ASAR archive
      if (candidate.includes('.asar') || candidate.includes('app.asar')) {
        continue;
      }
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
      }
    } catch {
      // Continue searching
    }
  }

  // Fallback: Write embedded script to OS temp directory
  const fallbackPath = path.join(os.tmpdir(), 'atm_print_raw_zpl.ps1');
  try {
    const scriptBytes = Buffer.byteLength(EMBEDDED_POWERSHELL_SCRIPT, 'utf8');
    if (!fs.existsSync(fallbackPath) || fs.statSync(fallbackPath).size !== scriptBytes) {
      fs.writeFileSync(fallbackPath, EMBEDDED_POWERSHELL_SCRIPT, 'utf8');
    }
  } catch (err: any) {
    console.warn(`[windowsPrinter] Notice writing temp spooler script: ${err.message}`);
  }
  return fallbackPath;
}

const SCRIPT_PATH = getSpoolerScriptPath();

/**
 * Lists all installed Windows printers using PowerShell Get-Printer.
 */
export async function listInstalledPrinters(): Promise<InstalledPrinterInfo[]> {
  if (process.platform !== 'win32') {
    return [
      {
        name: 'ZDesigner ZT230-200dpi ZPL',
        driverName: 'ZDesigner ZT230-200dpi ZPL',
        portName: '/dev/usb/lp0',
        status: 0,
        isZebra: true,
        isDefaultZt230: true,
      },
    ];
  }

  return new Promise((resolve) => {
    const cmd = 'Get-Printer | Select-Object Name, DriverName, PortName, PrinterStatus | ConvertTo-Json';
    execFile('powershell.exe', ['-NoProfile', '-Command', cmd], { timeout: 6000 }, (err, stdout) => {
      if (err || !stdout.trim()) {
        resolve([
          {
            name: 'ZDesigner ZT230-200dpi ZPL',
            driverName: 'ZDesigner ZT230-200dpi ZPL',
            portName: 'USB001',
            status: 0,
            isZebra: true,
            isDefaultZt230: true,
          },
        ]);
        return;
      }

      try {
        const parsed = JSON.parse(stdout);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        const printers: InstalledPrinterInfo[] = list.map((p: any) => {
          const name = p.Name || '';
          const driver = p.DriverName || '';
          const isZebra =
            name.toLowerCase().includes('zdesigner') ||
            name.toLowerCase().includes('zebra') ||
            name.toLowerCase().includes('zt230') ||
            driver.toLowerCase().includes('zdesigner') ||
            driver.toLowerCase().includes('zebra');
          const isDefaultZt230 = name.includes('ZT230') || driver.includes('ZT230');

          return {
            name,
            driverName: driver,
            portName: p.PortName || '',
            status: typeof p.PrinterStatus === 'number' ? p.PrinterStatus : 0,
            isZebra,
            isDefaultZt230,
          };
        });

        resolve(printers);
      } catch {
        resolve([]);
      }
    });
  });
}

/**
 * Dispatches RAW ZPL string directly to Windows Spooler for USB or local thermal printer.
 */
export async function sendRawZplToWindowsPrinter(
  printerName: string,
  zpl: string,
  docName: string = 'ATM Sensor Label Print'
): Promise<{ success: boolean; message: string; bytesWritten: number }> {
  const bytesCount = Buffer.byteLength(zpl, 'utf8');
  const tempFileName = `zpl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.zpl`;
  const tempFilePath = path.join(os.tmpdir(), tempFileName);
  const activeScriptPath = getSpoolerScriptPath();

  try {
    // Write ZPL to temporary file
    fs.writeFileSync(tempFilePath, zpl, 'utf8');

    return await new Promise((resolve, reject) => {
      const args = [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        activeScriptPath,
        '-PrinterName',
        printerName,
        '-FilePath',
        tempFilePath,
        '-DocName',
        docName,
      ];

      execFile('powershell.exe', args, { timeout: 15000 }, (error, stdout, stderr) => {
        const output = (stdout || '').trim();
        const errOutput = (stderr || '').trim();

        if (error) {
          reject(new Error(`Print spooler execution failed: ${error.message} - ${errOutput}`));
          return;
        }

        if (output.startsWith('SUCCESS:')) {
          resolve({
            success: true,
            message: output.replace('SUCCESS:', '').trim(),
            bytesWritten: bytesCount,
          });
        } else if (output.startsWith('ERROR:')) {
          reject(new Error(output.replace('ERROR:', '').trim()));
        } else {
          // Check if error output was generated
          if (errOutput) {
            reject(new Error(`Print error: ${errOutput}`));
          } else {
            resolve({
              success: true,
              message: output || `Sent ${bytesCount} bytes to ${printerName}`,
              bytesWritten: bytesCount,
            });
          }
        }
      });
    });
  } finally {
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch {
      // Ignore temp file cleanup failure
    }
  }
}

/**
 * Sends raw ZPL directly to Zebra printer over Network TCP Socket (e.g. port 9100).
 */
export async function sendRawZplToNetworkPrinter(
  host: string,
  port: number = 9100,
  zpl: string
): Promise<{ success: boolean; message: string; bytesWritten: number }> {
  const bytesCount = Buffer.byteLength(zpl, 'utf8');

  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(4000);

    socket.on('error', (err) => {
      socket.destroy();
      reject(new Error(`TCP Socket error to ${host}:${port}: ${err.message}`));
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error(`TCP Socket timed out connecting to ${host}:${port}`));
    });

    socket.connect(port, host, () => {
      socket.write(zpl, 'utf8', () => {
        socket.end();
        resolve({
          success: true,
          message: `Dispatched ${bytesCount} bytes to Zebra printer at ${host}:${port}`,
          bytesWritten: bytesCount,
        });
      });
    });
  });
}
