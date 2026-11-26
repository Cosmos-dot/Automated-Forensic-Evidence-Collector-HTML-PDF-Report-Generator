# Automated Forensic Evidence Collector & HTML/PDF Report Generator

Windows DFIR triage collector built with Node.js. Extracts volatile system state, running processes, network sockets, Registry persistence keys, USB history, and Chrome history with SHA-256 chain-of-custody verification and HTML/PDF reporting.

## Usage
- Live acquisition: `npm start`
- Custom output: `node index.js --output D:\Cases\Incident-01 --no-open`
- Verify chain of custody: `node index.js --verify .\output`
- Build standalone EXE: `npm run build`
