#!/bin/bash

# Asegúrate de tener Firebase CLI instalado
# npm install -g firebase-tools

# Colores para mensajes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Implementando reglas de Firebase Storage...${NC}"

# Verificar si firebase-tools está instalado
if ! command -v firebase &> /dev/null
then
    echo -e "${RED}Firebase CLI no está instalado. Instalando...${NC}"
    npm install -g firebase-tools
fi

# Iniciar sesión en Firebase (si es necesario)
echo -e "${YELLOW}Verificando autenticación de Firebase...${NC}"
firebase login --no-localhost

# Implementar las reglas de almacenamiento
echo -e "${YELLOW}Implementando reglas de almacenamiento...${NC}"
firebase deploy --only storage

echo -e "${GREEN}¡Reglas de Firebase Storage implementadas correctamente!${NC}"
echo -e "${YELLOW}Nota: Asegúrate de que tu proyecto esté configurado correctamente en .firebaserc${NC}" 