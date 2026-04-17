import os
import time
import json
import requests

# ==========================================
# ส่วนที่ต้องแก้ไข (CONFIGURATION)
# ==========================================
TELEGRAM_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN"  # ใส่ Token ของ Telegram Bot ที่คุณสร้างไว้
CHAT_ID = "YOUR_CHAT_ID"  # ใส่ Chat ID ของคุณ
WATCH_DIR = 'Z:\\\\'  # ใส่ Path ของโฟลเดอร์ใน Z:
CHECK_INTERVAL = 60              # ตรวจสอบทุกๆ 1 นาที (60 วินาที)
HISTORY_FILE = 'seen_pdfs.json'
# ==========================================

class PDFMonitor:
    def __init__(self):
        self.seen_files = self.load_seen_files()
        self.is_connected = False
        self.first_run = True

    def send_telegram(self, message):
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        payload = {"chat_id": CHAT_ID, "text": message, "parse_mode": "Markdown"}
        try:
            requests.post(url, json=payload, timeout=10)
        except:
            pass

    def load_seen_files(self):
        if os.path.exists(HISTORY_FILE):
            try:
                with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                    return set(json.load(f))
            except:
                return set()
        return set()

    def save_seen_files(self):
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(list(self.seen_files), f, ensure_ascii=False)

    def run(self):
        print(f"[*] Starting monitor on: {WATCH_DIR}")
        while True:
            # ตรวจสอบว่าเข้าถึง Path ได้หรือไม่ (Check VPN/Network)
            path_exists = os.path.exists(WATCH_DIR)

            # กรณีที่ 1: การเชื่อมต่อหลุด
            if self.is_connected and not path_exists:
                self.is_connected = False
                self.send_telegram("⚠️ *แจ้งเตือน:* เสียการเชื่อมต่อกับไดรฟ์ Z:\\" + " (โปรดตรวจสอบการเชื่อมต่อ VPN)")
            
            # กรณีที่ 2: กลับมาเชื่อมต่อได้
            elif not self.is_connected and path_exists:
                self.is_connected = True
                self.send_telegram("✅ *แจ้งเตือน:* เชื่อมต่อไดรฟ์ Z:\\" + " ได้แล้ว ระบบเริ่มทำงานตามปกติ")
                try:
                    current_files = {f for f in os.listdir(WATCH_DIR) if f.lower().endswith('.pdf')}
                    if self.first_run:
                        self.seen_files = current_files
                        self.save_seen_files()
                        self.first_run = False
                except:
                    pass

            # กรณีที่ 3: ตรวจสอบไฟล์ใหม่
            if self.is_connected:
                try:
                    current_files = {f for f in os.listdir(WATCH_DIR) if f.lower().endswith('.pdf')}
                    new_files = current_files - self.seen_files
                    if new_files:
                        for file_name in new_files:
                            self.send_telegram(f"🔔 *มีหนังสือใหม่เข้าครับ!*\n\nไฟล์: `{file_name}`")
                        self.seen_files.update(new_files)
                        self.save_seen_files()
                except:
                    pass

            time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    PDFMonitor().run()
