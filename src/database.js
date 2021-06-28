import pg from "pg";

const { Pool } = pg;

const connectionData = {
  user: "postgres",
  password: "123456",
  host: "127.0.0.1",
  port: 5432,
  database: "myWallet",
};

const connection = new Pool(connectionData);

export default connection;
