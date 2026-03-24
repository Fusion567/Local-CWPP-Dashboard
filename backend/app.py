"""
app.py — Flask API for the CWPP Dashboard (PostgreSQL edition).
"""

import concurrent.futures
import subprocess
import json
import os
import boto3
from flask import Flask, jsonify, request
from flask_cors import CORS
from auth import get_sts_credentials, get_account_details
from database import get_db_connection

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# MASTER TARGETS — drives the scan engine.
# account_id is auto-extracted from the role ARN.
# ---------------------------------------------------------------------------
MASTER_TARGETS = [
    {
        "client_name": "Prem Patel",
        "role_arn": "arn:aws:iam::610732543389:role/CWPP-Scanner-Role",
        "type": "container",
        "target_id": "610732543389.dkr.ecr.us-east-1.amazonaws.com/vulnerable-test-app:latest",
    },
    {
        "client_name": "Vraj Lalwala",
        "role_arn": "arn:aws:iam::310652789217:role/CWPP-SR-VL",
        "type": "vm",
        "target_id": "ami-YOUR_PRIVATE_AMI_ID_HERE",
    },
    {
        "client_name": "Jay Chantbara",
        "role_arn": "arn:aws:iam::951257755436:role/CWPP-SR-JC",
        "type": "vm",
        "target_id": "ami-YOUR_PRIVATE_AMI_ID_HERE",
    },
]

# Auto-enrich targets with account_id and display_name
for t in MASTER_TARGETS:
    try:
        t["account_id"] = t["role_arn"].split(":")[4]
        t["display_name"] = f"{t['client_name']} ({t['account_id']})"
    except Exception:
        t["account_id"] = "Unknown"
        t["display_name"] = t["client_name"]


# ---------------------------------------------------------------------------
# HELPER: upsert a resource row, returning its ARN
# ---------------------------------------------------------------------------
def _upsert_resource(cursor, arn, account_id, resource_type, region):
    cursor.execute(
        """
        INSERT INTO resources (arn, resource_type, account_id, region, last_seen_at)
        VALUES (%s, %s, %s, %s, NOW())
        ON CONFLICT (arn) DO UPDATE
            SET last_seen_at = NOW()
        """,
        (arn, resource_type, account_id, region),
    )


# ---------------------------------------------------------------------------
# GET  /api/accounts
# ---------------------------------------------------------------------------
@app.route("/api/accounts", methods=["GET"])
def get_accounts():
    """Return every known account for the UI dropdown."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT account_id, account_name FROM accounts ORDER BY account_name")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    accounts = [
        {"id": r["account_id"], "display_name": f"{r['account_name']} ({r['account_id']})"}
        for r in rows
    ]
    return jsonify(accounts)


# ---------------------------------------------------------------------------
# GET  /api/vulnerabilities
# Optional query params: ?account_id=xxx  ?status=Open  ?severity=Critical
# ---------------------------------------------------------------------------
@app.route("/api/vulnerabilities", methods=["GET"])
def get_vulnerabilities():
    account_id = request.args.get("account_id")
    status     = request.args.get("status")
    severity   = request.args.get("severity")

    query = """
        SELECT
            v.cve_id,
            v.severity,
            v.cvss_score,
            sr.package_name,
            sr.workload_display  AS workload,
            a.account_name,
            a.account_id,
            sr.status,
            sr.first_seen_at
        FROM scan_results  sr
        JOIN resources     r  ON r.arn        = sr.resource_arn
        JOIN accounts      a  ON a.account_id = r.account_id
        JOIN vulnerabilities v ON v.cve_id    = sr.cve_id
        WHERE 1=1
    """
    params = []

    if account_id:
        query += " AND a.account_id = %s"
        params.append(account_id)
    if status:
        query += " AND sr.status = %s"
        params.append(status)
    if severity:
        query += " AND v.severity = %s"
        params.append(severity)

    query += " ORDER BY sr.first_seen_at DESC"

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify([dict(r) for r in rows])


# ---------------------------------------------------------------------------
# GET  /api/stats
# Returns per-severity counts for the doughnut chart.
# ---------------------------------------------------------------------------
@app.route("/api/stats", methods=["GET"])
def get_stats():
    account_id = request.args.get("account_id")

    query = """
        SELECT v.severity, COUNT(*) AS count
        FROM scan_results  sr
        JOIN resources     r  ON r.arn      = sr.resource_arn
        JOIN vulnerabilities v ON v.cve_id  = sr.cve_id
        WHERE sr.status = 'Open'
    """
    params = []
    if account_id:
        query += " AND r.account_id = %s"
        params.append(account_id)

    query += " GROUP BY v.severity"

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    color_map = {
        "Critical": "#ef4444",
        "High":     "#f97316",
        "Medium":   "#eab308",
        "Low":      "#3b82f6",
    }
    severity_order = {"Critical": 1, "High": 2, "Medium": 3, "Low": 4}

    stats = {r["severity"]: r["count"] for r in rows}
    result = []
    for sev in ["Critical", "High", "Medium", "Low"]:
        result.append({
            "name":  sev,
            "count": stats.get(sev, 0),
            "fill":  color_map[sev],
        })

    return jsonify(result)


# ---------------------------------------------------------------------------
# POST /api/scan
# Body: { "account_name": "Prem Patel (610732543389)" }
# ---------------------------------------------------------------------------
@app.route("/api/scan", methods=["POST"])
def trigger_scan():
    data = request.get_json() or {}
    requested_account = data.get("account_name")

    if not requested_account:
        return jsonify({"message": "No account selected.", "findings_detected": 0}), 400

    targets = [t for t in MASTER_TARGETS if t["display_name"] == requested_account]
    if not targets:
        return jsonify({"message": "No matching targets found.", "findings_detected": 0}), 400

    # ------------------------------------------------------------------
    def scan_single_target(target):
        print(f"🚀  Thread: {target['display_name']}")
        creds = get_sts_credentials(target["role_arn"])
        if not creds:
            return {"error": f"Auth failed: {target['display_name']}", "data": []}

        env = os.environ.copy()
        env.update({
            "AWS_ACCESS_KEY_ID":     creds["AWS_ACCESS_KEY_ID"],
            "AWS_SECRET_ACCESS_KEY": creds["AWS_SECRET_ACCESS_KEY"],
            "AWS_SESSION_TOKEN":     creds["AWS_SESSION_TOKEN"],
            "AWS_REGION":            "us-east-1",
            "DOCKER_CONFIG":         "/dev/null",
        })
        for key in ["AWS_PROFILE", "AWS_ROLE_ARN", "AWS_CONFIG_FILE",
                    "AWS_SHARED_CREDENTIALS_FILE", "AWS_DEFAULT_REGION"]:
            env.pop(key, None)

        findings = []  # list of dicts ready for DB insert
        try:
            if target["type"] == "vm":
                trivy_target     = target["target_id"] if target["target_id"].startswith("ami:") else f"ami:{target['target_id']}"
                trivy_cmd        = ["trivy", "vm", "--format", "json", "--quiet", trivy_target]
                workload_display = target["target_id"].replace("ami:", "")
            else:
                trivy_cmd        = ["trivy", "image", "--format", "json", "--quiet", target["target_id"]]
                workload_display = target["target_id"].split("/")[-1]

            # Build a synthetic ARN for the scanned workload so it fits the resources table.
            resource_type = "ECR_Image" if target["type"] == "container" else "EC2_AMI"
            resource_arn  = f"arn:aws:cwpp:{target['account_id']}:{resource_type}/{workload_display}"

            result = subprocess.run(trivy_cmd, env=env, capture_output=True, text=True)
            if result.returncode == 0:
                report = json.loads(result.stdout)
                for result_set in report.get("Results", []):
                    for vuln in result_set.get("Vulnerabilities", []):
                        findings.append({
                            "resource_arn":     resource_arn,
                            "resource_type":    resource_type,
                            "account_id":       target["account_id"],
                            "cve_id":           vuln.get("VulnerabilityID"),
                            "severity":         vuln.get("Severity"),
                            "cvss_score":       vuln.get("CVSS", {}).get("nvd", {}).get("V3Score"),
                            "description":      vuln.get("Description", ""),
                            "package_name":     vuln.get("PkgName"),
                            "workload_display": workload_display,
                        })
        except Exception as e:
            return {"error": str(e), "data": []}

        return {"error": None, "data": findings}
    # ------------------------------------------------------------------

    # Run scans in parallel threads
    all_findings = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(targets)) as executor:
        futures = {executor.submit(scan_single_target, t): t for t in targets}
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            if result["data"]:
                all_findings.extend(result["data"])
            elif result["error"]:
                print(f"⚠️  Thread error: {result['error']}")

    if not all_findings:
        return jsonify({"message": "Scan complete. No vulnerabilities found.", "findings_detected": 0}), 201

    conn = get_db_connection()
    cursor = conn.cursor()

    # Wipe previous open findings for this account only
    cursor.execute(
        """
        DELETE FROM scan_results
        WHERE resource_arn IN (
            SELECT arn FROM resources WHERE account_id = %s
        )
        """,
        (targets[0]["account_id"],),
    )

    for f in all_findings:
        # 1. Ensure resource row exists
        _upsert_resource(cursor, f["resource_arn"], f["account_id"], f["resource_type"], "us-east-1")

        # 2. Upsert vulnerability into the CVE library (no duplicates)
        cursor.execute(
            """
            INSERT INTO vulnerabilities (cve_id, severity, cvss_score, description)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (cve_id) DO NOTHING
            """,
            (f["cve_id"], f["severity"], f["cvss_score"], f["description"]),
        )

        # 3. Insert the scan finding
        cursor.execute(
            """
            INSERT INTO scan_results (resource_arn, cve_id, package_name, workload_display, status)
            VALUES (%s, %s, %s, %s, 'Open')
            ON CONFLICT (resource_arn, cve_id, package_name) DO UPDATE
                SET status = 'Open', last_seen_at = NOW()
            """,
            (f["resource_arn"], f["cve_id"], f["package_name"], f["workload_display"]),
        )

    conn.commit()
    cursor.close()
    conn.close()

    print(f"✅  Scan complete for {requested_account}. Inserted {len(all_findings)} findings.")
    return jsonify({
        "message":           "Scan complete.",
        "findings_detected": len(all_findings),
    }), 201


if __name__ == "__main__":
    app.run(debug=True, port=5000)