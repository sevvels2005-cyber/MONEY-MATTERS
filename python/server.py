import os
import json
import re
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
TRANSACTIONS_FILE = DATA_DIR / "transactions.json"
PORT = 8000


def ensure_data_file():
    """Ensure data directory and transactions.json exist with valid JSON array."""
    if not DATA_DIR.exists():
        DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    if not TRANSACTIONS_FILE.exists():
        with open(TRANSACTIONS_FILE, "w", encoding="utf-8") as f:
            json.dump([], f, indent=2)
        return []

    try:
        with open(TRANSACTIONS_FILE, "r", encoding="utf-8") as f:
            content = f.read().strip()
            if not content:
                return []
            data = json.loads(content)
            if not isinstance(data, list):
                return []
            return data
    except Exception as e:
        print(f"[Warning] Failed to read transactions.json ({e}). Re-initializing empty list.")
        with open(TRANSACTIONS_FILE, "w", encoding="utf-8") as f:
            json.dump([], f, indent=2)
        return []


def save_transactions(transactions):
    """Save transactions list to data/transactions.json atomically."""
    ensure_data_file()
    temp_file = DATA_DIR / "transactions.json.tmp"
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(transactions, f, indent=2, ensure_ascii=False)
    
    # Atomic replace
    os.replace(temp_file, TRANSACTIONS_FILE)


class MoneyMattersHandler(BaseHTTPRequestHandler):
    """Custom HTTP handler serving Money Matters static files and REST API."""

    def log_message(self, format, *args):
        """Custom request logger."""
        print(f"[{self.log_date_time_string()}] {self.command} {self.path} -> {args[0]}")

    def send_json_response(self, data, status_code=200):
        """Helper to send JSON response."""
        response_bytes = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response_bytes)))
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.end_headers()
        self.wfile.write(response_bytes)

    def send_error_response(self, message, status_code=400):
        """Helper to send JSON error response."""
        self.send_json_response({"success": False, "message": message}, status_code=status_code)

    def serve_static_file(self, req_path):
        """Serve HTML, CSS, JS static files safely."""
        if req_path == "/" or req_path == "":
            req_path = "/index.html"

        # Sanitize path to prevent directory traversal
        safe_path = Path(req_path.lstrip("/")).resolve()
        target_file = (BASE_DIR / safe_path).resolve()

        try:
            target_file.relative_to(BASE_DIR)
        except ValueError:
            self.send_error(403, "Forbidden access")
            return

        if not target_file.exists() or not target_file.is_file():
            self.send_error(404, "File not found")
            return

        content_types = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
            ".json": "application/json; charset=utf-8",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".ico": "image/x-icon",
            ".svg": "image/svg+xml"
        }

        ext = target_file.suffix.lower()
        content_type = content_types.get(ext, "application/octet-stream")

        try:
            with open(target_file, "rb") as f:
                content = f.read()

            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            print(f"[Error] Serving file {target_file}: {e}")
            self.send_error(500, "Internal server error")

    def parse_json_body(self):
        """Parse incoming JSON payload."""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length <= 0:
                return None
            body_bytes = self.rfile.read(content_length)
            return json.loads(body_bytes.decode("utf-8"))
        except Exception as e:
            print(f"[Error] Parsing JSON body: {e}")
            return None

    def validate_transaction(self, data):
        """Validate transaction fields."""
        if not isinstance(data, dict):
            return False, "Invalid payload format."

        tx_type = str(data.get("type", "")).strip().lower()
        if tx_type not in ["income", "expense"]:
            return False, "Transaction type must be 'income' or 'expense'."

        try:
            amount = float(data.get("amount", 0))
            if amount <= 0:
                return False, "Amount must be greater than zero."
        except (ValueError, TypeError):
            return False, "Amount must be a valid number."

        category = str(data.get("category", "")).strip()
        if not category:
            return False, "Category is required."

        description = str(data.get("description", "")).strip()
        date_str = str(data.get("date", "")).strip()

        if not date_str:
            return False, "Date is required."

        return True, {
            "type": tx_type,
            "amount": round(amount, 2),
            "category": category,
            "description": description,
            "date": date_str
        }

    def do_GET(self):
        """Handle GET requests."""
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        if path == "/api/transactions":
            transactions = ensure_data_file()
            self.send_json_response({"success": True, "data": transactions})
            return

        # Fallback to static file server
        self.serve_static_file(path)

    def do_POST(self):
        """Handle POST requests."""
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        if path == "/api/transactions":
            body = self.parse_json_body()
            valid, result = self.validate_transaction(body)
            if not valid:
                self.send_error_response(result, 400)
                return

            transactions = ensure_data_file()
            
            # Generate unique ID
            new_id = 1
            if transactions:
                existing_ids = [t.get("id", 0) for t in transactions if isinstance(t.get("id"), int)]
                if existing_ids:
                    new_id = max(existing_ids) + 1

            new_tx = {
                "id": new_id,
                "type": result["type"],
                "amount": result["amount"],
                "category": result["category"],
                "description": result["description"],
                "date": result["date"]
            }

            transactions.append(new_tx)
            save_transactions(transactions)

            msg = "Income added successfully." if result["type"] == "income" else "Expense added successfully."
            self.send_json_response({"success": True, "message": msg, "data": new_tx}, 201)
            return

        if path == "/api/transactions/clear":
            save_transactions([])
            self.send_json_response({"success": True, "message": "All transactions cleared successfully."})
            return

        self.send_error_response("Endpoint not found", 404)

    def do_PUT(self):
        """Handle PUT requests for editing transactions."""
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        match = re.match(r"^/api/transactions/(\d+)$", path)
        if match:
            tx_id = int(match.group(1))
            body = self.parse_json_body()
            valid, result = self.validate_transaction(body)
            if not valid:
                self.send_error_response(result, 400)
                return

            transactions = ensure_data_file()
            found = False
            updated_tx = None

            for t in transactions:
                if t.get("id") == tx_id:
                    t["type"] = result["type"]
                    t["amount"] = result["amount"]
                    t["category"] = result["category"]
                    t["description"] = result["description"]
                    t["date"] = result["date"]
                    found = True
                    updated_tx = t
                    break

            if not found:
                self.send_error_response("Transaction not found", 404)
                return

            save_transactions(transactions)
            self.send_json_response({"success": True, "message": "Transaction updated successfully.", "data": updated_tx})
            return

        self.send_error_response("Endpoint not found", 404)

    def do_DELETE(self):
        """Handle DELETE requests for deleting transactions."""
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        match = re.match(r"^/api/transactions/(\d+)$", path)
        if match:
            tx_id = int(match.group(1))
            transactions = ensure_data_file()
            initial_count = len(transactions)
            
            transactions = [t for t in transactions if t.get("id") != tx_id]

            if len(transactions) == initial_count:
                self.send_error_response("Transaction not found", 404)
                return

            save_transactions(transactions)
            self.send_json_response({"success": True, "message": "Transaction deleted successfully."})
            return

        self.send_error_response("Endpoint not found", 404)


def run_server(port=PORT):
    """Run the Money Matters HTTP server."""
    ensure_data_file()
    server_address = ("", port)
    httpd = HTTPServer(server_address, MoneyMattersHandler)
    print("============================================================")
    print(f" MONEY MATTERS - Personal Finance Server")
    print(f" Running at: http://localhost:{port}/")
    print(f" Storage: {TRANSACTIONS_FILE}")
    print(" Press Ctrl+C to stop server")
    print("============================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()


if __name__ == "__main__":
    run_server()
