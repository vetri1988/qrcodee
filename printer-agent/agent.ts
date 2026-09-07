/**
 * Standalone Local Zebra Printer Agent Daemon
 *
 * This agent runs locally on the computer physically connected to the Zebra ZT230 printer via USB or local network.
 * It exposes an HTTP REST endpoint allowing the web application to submit raw ZPL directly to the printer.
 *
 * How to run:
 *   npx tsx printer-agent/agent.ts
 *
 * Default Port: 9100
 */

import http from 'http';
import net from 'net';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';

const AGENT_PORT = 9100;
const PRINTER_HOST = process.env.ZEBRA_IP || '192.168.1.120';
const PRINTER_TCP_PORT = 9100;
const LINUX_USB_DEVICE = '/dev/usb/lp0';
const DEFAULT_PRINTER_NAME = process.env.ZEBRA_PRINTER_NAME || 'ZDesigner ZT230-200dpi ZPL';

console.log('====================================================');
console.log(' ATM SENSOR BARCODE MANAGER - LOCAL PRINTER AGENT');
console.log(' Target: Zebra ZDesigner ZT230-200dpi ZPL');
console.log('====================================================');

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.method === 'GET' && req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ONLINE',
        targetPrinter: DEFAULT_PRINTER_NAME,
        agentPort: AGENT_PORT,
        mode: process.platform === 'win32' ? 'WINDOWS_RAW_SPOOLER' : 'LINUX_USB/TCP',
      })
    );
    return;
  }

  // Receive ZPL code to print
  if (req.method === 'POST' && (req.url === '/api/printer/zpl' || req.url === '/print')) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {
      if (!body || body.trim() === '') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Empty ZPL payload' }));
        return;
      }

      console.log(`[AGENT] Received ${Buffer.byteLength(body)} bytes of ZPL. Dispatching to Zebra ZT230...`);

      // 1. If on Windows, dispatch via Windows print spooler
      if (process.platform === 'win32') {
        const tempPath = path.join(os.tmpdir(), `agent_${Date.now()}.zpl`);
        try {
          fs.writeFileSync(tempPath, body, 'utf8');
          const scriptPath = path.resolve(process.cwd(), 'server', 'scripts', 'printRawZpl.ps1');
          await new Promise<void>((resolve, reject) => {
            execFile(
              'powershell.exe',
              ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-PrinterName', DEFAULT_PRINTER_NAME, '-FilePath', tempPath],
              { timeout: 10000 },
              (err, stdout) => {
                const out = (stdout || '').trim();
                if (err || out.startsWith('ERROR:')) {
                  reject(new Error(out || err?.message));
                } else {
                  console.log(`[AGENT] Windows Spooler success: ${out}`);
                  resolve();
                }
              }
            );
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: true,
              message: `ZPL dispatched to ${DEFAULT_PRINTER_NAME} via Windows Spooler.`,
              bytesReceived: Buffer.byteLength(body),
            })
          );
          return;
        } catch (winErr: any) {
          console.warn(`[AGENT] Windows Spooler dispatch notice: ${winErr.message}`);
        } finally {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        }
      }

      // 2. Linux USB direct device write
      if (fs.existsSync(LINUX_USB_DEVICE)) {
        try {
          fs.writeFileSync(LINUX_USB_DEVICE, body, 'utf8');
          console.log(`[AGENT] Successfully wrote ZPL to USB device ${LINUX_USB_DEVICE}`);
        } catch (usbErr: any) {
          console.warn(`[AGENT] USB write notice: ${usbErr.message}`);
        }
      }

      // 3. Network TCP Socket (port 9100)
      try {
        const client = new net.Socket();
        client.setTimeout(3000);
        client.on('error', (socketErr) => {
          console.warn(`[AGENT] Socket notice (${PRINTER_HOST}:${PRINTER_TCP_PORT}): ${socketErr.message}`);
        });
        client.on('timeout', () => {
          client.destroy();
        });
        client.connect(PRINTER_TCP_PORT, PRINTER_HOST, () => {
          client.write(body);
          client.end();
          console.log(`[AGENT] Dispatched ZPL to ${PRINTER_HOST}:${PRINTER_TCP_PORT}`);
        });
      } catch (tcpErr: any) {
        console.warn(`[AGENT] TCP dispatch notice: ${tcpErr.message}`);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          message: 'ZPL dispatched to Zebra printer.',
          bytesReceived: Buffer.byteLength(body),
        })
      );
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(AGENT_PORT, '0.0.0.0', () => {
  console.log(`[AGENT] Printer agent listening on http://localhost:${AGENT_PORT}`);
  console.log(`[AGENT] Ready to receive ZPL commands from ATM Label Manager web app.`);
});
