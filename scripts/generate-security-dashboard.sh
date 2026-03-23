#!/bin/bash
# generate-security-dashboard.sh
# Generates an HTML security dashboard from Trivy SBOM and scan results.
# Usage: ./scripts/generate-security-dashboard.sh <platform> <sbom-json> <vuln-json> <output-dir>
#
# Arguments:
#   platform   - macos | windows | linux | shared
#   sbom-json  - Path to CycloneDX SBOM JSON
#   vuln-json  - Path to Trivy vulnerability JSON
#   output-dir - Directory to write the dashboard HTML + SBOM files

set -euo pipefail

PLATFORM="${1:?Usage: $0 <platform> <sbom-json> <vuln-json> <output-dir>}"
SBOM_FILE="${2:?Missing sbom-json path}"
VULN_FILE="${3:?Missing vuln-json path}"
OUTPUT_DIR="${4:?Missing output-dir path}"
TIMESTAMP="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
VERSION="${WIWF_VERSION:-0.0.1-alpha}"

mkdir -p "$OUTPUT_DIR"

# Copy SBOM files
cp "$SBOM_FILE" "$OUTPUT_DIR/sbom.cdx.json"
[ -f "${VULN_FILE}" ] && cp "$VULN_FILE" "$OUTPUT_DIR/vulnerabilities.json" || echo '{"Results":[]}' > "$OUTPUT_DIR/vulnerabilities.json"

# Count dependencies from SBOM
DEP_COUNT=$(python3 -c "
import json, sys
try:
    with open('$SBOM_FILE') as f:
        data = json.load(f)
    comps = data.get('components', [])
    print(len(comps))
except:
    print(0)
" 2>/dev/null || echo "0")

# Count vulnerabilities by severity
VULN_STATS=$(python3 -c "
import json, sys
try:
    with open('$VULN_FILE') as f:
        data = json.load(f)
    results = data.get('Results', [])
    counts = {'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0, 'UNKNOWN': 0}
    for r in results:
        for v in r.get('Vulnerabilities', []):
            sev = v.get('Severity', 'UNKNOWN')
            counts[sev] = counts.get(sev, 0) + 1
    total = sum(counts.values())
    print(f'{total},{counts[\"CRITICAL\"]},{counts[\"HIGH\"]},{counts[\"MEDIUM\"]},{counts[\"LOW\"]}')
except:
    print('0,0,0,0,0')
" 2>/dev/null || echo "0,0,0,0,0")

IFS=',' read -r TOTAL_VULNS CRIT HIGH MED LOW <<< "$VULN_STATS"

# Generate dependency table from SBOM
DEP_TABLE=$(python3 -c "
import json, sys
try:
    with open('$SBOM_FILE') as f:
        data = json.load(f)
    comps = data.get('components', [])
    for c in sorted(comps, key=lambda x: x.get('name','')):
        name = c.get('name', 'unknown')
        ver = c.get('version', '-')
        ctype = c.get('type', '-')
        purl = c.get('purl', '')
        ecosystem = 'npm' if 'npm' in purl else 'cargo' if 'cargo' in purl else 'other'
        print(f'<tr><td>{name}</td><td>{ver}</td><td>{ctype}</td><td>{ecosystem}</td></tr>')
except:
    print('<tr><td colspan=\"4\">Unable to parse SBOM</td></tr>')
" 2>/dev/null || echo '<tr><td colspan="4">Unable to parse SBOM</td></tr>')

# Generate vulnerability table
VULN_TABLE=$(python3 -c "
import json, sys
try:
    with open('$VULN_FILE') as f:
        data = json.load(f)
    results = data.get('Results', [])
    for r in results:
        target = r.get('Target', 'unknown')
        for v in r.get('Vulnerabilities', []):
            vid = v.get('VulnerabilityID', '-')
            pkg = v.get('PkgName', '-')
            ver = v.get('InstalledVersion', '-')
            fix = v.get('FixedVersion', '-')
            sev = v.get('Severity', '-')
            title = v.get('Title', v.get('Description', '-'))[:120]
            color = {'CRITICAL':'#dc2626','HIGH':'#ea580c','MEDIUM':'#d97706','LOW':'#65a30d'}.get(sev, '#6b7280')
            print(f'<tr><td><span style=\"color:{color};font-weight:600\">{sev}</span></td><td><code>{vid}</code></td><td>{pkg}</td><td>{ver}</td><td>{fix}</td><td style=\"max-width:300px\">{title}</td></tr>')
except:
    print('<tr><td colspan=\"6\">No vulnerabilities found</td></tr>')
" 2>/dev/null || echo '<tr><td colspan="6">No vulnerabilities found</td></tr>')

# Write HTML dashboard
cat > "$OUTPUT_DIR/dashboard.html" << HTMLEOF
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>WIWF Security Dashboard - ${PLATFORM}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#f8fafc; color:#1e293b; }
  .header { background:linear-gradient(135deg,#6366f1,#8b5cf6); color:white; padding:32px 40px; }
  .header h1 { font-size:24px; margin-bottom:4px; }
  .header p { opacity:0.8; font-size:13px; }
  .container { max-width:1200px; margin:0 auto; padding:24px 40px; }
  .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:16px; margin:24px 0; }
  .card { background:white; border-radius:12px; padding:20px; box-shadow:0 1px 3px rgba(0,0,0,0.08); }
  .card .label { font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; margin-bottom:4px; }
  .card .value { font-size:28px; font-weight:700; }
  .card .value.crit { color:#dc2626; }
  .card .value.high { color:#ea580c; }
  .card .value.med { color:#d97706; }
  .card .value.low { color:#65a30d; }
  .card .value.ok { color:#059669; }
  .section { margin:32px 0; }
  .section h2 { font-size:16px; font-weight:600; margin-bottom:12px; padding-bottom:8px; border-bottom:2px solid #e2e8f0; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  th { background:#f1f5f9; text-align:left; padding:8px 12px; font-size:10px; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; }
  td { padding:8px 12px; border-bottom:1px solid #f1f5f9; }
  tr:hover { background:#f8fafc; }
  code { background:#f1f5f9; padding:1px 5px; border-radius:4px; font-size:11px; }
  .badge { display:inline-block; padding:2px 8px; border-radius:9999px; font-size:10px; font-weight:600; }
  .footer { margin-top:40px; padding:16px 0; border-top:1px solid #e2e8f0; font-size:11px; color:#94a3b8; text-align:center; }
  @media print { .header { background:#6366f1!important; -webkit-print-color-adjust:exact; } }
</style>
</head>
<body>
<div class="header">
  <h1>What I Would Forget &mdash; Security Dashboard</h1>
  <p>Platform: <strong>${PLATFORM}</strong> &middot; Version: ${VERSION} &middot; Generated: ${TIMESTAMP}</p>
</div>
<div class="container">
  <div class="cards">
    <div class="card">
      <div class="label">Total Dependencies</div>
      <div class="value">${DEP_COUNT}</div>
    </div>
    <div class="card">
      <div class="label">Total Vulnerabilities</div>
      <div class="value ${TOTAL_VULNS:+$([ "$TOTAL_VULNS" = "0" ] && echo 'ok' || echo 'high')}">${TOTAL_VULNS}</div>
    </div>
    <div class="card">
      <div class="label">Critical</div>
      <div class="value crit">${CRIT}</div>
    </div>
    <div class="card">
      <div class="label">High</div>
      <div class="value high">${HIGH}</div>
    </div>
    <div class="card">
      <div class="label">Medium</div>
      <div class="value med">${MED}</div>
    </div>
    <div class="card">
      <div class="label">Low</div>
      <div class="value low">${LOW}</div>
    </div>
  </div>

  <div class="section">
    <h2>Vulnerabilities</h2>
    <table>
      <thead><tr><th>Severity</th><th>CVE</th><th>Package</th><th>Installed</th><th>Fixed In</th><th>Description</th></tr></thead>
      <tbody>${VULN_TABLE}</tbody>
    </table>
  </div>

  <div class="section">
    <h2>Dependency Inventory (${DEP_COUNT} components)</h2>
    <table>
      <thead><tr><th>Package</th><th>Version</th><th>Type</th><th>Ecosystem</th></tr></thead>
      <tbody>${DEP_TABLE}</tbody>
    </table>
  </div>

  <div class="section">
    <h2>SBOM Files</h2>
    <p style="font-size:13px;color:#64748b">
      <a href="sbom.cdx.json">CycloneDX SBOM (JSON)</a> &middot;
      <a href="vulnerabilities.json">Vulnerability Scan Results (JSON)</a>
    </p>
  </div>

  <div class="footer">
    What I Would Forget &middot; Security Dashboard &middot; Generated by Trivy + WIWF CI/CD Pipeline
  </div>
</div>
</body>
</html>
HTMLEOF

echo "Dashboard generated: $OUTPUT_DIR/dashboard.html"
