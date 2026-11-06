#!/usr/bin/env python3
"""English Box - local server.
Run:  python serve.py   (or double-click start.bat on Windows)
Then open the printed address on the phone (same Wi-Fi)."""
import http.server, os, socket, sys, webbrowser

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
DIR = os.path.dirname(os.path.abspath(__file__))

def lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))
        return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"
    finally:
        s.close()

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=DIR, **k)
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")  # always serve the latest word list
        super().end_headers()
    def log_message(self, *a):
        pass

if __name__ == "__main__":
    url = f"http://{lan_ip()}:{PORT}/"
    httpd = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print("=" * 50)
    print("  English Box is running!")
    print(f"  Open on the phone:  {url}")
    print("  (phone and computer on the same Wi-Fi)")
    print("  Press Ctrl+C to stop")
    print("=" * 50)
    try:
        webbrowser.open(url)
    except Exception:
        pass
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
