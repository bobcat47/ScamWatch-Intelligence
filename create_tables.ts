import mysql from "mysql2/promise";

const sqls = [
  `CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100),
    avatar VARCHAR(500),
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS scam_reports (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(30) NOT NULL,
    country VARCHAR(50) NOT NULL,
    carrier VARCHAR(50),
    description TEXT NOT NULL,
    report_type VARCHAR(30) NOT NULL,
    danger_rating INT,
    evidence_url VARCHAR(500),
    call_recording_url VARCHAR(500),
    reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    display_name VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    country VARCHAR(50),
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS monitored_identities (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    identity_type VARCHAR(20) NOT NULL,
    identity_value VARCHAR(100) NOT NULL,
    label VARCHAR(50),
    breach_count INT DEFAULT 0,
    last_checked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS breach_alerts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    identity_id INT NOT NULL,
    user_id INT NOT NULL,
    breach_name VARCHAR(100) NOT NULL,
    breach_date VARCHAR(20),
    description TEXT,
    data_classes TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
];

async function create() {
  const conn = await mysql.createConnection(
    "mysql://24DTxAK1vHfPxNr.root:BfTaOFz3mHu0Ie8KWHZomCOYHbY7g9CS@ep-t4ni387b5e83b7519dc8.epsrv-t4n281l4mrmemi4zls9a.ap-southeast-1.privatelink.aliyuncs.com:4000/19ee03e2-d7e2-819a-8000-092d68a8f5b7"
  );
  for (const sql of sqls) {
    try {
      await conn.execute(sql);
      console.log("Created table OK");
    } catch (e: any) {
      console.log("Table may already exist:", e.message?.substring(0, 80));
    }
  }
  console.log("All tables ready");
  await conn.end();
}
create().catch(console.error);
