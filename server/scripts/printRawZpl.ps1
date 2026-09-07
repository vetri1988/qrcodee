param (
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
