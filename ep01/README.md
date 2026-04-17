# EP01: PDF Monitor Telegram

เครื่องมือเล็ก ๆ สำหรับเฝ้าดูโฟลเดอร์บน Windows ว่ามีไฟล์ PDF ใหม่เข้ามาหรือไม่ แล้วแจ้งเตือนผ่าน Telegram Bot โดยไฟล์หลักคือ `monitor_pdf.pyw`

สิ่งที่ควรระวัง:

- `TELEGRAM_TOKEN` เป็นข้อมูลลับ ห้าม commit token จริงขึ้น Git
- `CHAT_ID` อาจระบุตัวตนของผู้ใช้หรือกลุ่มได้ ควรหลีกเลี่ยงการเผยแพร่สาธารณะ
- `WATCH_DIR = 'Z:\\'` เป็น path ภายในเครื่องหรือ network drive แม้ไม่ใช่ secret โดยตรง แต่บอกโครงสร้างเครื่อง/ระบบได้
- `seen_pdfs.json` จะบันทึกรายชื่อไฟล์ PDF ที่เคยเห็นแล้ว ถ้าชื่อไฟล์มีข้อมูลลูกค้า เลขเอกสาร หรือข้อมูลส่วนตัว ไม่ควร commit ไฟล์นี้ขึ้น Git

## ไฟล์หลัก

```text
ep01/monitor_pdf.pyw
```

สคริปต์นี้ทำงานแบบ loop:

1. ตรวจว่าเข้าถึง `WATCH_DIR` ได้หรือไม่
2. ถ้าไดรฟ์หลุด จะส่ง Telegram แจ้งเตือน
3. ถ้าไดรฟ์กลับมา จะส่ง Telegram แจ้งว่าเชื่อมต่อได้แล้ว
4. ถ้ามี PDF ใหม่ในโฟลเดอร์ จะส่งชื่อไฟล์ไปที่ Telegram
5. บันทึกไฟล์ที่เคยเห็นแล้วลง `seen_pdfs.json`

## Requirements

ต้องมีสิ่งต่อไปนี้บน Windows:

- Python 3.10 หรือใหม่กว่า
- แพ็กเกจ `requests`
- Telegram Bot Token
- Telegram Chat ID
- โฟลเดอร์หรือ drive ที่ต้องการ monitor เช่น `Z:\`

## ติดตั้ง Python และ dependency

ตรวจว่ามี Python แล้วหรือยัง:

```powershell
python --version
```

ติดตั้ง dependency:

```powershell
pip install requests
```

ถ้าเครื่องมี Python หลายตัวและคำสั่งด้านบนไม่ได้ ให้ลอง:

```powershell
py -m pip install requests
```

## สร้าง Telegram Bot Token

1. เปิด Telegram แล้วค้นหา `@BotFather`
2. ส่งคำสั่ง:

```text
/newbot
```

3. ตั้งชื่อ bot และ username ตามที่ BotFather ถาม
4. BotFather จะให้ token หน้าตาประมาณนี้:

```text
1234567890:AAExampleTokenHere
```

นำ token นี้ไปใส่ใน `TELEGRAM_TOKEN`

## หา Telegram Chat ID

วิธีง่ายสำหรับแชทส่วนตัว:

1. ส่งข้อความอะไรก็ได้ไปหา bot ของคุณก่อน
2. เปิด URL นี้ใน browser โดยเปลี่ยน `<BOT_TOKEN>` เป็น token จริง:

```text
https://api.telegram.org/bot<BOT_TOKEN>/getUpdates
```

3. หา field `chat` และ `id` เช่น:

```json
{
  "chat": {
    "id": 123456789,
    "first_name": "Your Name"
  }
}
```

4. เอาเลข `id` ไปใส่ใน `CHAT_ID`

สำหรับกลุ่ม Telegram ให้เพิ่ม bot เข้า group ก่อน ส่งข้อความในกลุ่ม แล้วเปิด `getUpdates` เช่นเดียวกัน ค่า `chat.id` ของกลุ่มมักเป็นเลขติดลบ เช่น `-1001234567890`

## ตั้งค่าไฟล์ monitor_pdf.pyw

เปิดไฟล์:

```text
ep01/monitor_pdf.pyw
```

แก้ค่าด้านบนของไฟล์:

```python
TELEGRAM_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN"
CHAT_ID = "YOUR_CHAT_ID"
WATCH_DIR = 'Z:\\'
CHECK_INTERVAL = 60
HISTORY_FILE = 'seen_pdfs.json'
```

ตัวอย่าง:

```python
TELEGRAM_TOKEN = "1234567890:AAExampleTokenHere"
CHAT_ID = "123456789"
WATCH_DIR = 'Z:\\'
CHECK_INTERVAL = 60
HISTORY_FILE = 'seen_pdfs.json'
```

คำอธิบายค่า config:

- `TELEGRAM_TOKEN`: token จาก BotFather
- `CHAT_ID`: chat id ที่จะรับข้อความแจ้งเตือน
- `WATCH_DIR`: โฟลเดอร์ที่จะตรวจ PDF เช่น `Z:\\`, `D:\\Docs`, หรือ `\\server\\share\\folder`
- `CHECK_INTERVAL`: จำนวนวินาทีระหว่างการตรวจแต่ละครั้ง
- `HISTORY_FILE`: ไฟล์ที่ใช้จำว่าเคยเห็น PDF ไหนแล้ว

หมายเหตุ: ไฟล์ `.pyw` จะรันแบบไม่มี console window เหมาะกับการรัน background บน Windows

## วิธีรันด้วยมือ

จาก root ของ repo:

```powershell
pythonw ep01\monitor_pdf.pyw
```

หรือดับเบิลคลิกไฟล์นี้ใน File Explorer:

```text
ep01\monitor_pdf.pyw
```

ถ้าต้องการ debug และเห็น error ใน terminal ชั่วคราว ให้รันด้วย `python` แทน `pythonw`:

```powershell
python ep01\monitor_pdf.pyw
```

หยุดโปรแกรมได้โดยปิด process `pythonw.exe` ใน Task Manager

## ตั้งให้รันตอนเปิดเครื่อง Windows

มี 2 วิธีหลัก แนะนำวิธี Task Scheduler เพราะคุมเงื่อนไขได้ดีกว่า

## วิธีที่ 1: Task Scheduler

1. เปิด Start Menu แล้วค้นหา `Task Scheduler`
2. เลือก `Create Task...`
3. แท็บ `General`:
   - Name: `PDF Monitor Telegram`
   - เลือก `Run only when user is logged on`
   - ถ้าต้องเข้าถึง network drive เช่น `Z:\` ให้ใช้ user account เดียวกับที่ map drive นั้นไว้
4. แท็บ `Triggers`:
   - กด `New...`
   - Begin the task: `At log on`
   - เลือก user ของคุณ
5. แท็บ `Actions`:
   - กด `New...`
   - Action: `Start a program`
   - Program/script:

```text
pythonw
```

   - Add arguments:

```text
"C:\YOUR_PATH\nobrainseries\ep01\monitor_pdf.pyw"
```

   - Start in:

```text
C:\YOUR_PATH\nobrainseries
```

6. แท็บ `Conditions`:
   - ถ้าเป็น laptop อาจเอาเครื่องหมายถูก `Start the task only if the computer is on AC power` ออก
7. กด `OK`
8. คลิกขวา task แล้วเลือก `Run` เพื่อทดสอบ

ถ้า `pythonw` ไม่ทำงาน ให้หา path เต็มของ Python ด้วย:

```powershell
where pythonw
```

แล้วนำ path เต็มไปใส่ใน `Program/script` เช่น:

```text
C:\Users\YourUser\AppData\Local\Programs\Python\Python312\pythonw.exe
```

## วิธีที่ 2: Startup Folder

1. กด `Win + R`
2. พิมพ์:

```text
shell:startup
```

3. สร้าง shortcut ใหม่ในโฟลเดอร์นั้น
4. Target ของ shortcut ให้ใส่:

```text
pythonw "C:\YOUR_PATH\nobrainseries\ep01\monitor_pdf.pyw"
```

5. ตั้ง `Start in` เป็น:

```text
C:\YOUR_PATH\nobrainseries
```

วิธีนี้ง่าย แต่ถ้า network drive ยังไม่พร้อมหลัง login สคริปต์อาจแจ้งว่าไดรฟ์หลุดก่อน แล้วค่อยกลับมาเมื่อ drive พร้อม

## การทดสอบหลังตั้งค่า

1. รันสคริปต์ด้วยมือก่อน
2. วางไฟล์ `.pdf` ใหม่ใน `WATCH_DIR`
3. ตรวจว่ามีข้อความเข้า Telegram
4. ลบหรือย้าย `seen_pdfs.json` ถ้าต้องการให้ระบบถือว่าไฟล์ทั้งหมดเป็นไฟล์ใหม่ในการทดสอบรอบถัดไป

## Troubleshooting

ถ้าไม่มีข้อความเข้า Telegram:

- ตรวจว่า token ถูกต้อง
- ส่งข้อความหา bot ก่อนเรียก `getUpdates`
- ตรวจว่า `CHAT_ID` เป็นเลขถูกต้อง
- ตรวจว่าเครื่องต่อ internet ได้
- ลองรันด้วย `python ep01\monitor_pdf.pyw` เพื่อดู error

ถ้าไม่เจอไฟล์ PDF:

- ตรวจว่า `WATCH_DIR` ถูกต้อง
- ถ้าเป็น network drive ให้แน่ใจว่า Windows เห็น drive นั้นใน user เดียวกับที่รัน task
- ลองใช้ UNC path เช่น `\\server\\share\\folder` แทน mapped drive `Z:\`

ถ้ารันตอน startup แล้วไม่ทำงาน:

- เปิด Task Scheduler แล้วดู `Last Run Result`
- ใส่ path เต็มของ `pythonw.exe`
- ตั้ง `Start in` ให้เป็น root repo
- ถ้าใช้ `Z:\` ให้แน่ใจว่า drive ถูก map ก่อน task เริ่ม

## หมายเหตุด้านความปลอดภัย

ตอนนี้ config อยู่ในไฟล์ Python โดยตรง ซึ่งง่ายต่อการใช้ แต่ไม่เหมาะถ้าจะ publish repo สาธารณะ หลังจากใส่ token จริงแล้ว ห้าม commit ไฟล์นี้ขึ้น Git หรือควรปรับสคริปต์ให้อ่านค่าจาก environment variables / ไฟล์ `.env` ที่อยู่ใน `.gitignore`
