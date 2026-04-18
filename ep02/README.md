# Weather Bulk Fetch

**ถอดสมองสร้าง EP.02 - No Brain Build**

ดึงข้อมูลสภาพอากาศปัจจุบันของ 77 จังหวัดไทยจาก Open-Meteo API แบบทีละจังหวัด เก็บผลลง SQLite และดูสถานะผ่าน dashboard แบบ real-time ได้ที่ `http://localhost:3456`

## สิ่งที่โปรเจกต์นี้ทำ

- Seed รายชื่อจังหวัดจาก `thailand_provinces.csv` ลงตาราง `provinces`
- ดึงค่า `temperature_2m`, `relative_humidity_2m`, และ `wind_speed_10m` จาก Open-Meteo
- บันทึกผลสำเร็จเป็น `status = success`
- บันทึก error ของจังหวัดที่ยิง API ไม่ผ่านเป็น `status = failed`
- Retry เฉพาะ record ที่ failed ด้วย `npm run retry`
- เปิด dashboard สำหรับดู total, pending, success, failed และรายการจังหวัดทั้งหมด

## Tech Stack

- **Runtime**: Node.js 22+ (`node:sqlite`, built-in `fetch`, `AbortSignal.timeout`)
- **Database**: SQLite ผ่าน `node:sqlite`
- **Dashboard**: Node.js HTTP server แบบไม่ใช้ framework
- **Weather API**: Open-Meteo forecast API

## โครงสร้างไฟล์

```text
ep02/
├── dashboard.js          # เปิด web dashboard และ endpoint /api/data
├── db.js                 # SQLite setup, seed loader, query helpers
├── index.js              # Bulk fetch weather data จาก Open-Meteo
├── package.json          # npm scripts
├── package-lock.json     # lock dependencies
├── seed.js               # import thailand_provinces.csv เข้า weather.db
├── thailand_provinces.csv # input CSV ที่ต้องมีตอน seed
└── weather.db            # SQLite database ที่ generate ได้ ไม่ควร commit
```

## Setup

ติดตั้ง dependencies:

```bash
npm install
```

วางไฟล์ `thailand_provinces.csv` ไว้ในโฟลเดอร์ `ep02/` โดย expected columns คือ:

```csv
id,province_th,province_en,lat,lng
```

จากนั้น seed ข้อมูลจังหวัดลง SQLite:

```bash
npm run seed
```

คำสั่งนี้จะสร้างหรืออัปเดต `weather.db` และ insert จังหวัดที่ยังไม่มีด้วย `INSERT OR IGNORE`

## วิธีรัน

เปิด dashboard ก่อนใน Terminal 1:

```bash
npm run dashboard
```

เปิด browser ไปที่:

```text
http://localhost:3456
```

จากนั้นรัน bulk fetch ใน Terminal 2:

```bash
npm start
```

`index.js` จะประมวลผลเฉพาะ record ที่มี `status = pending` และหน่วงเวลา 1 วินาทีต่อจังหวัด (`DELAY_MS = 1000`) เพื่อลดการยิง API ถี่เกินไป

## Retry เฉพาะรายการที่ fail

ถ้ามีจังหวัดที่ fetch ไม่ผ่าน ให้รัน:

```bash
npm run retry
```

คำสั่งนี้จะ reset เฉพาะ record ที่ `status = failed` กลับเป็น `pending` ก่อนเริ่ม fetch ใหม่

## Flow การทำงาน

```text
thailand_provinces.csv
  -> npm run seed
  -> weather.db / provinces(status: pending)
  -> npm start
  -> fetch Open-Meteo ทีละจังหวัด
  -> success: บันทึก temperature, humidity, wind_speed, fetched_at
  -> failed: บันทึก error message
  -> dashboard อ่านข้อมูลล่าสุดจาก weather.db ทุก 2 วินาที
```

## API ที่ใช้

- **Open-Meteo**: https://open-meteo.com
- ไม่ต้องใช้ API key
- Endpoint ที่ `index.js` เรียก:

```text
https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run seed` | อ่าน `thailand_provinces.csv` แล้ว seed ลง `weather.db` |
| `npm start` | ดึง weather data สำหรับ record ที่ `pending` |
| `npm run retry` | reset record ที่ `failed` เป็น `pending` แล้ว fetch ใหม่ |
| `npm run dashboard` | เปิด dashboard ที่ `http://localhost:3456` |

## Reset weather.db

ถ้าต้องการล้างผล weather แต่เก็บรายชื่อจังหวัดไว้ ให้รันจากโฟลเดอร์ `ep02/`:

```bash
node -e "const { DatabaseSync } = require('node:sqlite'); const db = new DatabaseSync('weather.db'); db.exec(\"UPDATE provinces SET status='pending', temperature=NULL, humidity=NULL, wind_speed=NULL, fetched_at=NULL, error=NULL\"); db.close(); console.log('done');"
```

ถ้าต้องการสร้าง database ใหม่ทั้งหมด:

```bash
rm weather.db
npm run seed
```

บน Windows PowerShell ใช้:

```powershell
Remove-Item weather.db
npm run seed
```

