import fs from 'fs-extra';
import path from 'path';
import moment from 'moment';
import util from 'util';
import { exec } from 'child_process';

const execPromise = util.promisify(exec);

// Отримуємо директорії.
const __dirname = path.dirname(new URL(import.meta.url).pathname).slice(1);
const sourceDir = path.join(__dirname, 'src');
const backupDir = path.join(__dirname, 'backup');

const backupName = `backup_${moment().format('YYYYMMDD_HHmmss')}`;
const backupPath = path.join(backupDir, backupName);

// Дізнаємося шлях до бази даних і pg_dump.
const dbUrl = process.env.DB_URL || 'postgresql://postgres:123456789@localhost:5432/healthyHelper';
const pgDumpPath = process.env.PG_DUMP_PATH || `"C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump"`;

// Функція для створення резервної копії файлів.
async function backupFiles() {
  try {
    await fs.ensureDir(backupPath);
    await fs.copy(sourceDir, backupPath);
    console.log(`Резервна копія файлів успішно створена: ${backupPath}`);
    await backupDatabase();
  } catch (error) {
    console.error('Сталася помилка при створенні резервної копії файлів:', error);
  }
}

// Функція для створення резервної копії бази даних.
async function backupDatabase() {
  const dumpFilePath = path.join(backupPath, 'healthyHelper_backup.sql');
  const pgDumpCommand = `${pgDumpPath} --dbname=${dbUrl} --schema=public -F p -b -v -f "${dumpFilePath}"`;

  try {
    console.log('Створення резервної копії бази даних...');
    console.log('Running command:', pgDumpCommand);
    const pgDumpVersion = await execPromise(`${pgDumpPath} --version`);
    console.log('pg_dump версія:', pgDumpVersion.stdout);
    
    await execPromise(pgDumpCommand);
    console.log(`Резервна копія бази даних успішно створена: ${dumpFilePath}`);
  } catch (error) {
    console.error('Помилка при створенні резервної копії бази даних:', error);
    console.error('Повний текст помилки:', error.stderr);
  }
}

export { backupFiles };
