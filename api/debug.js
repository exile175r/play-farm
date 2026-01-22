export default function handler(req, res) {
  const envKeys = Object.keys(process.env);
  const dbEnvStatus = {
    DB_HOST: !!process.env.DB_HOST,
    DB_USER: !!process.env.DB_USER,
    DB_NAME: !!process.env.DB_NAME,
    DB_PORT: !!process.env.DB_PORT,
    NODE_ENV: process.env.NODE_ENV
  };

  res.status(200).json({
    message: "Debug endpoint is active",
    timestamp: new Date().toISOString(),
    dbEnvStatus,
    allEnvKeys: envKeys.filter(k => !k.includes('SECRET') && !k.includes('PASSWORD'))
  });
}
