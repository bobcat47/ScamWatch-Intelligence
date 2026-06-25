import mysql from "mysql2/promise";
async function drop() {
  const conn = await mysql.createConnection(
    "mysql://24DTxAK1vHfPxNr.root:BfTaOFz3mHu0Ie8KWHZomCOYHbY7g9CS@ep-t4ni387b5e83b7519dc8.epsrv-t4n281l4mrmemi4zls9a.ap-southeast-1.privatelink.aliyuncs.com:4000/19ee03e2-d7e2-819a-8000-092d68a8f5b7"
  );
  const tables = ["scam_reports", "chat_messages", "monitored_identities", "breach_alerts", "users"];
  for (const t of tables) {
    try { await conn.execute(`DROP TABLE IF EXISTS ${t}`); } catch (e) {}
  }
  console.log("All tables dropped");
  await conn.end();
}
drop().catch(console.error);
