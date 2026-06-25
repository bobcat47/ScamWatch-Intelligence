import mysql from "mysql2/promise";

async function dropTables() {
  const conn = await mysql.createConnection(
    "mysql://24DTxAK1vHfPxNr.root:BfTaOFz3mHu0Ie8KWHZomCOYHbY7g9CS@ep-t4ni387b5e83b7519dc8.epsrv-t4n281l4mrmemi4zls9a.ap-southeast-1.privatelink.aliyuncs.com:4000/19ee03e2-d7e2-819a-8000-092d68a8f5b7"
  );
  await conn.execute("DROP TABLE IF EXISTS scam_reports");
  await conn.execute("DROP TABLE IF EXISTS chat_messages");
  await conn.execute("DROP TABLE IF EXISTS phishing_urls");
  console.log("All tables dropped");
  await conn.end();
}

dropTables().catch(console.error);
