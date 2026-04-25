from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path


OUTPUT = Path("/tmp/alert-receiver-last.json")


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length)
        OUTPUT.write_bytes(body)
        print(body.decode("utf-8", errors="replace"), flush=True)
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"ok")

    def do_GET(self):
        if OUTPUT.exists():
            body = OUTPUT.read_bytes()
        else:
            body = b"{}"
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)


HTTPServer(("0.0.0.0", 8080), Handler).serve_forever()
