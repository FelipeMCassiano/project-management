import dotenv from "dotenv";
import pg from "pg";
async function connectDb(): Promise<pg.Pool> {
    dotenv.config();
    const url = process.env.DATABASEURL;

    const pool = new pg.Pool({ connectionString: url });
    return pool;
}
