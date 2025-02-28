#!/bin/bash

# Matar cualquier proceso que esté usando el puerto 3000
echo "Verificando si hay procesos usando el puerto 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "No hay procesos usando el puerto 3000"

# Esperar un momento para asegurarnos de que el puerto esté libre
sleep 1

# Iniciar el servidor frontend
echo "Iniciando el servidor frontend en el puerto 3000..."
npm run dev:stable

# Si el servidor se detiene, reiniciarlo automáticamente
while true; do
  if ! lsof -ti:3000 > /dev/null; then
    echo "El servidor se ha detenido. Reiniciando..."
    npm run dev:stable
  fi
  sleep 5
done 