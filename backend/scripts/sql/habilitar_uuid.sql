-- Habilitar extensión UUID para PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verificar que se creó correctamente
SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';
