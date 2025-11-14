module.exports = {
  apps: [
    {
      name: 'instituto-san-martin-api',
      script: 'dist/index.js',
      instances: 1, // Cambiado de 'max' a 1 para evitar problemas con keep-alive
      exec_mode: 'fork', // Cambiado de 'cluster' a 'fork' para simplicidad
      watch: false,
      max_memory_restart: '2G', // Aumentado de 1G a 2G
      autorestart: true, // Auto-reiniciar si se cae
      max_restarts: 10, // Máximo 10 reinicios
      min_uptime: '10s', // Tiempo mínimo para considerar inicio exitoso
      listen_timeout: 5000, // Timeout para escuchar
      kill_timeout: 5000, // Timeout para matar proceso
      // Prevenir reinicios por inactividad
      exp_backoff_restart_delay: 100,
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
        // Variables para prevenir timeouts
        NODE_OPTIONS: '--max-old-space-size=2048',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        NODE_OPTIONS: '--max-old-space-size=2048',
      },
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
