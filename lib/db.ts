import {Pool} from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// const pool = new Pool({
//   user: "postgres",
//   host: "localhost",
//   database: "OrderManagement",
//   password: "Admin123!",
//   port: 5432,
// });

export default pool;